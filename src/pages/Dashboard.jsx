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
import {
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Heart,
  Moon,
  Edit3,
  Activity,
  Clock,
  Play,
  ChevronRight,
  ChevronLeft,
  X,
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
  const [selectedFocus, setSelectedFocus] = useState("General");
  const [showFullInsight, setShowFullInsight] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

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

  // Get focus-specific LaurAI prompts
  const getFocusPrompts = () => {
    const prompts = {
      General: [
        "How should I work today?",
        "Why does this feel harder than usual?",
        "What should I focus on this week?"
      ],
      Relationships: [
        "What should I be mindful of in connection today?",
        "Where might I be over-accommodating?",
        "How can I honor my needs in relationships?"
      ],
      Business: [
        "What's my work capacity today?",
        "Should I push forward or pause?",
        "What's the best way to approach meetings today?"
      ],
      Money: [
        "How should I think about investments today?",
        "What financial decisions can I make now?",
        "Where is scarcity showing up?"
      ],
      Mindset: [
        "What belief is blocking me?",
        "What do I need to hear today?",
        "How do I stop overthinking this?"
      ],
      "Nervous System": [
        "Why am I dysregulated?",
        "What does my body need?",
        "How do I come back to safety?"
      ],
      Astrology: [
        "What's happening astrologically?",
        "How do the planets affect me today?",
        "What cosmic energy am I working with?"
      ],
      "Human Design": [
        "How should I make this decision?",
        "Am I forcing or flowing?",
        "What does my authority say?"
      ]
    };
    return prompts[selectedFocus] || prompts.General;
  };

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
- CURRENT FOCUS: ${selectedFocus}

TODAY'S SNAPSHOT SUMMARY:
${snapshotData.narrative}

USER QUESTION: "${question}"

RESPONSE REQUIREMENTS:
- Reference their current cycle, nervous system, or capacity
- Filter through ${selectedFocus} lens
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

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const greeting = getGreeting();

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
              Let&apos;s build your personalised ALIVE Pathway. Complete a short diagnostic so we can prescribe exactly what you need.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-indigo-50/30 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Your Inner Systems */}
          <div className="lg:col-span-3 space-y-4">
            {/* Your Inner Systems */}
            <Card className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
              <CardHeader className="pb-5">
                <CardTitle className="text-sm font-medium text-gray-600 tracking-wide uppercase">Your Inner Systems</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Nervous System */}
                <Link to={createPageUrl("CheckIn")} className="block group">
                  <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 hover:bg-white/90 transition-all duration-300 border-0 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
                    <div className="flex items-start gap-3">
                      <motion.div 
                        className="w-10 h-10 bg-gradient-to-br from-pink-400/90 to-rose-400/90 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Heart className="w-4 h-4 text-white" strokeWidth={1.5} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 text-sm tracking-tight">My Nervous System</h3>
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium text-gray-700">Current State:</span> {checkIns?.[0]?.nervous_system_state || "Fawn"}
                        </p>
                        <p className="text-xs text-gray-400 leading-relaxed">Your system is prioritizing safety today</p>
                        <Button variant="link" className="text-xs text-purple-500 p-0 h-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          View guidance →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Human Design */}
                <Link to={createPageUrl("MyHumanDesign")} className="block group">
                  <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 hover:bg-white/90 transition-all duration-300 border-0 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
                    <div className="flex items-start gap-3">
                      <motion.div 
                        className="w-10 h-10 bg-gradient-to-br from-purple-400/90 to-indigo-400/90 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <Target className="w-4 h-4 text-white" strokeWidth={1.5} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 text-sm tracking-tight">My Human Design</h3>
                        <p className="text-xs text-gray-500 mb-0.5">
                          <span className="font-medium text-gray-700">Type:</span> {diagnosticSession?.humanDesignProfile?.type || "Projector"}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium text-gray-700">Authority:</span> {diagnosticSession?.humanDesignProfile?.authority || "Emotional"}
                        </p>
                        <p className="text-xs text-gray-400 leading-relaxed">Discernment beats effort today</p>
                        <Button variant="link" className="text-xs text-purple-500 p-0 h-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          View guidance →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* My Cycle */}
                <Link to={createPageUrl("MyCycle")} className="block group">
                  <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 hover:bg-white/90 transition-all duration-300 border-0 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
                    <div className="flex items-start gap-3">
                      <motion.div 
                        className="w-10 h-10 bg-gradient-to-br from-indigo-400/90 to-blue-400/90 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Moon className="w-4 h-4 text-white" strokeWidth={1.5} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 text-sm tracking-tight">My Cycle</h3>
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium text-gray-700">Phase:</span> {checkIns?.[0]?.cycle_phase || "Luteal"}
                        </p>
                        <p className="text-xs text-gray-400 leading-relaxed">Turning inward, discernment, and expression.</p>
                        <Button variant="link" className="text-xs text-purple-500 p-0 h-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          View guidance →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Your Life Domains */}
            <Card className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
              <CardHeader className="pb-5">
                <CardTitle className="text-sm font-medium text-gray-600 tracking-wide uppercase flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  Your Life Domains
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border-0 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm tracking-tight">Business • Career</h3>
                  <p className="text-xs text-gray-500 mb-1">Current theme:</p>
                  <p className="text-sm text-gray-700 font-light">Clarity before momentum</p>
                  <Button variant="link" className="text-xs text-purple-500 p-0 h-auto mt-2">
                    View guidance →
                  </Button>
                </div>
                <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border-0 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm flex items-center gap-2 tracking-tight">
                    Finance
                    <Badge variant="secondary" className="text-xs bg-purple-100/80 text-purple-700 border-0 font-normal">Intention</Badge>
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">Resources & visibility progress</p>
                  <Progress value={45} className="h-1.5 mb-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Center */}
          <div className="lg:col-span-6 space-y-6">
            {/* Daily ALIVE Snapshot */}
            <Card className="bg-gradient-to-br from-[#2A1A3C]/95 via-[#3B224E]/95 to-[#4A2B5E]/95 text-white border-0 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="pb-6 pt-7">
                <div className="flex items-center justify-center mb-4">
                  <Tabs value={snapshotView} onValueChange={setSnapshotView} className="w-auto">
                    <TabsList className="bg-white/10 backdrop-blur-md border-0 rounded-full p-1">
                      <TabsTrigger value={SNAPSHOT_VIEWS.DAILY} className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-sm rounded-full px-4">
                        Daily
                      </TabsTrigger>
                      <TabsTrigger value={SNAPSHOT_VIEWS.WEEKLY} className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-sm rounded-full px-4">
                        Weekly
                      </TabsTrigger>
                      <TabsTrigger value={SNAPSHOT_VIEWS.MONTHLY} className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-sm rounded-full px-4">
                        Monthly
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Focus Selector */}
                <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                  {["General", "Relationships", "Business", "Money", "Mindset", "Nervous System", "Astrology", "Human Design"].map((focus) => (
                    <button
                      key={focus}
                      onClick={() => setSelectedFocus(focus)}
                      className={`px-3 py-1.5 rounded-full text-xs font-light transition-all ${
                        selectedFocus === focus
                          ? "bg-white/20 text-white shadow-sm"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                      }`}
                    >
                      {focus}
                    </button>
                  ))}
                </div>

                <CardTitle className="text-xl text-center font-light tracking-tight">Your Daily ALIVE Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-8">
                {isGeneratingSnapshot ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border border-white/20 border-t-white rounded-full mb-4" />
                    <p className="text-white/70 text-sm font-light">Understanding your state today...</p>
                  </div>
                ) : snapshotData ? (
                  <div className="space-y-6">
                    {/* Above the Fold - Always Visible */}
                    <div className="space-y-6">
                      {/* System Icons */}
                      <div className="flex justify-center items-center gap-4">
                        {snapshotData.astrology?.sunSign && (
                          <div className="text-center">
                            <motion.div 
                              className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center mb-1.5 shadow-lg"
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="w-4 h-4 text-amber-300/90" strokeWidth={1.5} />
                            </motion.div>
                            <p className="text-xs text-white/70 font-light">{snapshotData.astrology.sunSign}</p>
                          </div>
                        )}
                        <div className="text-center">
                          <motion.div 
                            className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center mb-1.5 shadow-lg"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          >
                            <Target className="w-4 h-4 text-purple-300/90" strokeWidth={1.5} />
                          </motion.div>
                          <p className="text-xs text-white/70 font-light">{snapshotData.humanDesign?.type || "Projector"}</p>
                        </div>
                        <div className="text-center">
                          <motion.div 
                            className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center mb-1.5 shadow-lg"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Moon className="w-4 h-4 text-indigo-300/90" strokeWidth={1.5} />
                          </motion.div>
                          <p className="text-xs text-white/70 font-light">{snapshotData.cyclePhase}</p>
                        </div>
                        <div className="text-center">
                          <motion.div 
                            className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center mb-1.5 shadow-lg"
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Heart className="w-4 h-4 text-pink-300/90" strokeWidth={1.5} />
                          </motion.div>
                          <p className="text-xs text-white/70 font-light">{snapshotData.nervousSystemState}</p>
                        </div>
                        <div className="text-center">
                          <motion.div 
                            className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center mb-1.5 shadow-lg"
                            animate={{ y: [0, -4, 0], opacity: [1, 0.8, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <TrendingUp className="w-4 h-4 text-purple-300/90" strokeWidth={1.5} />
                          </motion.div>
                          <p className="text-xs text-white/70 font-light">{snapshotData.alivePhase}</p>
                        </div>
                      </div>

                      {/* Headline - ONE sentence */}
                      <div className="text-center px-6">
                        <h3 className="text-2xl font-light tracking-tight leading-relaxed">{snapshotData.guidingPhrase}</h3>
                      </div>

                      {/* Short Summary - 2-3 lines */}
                      <div className="text-center px-8">
                        <p className="text-white/80 leading-relaxed text-sm font-light max-w-xl mx-auto">
                          {snapshotData.narrative.split('\n')[0]}
                        </p>
                      </div>
                    </div>

                    {/* Expandable Deep Insight */}
                    {snapshotData.narrative.split('\n').length > 1 && (
                      <div className="border-t border-white/10 pt-6">
                        <button
                          onClick={() => setShowFullInsight(!showFullInsight)}
                          className="w-full flex items-center justify-center gap-2 text-xs text-white/60 hover:text-white/80 transition-colors mb-4"
                        >
                          <span className="font-light">{showFullInsight ? "Show less" : "Read full insight"}</span>
                          <ChevronRight className={`w-3 h-3 transition-transform ${showFullInsight ? "rotate-90" : ""}`} strokeWidth={1.5} />
                        </button>

                        {showFullInsight && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="max-h-64 overflow-y-auto scrollbar-hide"
                          >
                            <div className="px-8 pb-4">
                              <p className="text-white/80 leading-relaxed whitespace-pre-line text-sm font-light">
                                {snapshotData.narrative}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Ask LaurAI - Integrated */}
                    <div className="border-t border-white/10 pt-8 mt-8">
                      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                        <div className="text-center mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400/90 to-purple-500/90 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Sparkles className="w-6 h-6 text-white" strokeWidth={1.5} />
                          </div>
                          <h3 className="text-lg font-light text-gray-900 mb-2 tracking-tight">Ask LaurAI</h3>
                          <p className="text-xs text-gray-500 font-light">Design-aware guidance just for you</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                          {getFocusPrompts().map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickQuestion(prompt)}
                              className="text-xs text-gray-600 hover:text-gray-900 font-light transition-colors"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2 max-w-2xl mx-auto">
                          <Input
                            value={lauraiQuestion}
                            onChange={(e) => setLauraiQuestion(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
                            placeholder="Or ask your own question..."
                            className="flex-1 bg-gray-50/80 backdrop-blur-sm border-gray-200/50 text-gray-900 placeholder:text-gray-400 rounded-full px-5 h-12 font-light focus:ring-purple-400/20"
                            disabled={isLauraiThinking}
                          />
                          <Button
                            onClick={handleCustomQuestion}
                            disabled={isLauraiThinking || !lauraiQuestion.trim()}
                            className="bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 text-white rounded-full h-12 w-12 p-0 shadow-md"
                          >
                            {isLauraiThinking ? (
                              <div className="animate-spin w-4 h-4 border border-white/20 border-t-white rounded-full" />
                            ) : (
                              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                            )}
                          </Button>
                        </div>

                        {lauraiResponse && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 bg-gray-50/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm max-w-2xl mx-auto border border-gray-100/50"
                          >
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-light">
                              {lauraiResponse}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Button onClick={generateSnapshot} className="bg-white/20 hover:bg-white/30 text-white text-sm font-light rounded-full px-8 py-6 backdrop-blur-sm">
                      Generate Today&apos;s Snapshot
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended For You */}
            <Card className="bg-gradient-to-br from-[#2A1A3C]/95 via-[#3B224E]/95 to-[#4A2B5E]/95 text-white border-0 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="pb-5 pt-6">
                <CardTitle className="flex items-center gap-2 text-base font-light tracking-tight">
                  <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                  Recommended For You Right Now
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendedModules.slice(0, 2).map((module, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border-0 shadow-lg hover:bg-white/15 transition-all duration-300">
                      <h3 className="font-medium text-white mb-3 text-sm tracking-tight leading-snug">{module.title}</h3>
                      <p className="text-xs text-white/70 mb-4 line-clamp-2 font-light leading-relaxed">{module.summary}</p>
                      <div className="flex items-center gap-2 text-xs text-white/60 mb-4">
                        <Clock className="w-3 h-3" strokeWidth={1.5} />
                        <span className="font-light">{module.duration} min • Video</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs bg-white/15 text-white/90 border-0 h-6 rounded-full font-light">Lowest lift</Badge>
                        <Badge variant="secondary" className="text-xs bg-white/15 text-white/90 border-0 h-6 rounded-full font-light">Manifestation today</Badge>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-pink-500/90 to-rose-500/90 hover:from-pink-500 hover:to-rose-500 text-white text-sm h-9 rounded-full font-light shadow-lg">
                        Start
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Community */}
            <Card className="bg-gradient-to-br from-purple-50/60 via-pink-50/40 to-transparent backdrop-blur-xl border-0 shadow-[0_8px_30px_rgba(147,51,234,0.08)] rounded-3xl overflow-hidden">
              <CardHeader className="pb-3 pt-7">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </motion.div>
                </div>
                <CardTitle className="text-xl font-light text-gray-900 tracking-tight mb-2">
                  Community
                </CardTitle>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  You don't have to navigate this alone
                </p>
              </CardHeader>
              <CardContent className="pt-2 pb-7 px-6">
                {/* Active Members */}
                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center mb-1 relative">
                      <span className="text-xl">👩🏻</span>
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs">+</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-light">Sarah J</p>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center mb-1 relative">
                      <span className="text-xl">👩🏼</span>
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs">+</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-light">Emma R</p>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center mb-1 relative">
                      <span className="text-xl">👩🏾</span>
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs">+</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-light">Maya K</p>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center mb-1 relative">
                      <span className="text-xl">👩🏻</span>
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs">+</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-light">Lisa M</p>
                  </div>
                </div>

                {/* Upcoming Today */}
                <div className="mb-5">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Upcoming Today</h3>
                  <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-transparent rounded-2xl p-4 border border-amber-100/50">
                    <p className="text-xs text-amber-600 font-medium mb-1">4:30 PM</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">COMMUNITY CIRCLE</p>
                    <p className="text-sm text-gray-900 font-light">Navigating career transitions with grace</p>
                  </div>
                </div>

                {/* Ongoing */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Ongoing</h3>
                  <div className="space-y-2">
                    <button className="w-full group bg-gradient-to-br from-purple-100/80 via-purple-50/60 to-transparent backdrop-blur-sm rounded-2xl px-4 py-3 border border-purple-200/40 hover:border-purple-300/60 transition-all duration-300 hover:shadow-md text-left">
                      <p className="text-xs text-purple-700 font-medium mb-1">Navigating a breakup</p>
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2">
                          <div className="w-5 h-5 rounded-full bg-pink-300 border-2 border-white" />
                          <div className="w-5 h-5 rounded-full bg-purple-300 border-2 border-white" />
                          <div className="w-5 h-5 rounded-full bg-indigo-300 border-2 border-white" />
                        </div>
                        <span className="text-xs text-gray-500 font-light ml-1">24 members</span>
                      </div>
                    </button>
                    <button className="w-full group bg-gradient-to-br from-pink-100/80 via-pink-50/60 to-transparent backdrop-blur-sm rounded-2xl px-4 py-3 border border-pink-200/40 hover:border-pink-300/60 transition-all duration-300 hover:shadow-md text-left">
                      <p className="text-xs text-pink-700 font-medium mb-1">Building without burnout</p>
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2">
                          <div className="w-5 h-5 rounded-full bg-rose-300 border-2 border-white" />
                          <div className="w-5 h-5 rounded-full bg-pink-300 border-2 border-white" />
                          <div className="w-5 h-5 rounded-full bg-fuchsia-300 border-2 border-white" />
                        </div>
                        <span className="text-xs text-gray-500 font-light ml-1">32 members</span>
                      </div>
                    </button>
                    <button className="w-full group bg-gradient-to-br from-indigo-100/80 via-indigo-50/60 to-transparent backdrop-blur-sm rounded-2xl px-4 py-3 border border-indigo-200/40 hover:border-indigo-300/60 transition-all duration-300 hover:shadow-md text-left">
                      <p className="text-xs text-indigo-700 font-medium mb-1">Cycle-aware work & life</p>
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-300 border-2 border-white" />
                          <div className="w-5 h-5 rounded-full bg-blue-300 border-2 border-white" />
                          <div className="w-5 h-5 rounded-full bg-violet-300 border-2 border-white" />
                        </div>
                        <span className="text-xs text-gray-500 font-light ml-1">18 members</span>
                      </div>
                    </button>
                  </div>
                </div>

                <Link to={createPageUrl("Community")}>
                  <Button className="w-full bg-gradient-to-r from-purple-400/90 via-pink-400/90 to-rose-400/90 hover:from-purple-500 hover:via-pink-500 hover:to-rose-500 text-white text-sm h-11 rounded-full font-light shadow-[0_4px_20px_rgba(147,51,234,0.25)] hover:shadow-[0_6px_30px_rgba(147,51,234,0.35)] transition-all duration-300">
                    Find your people
                  </Button>
                </Link>
              </CardContent>
            </Card>





            {/* Stress & Energy Patterns */}
            <Card className="bg-white/60 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 tracking-wide uppercase">Your Stress & Energy Patterns</CardTitle>
                <p className="text-xs text-gray-400 mt-1 font-light">Noteworthy moments and emotional rhythms over time</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-gray-100/50"
                      onClick={() => {
                        const newDate = new Date(selectedMonth);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedMonth(newDate);
                      }}
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                    </Button>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-gray-100/50"
                      onClick={() => {
                        const newDate = new Date(selectedMonth);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedMonth(newDate);
                      }}
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center font-light">
                    Each day reflects your overall stress level. Tap a day to see what showed up.
                  </p>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 mb-2 font-light text-center">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {(() => {
                      const year = selectedMonth.getFullYear();
                      const month = selectedMonth.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const days = [];

                      // Empty cells before first day
                      for (let i = 0; i < firstDay; i++) {
                        days.push(<div key={`empty-${i}`} className="aspect-square" />);
                      }

                      // Calendar days
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dayDate = new Date(year, month, day);
                        const dayCheckIn = checkIns?.find(c => {
                          const checkInDate = new Date(c.created_date);
                          return checkInDate.getDate() === day && 
                                 checkInDate.getMonth() === month && 
                                 checkInDate.getFullYear() === year;
                        });

                        let bgColor = 'bg-pink-100/40';
                        if (dayCheckIn) {
                          if (dayCheckIn.stress >= 7 || dayCheckIn.capacity <= 3) {
                            bgColor = 'bg-red-200/60';
                          } else if (dayCheckIn.stress >= 5 || dayCheckIn.capacity <= 5) {
                            bgColor = 'bg-pink-200/60';
                          } else if (dayCheckIn.energy >= 7 && dayCheckIn.stress <= 4) {
                            bgColor = 'bg-green-200/60';
                          }
                        }

                        const hasEvent = dayCheckIn && (dayCheckIn.stress >= 6 || dayCheckIn.capacity <= 4);

                        days.push(
                          <button
                            key={day}
                            onClick={() => {
                              if (dayCheckIn) {
                                setSelectedDay({ date: dayDate, checkIn: dayCheckIn });
                              }
                            }}
                            className={`aspect-square rounded-full ${bgColor} hover:ring-2 hover:ring-purple-300/50 transition-all relative ${dayCheckIn ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            {hasEvent && (
                              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-purple-500" />
                            )}
                          </button>
                        );
                      }

                      return days;
                    })()}
                  </div>
                </div>

                <div>
                  <div className="flex justify-center gap-4 text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400/90" />
                      <span className="text-gray-600 font-light">Regulated — calm or steady day</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-pink-400/90" />
                      <span className="text-gray-600 font-light">Mild Stress — emotional or mental strain</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400/90" />
                      <span className="text-gray-600 font-light">High Stress — overload, conflict, or depletion</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center font-light">
                    Based on check-ins, behaviour patterns, and emotional signals
                  </p>
                </div>

                {/* Selected Day Label */}
                {selectedDay && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center"
                  >
                    <p className="text-sm text-purple-600 font-medium">
                      {selectedDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Noteworthy moment detected
                    </p>
                  </motion.div>
                )}

                {/* Collapsed Preview Card */}
                {selectedDay && !document.querySelector('.fixed.inset-0.bg-black\\/30') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 bg-gradient-to-br from-purple-50/50 to-pink-50/30 rounded-2xl p-4 border border-purple-100/50"
                  >
                    <h3 className="text-sm font-medium text-gray-900 mb-2">What showed up on this day</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3 font-light">
                      {selectedDay.checkIn.stress >= 7 ? 'Elevated emotional stress' : 'Moderate tension'} coincided with {selectedDay.checkIn.capacity <= 3 ? 'low capacity' : 'reduced energy'}{selectedDay.checkIn.nervous_system_state && ` and ${selectedDay.checkIn.nervous_system_state} mode`}.
                    </p>
                    <button className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                      View details
                      <ArrowRight className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Day Detail Panel */}
            {selectedDay && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-end" onClick={() => setSelectedDay(null)}>
                <motion.div
                  initial={{ x: 400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 400, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto"
                >
                  <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">What showed up this day</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)} className="rounded-full">
                      <X className="w-5 h-5 text-gray-400" />
                    </Button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* AI Snapshot Summary */}
                    <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/30 rounded-2xl p-5">
                      <p className="text-sm text-gray-700 leading-relaxed font-light">
                        This day showed {selectedDay.checkIn.stress >= 7 ? 'heightened stress' : 'moderate tension'} and {selectedDay.checkIn.capacity <= 3 ? 'low capacity' : 'reduced energy'}. 
                        {selectedDay.checkIn.nervous_system_state && ` Your nervous system was in ${selectedDay.checkIn.nervous_system_state} mode.`}
                        {selectedDay.checkIn.cycle_phase && ` This coincided with your ${selectedDay.checkIn.cycle_phase} phase.`}
                      </p>
                    </div>

                    {/* Context Tags */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-medium">Context</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDay.checkIn.cycle_phase && (
                          <Badge variant="secondary" className="bg-purple-100/80 text-purple-700 border-0 font-light">
                            {selectedDay.checkIn.cycle_phase} phase
                          </Badge>
                        )}
                        {selectedDay.checkIn.stress >= 7 && (
                          <Badge variant="secondary" className="bg-red-100/80 text-red-700 border-0 font-light">
                            High stress
                          </Badge>
                        )}
                        {selectedDay.checkIn.capacity <= 3 && (
                          <Badge variant="secondary" className="bg-amber-100/80 text-amber-700 border-0 font-light">
                            Low capacity
                          </Badge>
                        )}
                        {selectedDay.checkIn.nervous_system_state && (
                          <Badge variant="secondary" className="bg-indigo-100/80 text-indigo-700 border-0 font-light">
                            Nervous system: {selectedDay.checkIn.nervous_system_state}
                          </Badge>
                        )}
                        {selectedDay.checkIn.energy <= 4 && (
                          <Badge variant="secondary" className="bg-gray-100/80 text-gray-700 border-0 font-light">
                            Low energy
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Pattern Callout */}
                    {selectedDay.checkIn.stress >= 6 && (
                      <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl p-5 border border-amber-100/50">
                        <p className="text-xs uppercase tracking-wider text-amber-700 mb-2 font-medium">Pattern we're noticing</p>
                        <p className="text-sm text-gray-700 leading-relaxed font-light">
                          Similar stress responses have appeared multiple times this month, often coinciding with {selectedDay.checkIn.cycle_phase || 'luteal'} phase.
                        </p>
                      </div>
                    )}

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/80 rounded-xl p-4 border border-gray-100/50">
                        <p className="text-xs text-gray-500 mb-1 font-light">Energy</p>
                        <p className="text-2xl font-light text-gray-900">{selectedDay.checkIn.energy}/10</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-4 border border-gray-100/50">
                        <p className="text-xs text-gray-500 mb-1 font-light">Stress</p>
                        <p className="text-2xl font-light text-gray-900">{selectedDay.checkIn.stress}/10</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-4 border border-gray-100/50">
                        <p className="text-xs text-gray-500 mb-1 font-light">Capacity</p>
                        <p className="text-2xl font-light text-gray-900">{selectedDay.checkIn.capacity}/10</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-4 border border-gray-100/50">
                        <p className="text-xs text-gray-500 mb-1 font-light">Mood</p>
                        <p className="text-2xl font-light text-gray-900">{selectedDay.checkIn.mood}/10</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedDay.checkIn.notes && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-medium">Your notes</p>
                        <div className="bg-white/80 rounded-xl p-4 border border-gray-100/50">
                          <p className="text-sm text-gray-700 leading-relaxed font-light">{selectedDay.checkIn.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Source Reference */}
                    <div className="pt-4 border-t border-gray-100">
                      <button className="text-xs text-purple-600 hover:text-purple-700 font-light flex items-center gap-1">
                        <span>From today's check-in</span>
                        <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs h-9 px-4 rounded-full border-gray-200/50 hover:bg-gray-50/50 font-light">
                <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
                Reflect
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs h-9 px-4 rounded-full border-gray-200/50 hover:bg-gray-50/50 font-light">
                <Activity className="w-3.5 h-3.5" strokeWidth={1.5} />
                Regulate
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs h-9 px-4 rounded-full border-gray-200/50 hover:bg-gray-50/50 font-light">
                <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
                Cycle
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs h-9 px-4 rounded-full border-gray-200/50 hover:bg-gray-50/50 font-light">
                <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
                Sleep
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}