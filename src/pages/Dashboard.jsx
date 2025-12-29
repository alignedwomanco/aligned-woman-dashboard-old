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
    <div className="min-h-screen pb-12" style={{ backgroundColor: '#F3E8FF' }}>
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Timeframe Toggle - Moved Below */}

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Your Inner Systems + Life Domains */}
          <div className="lg:col-span-3 space-y-6">
            {/* Timeframe Toggle Above Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs value={snapshotView} onValueChange={setSnapshotView} className="w-full">
                <TabsList className="w-full bg-white/90 backdrop-blur-sm border-0 h-11 p-1 rounded-xl">
                  <TabsTrigger value={SNAPSHOT_VIEWS.DAILY} className="flex-1 data-[state=active]:bg-[#3B224E] data-[state=active]:text-white rounded-lg font-medium">
                    Daily
                  </TabsTrigger>
                  <TabsTrigger value={SNAPSHOT_VIEWS.WEEKLY} className="flex-1 data-[state=active]:bg-[#3B224E] data-[state=active]:text-white rounded-lg font-medium">
                    Weekly
                  </TabsTrigger>
                  <TabsTrigger value={SNAPSHOT_VIEWS.MONTHLY} className="flex-1 data-[state=active]:bg-[#3B224E] data-[state=active]:text-white rounded-lg font-medium">
                    Monthly
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </motion.div>
            {/* Your Inner Systems */}
            <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            >
            <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Your Inner Systems</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* My Nervous System */}
              <button 
                onClick={() => handleSystemClick('nervous_system')}
                className="w-full bg-pink-50 rounded-lg p-4 border border-pink-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-pink-900">My Nervous System</h3>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  <span className="font-medium">Current State:</span> {checkIns?.[0]?.nervous_system_state || "Fawn"}
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  Your system is prioritizing safety today
                </p>
                <span className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
                  View nervous system guidance →
                </span>
              </button>

              {/* My Human Design */}
              <button 
                onClick={() => handleSystemClick('human_design')}
                className="w-full bg-purple-50 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-purple-900">My Human Design</h3>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  <span className="font-medium">Type:</span> {diagnosticSession?.humanDesignProfile?.type || "Projector"}
                </p>
                <p className="text-xs text-gray-600 mb-1">
                  <span className="font-medium">Authority:</span> {diagnosticSession?.humanDesignProfile?.authority || "Emotional"}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  Discernment beats effort today
                </p>
                <span className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                  View design guidance →
                </span>
              </button>

              {/* My Cycle */}
              <button 
                onClick={() => handleSystemClick('cycle')}
                className="w-full bg-indigo-50 rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Moon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-indigo-900">My Cycle</h3>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  <span className="font-medium">Phase:</span> {checkIns?.[0]?.cycle_phase || diagnosticSession?.cycleProfile?.cycleStage || "Luteal"}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  Lower energy is natural in this phase. Adapt, don't push.
                </p>
                <span className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  View cycle guidance →
                </span>
              </button>

              {/* My Astrology */}
              <button 
                onClick={() => handleSystemClick('astrology')}
                className="w-full bg-amber-50 rounded-lg p-4 border border-amber-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-amber-900">My Astrology</h3>
                </div>
                <div className="flex gap-2 mb-2">
                  <Badge className="bg-amber-200 text-amber-900 text-xs">
                    ☉ {diagnosticSession?.astrologyProfile?.sunSign || "Sagittarius"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {diagnosticSession?.astrologyProfile?.currentTransitSummary?.slice(0, 80) || "Current transits support vision and refinement"}...
                </p>
              </button>
            </CardContent>
            </Card>
            </motion.div>

            {/* Your Life Domains */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">Your Life Domains</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Business & Career */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm text-blue-900">Business + Career</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Current theme:</span> Clarity before momentum
                    </p>
                  </div>

                  {/* Finance */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm text-green-900">Finance</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Focus today:</span> Conscious spending habits
                    </p>
                    <Badge className="bg-purple-200 text-purple-900 text-xs">Intention</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Center Column: Main Snapshot */}
          <div className="lg:col-span-6 space-y-6">
            {/* Your Daily ALIVE Snapshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-[#2D1B3D] to-[#4A2B5E] text-white border-0 overflow-hidden rounded-2xl shadow-xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-8 text-center">Your Daily ALIVE Snapshot</h2>
                  
                  {isGeneratingSnapshot ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4" />
                        <p className="text-white/70">Generating your personalized snapshot...</p>
                      </div>
                    </div>
                  ) : snapshotData ? (
                    <>
                      {/* System Icons - Now Clickable */}
                      <div className="flex justify-center gap-4 mb-8">
                        {snapshotData.astrology?.sunSign && (
                          <button 
                            onClick={() => setSelectedIcon(selectedIcon === 'astrology' ? null : 'astrology')}
                            className="text-center hover:scale-110 transition-transform cursor-pointer"
                          >
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-white/30">
                              <Sparkles className="w-8 h-8 text-yellow-300" />
                            </div>
                            <p className="text-xs font-medium">{snapshotData.astrology.sunSign}</p>
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedIcon(selectedIcon === 'humanDesign' ? null : 'humanDesign')}
                          className="text-center hover:scale-110 transition-transform cursor-pointer"
                        >
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-white/30">
                            <Target className="w-8 h-8 text-purple-300" />
                          </div>
                          <p className="text-xs font-medium">{snapshotData.humanDesign?.type || "Projector"}</p>
                        </button>
                        <button 
                          onClick={() => setSelectedIcon(selectedIcon === 'cycle' ? null : 'cycle')}
                          className="text-center hover:scale-110 transition-transform cursor-pointer"
                        >
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-white/30">
                            <Moon className="w-8 h-8 text-blue-300" />
                          </div>
                          <p className="text-xs font-medium">{snapshotData.cyclePhase}</p>
                        </button>
                        <button 
                          onClick={() => setSelectedIcon(selectedIcon === 'nervousSystem' ? null : 'nervousSystem')}
                          className="text-center hover:scale-110 transition-transform cursor-pointer"
                        >
                          <div className="w-16 h-16 bg-pink-500 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-pink-600">
                            <Heart className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-xs font-medium">{snapshotData.nervousSystemState}</p>
                        </button>
                        <button 
                          onClick={() => setSelectedIcon(selectedIcon === 'alive' ? null : 'alive')}
                          className="text-center hover:scale-110 transition-transform cursor-pointer"
                        >
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-white/30">
                            <Waves className="w-8 h-8 text-indigo-300" />
                          </div>
                          <p className="text-xs font-medium">{snapshotData.alivePhase}</p>
                        </button>
                      </div>

                      {/* Icon Explanation (appears when clicked) */}
                      {selectedIcon && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white/10 rounded-xl p-4 mb-6"
                        >
                          <p className="text-sm text-white/90">
                            {snapshotData.iconExplanations?.[selectedIcon] || "Understanding this aspect of your system..."}
                          </p>
                        </motion.div>
                      )}

                      {/* Main Narrative - Now Scrollable */}
                      <div className="mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        <p className="text-white/90 leading-relaxed whitespace-pre-line">
                          {snapshotData.narrative}
                        </p>
                      </div>

                      {/* Guiding Phrase */}
                      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-4 mb-6 text-center">
                        <p className="font-bold text-lg">{snapshotData.guidingPhrase}</p>
                      </div>

                      {/* Ask LaurAI */}
                      <div className="bg-pink-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">Ask LaurAI about today</p>
                        </div>
                        
                        {/* Quick Questions */}
                        <div className="flex gap-2 flex-wrap mb-3">
                          <button
                            onClick={() => handleQuickQuestion("How should I work today?")}
                            className="bg-white text-gray-700 text-xs border-0 shadow-sm px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            How should I work today?
                          </button>
                          <button
                            onClick={() => handleQuickQuestion("Why does this feel harder than usual?")}
                            className="bg-white text-gray-700 text-xs border-0 shadow-sm px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            Why does this feel harder than usual?
                          </button>
                          <button
                            onClick={() => handleQuickQuestion("What should I focus on this week?")}
                            className="bg-white text-gray-700 text-xs border-0 shadow-sm px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            What should I focus on this week?
                          </button>
                        </div>

                        {/* Custom Question Input */}
                        <div className="flex gap-2">
                          <Input
                            value={lauraiQuestion}
                            onChange={(e) => setLauraiQuestion(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
                            placeholder="Ask your own question..."
                            className="flex-1 bg-white text-gray-900 border-0"
                            disabled={isLauraiThinking}
                          />
                          <Button 
                            onClick={handleCustomQuestion}
                            disabled={isLauraiThinking || !lauraiQuestion.trim()}
                            className="bg-pink-500 hover:bg-pink-600 text-white"
                          >
                            {isLauraiThinking ? (
                              <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                            ) : (
                              <Heart className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        {/* LaurAI Response */}
                        {lauraiResponse && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 bg-white rounded-lg p-4"
                          >
                            <p className="text-sm text-gray-900 whitespace-pre-line">{lauraiResponse}</p>
                          </motion.div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Button onClick={generateSnapshot} className="bg-pink-500 hover:bg-pink-600">
                        Generate Today's Snapshot
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recommended For You Right Now */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-[#2D1B3D] to-[#4A2B5E] text-white border-0 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Sparkles className="w-5 h-5" />
                    Recommended For You Right Now
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Module 1 */}
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-5">
                      <h3 className="font-bold mb-2">In your Orbit Today</h3>
                      <p className="text-sm mb-3">Understanding your inner Operating System</p>
                      <p className="text-xs mb-3 text-white/80">
                        🎬 Emotional to stop letting your feelings entangle
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">12 min • Video</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-white/20 text-white text-xs border-0 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Lesson 01
                        </Badge>
                        <Badge className="bg-white/20 text-white text-xs border-0">Nervous system ready</Badge>
                      </div>
                      <Button className="w-full mt-4 bg-white text-pink-600 hover:bg-white/90">
                        Start
                      </Button>
                    </div>

                    {/* Module 2 */}
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5">
                      <h3 className="font-bold mb-2">Your Cubaneer Focus</h3>
                      <p className="text-sm mb-3">Setting Boundaries Without Guilt</p>
                      <p className="text-xs mb-3 text-white/80">
                        🎬 Removing because Life loves 2 hrs
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">20 min • Video</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-white/20 text-white text-xs border-0">Binds path</Badge>
                        <Badge className="bg-white/20 text-white text-xs border-0">Mam in ascendance</Badge>
                      </div>
                      <Button className="w-full mt-4 bg-white text-purple-600 hover:bg-white/90">
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Cycle, Activity, Patterns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Cycle & Capacity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Cycle & Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl p-5 text-white mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Luteal</span>
                      <span className="text-3xl font-bold">{diagnosticSession?.capacityScore || 5.5}</span>
                    </div>
                    <Progress value={(diagnosticSession?.capacityScore || 5.5) * 10} className="h-2 bg-white/30 mb-3" />
                    <p className="text-xs text-white/90">Gentle movement & warm foods</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    {['Thu', 'Fri', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((day, i) => (
                      <div key={day} className="text-center">
                        <div className={`w-8 h-8 rounded-full mb-1 ${i < 3 ? 'bg-purple-500' : i < 5 ? 'bg-purple-300' : 'bg-gray-200'}`} />
                        <span className="text-xs text-gray-600">{day}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Body Patterns */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">Body Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>Energy</span>
                      <span>Capacity</span>
                    </div>
                    <div className="h-32 bg-purple-50 rounded-lg flex items-center justify-center">
                      {/* Placeholder for wave chart */}
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
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button size="sm" variant="ghost" className="text-xs">Daily</Button>
                    <Button size="sm" variant="ghost" className="text-xs">Weekly</Button>
                    <Button size="sm" className="text-xs bg-pink-500 text-white">Monthly</Button>
                    <span className="text-xs text-gray-600 self-center">Jul</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stress & Energy Patterns Calendar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900">Your Stress & Energy Patterns</CardTitle>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-sm">May 2024</h3>
                      <div className="flex gap-2 text-xs">
                        <Button size="sm" variant="ghost" className="text-xs h-6 px-2">Daily</Button>
                        <Button size="sm" variant="ghost" className="text-xs h-6 px-2">Weekly</Button>
                        <Button size="sm" variant="ghost" className="text-xs h-6 px-2">(More)</Button>
                      </div>
                    </div>
                  </div>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-600">{day}</div>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-full flex items-center justify-center text-xs ${
                          i % 5 === 0 ? 'bg-green-200' : 
                          i % 3 === 0 ? 'bg-pink-300' : 
                          i % 2 === 0 ? 'bg-red-300' : 'bg-gray-100'
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-200" />
                      <span className="text-gray-600">Regulated</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-pink-300" />
                      <span className="text-gray-600">Mild Stress</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-300" />
                      <span className="text-gray-600">High Stress</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Tools Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Reflect</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Regulate</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Cycle</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Moon className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Sleep</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 hidden">
            <Link to={createPageUrl("Journal")} className="block">
              <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Edit3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">Reflect</h3>
                    <p className="text-xs text-gray-600 mt-1">Journal & insights</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl("CheckIn")} className="block">
              <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">Regulate</h3>
                    <p className="text-xs text-gray-600 mt-1">Daily check-in</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">Cycle</h3>
                  <p className="text-xs text-gray-600 mt-1">Track your cycle</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">Sleep</h3>
                  <p className="text-xs text-gray-600 mt-1">Rest insights</p>
                </div>
              </CardContent>
            </Card>
          </div>
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