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
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

const concernOptions = [
  { id: "business", label: "Business / Career", icon: Briefcase },
  { id: "relationships", label: "Relationships", icon: Heart },
  { id: "emotional", label: "Emotional / Nervous System", icon: Brain },
  { id: "body", label: "Body or Hormones", icon: Activity },
  { id: "money", label: "Money", icon: DollarSign },
  { id: "confidence", label: "Confidence or Identity", icon: Shield },
  { id: "boundaries", label: "Boundaries or Communication", icon: Shield },
  { id: "purpose", label: "Purpose or Leadership", icon: Target },
  { id: "visibility", label: "Visibility or Personal Brand", icon: Eye },
  { id: "other", label: "Other", icon: MoreHorizontal },
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

const moodOptions = [
  { value: "low", emoji: "😔", label: "Low" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "clarity", emoji: "✨", label: "Clarity" },
  { value: "uplift", emoji: "✨", label: "Uplift" },
  { value: "joy", emoji: "🌸", label: "Joy" },
];

const timeOptions = ["3 minutes", "10 minutes", "20 minutes", "45 minutes", "Varies a lot"];

export default function OnboardingDiagnostic() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answers, setAnswers] = useState({
    concerns: [],
    currentFeeling: "",
    moodCheck: "",
    capacityScore: 5,
    timeAvailable: "",
    awarenessAnswers: {},
    liberationAnswers: {},
    intentionAnswers: {},
    visionAnswers: {},
  });

  const totalSteps = getDynamicStepCount();

  function getDynamicStepCount() {
    let count = 5; // Foundation questions
    if (answers.concerns.includes("emotional") || answers.concerns.includes("body")) {
      count += 3; // More awareness questions
    } else {
      count += 2;
    }
    if (answers.concerns.includes("business") || answers.concerns.includes("purpose")) {
      count += 3; // More intention questions
    }
    return count;
  }

  const updateAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleConcern = (concernId) => {
    setAnswers((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(concernId)
        ? prev.concerns.filter((c) => c !== concernId)
        : [...prev.concerns, concernId],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return answers.concerns.length > 0;
      case 1:
        return answers.currentFeeling !== "";
      case 2:
        return answers.moodCheck !== "";
      case 3:
        return true;
      case 4:
        return answers.timeAvailable !== "";
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

    // Analyze answers to determine phases and recommendations
    const result = await analyzeAnswers(answers);

    await base44.entities.DiagnosticSession.create({
      ...answers,
      primaryPhase: result.primaryPhase,
      secondaryPhase: result.secondaryPhase,
      riskFlags: result.riskFlags,
      condensedTopics: result.condensedTopics,
      recommendedModules: result.recommendedModules,
      firstWeekPlan: result.firstWeekPlan,
      isComplete: true,
    });

    setTimeout(() => {
      navigate(createPageUrl("Dashboard"));
    }, 2000);
  };

  const analyzeAnswers = async (data) => {
    const prompt = `Analyze this user's onboarding responses and provide recommendations:

Concerns: ${data.concerns.join(", ")}
Current Feeling: ${data.currentFeeling}
Mood: ${data.moodCheck}
Capacity: ${data.capacityScore}/10
Time Available: ${data.timeAvailable}

Based on these answers, determine:
1. Primary phase (Awareness, Liberation, Intention, or VisionEmbodiment)
2. Secondary phase
3. Any risk flags (e.g., burnout, overwhelm, low capacity)
4. Topics to condense (things they already know)
5. 3-5 recommended first modules
6. 3-5 action items for their first week

Be concise and specific.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          primaryPhase: { type: "string" },
          secondaryPhase: { type: "string" },
          capacityScore: { type: "number" },
          riskFlags: { type: "array", items: { type: "string" } },
          condensedTopics: { type: "array", items: { type: "string" } },
          recommendedModules: { type: "array", items: { type: "string" } },
          firstWeekPlan: { type: "array", items: { type: "string" } },
        },
      },
    });

    return result;
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
    <div className="min-h-screen bg-gradient-to-b from-[#4A1228] to-[#2A0A18] p-4 md:p-6">
      <div className="max-w-2xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 py-6">
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
        <div className="flex-1 overflow-y-auto pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 0: Concerns */}
              {step === 0 && (
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

              {/* Step 1: Current Feeling */}
              {step === 1 && (
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
                        onClick={() => updateAnswer("currentFeeling", feeling)}
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

              {/* Step 2: Mood Check */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      <span className="text-rose-300">How are you feeling?</span>
                    </h2>
                    <p className="text-white/60">Quick mood check-in</p>
                  </div>
                  <Card className="bg-white/5 border-white/10 p-8">
                    <div className="grid grid-cols-5 gap-4">
                      {moodOptions.map((mood) => (
                        <button
                          key={mood.value}
                          onClick={() => updateAnswer("moodCheck", mood.value)}
                          className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
                            answers.moodCheck === mood.value
                              ? "bg-rose-400/20 scale-110"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <span className="text-4xl">{mood.emoji}</span>
                          <span className="text-white/70 text-sm font-medium">{mood.label}</span>
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Step 3: Capacity */}
              {step === 3 && (
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

              {/* Step 4: Time Available */}
              {step === 4 && (
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
                        onClick={() => updateAnswer("timeAvailable", time)}
                        className={`p-5 rounded-2xl border-2 transition-all ${
                          answers.timeAvailable === time
                            ? "bg-rose-400/10 border-rose-400/50 text-white"
                            : "bg-white/5 border-white/10 hover:border-white/20 text-white/70"
                        }`}
                      >
                        <span className="font-medium text-lg">{time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional dynamic steps would go here based on concerns */}
              {step >= 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Tell us what's <span className="text-rose-300">happening</span> for you
                    </h2>
                    <p className="text-white/60">Share as much or as little as you'd like</p>
                  </div>
                  <Textarea
                    value={answers.awarenessAnswers.context || ""}
                    onChange={(e) =>
                      updateAnswer("awarenessAnswers", {
                        ...answers.awarenessAnswers,
                        context: e.target.value,
                      })
                    }
                    placeholder="I've been feeling... I'm working on... I need support with..."
                    className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl text-lg p-6"
                  />
                  {answers.concerns.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {answers.concerns.map((concern) => {
                        const option = concernOptions.find((c) => c.id === concern);
                        return (
                          <Badge key={concern} variant="secondary" className="bg-rose-400/20 text-rose-200">
                            {option?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4">
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            size="lg"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl py-6 text-lg font-semibold disabled:opacity-40"
          >
            {step < totalSteps - 1 ? "Continue →" : "Complete"}
          </Button>
        </div>
      </div>
    </div>
  );
}