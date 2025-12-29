import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { daysBetweenDates, isSameDay } from "@/components/utils/dateUtils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import PersonalizedLearningPath from "@/components/dashboard/PersonalizedLearningPath";
import DailySnapshotCard from "@/components/dashboard/DailySnapshotCard";
import WeeklySnapshotCard from "@/components/dashboard/WeeklySnapshotCard";
import MonthlySnapshotCard from "@/components/dashboard/MonthlySnapshotCard";
import { DASHBOARD_CONSTANTS, ALIVE_PHASES, SNAPSHOT_VIEWS } from "@/components/dashboard/constants";
import SystemDetailDrawer from "@/components/dashboard/SystemDetailDrawer";
import {
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Heart,
  Smile,
  Moon,
  Edit3,
  Activity,
  Calendar,
  Play,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Waves,
} from "lucide-react";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [snapshotView, setSnapshotView] = useState(SNAPSHOT_VIEWS.DAILY);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [snapshotData, setSnapshotData] = useState(null);
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);
  const [lauraiQuestion, setLauraiQuestion] = useState("");
  const [lauraiResponse, setLauraiResponse] = useState("");
  const [isLauraiThinking, setIsLauraiThinking] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [systemData, setSystemData] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setCurrentUser(userData);
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: diagnosticSession } = useQuery({
    queryKey: ["diagnosticSession"],
    queryFn: async () => {
      const sessions = await base44.entities.DiagnosticSession.filter(
        { isComplete: true },
        "-created_date",
        1
      );
      return sessions[0] || null;
    },
  });

  const { data: moduleProgress } = useQuery({
    queryKey: ["moduleProgress"],
    queryFn: () => base44.entities.UserModuleProgress.list("-updated_date"),
    initialData: [],
  });

  const { data: checkIns } = useQuery({
    queryKey: ["checkIns"],
    queryFn: () => base44.entities.CheckIn.list("-created_date", DASHBOARD_CONSTANTS.RECENT_CHECKINS_LIMIT),
    initialData: [],
  });

  const { data: journalEntries } = useQuery({
    queryKey: ["journalEntries"],
    queryFn: () => base44.entities.JournalEntry.list("-created_date", DASHBOARD_CONSTANTS.RECENT_JOURNAL_ENTRIES_LIMIT),
    initialData: [],
  });

  const { data: purposeRuns } = useQuery({
    queryKey: ["purposeRuns"],
    queryFn: () =>
      base44.entities.ToolRun.filter(
        { toolSlug: "define-my-purpose", status: "Complete" },
        "-completed_date",
        1
      ),
    initialData: [],
  });

  const { data: userPoints } = useQuery({
    queryKey: ["userPoints"],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.filter({});
      return points[0] || null;
    },
    enabled: !!currentUser,
  });

  const completedModules = moduleProgress?.filter((p) => p.status === "Complete").length || 0;
  const completedModulesList = moduleProgress?.filter((p) => p.status === "Complete") || [];
  const inProgressModule = moduleProgress?.find((p) => p.status === "InProgress");
  const checkInStreak = checkIns?.length || 0;
  const latestCheckIn = checkIns?.[0];
  const latestPurposeRun = purposeRuns?.[0];

  // Generate personalized recommendations
  const recommendedModules = useMemo(() => {
    return diagnosticSession?.recommendedModules?.slice(0, DASHBOARD_CONSTANTS.RECOMMENDED_MODULES_LIMIT).map((title, index) => ({
      id: `rec-${index}`,
      title,
      phase: diagnosticSession.primaryPhase || ALIVE_PHASES.AWARENESS,
      duration: 45,
      summary: `Recommended based on your ${diagnosticSession.primaryPhase} phase focus`,
      isRecommended: true,
      pointsReward: 20,
    })) || [];
  }, [diagnosticSession]);
  
  const canRerunPurpose = () => {
    if (!latestPurposeRun?.completedAt) return true;
    const daysSince = daysBetweenDates(latestPurposeRun.completedAt, new Date());
    return daysSince >= DASHBOARD_CONSTANTS.PURPOSE_RERUN_COOLDOWN_DAYS;
  };

  const { data: allModules } = useQuery({
    queryKey: ["allModules"],
    queryFn: () => base44.entities.Module.list(),
    initialData: [],
  });

  const phaseProgress = useMemo(() => {
    const phases = Object.values(ALIVE_PHASES);
    const progress = {};
    
    phases.forEach(phase => {
      const modulesInPhase = allModules.filter(m => m.phase === phase);
      const completedInPhase = moduleProgress.filter(p => 
        p.status === "Complete" && 
        modulesInPhase.some(m => m.id === p.moduleId)
      );
      progress[phase] = modulesInPhase.length > 0 
        ? Math.round((completedInPhase.length / modulesInPhase.length) * 100)
        : 0;
    });
    
    return progress;
  }, [allModules, moduleProgress]);

  useEffect(() => {
    if (diagnosticSession?.snapshotFrequency) {
      setSnapshotView(diagnosticSession.snapshotFrequency);
    }
  }, [diagnosticSession]);

  const needsCheckIn = useMemo(() => {
    if (!diagnosticSession?.lastCheckInDate) return true;
    return !isSameDay(diagnosticSession.lastCheckInDate, new Date());
  }, [diagnosticSession]);

  // Generate dynamic snapshot
  const generateSnapshot = async () => {
    if (!diagnosticSession || !currentUser) return;
    
    setIsGeneratingSnapshot(true);
    
    try {
      const latestCheckIn = checkIns?.[0];
      const cyclePhase = diagnosticSession?.cycleProfile?.cycleStage === "Cycling" 
        ? (latestCheckIn?.cycle_phase || "Luteal")
        : diagnosticSession?.cycleProfile?.cycleStage || "Not tracking";
      
      const nervousSystemState = latestCheckIn?.nervous_system_state || "Fawn";
      const capacityScore = latestCheckIn?.capacity || diagnosticSession?.capacityScore || 5.5;
      const energyLevel = latestCheckIn?.energy || 5;
      const stressLevel = latestCheckIn?.stress || 5;
      
      const prompt = `You are generating a personalized Daily ALIVE Snapshot for ${currentUser.full_name}.

USER CONTEXT:
- Human Design: Type: ${diagnosticSession.humanDesignProfile?.type || "Projector"}, Authority: ${diagnosticSession.humanDesignProfile?.authority || "Emotional"}
- Cycle Phase: ${cyclePhase}
- Nervous System State: ${nervousSystemState}
- ALIVE Phase: Primary - ${diagnosticSession.primaryPhase || "Intention"}, Secondary - ${diagnosticSession.secondaryPhase || "Liberation"}
- Capacity Score: ${capacityScore}/10
- Energy Level: ${energyLevel}/10
- Stress Level: ${stressLevel}/10
- Recent Context: ${diagnosticSession.userContextText || "No recent context"}
- Core Values: ${diagnosticSession.values?.join(", ") || "Not specified"}
- Current Concerns: ${diagnosticSession.concerns?.join(", ") || "General wellbeing"}

GENERATE:
1. A scrollable 3-4 paragraph narrative that weaves together:
   - How their cycle phase affects capacity today
   - What their nervous system state means for their decisions
   - How their Human Design suggests they respond (not push)
   - What their ALIVE phase indicates about their growth journey
   - Normalize low capacity - it's biological, not failure

2. A short guiding phrase (5-8 words) based on their state

3. Icon explanations for: Cycle, Nervous System, Human Design, ALIVE Phase

The tone must be:
- Warm, not clinical
- Normalizing, not diagnosing
- Systemic (connecting patterns), not isolated advice

NO TWO SNAPSHOTS SHOULD BE IDENTICAL. Reference today's date, energy patterns, and make it feel personalized.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            narrative: { type: "string" },
            guidingPhrase: { type: "string" },
            iconExplanations: {
              type: "object",
              properties: {
                cycle: { type: "string" },
                nervousSystem: { type: "string" },
                humanDesign: { type: "string" },
                alivePhase: { type: "string" }
              }
            }
          }
        }
      });
      
      setSnapshotData({
        ...result,
        cyclePhase,
        nervousSystemState,
        capacityScore,
        humanDesign: diagnosticSession.humanDesignProfile,
        alivePhase: diagnosticSession.primaryPhase || "Intention",
        astrology: diagnosticSession.astrologyProfile
      });
    } catch (error) {
      console.error("Failed to generate snapshot:", error);
    } finally {
      setIsGeneratingSnapshot(false);
    }
  };

  // Generate snapshot on load or when view changes
  useEffect(() => {
    if (diagnosticSession && currentUser && !snapshotData) {
      generateSnapshot();
    }
  }, [diagnosticSession, currentUser, snapshotView]);

  // Handle LaurAI questions
  const askLaurAI = async (question) => {
    if (!question.trim() || !snapshotData) return;
    
    setIsLauraiThinking(true);
    setLauraiResponse("");
    
    try {
      const contextPrompt = `You are LaurAI, a personalized wellness assistant integrated with The Aligned Woman Blueprint.

CRITICAL CONTEXT (Must reference in every response):
- User: ${currentUser.full_name}
- Today's Date: ${new Date().toLocaleDateString()}
- Cycle Phase: ${snapshotData.cyclePhase}
- Nervous System State: ${snapshotData.nervousSystemState}
- Capacity: ${snapshotData.capacityScore}/10
- Human Design Type: ${snapshotData.humanDesign?.type || "Projector"}
- Human Design Authority: ${snapshotData.humanDesign?.authority || "Emotional"}
- ALIVE Phase: ${snapshotData.alivePhase}
- Recent Concerns: ${diagnosticSession.concerns?.join(", ") || "General wellbeing"}

TODAY'S SNAPSHOT SUMMARY:
${snapshotData.narrative}

USER QUESTION: "${question}"

RESPONSE REQUIREMENTS:
- Reference their current cycle, nervous system, or capacity
- Normalize reduced capacity - it's biological
- Connect to their ALIVE phase
- Never contradict today's snapshot
- Keep responses warm, grounded, and brief (2-3 paragraphs max)
- Make it feel like you understand TODAY specifically, not generic advice`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt
      });
      
      setLauraiResponse(response);
    } catch (error) {
      console.error("LaurAI error:", error);
      setLauraiResponse("I'm having trouble connecting right now. Please try again.");
    } finally {
      setIsLauraiThinking(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setLauraiQuestion(question);
    askLaurAI(question);
  };

  const handleCustomQuestion = () => {
    askLaurAI(lauraiQuestion);
  };

  // Generate dynamic system data
  const generateSystemData = async (system) => {
    if (!diagnosticSession || !currentUser) return;
    
    const latestCheckIn = checkIns?.[0];
    const cyclePhase = diagnosticSession?.cycleProfile?.cycleStage === "Cycling" 
      ? (latestCheckIn?.cycle_phase || "Luteal")
      : diagnosticSession?.cycleProfile?.cycleStage || "Not tracking";
    
    const nervousSystemState = latestCheckIn?.nervous_system_state || "Fawn";
    const capacityScore = latestCheckIn?.capacity || diagnosticSession?.capacityScore || 5.5;
    
    const systemPrompts = {
      nervous_system: `Generate guidance for Nervous System state: ${nervousSystemState}, Capacity: ${capacityScore}/10, Recent stress: ${latestCheckIn?.stress || 5}/10`,
      human_design: `Generate guidance for Human Design Type: ${diagnosticSession.humanDesignProfile?.type || "Projector"}, Authority: ${diagnosticSession.humanDesignProfile?.authority || "Emotional"}, ALIVE Phase: ${diagnosticSession.primaryPhase}`,
      cycle: `Generate guidance for Cycle Phase: ${cyclePhase}, Capacity: ${capacityScore}/10, Energy: ${latestCheckIn?.energy || 5}/10`,
      astrology: `Generate guidance for Astrology: Sun ${diagnosticSession.astrologyProfile?.sunSign || "Sagittarius"}, Moon ${diagnosticSession.astrologyProfile?.moonSign || "Unknown"}, Current transits`
    };

    const prompt = `You are generating system-specific guidance for ${currentUser.full_name}.

SYSTEM: ${system.replace('_', ' ').toUpperCase()}
${systemPrompts[system]}

GENERATE:
1. A 2-3 sentence summary of their current state in this system
2. Today's guidance (one clear statement)
3. 3-5 things that help today (short phrases)
4. 2-4 things to avoid today (short phrases)

Format: JSON with keys: summary, guidance, helps (array), avoid (array)`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            guidance: { type: "string" },
            helps: { type: "array", items: { type: "string" } },
            avoid: { type: "array", items: { type: "string" } }
          }
        }
      });

      const systemSpecificData = {
        nervous_system: {
          state: nervousSystemState,
          recentPattern: checkIns?.length > 3 ? "Variable stress patterns" : "Stable",
          actions: [
            { label: "Log how you feel", onClick: () => window.location.href = createPageUrl("CheckIn") },
            { label: "3-min reset", onClick: () => {} }
          ]
        },
        human_design: {
          type: diagnosticSession.humanDesignProfile?.type || "Projector",
          authority: diagnosticSession.humanDesignProfile?.authority || "Emotional",
          strategy: diagnosticSession.humanDesignProfile?.strategy || "Wait for invitation"
        },
        cycle: {
          phase: cyclePhase,
          dayOfCycle: latestCheckIn?.cycle_day || "Unknown",
          capacityGuidance: capacityScore < 5 ? "Lower capacity phase" : "Higher capacity phase",
          actions: [
            { label: "Log symptoms", onClick: () => {} },
            { label: "Plan by phase", onClick: () => {} }
          ]
        },
        astrology: {
          currentSign: diagnosticSession.astrologyProfile?.sunSign || "Sagittarius",
          theme: "Vision and expansion",
          emotionalTone: "Optimistic with need for refinement"
        }
      };

      setSystemData({
        ...result,
        ...systemSpecificData[system]
      });
    } catch (error) {
      console.error("Failed to generate system data:", error);
    }
  };

  const handleSystemClick = async (system) => {
    setSelectedSystem(system);
    await generateSystemData(system);
  };

  const { data: relevantCourses = [] } = useQuery({
    queryKey: ["relevantCourses", selectedSystem],
    queryFn: async () => {
      if (!selectedSystem) return [];
      const courses = await base44.entities.Course.list();
      // Filter based on system - simplified logic
      return courses.slice(0, 3);
    },
    enabled: !!selectedSystem
  });

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
    if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
    return { text: "Good Evening", emoji: "🌙" };
  };

  const greeting = getGreeting();

  // Apply background
  useEffect(() => {
    const bg = currentUser?.background_image || '#FBF4FD';
    if (bg.startsWith('#')) {
      document.body.style.backgroundColor = bg;
      document.body.style.backgroundImage = "none";
    } else if (bg.startsWith('data:image/svg+xml')) {
      document.body.style.backgroundImage = `url("${bg}")`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundColor = "transparent";
    } else {
      document.body.style.backgroundImage = `url(${bg})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundColor = "transparent";
    }
  }, [currentUser?.background_image]);

  // Mock stress/energy calendar data (would come from CheckIn entities)
  const stressCalendarData = useMemo(() => {
    const data = {};
    checkIns?.forEach(checkIn => {
      const date = new Date(checkIn.created_date).toLocaleDateString();
      data[date] = {
        stress: checkIn.stress,
        energy: checkIn.energy,
        regulated: checkIn.stress < 5
      };
    });
    return data;
  }, [checkIns]);

  // If no diagnostic completed, show onboarding prompt
  if (!diagnosticSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
        <div className="max-w-4xl mx-auto pt-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#3B224E] to-[#4A2B5E] rounded-full flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#3B224E] mb-4">
              Welcome{currentUser?.full_name ? `, ${currentUser.full_name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-xl text-gray-600 max-w-xl mx-auto mb-8">
              Let's build your personalised ALIVE Pathway. Complete a short diagnostic so we can prescribe exactly what you need.
            </p>
            <Link to={createPageUrl("OnboardingForm")}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#3B224E] to-[#4A2B5E] hover:from-[#1F0B2E] hover:to-[#3B224E] text-white px-10 py-6 text-lg font-semibold rounded-full shadow-xl"
              >
                Begin Your Diagnostic
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const getSnapshotContent = () => {
    if (snapshotView === SNAPSHOT_VIEWS.WEEKLY) {
      return <WeeklySnapshotCard diagnosticSession={diagnosticSession} />;
    }

    if (snapshotView === SNAPSHOT_VIEWS.MONTHLY) {
      return <MonthlySnapshotCard diagnosticSession={diagnosticSession} />;
    }

    return <DailySnapshotCard diagnosticSession={diagnosticSession} needsCheckIn={needsCheckIn} />;
  };

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'rgb(250, 248, 255)' }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* ZONE 1: ORIENTATION - Daily Anchor */}
        {/* Your Daily ALIVE Snapshot - Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-br from-purple-50/40 to-indigo-50/30 rounded-3xl p-10 max-w-4xl mx-auto shadow-sm">
            {isGeneratingSnapshot ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-purple-300/30 border-t-purple-400 rounded-full mb-4" />
                <p className="text-gray-500 font-light">Understanding your state today...</p>
              </div>
            ) : snapshotData ? (
              <div className="space-y-8">
                {/* System Icons - Subtle */}
                <div className="flex justify-center gap-6 mb-2">
                  {snapshotData.astrology?.sunSign && (
                    <button 
                      onClick={() => setSelectedIcon(selectedIcon === 'astrology' ? null : 'astrology')}
                      className="text-center hover:scale-105 transition-all"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-100/50 to-transparent rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-amber-100/70">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                      </div>
                      <p className="text-xs text-gray-500 font-light">{snapshotData.astrology.sunSign}</p>
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedIcon(selectedIcon === 'humanDesign' ? null : 'humanDesign')}
                    className="text-center hover:scale-105 transition-all"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-purple-100/70">
                      <Target className="w-6 h-6 text-purple-500" />
                    </div>
                    <p className="text-xs text-gray-500 font-light">{snapshotData.humanDesign?.type || "Projector"}</p>
                  </button>
                  <button 
                    onClick={() => setSelectedIcon(selectedIcon === 'cycle' ? null : 'cycle')}
                    className="text-center hover:scale-105 transition-all"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100/50 to-transparent rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-indigo-100/70">
                      <Moon className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-xs text-gray-500 font-light">{snapshotData.cyclePhase}</p>
                  </button>
                  <button 
                    onClick={() => setSelectedIcon(selectedIcon === 'nervousSystem' ? null : 'nervousSystem')}
                    className="text-center hover:scale-105 transition-all"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-100/50 to-transparent rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-pink-100/70">
                      <Heart className="w-6 h-6 text-pink-500" />
                    </div>
                    <p className="text-xs text-gray-500 font-light">{snapshotData.nervousSystemState}</p>
                  </button>
                </div>

                {/* Icon Explanation */}
                {selectedIcon && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/60 rounded-2xl p-5 mb-4"
                  >
                    <p className="text-sm text-gray-600 leading-relaxed font-light text-center">
                      {snapshotData.iconExplanations?.[selectedIcon] || "Understanding this aspect..."}
                    </p>
                  </motion.div>
                )}

                {/* Main Narrative */}
                <div className="max-w-3xl mx-auto">
                  <p className="text-gray-700 leading-loose text-center whitespace-pre-line font-light text-lg">
                    {snapshotData.narrative}
                  </p>
                </div>

                {/* Guiding Phrase */}
                <div className="text-center mt-8">
                  <p className="text-2xl font-light text-gray-800 tracking-wide">
                    {snapshotData.guidingPhrase}
                  </p>
                </div>

                {/* Ask LaurAI - Softer */}
                <div className="bg-gradient-to-br from-pink-50/50 to-purple-50/30 rounded-2xl p-6 mt-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-light text-gray-700">You might explore with LaurAI</p>
                  </div>
                  
                  {/* Quick Questions */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    <button
                      onClick={() => handleQuickQuestion("How should I work today?")}
                      className="bg-white/80 text-gray-600 text-xs px-4 py-2 rounded-full hover:bg-white transition-colors shadow-sm font-light"
                    >
                      How should I work today?
                    </button>
                    <button
                      onClick={() => handleQuickQuestion("Why does this feel harder than usual?")}
                      className="bg-white/80 text-gray-600 text-xs px-4 py-2 rounded-full hover:bg-white transition-colors shadow-sm font-light"
                    >
                      Why does this feel harder?
                    </button>
                  </div>

                  {/* Custom Question Input */}
                  <div className="flex gap-2">
                    <Input
                      value={lauraiQuestion}
                      onChange={(e) => setLauraiQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
                      placeholder="Or ask your own question..."
                      className="flex-1 bg-white/80 border-0 rounded-full px-5 shadow-sm font-light text-sm"
                      disabled={isLauraiThinking}
                    />
                    <Button 
                      onClick={handleCustomQuestion}
                      disabled={isLauraiThinking || !lauraiQuestion.trim()}
                      className="bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full shadow-sm hover:from-pink-500 hover:to-purple-500"
                    >
                      {isLauraiThinking ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* LaurAI Response */}
                  {lauraiResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 bg-white/80 rounded-2xl p-5"
                    >
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-light">{lauraiResponse}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Button onClick={generateSnapshot} className="bg-purple-400 hover:bg-purple-500 text-white rounded-full px-10 py-6 text-base font-light shadow-sm">
                  Begin Today&apos;s Check-In
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ZONE 2: SUPPORTING SIGNALS - Today's Signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-6 text-center font-light">Today&apos;s Signals</h2>
          
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {/* Nervous System */}
            <button 
              onClick={() => handleSystemClick('nervous_system')}
              className="bg-white/40 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/60 transition-all text-left group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <p className="text-xs text-gray-500 mb-1 font-light">Nervous System</p>
              <p className="text-sm font-medium text-gray-800">{checkIns?.[0]?.nervous_system_state || "Fawn"}</p>
            </button>

            {/* Human Design */}
            <Link 
              to={createPageUrl("MyHumanDesign")}
              className="block bg-white/40 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/60 transition-all text-left group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mb-1 font-light">Design</p>
              <p className="text-sm font-medium text-gray-800">{diagnosticSession?.humanDesignProfile?.type || "Projector"}</p>
            </Link>

            {/* Cycle */}
            <Link 
              to={createPageUrl("MyCycle")}
              className="block bg-white/40 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/60 transition-all text-left group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Moon className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-xs text-gray-500 mb-1 font-light">Cycle</p>
              <p className="text-sm font-medium text-gray-800">{checkIns?.[0]?.cycle_phase || "Luteal"}</p>
            </Link>

            {/* Astrology */}
            <Link 
              to={createPageUrl("MyAstrology")}
              className="block bg-white/40 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/60 transition-all text-left group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xs text-gray-500 mb-1 font-light">Astrology</p>
              <p className="text-sm font-medium text-gray-800">{diagnosticSession?.astrologyProfile?.sunSign || "Sagittarius"}</p>
            </Link>
          </div>
        </motion.div>

        {/* ZONE 3: OPTIONAL DEPTH - Progressive Disclosure */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="space-y-12"
        >
          {/* Support Available */}
          <div>
            <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-6 text-center font-light">Support Available</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {recommendedModules.slice(0, 2).map((module, idx) => (
                <div key={idx} className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/60 transition-all group">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Play className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{module.title}</h3>
                      <p className="text-xs text-gray-500 font-light">{module.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {module.duration} min
                    </span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full font-light hover:from-purple-500 hover:to-pink-500">
                    Begin when ready
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Optional: Patterns & Insights (Collapsed by Default) */}
          <details className="group max-w-3xl mx-auto">
            <summary className="flex items-center justify-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-light list-none">
              <span>View patterns & insights</span>
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-8 space-y-6">
              {/* Body Patterns */}
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Your Body Patterns</h3>
                <div className="h-32 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 200 80">
                    <path
                      d="M 0 40 Q 25 20, 50 40 T 100 40 T 150 40 T 200 40"
                      stroke="#C67793"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M 0 50 Q 25 30, 50 50 T 100 50 T 150 50 T 200 50"
                      stroke="#9333EA"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
                <div className="flex justify-center gap-3 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#C67793]" />
                    Energy
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#9333EA]" />
                    Capacity
                  </span>
                </div>
              </div>

              {/* Cycle & Capacity */}
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Cycle & Capacity</h3>
                <div className="bg-gradient-to-br from-pink-100/50 to-rose-100/50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600 font-light">Current Phase</span>
                    <span className="text-2xl font-light text-gray-800">{diagnosticSession?.capacityScore || 5.5}</span>
                  </div>
                  <Progress value={(diagnosticSession?.capacityScore || 5.5) * 10} className="h-2 bg-white/60 mb-3" />
                  <p className="text-xs text-gray-600 font-light">Gentle movement & warm foods</p>
                </div>
              </div>
            </div>
          </details>
        </motion.div>

        {/* Quick Tools - Minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-16"
        >
          <div className="flex items-center justify-center gap-6">
            <Link to={createPageUrl("Journal")} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Edit3 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500 font-light">Reflect</span>
            </Link>
            <Link to={createPageUrl("CheckIn")} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <span className="text-xs text-gray-500 font-light">Regulate</span>
            </Link>
            <Link to={createPageUrl("MyCycle")} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500 font-light">Cycle</span>
            </Link>
          </div>
        </motion.div>

        {/* Timeframe Toggle - Moved to Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 max-w-md mx-auto"
        >
          <Tabs value={snapshotView} onValueChange={setSnapshotView} className="w-full">
            <TabsList className="w-full bg-white/60 backdrop-blur-sm border-0 h-11 p-1 rounded-full">
              <TabsTrigger value={SNAPSHOT_VIEWS.DAILY} className="flex-1 data-[state=active]:bg-purple-400 data-[state=active]:text-white rounded-full font-light">
                Daily
              </TabsTrigger>
              <TabsTrigger value={SNAPSHOT_VIEWS.WEEKLY} className="flex-1 data-[state=active]:bg-purple-400 data-[state=active]:text-white rounded-full font-light">
                Weekly
              </TabsTrigger>
              <TabsTrigger value={SNAPSHOT_VIEWS.MONTHLY} className="flex-1 data-[state=active]:bg-purple-400 data-[state=active]:text-white rounded-full font-light">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </div>

      {/* System Detail Drawer */}
      {selectedSystem && snapshotData && (
        <SystemDetailDrawer
          isOpen={!!selectedSystem}
          onClose={() => setSelectedSystem(null)}
          system={selectedSystem}
          systemData={systemData}
          snapshotContext={snapshotData}
          currentUser={currentUser}
          courses={relevantCourses}
        />
      )}
    </div>
  );
}