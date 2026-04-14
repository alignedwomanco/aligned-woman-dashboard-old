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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import PlaceAutocomplete from "@/components/onboarding/PlaceAutocomplete";
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
  const [lauraiHelp, setLauraiHelp] = useState({});
  const [loadingHelp, setLoadingHelp] = useState(null);
  const [answers, setAnswers] = useState({
    fullName: "",
    email: "",
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

  const totalSteps = 12; // 0-11

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
        return answers.fullName.trim() !== "" && answers.email.trim() !== ""; // Name and email required
      case 2:
        return answers.concerns.length > 0;
      case 3:
        return answers.currentFeeling !== ""; // Required
      case 4:
        return answers.timeAvailable !== ""; // Required
      case 5:
        return true; // Capacity is always set
      case 6:
        return answers.userContextText.trim() !== ""; // Required
      case 7:
        return answers.cycleProfile.cycleStage !== ""; // Required
      case 8:
        return !answers.enableDeepPersonalisation || answers.dob !== "";
      case 9:
        return true; // Optional step, can proceed anytime
      case 10:
        return true; // Snapshot prefs have defaults
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      // Scroll to bottom to show new question
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);

    // Update user profile with name
    await base44.auth.updateMe({
      full_name: answers.fullName,
    });

    const result = await analyzeAnswers(answers);

    await base44.entities.DiagnosticSession.create({
      ...answers,
      ...result,
      isComplete: true,
      lastCheckInDate: new Date().toISOString(),
    });

    // Generate demo check-ins for December 2025 to populate the dashboard calendar
    const demoCheckIns = generateDemoCheckIns();
    for (const checkIn of demoCheckIns) {
      await base44.entities.CheckIn.create(checkIn);
    }

    setTimeout(() => {
      navigate(createPageUrl("Dashboard"));
    }, 2000);
  };

  const generateDemoCheckIns = () => {
    const checkIns = [];
    const today = new Date();
    const year = 2025;
    const month = 11; // December (0-indexed)
    
    // Generate 15 demo check-ins throughout December
    for (let day = 1; day <= 15; day++) {
      const date = new Date(year, month, day);
      if (date > today) break; // Don't create future check-ins
      
      // Vary the patterns to show different stress/energy levels
      let energy, stress, capacity, mood, nervous_system_state, cycle_phase;
      
      if (day % 7 === 0 || day % 11 === 0) {
        // High stress days
        energy = Math.floor(Math.random() * 3) + 2; // 2-4
        stress = Math.floor(Math.random() * 3) + 7; // 7-9
        capacity = Math.floor(Math.random() * 3) + 2; // 2-4
        mood = Math.floor(Math.random() * 3) + 3; // 3-5
        nervous_system_state = ["Fawn", "Flight"][Math.floor(Math.random() * 2)];
      } else if (day % 5 === 0) {
        // Moderate stress days
        energy = Math.floor(Math.random() * 3) + 4; // 4-6
        stress = Math.floor(Math.random() * 3) + 5; // 5-7
        capacity = Math.floor(Math.random() * 3) + 4; // 4-6
        mood = Math.floor(Math.random() * 3) + 5; // 5-7
        nervous_system_state = ["Fawn", "Freeze"][Math.floor(Math.random() * 2)];
      } else {
        // Good days
        energy = Math.floor(Math.random() * 3) + 6; // 6-8
        stress = Math.floor(Math.random() * 3) + 2; // 2-4
        capacity = Math.floor(Math.random() * 3) + 6; // 6-8
        mood = Math.floor(Math.random() * 3) + 7; // 7-9
        nervous_system_state = ["Safe & Social", "Rest & Digest"][Math.floor(Math.random() * 2)];
      }
      
      // Assign cycle phase based on day of month (if cycling)
      if (answers.cycleProfile?.cycleStage === "Cycling") {
        if (day <= 6) cycle_phase = "Menstrual";
        else if (day <= 12) cycle_phase = "Follicular";
        else if (day <= 16) cycle_phase = "Ovulatory";
        else cycle_phase = "Luteal";
      }
      
      checkIns.push({
        energy,
        stress,
        capacity,
        mood,
        nervous_system_state,
        cycle_phase,
        created_date: date.toISOString(),
        notes: day % 7 === 0 ? "Particularly challenging day with multiple deadlines" : 
               day % 5 === 0 ? "Feeling the pressure but managing" : "",
      });
    }
    
    return checkIns;
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
        // Scroll to bottom to show new question
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    }, 300);
  };

  // Auto-advance when certain questions are answered
  const handleAutoAdvance = () => {
    if (canProceed() && step < totalSteps - 1) {
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  };

  // Get LaurAI help for questions
  const getLaurAIHelp = async (questionKey, questionText) => {
    if (lauraiHelp[questionKey]) {
      setLauraiHelp(prev => ({ ...prev, [questionKey]: null }));
      return;
    }

    setLoadingHelp(questionKey);
    
    try {
      let contextPrompt = `You are LaurAI, helping someone fill out an onboarding form. They're stuck on this question:

"${questionText}"

`;

      // Add specific context based on question
      if (questionKey === 'context') {
        contextPrompt += `They selected these concerns: ${answers.concerns.map(c => concernOptions.find(opt => opt.id === c)?.label).join(", ") || "none yet"}
They're feeling: ${answers.currentFeeling || "not specified"}
Capacity: ${answers.capacityScore}/10

Give 2-3 sentence starters or prompts they can use to share what's happening. For example: "You could start with 'Right now I'm struggling with...' or 'What's been hardest is...'"`;
      } else if (questionKey === 'releasing') {
        contextPrompt += `They're working on: ${answers.concerns.map(c => concernOptions.find(opt => opt.id === c)?.label).join(", ") || "general wellbeing"}

Give 2-3 specific examples of what 'heavy' might mean in this context. Examples like: "people-pleasing behaviors", "old identity as someone who never says no", "belief that rest equals laziness"`;
      } else if (questionKey === 'becoming') {
        contextPrompt += `They're releasing: ${answers.releasing || "not specified yet"}
They're working on: ${answers.concerns.map(c => concernOptions.find(opt => opt.id === c)?.label).join(", ") || "general wellbeing"}

Give 2-3 examples of qualities/feelings they might want more of. Like: "more ease in decision-making", "more trust in your intuition", "more space to think"`;
      } else if (questionKey === 'boundaries') {
        contextPrompt += `They're working on: ${answers.concerns.map(c => concernOptions.find(opt => opt.id === c)?.label).join(", ") || "general wellbeing"}
Capacity: ${answers.capacityScore}/10

Give 2-3 specific boundary examples related to their context. Like: "no meetings before 9am", "stop explaining my choices to others", "distance from conversations about [topic]"`;
      }

      contextPrompt += `\n\nBe warm, specific, and practical. Keep it under 3 sentences.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt
      });

      setLauraiHelp(prev => ({ ...prev, [questionKey]: response }));
    } catch (error) {
      console.error("LaurAI help error:", error);
    } finally {
      setLoadingHelp(null);
    }
  };

  // Determine if current step needs manual next button
  const needsNextButton = () => {
    return step === 0 || step === 1 || step === 2 || step === 5 || step === 6 || step === 7 || step === 8 || step === 9 || step === 10 || step === 11;
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-indigo-50/30 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-12 text-center"
        >
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-light text-gray-900 mb-2 tracking-tight">Building Your Pathway...</h2>
          <p className="text-gray-500 font-light">Analyzing your responses to create your personalized journey.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-indigo-50/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img 
                src="https://media.base44.com/images/public/69597fee61a120309007685f/511e856dc_99e446771_AWBlogo.png"
                alt="The Aligned Woman"
                className="w-14 h-14 object-contain -mt-2"
              />
              <div>
                <h1 className="text-lg font-medium text-gray-900 tracking-tight">Your Pathway</h1>
                <p className="text-gray-500 text-sm font-light">{step + 1} of {totalSteps}</p>
              </div>
            </div>
          </div>
          <Progress value={((step + 1) / totalSteps) * 100} className="h-2 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-purple-400 [&>div]:to-pink-400" />
        </div>

        {/* Question Content */}
        <div className="space-y-4">
          {/* Render all questions up to current step */}
          {Array.from({ length: step + 1 }, (_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={i < step ? "opacity-60" : ""}
            >
              {/* Step 0: Welcome */}
              {i === 0 && (
                <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-12 space-y-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-purple-500" />
                </div>
                <h2 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">Welcome</h2>
                <p className="text-xl text-gray-700 mb-4 font-light">
                  This platform adapts to you.
                </p>
                <p className="text-gray-500 max-w-md mx-auto font-light leading-relaxed">
                  Answer a few questions so we can personalise your daily guidance. 
                  You can skip anything and update later.
                </p>
                {i === step && (
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-8 py-6 text-lg font-light shadow-lg"
                  >
                    Start My Journey
                  </Button>
                )}
                </div>
              )}

              {/* Step 1: Name & Email */}
              {i === 1 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                      Let's get to <span className="text-purple-600">know you</span>
                    </h2>
                    <p className="text-gray-500 mb-6 font-light">Tell us your name and email</p>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 mb-2 block font-medium">Full Name *</Label>
                        <Input
                          value={answers.fullName}
                          onChange={(e) => updateAnswer("fullName", e.target.value)}
                          className="bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 mb-2 block font-medium">Email *</Label>
                        <Input
                          type="email"
                          value={answers.email}
                          onChange={(e) => updateAnswer("email", e.target.value)}
                          onBlur={handleAutoAdvance}
                          className="bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400"
                          placeholder="your@email.com"
                        />
                      </div>
                      {i === step && canProceed() && (
                        <Button
                          onClick={handleNext}
                          size="lg"
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-light shadow-lg mt-4"
                        >
                          Continue →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Concerns */}
              {i === 2 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                      What do you need <span className="text-purple-600">help with</span> this week?
                    </h2>
                    <p className="text-gray-500 mb-6 font-light">Select all that resonate with you</p>
                    <div className="space-y-3">
                      {concernOptions.map((concern) => {
                        const Icon = concern.icon;
                        const isSelected = answers.concerns.includes(concern.id);
                        return (
                          <button
                            key={concern.id}
                            onClick={() => toggleConcern(concern.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                              isSelected
                                ? "bg-purple-50 border-purple-200 shadow-sm"
                                : "bg-white/80 border-gray-200 hover:border-purple-200 hover:bg-purple-50/50"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isSelected ? "bg-purple-100" : "bg-gray-100"
                            }`}>
                              <Icon className={`w-6 h-6 ${isSelected ? "text-purple-600" : "text-gray-500"}`} />
                            </div>
                            <span className={`font-light flex-1 text-left ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{concern.label}</span>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"
                            }`}>
                              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {i === step && canProceed() && (
                      <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-light shadow-lg mt-6"
                      >
                        Continue →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Current Feeling */}
              {i === 3 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                      What feels <span className="text-purple-600">hardest</span> at the moment?
                    </h2>
                    <p className="text-gray-500 mb-6 font-light">Or in the last month</p>
                    <div className="grid grid-cols-2 gap-3">
                      {feelingOptions.map((feeling) => (
                        <button
                          key={feeling}
                          onClick={() => handleSingleSelect("currentFeeling", feeling)}
                          className={`p-4 rounded-2xl border transition-all text-center ${
                            answers.currentFeeling === feeling
                              ? "bg-purple-50 border-purple-200 text-gray-900 shadow-sm"
                              : "bg-white/80 border-gray-200 hover:border-purple-200 text-gray-700 hover:bg-purple-50/50"
                          }`}
                        >
                          <span className="font-light">{feeling}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Time Available */}
              {i === 4 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                      How much <span className="text-purple-600">time</span> do you have?
                    </h2>
                    <p className="text-gray-500 mb-6 font-light">Per day, realistically</p>
                    <div className="grid grid-cols-2 gap-3">
                      {timeOptions.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleSingleSelect("timeAvailable", time)}
                          className={`p-5 rounded-2xl border transition-all ${
                            answers.timeAvailable === time
                              ? "bg-purple-50 border-purple-200 text-gray-900 shadow-sm"
                              : "bg-white/80 border-gray-200 hover:border-purple-200 text-gray-700 hover:bg-purple-50/50"
                          }`}
                        >
                          <Clock className={`w-6 h-6 mx-auto mb-2 ${answers.timeAvailable === time ? "text-purple-500" : "text-gray-500"}`} />
                          <span className="font-light text-lg">{time}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Capacity */}
              {i === 5 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                      Capacity <span className="text-purple-600">right now</span>
                    </h2>
                    <p className="text-gray-500 mb-8 font-light">How resourced do you feel at the moment (i.e. last 30 days)?</p>
                    <div className="space-y-6">
                      <div className="flex justify-between text-sm text-gray-500 font-light">
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
                        <span className="text-6xl font-light text-purple-600">{answers.capacityScore}</span>
                        <span className="text-2xl text-gray-400 font-light">/10</span>
                      </div>
                    </div>
                    {i === step && (
                      <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-light shadow-lg mt-6"
                      >
                        Continue →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 6: Free Text Context */}
              {i === 6 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                      Tell us what's <span className="text-purple-600">happening</span> for you
                    </h2>
                    <p className="text-gray-500 mb-6 font-light">
                      {answers.concerns.length > 0 
                        ? `Tell us more about ${answers.concerns.slice(0, 2).map(c => concernOptions.find(opt => opt.id === c)?.label.toLowerCase()).join(" and ")}`
                        : "Share as much or as little as you'd like"}
                    </p>
                    <div className="space-y-3">
                      <Textarea
                        value={answers.userContextText}
                        onChange={(e) => updateAnswer("userContextText", e.target.value)}
                        placeholder={answers.concerns.length > 0 
                          ? `What's happening with ${answers.concerns.slice(0, 2).map(c => concernOptions.find(opt => opt.id === c)?.label.toLowerCase()).join(" and ")}...`
                          : "I've been feeling... I'm working on... I need support with..."}
                        className="min-h-[200px] bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl text-lg p-6"
                      />
                      <button
                        type="button"
                        onClick={() => getLaurAIHelp('context', 'Tell us what\'s happening for you')}
                        className="text-sm text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1 font-light"
                      >
                        {loadingHelp === 'context' ? (
                          <>
                            <div className="animate-spin w-3 h-3 border border-purple-200 border-t-purple-600 rounded-full" />
                            <span>Getting help...</span>
                          </>
                        ) : (
                          <>Not sure what to write? Ask LaurAI →</>
                        )}
                      </button>
                      {lauraiHelp.context && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-purple-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed font-light"
                        >
                          {lauraiHelp.context}
                        </motion.div>
                      )}
                    </div>
                    {i === step && canProceed() && (
                      <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-light shadow-lg mt-4"
                      >
                        Continue →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 7: Cycle Profile */}
              {i === 7 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                      <span className="text-purple-600">Cycle</span> / Hormone Support
                    </h2>
                    <p className="text-gray-500 mb-6 font-light">Optional - helps personalize energy guidance</p>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 mb-2 block font-medium">Cycle Stage</Label>
                        <Select
                          value={answers.cycleProfile.cycleStage}
                          onValueChange={(value) => updateCycleProfile("cycleStage", value)}
                        >
                          <SelectTrigger className="bg-white/80 border-gray-200 text-gray-900">
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
                            <Label className="text-gray-700 mb-2 block font-medium">Cycle Length (days)</Label>
                            <Input
                              type="number"
                              value={answers.cycleProfile.cycleLength}
                              onChange={(e) => updateCycleProfile("cycleLength", parseInt(e.target.value))}
                              className="bg-white/80 border-gray-200 text-gray-900"
                              min="21"
                              max="45"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-700 mb-2 block font-medium">Last Period Date (optional)</Label>
                            <Input
                              type="date"
                              value={answers.cycleProfile.lastPeriodDate}
                              onChange={(e) => updateCycleProfile("lastPeriodDate", e.target.value)}
                              className="bg-white/80 border-gray-200 text-gray-900"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    {i === step && canProceed() && (
                      <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-light shadow-lg mt-6"
                      >
                        Continue →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 8: Birth Details */}
              {i === 8 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                      Want <span className="text-purple-600">deeper personalisation</span>?
                    </h2>
                    <p className="text-gray-500 mb-6 font-light">Add your birth details for Human Design + Astrology insights. Optional.</p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-gray-200">
                        <Label className="text-gray-700 font-medium">Enable Deep Personalisation</Label>
                        <Switch
                          checked={answers.enableDeepPersonalisation}
                          onCheckedChange={(checked) => updateAnswer("enableDeepPersonalisation", checked)}
                        />
                      </div>
                      {answers.enableDeepPersonalisation && (
                      <>
                        <div>
                          <Label className="text-gray-700 mb-2 block font-medium">Date of Birth *</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Select
                                value={answers.dob.split('-')[2] || ""}
                                onValueChange={(day) => {
                                  const [year, month] = answers.dob.split('-');
                                  updateAnswer("dob", `${year || "1990"}-${month || "01"}-${day.padStart(2, '0')}`);
                                }}
                              >
                                <SelectTrigger className="bg-white/80 border-gray-200 text-gray-900">
                                  <SelectValue placeholder="Day" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Select
                                value={answers.dob.split('-')[1] || ""}
                                onValueChange={(month) => {
                                  const [year, , day] = answers.dob.split('-');
                                  updateAnswer("dob", `${year || "1990"}-${month.padStart(2, '0')}-${day || "01"}`);
                                }}
                              >
                                <SelectTrigger className="bg-white/80 border-gray-200 text-gray-900">
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>{month}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Select
                                value={answers.dob.split('-')[0] || ""}
                                onValueChange={(year) => {
                                  const [, month, day] = answers.dob.split('-');
                                  updateAnswer("dob", `${year}-${month || "01"}-${day || "01"}`);
                                }}
                              >
                                <SelectTrigger className="bg-white/80 border-gray-200 text-gray-900">
                                  <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-700 mb-2 block font-medium">Time of Birth (optional)</Label>
                          <Input
                            type="time"
                            value={answers.tob}
                            onChange={(e) => updateAnswer("tob", e.target.value)}
                            className="bg-white/80 border-gray-200 text-gray-900"
                            placeholder="I don't know"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700 mb-2 block font-medium">Place of Birth (optional)</Label>
                          <PlaceAutocomplete
                            value={answers.pob}
                            onChange={(value) => updateAnswer("pob", value)}
                            className="bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400"
                            placeholder="Start typing city name..."
                          />
                        </div>
                      </>
                      )}
                    </div>
                    {i === step && canProceed() && (
                      <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-light shadow-lg mt-6"
                      >
                        Continue →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 9: Values, Identity, Boundaries */}
              {i === 9 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-8 tracking-tight">
                      Your <span className="text-purple-600">Values & Identity</span>
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-gray-700 mb-3 block text-lg font-medium">Core Values</Label>
                        <div className="flex flex-wrap gap-2">
                          {coreValueOptions.map((value) => (
                            <button
                              key={value}
                              onClick={() => toggleValue(value)}
                              className={`px-4 py-2 rounded-full border transition-all ${
                                answers.values.includes(value)
                                  ? "bg-purple-50 border-purple-200 text-gray-900"
                                  : "bg-white/80 border-gray-200 text-gray-700 hover:border-purple-200 hover:bg-purple-50/50"
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-700 mb-2 block font-medium">Letting go (what feels heavy right now)</Label>
                        <p className="text-gray-500 text-sm mb-3 font-light">This can be a habit, a belief, a role you're playing, or something that's draining you.</p>
                        <div className="space-y-3">
                          <Input
                            value={answers.releasing}
                            onChange={(e) => updateAnswer("releasing", e.target.value)}
                            className="bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400"
                            placeholder="For example: people-pleasing, overworking, self-doubt, a relationship pattern, unrealistic expectations…"
                          />
                          <button
                            type="button"
                            onClick={() => getLaurAIHelp('releasing', 'What feels heavy right now that you want to let go of?')}
                            className="text-sm text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1 font-light"
                          >
                            {loadingHelp === 'releasing' ? (
                              <>
                                <div className="animate-spin w-3 h-3 border border-purple-200 border-t-purple-600 rounded-full" />
                                <span>Getting help...</span>
                              </>
                            ) : (
                              <>Not sure what to write? Ask LaurAI →</>
                            )}
                          </button>
                          {lauraiHelp.releasing && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="bg-purple-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed font-light"
                            >
                              {lauraiHelp.releasing}
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-700 mb-2 block font-medium">What do you want more of in your life?</Label>
                        <p className="text-gray-500 text-sm mb-1 font-light">You don't need a full answer, just a direction.</p>
                        <p className="text-gray-400 text-xs mb-3 font-light">Think in feelings or qualities, not labels.</p>
                        <div className="space-y-3">
                          <Input
                            value={answers.becoming}
                            onChange={(e) => updateAnswer("becoming", e.target.value)}
                            className="bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400"
                            placeholder="For example: more calm, more confidence, more honesty, more ease, more self-trust…"
                          />
                          <button
                            type="button"
                            onClick={() => getLaurAIHelp('becoming', 'What do you want more of in your life?')}
                            className="text-sm text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1 font-light"
                          >
                            {loadingHelp === 'becoming' ? (
                              <>
                                <div className="animate-spin w-3 h-3 border border-purple-200 border-t-purple-600 rounded-full" />
                                <span>Getting help...</span>
                              </>
                            ) : (
                              <>Not sure what to write? Ask LaurAI →</>
                            )}
                          </button>
                          {lauraiHelp.becoming && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="bg-purple-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed font-light"
                            >
                              {lauraiHelp.becoming}
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-700 mb-2 block font-medium">Where do you need better boundaries right now?</Label>
                        <p className="text-gray-500 text-sm mb-3 font-light">This helps protect your energy while you're growing.</p>
                        <button
                          type="button"
                          onClick={() => getLaurAIHelp('boundaries', 'Where do you need better boundaries?')}
                          className="text-sm text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1 mb-3 font-light"
                        >
                          {loadingHelp === 'boundaries' ? (
                            <>
                              <div className="animate-spin w-3 h-3 border border-purple-200 border-t-purple-600 rounded-full" />
                              <span>Getting help...</span>
                            </>
                          ) : (
                            <>Not sure what to write? Ask LaurAI →</>
                          )}
                        </button>
                        {lauraiHelp.boundaries && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-purple-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed mb-3 font-light"
                          >
                            {lauraiHelp.boundaries}
                          </motion.div>
                        )}
                        <div className="space-y-2">
                          {answers.boundaries.map((boundary, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={boundary}
                                onChange={(e) => updateBoundary(index, e.target.value)}
                                className="bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400"
                                placeholder="For example: no work after 7pm, fewer explanations to others, space from certain conversations…"
                              />
                              {answers.boundaries.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBoundary(index)}
                                  className="text-gray-500 hover:text-gray-700"
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
                              className="w-full bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50"
                            >
                              ➕ Add another boundary
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {i === step && canProceed() && (
                      <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-light shadow-lg mt-6"
                      >
                        Continue →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 10: Snapshot Preferences */}
              {i === 10 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                      Your <span className="text-purple-600">Snapshot</span> Preferences
                    </h2>
                    <p className="text-gray-500 mb-6 font-light">How often would you like to see your full overview?</p>

                    <div className="space-y-3 mb-6">
                      {[
                        { value: "daily", label: "Daily snapshot (everything in one view)" },
                        { value: "weekly", label: "Weekly overview" },
                        { value: "monthly", label: "Monthly reflection" },
                        { value: "manual", label: "Only when I check in" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateAnswer("snapshotFrequency", option.value)}
                          className={`w-full p-4 rounded-2xl border transition-all text-left ${
                            answers.snapshotFrequency === option.value
                              ? "bg-purple-50 border-purple-200 text-gray-900 shadow-sm"
                              : "bg-white/80 border-gray-200 hover:border-purple-200 text-gray-700 hover:bg-purple-50/50"
                          }`}
                        >
                          <span className="font-light">{option.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="bg-white/80 border border-gray-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-700 text-base font-medium">Daily Update</Label>
                          <p className="text-gray-500 text-sm mt-1 font-light">
                            Send me a daily update that includes everything (my snapshot)
                          </p>
                        </div>
                        <Switch
                          checked={answers.dailyUpdateEnabled}
                          onCheckedChange={(checked) => updateAnswer("dailyUpdateEnabled", checked)}
                        />
                      </div>
                    </div>
                    {i === step && (
                      <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-light shadow-lg mt-6"
                      >
                        Continue →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 11: Summary */}
              {i === 11 && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-purple-500" />
                    </div>
                    <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">You're All Set!</h2>
                    <p className="text-gray-500 font-light">Here's your personalized pathway summary</p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 space-y-6">
                    <div>
                      <Label className="text-purple-600 text-sm font-medium">Focus Areas</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {answers.concerns.map((concern) => (
                          <Badge key={concern} className="bg-purple-50 text-gray-700 border-0 font-light">
                            {concernOptions.find((c) => c.id === concern)?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-purple-600 text-sm font-medium">Current State</Label>
                      <p className="text-gray-900 mt-1 font-light">{answers.currentFeeling}</p>
                    </div>

                    <div>
                      <Label className="text-purple-600 text-sm font-medium">Daily Time Available</Label>
                      <p className="text-gray-900 mt-1 font-light">{answers.timeAvailable}</p>
                    </div>

                    <div>
                      <Label className="text-purple-600 text-sm font-medium">Capacity Score</Label>
                      <p className="text-gray-900 mt-1 font-light">{answers.capacityScore}/10</p>
                    </div>

                    <div>
                      <Label className="text-purple-600 text-sm font-medium">Snapshot Frequency</Label>
                      <p className="text-gray-900 mt-1 capitalize font-light">{answers.snapshotFrequency}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Buttons - Only show when on question that needs manual next */}
        {needsNextButton() && step === totalSteps - 1 && (
          <div className="mt-8 pb-6">
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-6 text-lg font-light disabled:opacity-40 shadow-lg"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}