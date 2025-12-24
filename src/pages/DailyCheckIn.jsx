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
import { Sparkles, Heart, TrendingUp, AlertCircle, Target, Loader2 } from "lucide-react";

const moodOptions = [
  { emoji: "😊", label: "Great", value: "great" },
  { emoji: "🙂", label: "Good", value: "good" },
  { emoji: "😐", label: "Okay", value: "okay" },
  { emoji: "😔", label: "Low", value: "low" },
  { emoji: "😟", label: "Struggling", value: "struggling" },
];

const energyLevels = ["Depleted", "Low", "Moderate", "Good", "High"];
const needsOptions = [
  "Rest & Recovery",
  "Movement",
  "Clarity",
  "Support",
  "Direction",
  "Boundaries",
  "Confidence",
  "Nothing - I'm good",
];

export default function DailyCheckIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState(new Set());
  const [checkInData, setCheckInData] = useState({
    mood: "",
    energy: 5,
    todayFeeling: "",
    todayGoals: "",
    struggles: "",
    needsHelp: [],
    bodySignals: "",
  });

  const totalSteps = 6;

  const updateData = (key, value) => {
    setCheckInData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSingleSelect = (key, value) => {
    updateData(key, value);
    // Only auto-advance if this step hasn't been visited before
    if (!visitedSteps.has(step)) {
      setTimeout(() => {
        setVisitedSteps(prev => new Set([...prev, step]));
        if (step < totalSteps - 1) {
          setStep(step + 1);
        }
      }, 300);
    }
  };

  const toggleNeed = (need) => {
    setCheckInData((prev) => ({
      ...prev,
      needsHelp: prev.needsHelp.includes(need)
        ? prev.needsHelp.filter((n) => n !== need)
        : [...prev.needsHelp, need],
    }));
  };

  const handleComplete = async () => {
    setIsProcessing(true);

    // Get current diagnostic session
    const sessions = await base44.entities.DiagnosticSession.filter(
      { isComplete: true },
      "-created_date",
      1
    );
    const currentSession = sessions[0];

    if (!currentSession) {
      navigate(createPageUrl("OnboardingForm"));
      return;
    }

    // Generate updated snapshot based on check-in
    const snapshot = await generateDailySnapshot(checkInData, currentSession);

    // Update diagnostic session with new snapshot
    await base44.entities.DiagnosticSession.update(currentSession.id, {
      dailySnapshot: snapshot,
      lastCheckInDate: new Date().toISOString(),
    });

    // Track the check-in
    await base44.entities.CheckIn.create({
      energy: checkInData.energy,
      mood: moodOptions.findIndex((m) => m.value === checkInData.mood) + 1,
      stress: 5, // default
      capacity: checkInData.energy,
      bodySignals: checkInData.bodySignals,
      notes: `Today feeling: ${checkInData.todayFeeling}\nGoals: ${checkInData.todayGoals}\nStruggles: ${checkInData.struggles}`,
    });

    setTimeout(() => {
      navigate(createPageUrl("Dashboard"));
    }, 1000);
  };

  const generateDailySnapshot = async (checkIn, session) => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    
    const cyclePhase = getCyclePhase(session.cycleProfile?.lastPeriodDate, session.cycleProfile?.cycleLength);

    const prompt = `You are creating an integrated daily snapshot for a woman using the ALIVE Method platform.

TODAY: ${today}

CURRENT STATE (from today's check-in):
- Mood: ${checkIn.mood}
- Energy: ${checkIn.energy}/10
- Feeling: ${checkIn.todayFeeling}
- Goals for today: ${checkIn.todayGoals}
- Struggles: ${checkIn.struggles}
- Needs help with: ${checkIn.needsHelp.join(", ")}
- Body signals: ${checkIn.bodySignals}

USER PROFILE:
- ALIVE Phase: ${session.primaryPhase} (Secondary: ${session.secondaryPhase})
- Capacity baseline: ${session.capacityScore}/10
- Concerns: ${session.concerns?.join(", ")}
- Core values: ${session.values?.join(", ")}
${session.cycleProfile?.cycleStage === "Cycling" ? `- Cycle Phase: ${cyclePhase}` : `- Cycle Stage: ${session.cycleProfile?.cycgeStage}`}
${session.enableDeepPersonalisation ? `- Human Design: ${session.humanDesignProfile?.type} ${session.humanDesignProfile?.authority}` : ""}
${session.enableDeepPersonalisation ? `- Astrology: ${session.astrologyProfile?.sunSign} Sun, ${session.astrologyProfile?.moonSign} Moon` : ""}

CRITICAL: Create ONE INTEGRATED narrative that synthesizes all systems, not separate sections.

The integration model:
- Astrology (if available) = what external energies are active today
- Human Design (if available) = how they're wired to interact with those energies  
- Cycle = how much internal fuel they have right now
- Nervous system = how safely their system can process demand today
- ALIVE Method = what phase of growth they're integrating through

External conditions + Internal wiring + Current capacity = aligned action

Provide a SINGLE synthesized snapshot that:
1. Opens with a clear statement about what today is about
2. Weaves together the external energy (if available), their design (if available), their cycle, their nervous system state based on energy/mood
3. Translates this into specific guidance for movement, nutrition, focus
4. Frames everything through their ALIVE phase

Output format:
{
  "mainNarrative": "2-3 paragraphs of integrated wisdom - one voice, not separate systems",
  "todayIsAbout": "One clear sentence",
  "energyGuidance": "Based on their actual energy today",
  "movementRecommendation": "What type and intensity",
  "nutritionRecommendation": "What to prioritize",
  "focusReminder": "What to prioritize or avoid",
  "aliveLens": "How today connects to their growth arc",
  "recommendedModules": ["2-3 module topics aligned with today's needs"]
}

Be warm, specific, and synthesized. This is ONE intelligence speaking, not five systems.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          mainNarrative: { type: "string" },
          todayIsAbout: { type: "string" },
          energyGuidance: { type: "string" },
          movementRecommendation: { type: "string" },
          nutritionRecommendation: { type: "string" },
          focusReminder: { type: "string" },
          aliveLens: { type: "string" },
          recommendedModules: { type: "array", items: { type: "string" } },
        },
      },
    });

    return result;
  };

  const getCyclePhase = (lastPeriodDate, cycleLength = 28) => {
    if (!lastPeriodDate) return "Unknown";
    const daysSince = Math.floor((new Date() - new Date(lastPeriodDate)) / (1000 * 60 * 60 * 24));
    const cycleDay = daysSince % cycleLength;
    if (cycleDay <= 6) return "Menstrual";
    if (cycleDay <= Math.floor(cycleLength * 0.4)) return "Follicular";
    if (cycleDay <= Math.floor(cycleLength * 0.5)) return "Ovulatory";
    return "Luteal";
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return checkInData.mood !== "";
      case 1:
        return true;
      case 2:
        return checkInData.todayFeeling !== "";
      case 3:
        return checkInData.todayGoals !== "";
      case 4:
        return true;
      case 5:
        return checkInData.needsHelp.length > 0;
      default:
        return true;
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#611836] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 text-[#FECDD4] animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Synthesizing Your Day...</h2>
          <p className="text-white/60">Creating your personalized snapshot.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#611836] p-4 md:p-6">
      <div className="max-w-2xl mx-auto w-full">
        <div className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FECDD4]/20 rounded-full flex items-center justify-center">
               <Heart className="w-6 h-6 text-[#FECDD4]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Daily Check-In</h1>
                <p className="text-white/50 text-sm">{step + 1} of {totalSteps}</p>
              </div>
            </div>
          </div>
          <Progress value={((step + 1) / totalSteps) * 100} className="h-3 [&>div]:bg-[#FECDD4] [&>div]:bg-[length:30px_30px] [&>div]:animate-[progress_1s_linear_infinite] [&>div]:bg-[repeating-linear-gradient(45deg,#FECDD4,#FECDD4_10px,rgba(255,255,255,.6)_10px,rgba(255,255,255,.6)_20px)]" />
        </div>

        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 0: Mood */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      How do you feel <span className="text-[#FECDD4]">today</span>?
                    </h2>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {moodOptions.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => handleSingleSelect("mood", mood.value)}
                        className={`p-6 rounded-2xl border-2 transition-all ${
                          checkInData.mood === mood.value
                            ? "bg-[#FECDD4]/10 border-[#FECDD4]/50 scale-105"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="text-4xl mb-2">{mood.emoji}</div>
                        <div className="text-white text-sm">{mood.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Energy */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Your <span className="text-[#FECDD4]">energy</span> level today
                    </h2>
                  </div>
                  <Card className="bg-white/5 border-white/10 p-8">
                    <div className="space-y-6">
                      <div className="flex justify-between text-sm text-white/50">
                        <span>Depleted</span>
                        <span>Abundant</span>
                      </div>
                      <Slider
                        value={[checkInData.energy]}
                        onValueChange={(val) => updateData("energy", val[0])}
                        max={10}
                        min={1}
                        step={1}
                        className="py-4"
                      />
                      <div className="text-center">
                        <span className="text-6xl font-bold text-[#FECDD4]">{checkInData.energy}</span>
                        <span className="text-2xl text-white/40">/10</span>
                        <div className="text-white/60 mt-3">
                          {energyLevels[Math.floor((checkInData.energy - 1) / 2)]}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Step 2: Today's Feeling */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      What's <span className="text-[#FECDD4]">present</span> for you today?
                    </h2>
                    <p className="text-white/60">How does today feel in your body?</p>
                  </div>
                  <Textarea
                    value={checkInData.todayFeeling}
                    onChange={(e) => updateData("todayFeeling", e.target.value)}
                    placeholder="I'm feeling... I'm noticing..."
                    className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl text-lg p-6"
                  />
                </div>
              )}

              {/* Step 3: Today's Goals */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      What do you want to <span className="text-[#FECDD4]">focus on</span> today?
                    </h2>
                    <p className="text-white/60">Your intentions for today</p>
                  </div>
                  <Textarea
                    value={checkInData.todayGoals}
                    onChange={(e) => updateData("todayGoals", e.target.value)}
                    placeholder="Today I want to... I need to..."
                    className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl text-lg p-6"
                  />
                </div>
              )}

              {/* Step 4: Struggles */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      What's been <span className="text-[#FECDD4]">challenging</span>?
                    </h2>
                    <p className="text-white/60">This week or today</p>
                  </div>
                  <Textarea
                    value={checkInData.struggles}
                    onChange={(e) => updateData("struggles", e.target.value)}
                    placeholder="I've been struggling with... What's hard is..."
                    className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl text-lg p-6"
                  />
                </div>
              )}

              {/* Step 5: Needs */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      What do you <span className="text-[#FECDD4]">need</span> today?
                    </h2>
                    <p className="text-white/60">Select what feels true</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {needsOptions.map((need) => (
                      <button
                        key={need}
                        onClick={() => toggleNeed(need)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          checkInData.needsHelp.includes(need)
                            ? "bg-[#FECDD4]/10 border-[#FECDD4]/50 text-white"
                            : "bg-white/5 border-white/10 hover:border-white/20 text-white/70"
                        }`}
                      >
                        {need}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 pb-6 flex gap-3">
          {step > 0 && (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              size="lg"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white hover:shadow-lg"
            >
              Back
            </Button>
          )}
          <Button
            onClick={() => {
              if (step < totalSteps - 1) {
                setStep(step + 1);
              } else {
                handleComplete();
              }
            }}
            disabled={!canProceed()}
            size="lg"
            className="flex-1 bg-[#FECDD4] hover:bg-[#FDB8C3] text-[#611836] rounded-2xl py-6 text-lg font-semibold disabled:opacity-40"
          >
            {step < totalSteps - 1 ? "Next →" : "Complete Check-In"}
          </Button>
        </div>
      </div>
    </div>
  );
}