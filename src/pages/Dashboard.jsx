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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Your Inner Systems */}
          <div className="lg:col-span-3 space-y-6">
            {/* Your Inner Systems */}
            <Card className="bg-gradient-to-br from-purple-100/50 to-indigo-100/50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Your Inner Systems</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nervous System */}
                <Link to={createPageUrl("CheckIn")} className="block">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white/80 transition-all border border-pink-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">My Nervous System</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Current State:</span> {checkIns?.[0]?.nervous_system_state || "Fawn"}
                        </p>
                        <p className="text-xs text-gray-500">Your system is prioritizing safety today</p>
                        <Button variant="link" className="text-xs text-purple-600 p-0 h-auto mt-2">
                          View current system guidance →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Human Design */}
                <Link to={createPageUrl("MyHumanDesign")} className="block">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white/80 transition-all border border-purple-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">My Human Design</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Type:</span> {diagnosticSession?.humanDesignProfile?.type || "Projector"}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          <span className="font-medium">Authority:</span> {diagnosticSession?.humanDesignProfile?.authority || "Emotional"}
                        </p>
                        <p className="text-xs text-gray-500">Discernment beats effort today</p>
                        <Button variant="link" className="text-xs text-purple-600 p-0 h-auto mt-2">
                          View cycle guidance →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* My Cycle */}
                <Link to={createPageUrl("MyCycle")} className="block">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white/80 transition-all border border-indigo-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Moon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">My Cycle</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Phase:</span> {checkIns?.[0]?.cycle_phase || "Luteal"}
                        </p>
                        <p className="text-xs text-gray-500">Turning inward, discernment, and expression.</p>
                        <Button variant="link" className="text-xs text-purple-600 p-0 h-auto mt-2">
                          View cycle guidance →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Your Life Domains */}
            <Card className="bg-gradient-to-br from-purple-100/50 to-indigo-100/50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Your Life Domains
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Business • Career</h3>
                  <p className="text-xs text-gray-600 mb-2">Current theme:</p>
                  <p className="text-sm text-gray-700">Clarity before momentum</p>
                  <Button variant="link" className="text-xs text-purple-600 p-0 h-auto mt-2">
                    View work guidance guidance →
                  </Button>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    Finance
                    <Badge variant="secondary" className="text-xs">Intention</Badge>
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">Resources & visibility progress</p>
                  <Progress value={45} className="h-2 mb-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Center */}
          <div className="lg:col-span-6 space-y-6">
            {/* Daily ALIVE Snapshot */}
            <Card className="bg-gradient-to-br from-[#3B224E] to-[#4A2B5E] text-white border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Tabs value={snapshotView} onValueChange={setSnapshotView} className="w-auto">
                    <TabsList className="bg-white/10 border-0">
                      <TabsTrigger value={SNAPSHOT_VIEWS.DAILY} className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                        Daily
                      </TabsTrigger>
                      <TabsTrigger value={SNAPSHOT_VIEWS.WEEKLY} className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                        Weekly
                      </TabsTrigger>
                      <TabsTrigger value={SNAPSHOT_VIEWS.MONTHLY} className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                        Monthly
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardTitle className="text-2xl text-center mb-6">Your Daily ALIVE Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                {isGeneratingSnapshot ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mb-4" />
                    <p className="text-white/80">Understanding your state today...</p>
                  </div>
                ) : snapshotData ? (
                  <div className="space-y-6">
                    {/* System Icons */}
                    <div className="flex justify-center items-center gap-4 mb-6">
                      {snapshotData.astrology?.sunSign && (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex flex-col items-center justify-center mb-2">
                            <Sparkles className="w-6 h-6 text-amber-300" />
                          </div>
                          <p className="text-xs text-white/80">{snapshotData.astrology.sunSign}</p>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex flex-col items-center justify-center mb-2">
                          <Target className="w-6 h-6 text-purple-300" />
                        </div>
                        <p className="text-xs text-white/80">{snapshotData.humanDesign?.type || "Projector"}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex flex-col items-center justify-center mb-2">
                          <Moon className="w-6 h-6 text-indigo-300" />
                        </div>
                        <p className="text-xs text-white/80">{snapshotData.cyclePhase}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex flex-col items-center justify-center mb-2">
                          <Heart className="w-6 h-6 text-pink-300" />
                        </div>
                        <p className="text-xs text-white/80">{snapshotData.nervousSystemState}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex flex-col items-center justify-center mb-2">
                          <TrendingUp className="w-6 h-6 text-purple-300" />
                        </div>
                        <p className="text-xs text-white/80">{snapshotData.alivePhase}</p>
                      </div>
                    </div>

                    {/* Main Narrative */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold mb-4">{snapshotData.guidingPhrase}</h3>
                      <p className="text-white/90 leading-relaxed whitespace-pre-line">{snapshotData.narrative}</p>
                    </div>

                    {/* CTA Button */}
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-full py-3 px-6 text-center">
                      <p className="text-white font-medium">Less effort. More alignment.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Button onClick={generateSnapshot} className="bg-white/20 hover:bg-white/30 text-white">
                      Generate Today&apos;s Snapshot
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ask LaurAI */}
            <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Ask LaurAI about today</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    onClick={() => handleQuickQuestion("How should I work today?")}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    How should I work today?
                  </Button>
                  <Button
                    onClick={() => handleQuickQuestion("Why does this feel harder than usual?")}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Why does this feel harder than usual?
                  </Button>
                  <Button
                    onClick={() => handleQuickQuestion("What should I focus on this week?")}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    What should I focus on this week?
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={lauraiQuestion}
                    onChange={(e) => setLauraiQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
                    placeholder="Or ask your own question..."
                    className="flex-1 bg-white"
                    disabled={isLauraiThinking}
                  />
                  <Button
                    onClick={handleCustomQuestion}
                    disabled={isLauraiThinking || !lauraiQuestion.trim()}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                  >
                    {isLauraiThinking ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {lauraiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-white rounded-xl p-4"
                  >
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {lauraiResponse}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Recommended For You */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Recommended For You Right Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendedModules.slice(0, 2).map((module, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                      <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{module.summary}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {module.duration} min • Video
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs">Lowest lift</Badge>
                        <Badge variant="secondary" className="text-xs">Manifestation today</Badge>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Start
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Cycle & Capacity */}
            <Card className="bg-gradient-to-br from-pink-400 to-rose-500 text-white border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Moon className="w-5 h-5" />
                  Cycle & Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-white/80 text-sm mb-2">{checkIns?.[0]?.cycle_phase || "Luteal"}</p>
                  <p className="text-5xl font-bold">{diagnosticSession?.capacityScore || 5.5}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <Progress value={(diagnosticSession?.capacityScore || 5.5) * 10} className="h-2 bg-white/30 mb-3" />
                  <p className="text-white/90 text-sm">Gentle movement & warm foods</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-gray-600">Thu</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-gray-600">Feb</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-gray-600">Mar</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Body Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Body Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl flex items-center justify-center mb-4">
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
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="sm" className="text-xs">
                    Daily
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Weekly
                  </Button>
                  <Button variant="default" size="sm" className="text-xs bg-pink-500">
                    Monthly
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Jul
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Reflect
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Regulate
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Cycle
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Sleep
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}