import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Briefcase,
  Heart,
  Brain,
  Activity,
  DollarSign,
  Shield,
  Target,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  X,
} from "lucide-react";

const concernOptions = [
  { id: "business", label: "Business / Career", icon: Briefcase },
  { id: "relationships", label: "Relationships", icon: Heart },
  { id: "emotional", label: "Emotional / Nervous System Support", icon: Brain },
  { id: "body", label: "Body or Hormones", icon: Activity },
  { id: "money", label: "Money", icon: DollarSign },
  { id: "confidence", label: "Confidence or Identity", icon: Shield },
  { id: "boundaries", label: "Boundaries or Communication", icon: Shield },
  { id: "purpose", label: "Purpose or Leadership", icon: Target },
  { id: "visibility", label: "Visibility or Personal Brand", icon: Eye },
  { id: "other", label: "Other", icon: MoreHorizontal },
  { id: "all", label: "All of the above", icon: CheckCircle },
];

const feelingOptions = [
  "Overwhelmed",
  "Exhausted",
  "Anxious",
  "Numb",
  "Scattered",
  "Unmotivated",
  "Irritable",
  "Sad",
  "Stuck",
  "Fine but disconnected",
];

const timeOptions = ["3 minutes", "10 minutes", "20 minutes", "45 minutes", "Varies a lot"];

const coreValueOptions = [
  "Authenticity",
  "Growth",
  "Connection",
  "Freedom",
  "Impact",
  "Balance",
  "Creativity",
  "Service",
];

export default function OnboardingForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answers, setAnswers] = useState({
    concerns: [],
    currentFeeling: "",
    capacityScore: 5,
    timeAvailable: "",
    userContextText: "",
    cycleProfile: {
      lastPeriodDate: "",
      cycleLength: 28,
      cycleStage: "",
    },
    dob: "",
    tob: "",
    pob: "",
    enableDeepPersonalisation: false,
    values: [],
    releasing: "",
    becoming: "",
    boundaries: [""],
    snapshotFrequency: "daily",
    dailyUpdateEnabled: false,
  });

  const totalSteps = 11; // 0-10

  const updateAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const updateCycleProfile = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      cycleProfile: { ...prev.cycleProfile, [key]: value },
    }));
  };

  const toggleConcern = (concernId) => {
    if (concernId === "all") {
      if (answers.concerns.includes("all")) {
        setAnswers((prev) => ({ ...prev, concerns: [] }));
      } else {
        setAnswers((prev) => ({ ...prev, concerns: ["all"] }));
      }
    } else {
      setAnswers((prev) => ({
        ...prev,
        concerns: prev.concerns.includes("all")
          ? [concernId]
          : prev.concerns.includes(concernId)
          ? prev.concerns.filter((c) => c !== concernId)
          : [...prev.concerns, concernId],
      }));
    }
  };

  const toggleValue = (value) => {
    setAnswers((prev) => ({
      ...prev,
      values: prev.values.includes(value)
        ? prev.values.filter((v) => v !== value)
        : [...prev.values, value],
    }));
  };

  const addBoundary = () => {
    setAnswers((prev) => ({
      ...prev,
      boundaries: [...prev.boundaries, ""],
    }));
  };

  const updateBoundary = (index, value) => {
    setAnswers((prev) => ({
      ...prev,
      boundaries: prev.boundaries.map((b, i) => (i === index ? value : b)),
    }));
  };

  const removeBoundary = (index) => {
    setAnswers((prev) => ({
      ...prev,
      boundaries: prev.boundaries.filter((_, i) => i !== index),
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return true; // Welcome screen
      case 1:
        return answers.concerns.length > 0;
      case 2:
        return true; // Auto-advance on single select
      case 3:
        return true; // Auto-advance on single select
      case 4:
        return true; // Capacity is always set
      case 5:
        return true; // Free text is optional
      case 6:
        return true; // Cycle info is optional
      case 7:
        return !answers.enableDeepPersonalisation || answers.dob !== "";
      case 8:
        return answers.values.length > 0;
      case 9:
        return true; // Snapshot prefs have defaults
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);

    const result = await analyzeAnswers(answers);

    await base44.entities.DiagnosticSession.create({
      ...answers,
      ...result,
      isComplete: true,
    });

    setTimeout(() => {
      navigate(createPageUrl("Dashboard"));
    }, 2000);
  };

  const getCyclePhase = (lastPeriodDate, cycleLength) => {
    if (!lastPeriodDate) return null;
    const daysSincePeriod = Math.floor((new Date() - new Date(lastPeriodDate)) / (1000 * 60 * 60 * 24));
    const cycleDay = daysSincePeriod % cycleLength;
    
    if (cycleDay <= 6) return "Menstrual";
    if (cycleDay <= Math.floor(cycleLength * 0.4)) return "Follicular";
    if (cycleDay <= Math.floor(cycleLength * 0.5)) return "Ovulatory";
    return "Luteal";
  };

  const analyzeAnswers = async (data) => {
    const cyclePhase = getCyclePhase(data.cycleProfile?.lastPeriodDate, data.cycleProfile?.cycleLength);
    const daysSincePeriod = data.cycleProfile?.lastPeriodDate 
      ? Math.floor((new Date() - new Date(data.cycleProfile.lastPeriodDate)) / (1000 * 60 * 60 * 24))
      : null;

    const prompt = `You are analyzing a woman's wellness profile to create her personalized ALIVE Method pathway.

CONTEXT:
- Concerns: ${data.concerns.join(", ")}
- Current Feeling: ${data.currentFeeling}
- Capacity Score: ${data.capacityScore}/10
- Time Available: ${data.timeAvailable}
- Personal Context: ${data.userContextText || "Not provided"}
- Core Values: ${data.values.join(", ")}
- Releasing: ${data.releasing || "Not specified"}
- Becoming: ${data.becoming || "Not specified"}
- Boundaries: ${data.boundaries.filter(b => b).join("; ") || "Not set"}
${data.cycleProfile?.cycleStage === "Cycling" ? `- Cycle Phase: ${cyclePhase} (Day ${daysSincePeriod} of ${data.cycleProfile.cycleLength}-day cycle)` : `- Cycle Stage: ${data.cycleProfile?.cycleStage || "Not specified"}`}
${data.enableDeepPersonalisation ? `- Birth Data: ${data.dob} ${data.tob ? `at ${data.tob}` : ""} in ${data.pob}` : ""}

PROVIDE:
1. Primary ALIVE Phase (Awareness/Liberation/Intention/VisionEmbodiment) - which phase she needs most right now
2. Secondary Phase - supporting phase for integration
3. ALIVE Narrative - 2-3 sentences explaining why these phases and what they mean for her journey
4. Phase Focus Advice - one clear action statement for her primary phase
5. Risk Flags - any concerns (burnout, overwhelm, low capacity, isolation)
6. Condensed Topics - areas she may already understand or have worked on
7. Recommended Modules - 3-5 specific module topics aligned with her phases
8. First Week Plan - 3-5 concrete, time-appropriate actions

${data.enableDeepPersonalisation ? `
ASTROLOGY (based on ${data.dob}):
- Determine likely Sun, Moon, Rising signs
- Current transit summary (general for this time of year)
` : ""}

${data.enableDeepPersonalisation ? `
HUMAN DESIGN (inferred from birth data):
- Determine likely Type, Authority, Strategy
- Energy pattern description
` : ""}

DAILY SNAPSHOT:
- Astrology Insight: One sentence about current energy
- Human Design Insight: How to work with her design today
- Cycle Insight: Guidance based on ${cyclePhase || data.cycleProfile?.cycleStage || "her body's rhythm"}
- Energy Guidance: What to do with ${data.capacityScore}/10 capacity
- Exercise Recommendation: Type and intensity for today
- Nutrition Recommendation: What to prioritize nutritionally
- Focus Reminder: One grounding statement

WEEKLY SUMMARY: 2-3 paragraph overview for the week ahead
MONTHLY SUMMARY: 2-3 paragraph reflection and intention-setting for the month

Be warm, specific, and action-oriented.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          primaryPhase: { type: "string" },
          secondaryPhase: { type: "string" },
          aliveNarrative: { type: "string" },
          phaseFocusAdvice: { type: "string" },
          riskFlags: { type: "array", items: { type: "string" } },
          condensedTopics: { type: "array", items: { type: "string" } },
          recommendedModules: { type: "array", items: { type: "string" } },
          firstWeekPlan: { type: "array", items: { type: "string" } },
          astrologyProfile: {
            type: "object",
            properties: {
              sunSign: { type: "string" },
              moonSign: { type: "string" },
              risingSign: { type: "string" },
              currentTransitSummary: { type: "string" }
            }
          },
          humanDesignProfile: {
            type: "object",
            properties: {
              type: { type: "string" },
              authority: { type: "string" },
              strategy: { type: "string" },
              energyPattern: { type: "string" }
            }
          },
          dailySnapshot: {
            type: "object",
            properties: {
              astrologyInsight: { type: "string" },
              humanDesignInsight: { type: "string" },
              cycleInsight: { type: "string" },
              energyGuidance: { type: "string" },
              exerciseRecommendation: { type: "string" },
              nutritionRecommendation: { type: "string" },
              focusReminder: { type: "string" }
            }
          },
          weeklySnapshotSummary: { type: "string" },
          monthlySnapshotSummary: { type: "string" }
        },
      },
    });

    return result;
  };

  // Auto-advance for single-select questions
  const handleSingleSelect = (key, value) => {
    updateAnswer(key, value);
    setTimeout(() => {
      if (step < totalSteps - 1) {
        setStep(step + 1);
      }
    }, 300);
  };

  // Determine if current step needs manual next button
  const needsNextButton = () => {
    return step === 0 || step === 1 || step === 4 || step === 5 || step === 6 || step === 7 || step === 8 || step === 9 || step === 10;
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#4A1228] to-[#2A0A18] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 text-rose-300 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Building Your Pathway...</h2>
          <p className="text-white/60">Analyzing your responses to create your personalized journey.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4A1228] to-[#2A0A18] p-4 md:p-6 pb-28">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6945438e6f6e0e1d874ba569/6f3c1f132_AWLogoWhite.png"
                alt="The Aligned Woman"
                className="w-14 h-14 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-white">Your Pathway</h1>
                <p className="text-white/50 text-sm">{step + 1} of {totalSteps}</p>
              </div>
            </div>
          </div>
          <Progress value={((step + 1) / totalSteps) * 100} className="h-1.5" />
        </div>

        {/* Question Content */}
        <div className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 0: Welcome */}
              {step === 0 && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 bg-rose-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-rose-300" />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">Welcome</h2>
                  <p className="text-xl text-white/80 mb-4">
                    This platform adapts to you.
                  </p>
                  <p className="text-white/60 max-w-md mx-auto">
                    Answer a few questions so we can personalise your daily guidance. 
                    You can skip anything and update later.
                  </p>
                </div>
              )}

              {/* Step 1: Concerns */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      What do you need <span className="text-rose-300">help with</span> this week?
                    </h2>
                    <p className="text-white/60">Select all that resonate with you</p>
                  </div>
                  <div className="space-y-3">
                    {concernOptions.map((concern) => {
                      const Icon = concern.icon;
                      const isSelected = answers.concerns.includes(concern.id);
                      return (
                        <button
                          key={concern.id}
                          onClick={() => toggleConcern(concern.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                            isSelected
                              ? "bg-rose-400/10 border-rose-400/50"
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-rose-400/20" : "bg-white/10"
                          }`}>
                            <Icon className={`w-6 h-6 ${isSelected ? "text-rose-300" : "text-white/60"}`} />
                          </div>
                          <span className="text-white font-medium flex-1 text-left">{concern.label}</span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-rose-400 bg-rose-400" : "border-white/30"
                          }`}>
                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Current Feeling */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      What feels <span className="text-rose-300">hardest</span> this week?
                    </h2>
                    <p className="text-white/60">Choose what resonates most</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {feelingOptions.map((feeling) => (
                      <button
                        key={feeling}
                        onClick={() => handleSingleSelect("currentFeeling", feeling)}
                        className={`p-4 rounded-2xl border-2 transition-all text-center ${
                          answers.currentFeeling === feeling
                            ? "bg-rose-400/10 border-rose-400/50 text-white"
                            : "bg-white/5 border-white/10 hover:border-white/20 text-white/70"
                        }`}
                      >
                        <span className="font-medium">{feeling}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Time Available */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      How much <span className="text-rose-300">time</span> do you have?
                    </h2>
                    <p className="text-white/60">Per day, realistically</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {timeOptions.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleSingleSelect("timeAvailable", time)}
                        className={`p-5 rounded-2xl border-2 transition-all ${
                          answers.timeAvailable === time
                            ? "bg-rose-400/10 border-rose-400/50 text-white"
                            : "bg-white/5 border-white/10 hover:border-white/20 text-white/70"
                        }`}
                      >
                        <Clock className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-medium text-lg">{time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Capacity */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Capacity <span className="text-rose-300">right now</span>
                    </h2>
                    <p className="text-white/60">How resourced do you feel today?</p>
                  </div>
                  <Card className="bg-white/5 border-white/10 p-8">
                    <div className="space-y-6">
                      <div className="flex justify-between text-sm text-white/50">
                        <span>Barely coping</span>
                        <span>Resourced and steady</span>
                      </div>
                      <Slider
                        value={[answers.capacityScore]}
                        onValueChange={(val) => updateAnswer("capacityScore", val[0])}
                        max={10}
                        min={1}
                        step={1}
                        className="py-4"
                      />
                      <div className="text-center">
                        <span className="text-6xl font-bold text-rose-300">{answers.capacityScore}</span>
                        <span className="text-2xl text-white/40">/10</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Step 5: Free Text Context */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Tell us what's <span className="text-rose-300">happening</span> for you
                    </h2>
                    <p className="text-white/60">Share as much or as little as you'd like</p>
                  </div>
                  <Textarea
                    value={answers.userContextText}
                    onChange={(e) => updateAnswer("userContextText", e.target.value)}
                    placeholder="I've been feeling... I'm working on... I need support with..."
                    className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl text-lg p-6"
                  />
                </div>
              )}

              {/* Step 6: Cycle Profile */}
              {step === 6 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      <span className="text-rose-300">Cycle</span> / Hormone Support
                    </h2>
                    <p className="text-white/60">Optional - helps personalize energy guidance</p>
                  </div>
                  <Card className="bg-white/5 border-white/10 p-6 space-y-4">
                    <div>
                      <Label className="text-white mb-2 block">Cycle Stage</Label>
                      <Select
                        value={answers.cycleProfile.cycleStage}
                        onValueChange={(value) => updateCycleProfile("cycleStage", value)}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cycling">Cycling</SelectItem>
                          <SelectItem value="Perimenopausal">Perimenopausal</SelectItem>
                          <SelectItem value="Menopausal">Menopausal</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {answers.cycleProfile.cycleStage === "Cycling" && (
                      <>
                        <div>
                          <Label className="text-white mb-2 block">Cycle Length (days)</Label>
                          <Input
                            type="number"
                            value={answers.cycleProfile.cycleLength}
                            onChange={(e) => updateCycleProfile("cycleLength", parseInt(e.target.value))}
                            className="bg-white/10 border-white/20 text-white"
                            min="21"
                            max="45"
                          />
                        </div>
                        <div>
                          <Label className="text-white mb-2 block">Last Period Date (optional)</Label>
                          <Input
                            type="date"
                            value={answers.cycleProfile.lastPeriodDate}
                            onChange={(e) => updateCycleProfile("lastPeriodDate", e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </>
                    )}
                  </Card>
                </div>
              )}

              {/* Step 7: Birth Details */}
              {step === 7 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Want <span className="text-rose-300">deeper personalisation</span>?
                    </h2>
                    <p className="text-white/60">Add your birth details for Human Design + Astrology insights. Optional.</p>
                  </div>
                  <Card className="bg-white/5 border-white/10 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Enable Deep Personalisation</Label>
                      <Switch
                        checked={answers.enableDeepPersonalisation}
                        onCheckedChange={(checked) => updateAnswer("enableDeepPersonalisation", checked)}
                      />
                    </div>
                    {answers.enableDeepPersonalisation && (
                      <>
                        <div>
                          <Label className="text-white mb-2 block">Date of Birth *</Label>
                          <Input
                            type="date"
                            value={answers.dob}
                            onChange={(e) => updateAnswer("dob", e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white mb-2 block">Time of Birth (optional)</Label>
                          <Input
                            type="time"
                            value={answers.tob}
                            onChange={(e) => updateAnswer("tob", e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="I don't know"
                          />
                        </div>
                        <div>
                          <Label className="text-white mb-2 block">Place of Birth (optional)</Label>
                          <Input
                            value={answers.pob}
                            onChange={(e) => updateAnswer("pob", e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="City, Country"
                          />
                        </div>
                      </>
                    )}
                  </Card>
                </div>
              )}

              {/* Step 8: Values, Identity, Boundaries */}
              {step === 8 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Your <span className="text-rose-300">Values & Identity</span>
                    </h2>
                  </div>

                  <div>
                    <Label className="text-white mb-3 block text-lg">Core Values</Label>
                    <div className="flex flex-wrap gap-2">
                      {coreValueOptions.map((value) => (
                        <button
                          key={value}
                          onClick={() => toggleValue(value)}
                          className={`px-4 py-2 rounded-full border-2 transition-all ${
                            answers.values.includes(value)
                              ? "bg-rose-400/20 border-rose-400 text-white"
                              : "bg-white/5 border-white/20 text-white/70"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Releasing (Identity Evolution)</Label>
                    <Input
                      value={answers.releasing}
                      onChange={(e) => updateAnswer("releasing", e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="What are you letting go of?"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Becoming (Identity Evolution)</Label>
                    <Input
                      value={answers.becoming}
                      onChange={(e) => updateAnswer("becoming", e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Who are you becoming?"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Active Boundaries</Label>
                    <p className="text-white/60 text-sm mb-3">What boundaries do you need right now?</p>
                    <div className="space-y-2">
                      {answers.boundaries.map((boundary, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={boundary}
                            onChange={(e) => updateBoundary(index, e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder={`Boundary ${index + 1}`}
                          />
                          {answers.boundaries.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBoundary(index)}
                              className="text-white/60 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {answers.boundaries.length < 5 && (
                        <Button
                          variant="outline"
                          onClick={addBoundary}
                          className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                        >
                          + Add Boundary
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 9: Snapshot Preferences */}
              {step === 9 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Your <span className="text-rose-300">Snapshot</span> Preferences
                    </h2>
                    <p className="text-white/60">How often would you like to see your full overview?</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { value: "daily", label: "Daily snapshot (everything in one view)" },
                      { value: "weekly", label: "Weekly overview" },
                      { value: "monthly", label: "Monthly reflection" },
                      { value: "manual", label: "Only when I check in" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateAnswer("snapshotFrequency", option.value)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                          answers.snapshotFrequency === option.value
                            ? "bg-rose-400/10 border-rose-400/50 text-white"
                            : "bg-white/5 border-white/10 hover:border-white/20 text-white/70"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <Card className="bg-white/5 border-white/10 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white text-base">Daily Update</Label>
                        <p className="text-white/60 text-sm mt-1">
                          Send me a daily update that includes everything (my snapshot)
                        </p>
                      </div>
                      <Switch
                        checked={answers.dailyUpdateEnabled}
                        onCheckedChange={(checked) => updateAnswer("dailyUpdateEnabled", checked)}
                      />
                    </div>
                  </Card>
                </div>
              )}

              {/* Step 10: Summary */}
              {step === 10 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-rose-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-rose-300" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">You're All Set!</h2>
                    <p className="text-white/60">Here's your personalized pathway summary</p>
                  </div>

                  <Card className="bg-white/5 border-white/10 p-6 space-y-4">
                    <div>
                      <Label className="text-rose-300 text-sm">Focus Areas</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {answers.concerns.map((concern) => (
                          <Badge key={concern} className="bg-white/10 text-white border-0">
                            {concernOptions.find((c) => c.id === concern)?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-rose-300 text-sm">Current State</Label>
                      <p className="text-white mt-1">{answers.currentFeeling}</p>
                    </div>

                    <div>
                      <Label className="text-rose-300 text-sm">Daily Time Available</Label>
                      <p className="text-white mt-1">{answers.timeAvailable}</p>
                    </div>

                    <div>
                      <Label className="text-rose-300 text-sm">Capacity Score</Label>
                      <p className="text-white mt-1">{answers.capacityScore}/10</p>
                    </div>

                    <div>
                      <Label className="text-rose-300 text-sm">Snapshot Frequency</Label>
                      <p className="text-white mt-1 capitalize">{answers.snapshotFrequency}</p>
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#2A0A18] via-[#2A0A18]/95 to-transparent pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              size="lg"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Back
            </Button>
          )}
          {needsNextButton() && (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              size="lg"
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl py-6 text-lg font-semibold disabled:opacity-40"
            >
              {step === 0 ? "Start My Journey" : step < totalSteps - 1 ? "Continue →" : "Go to Dashboard"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}