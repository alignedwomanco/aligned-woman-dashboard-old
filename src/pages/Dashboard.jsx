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

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
    if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
    return { text: "Good Evening", emoji: "🌙" };
  };

  const greeting = getGreeting();

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
            <div className="w-20 h-20 bg-gradient-to-br from-[#2F1B3E] to-[#4A2B5E] rounded-full flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#2F1B3E] mb-4">
              Welcome{currentUser?.full_name ? `, ${currentUser.full_name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-xl text-gray-600 max-w-xl mx-auto mb-8">
              Let's build your personalised ALIVE Pathway. Complete a short diagnostic so we can prescribe exactly what you need.
            </p>
            <Link to={createPageUrl("OnboardingForm")}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#2F1B3E] to-[#4A2B5E] hover:from-[#1F0B2E] hover:to-[#2F1B3E] text-white px-10 py-6 text-lg font-semibold rounded-full shadow-xl"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 pb-12">
      <div className="max-w-[1600px] mx-auto px-8 py-8">


        {/* Timeframe Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={snapshotView} onValueChange={setSnapshotView} className="w-auto inline-block">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-purple-200">
              <TabsTrigger value={SNAPSHOT_VIEWS.DAILY} className="data-[state=active]:bg-[#2F1B3E] data-[state=active]:text-white">
                Daily
              </TabsTrigger>
              <TabsTrigger value={SNAPSHOT_VIEWS.WEEKLY} className="data-[state=active]:bg-[#2F1B3E] data-[state=active]:text-white">
                Weekly
              </TabsTrigger>
              <TabsTrigger value={SNAPSHOT_VIEWS.MONTHLY} className="data-[state=active]:bg-[#2F1B3E] data-[state=active]:text-white">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Your Inner Systems + Life Domains */}
          <div className="lg:col-span-3 space-y-6">
            {/* Your Inner Systems */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-900">Your Inner Systems</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* My Nervous System */}
                  <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm text-pink-900">My Nervous System</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Current State:</span> Fawn
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      Your system is prioritizing safety today
                    </p>
                    <button className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
                      View nervous system guidance →
                    </button>
                  </div>

                  {/* My Human Design */}
                  {diagnosticSession?.humanDesignProfile && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm text-purple-900">My Human Design</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">Type:</span> {diagnosticSession.humanDesignProfile.type}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">Authority:</span> {diagnosticSession.humanDesignProfile.authority}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Discernment beats effort today
                      </p>
                      <button className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                        View cycle guidance →
                      </button>
                    </div>
                  )}

                  {/* My Cycle */}
                  {diagnosticSession?.cycleProfile && (
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <Moon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm text-indigo-900">My Cycle</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">Phase:</span> {diagnosticSession.cycleProfile.cycleStage}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Lower energy is natural in this phase. Adapt, don't push.
                      </p>
                      <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                        View cycle guidance →
                      </button>
                    </div>
                  )}

                  {/* My Astrology */}
                  {diagnosticSession?.astrologyProfile && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm text-amber-900">My Astrology</h3>
                      </div>
                      <div className="flex gap-2 mb-2">
                        {diagnosticSession.astrologyProfile.sunSign && (
                          <Badge className="bg-amber-200 text-amber-900 text-xs">
                            ☉ {diagnosticSession.astrologyProfile.sunSign}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {diagnosticSession.astrologyProfile.currentTransitSummary?.slice(0, 80)}...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Your Life Domains */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Your Life Domains
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Business & Career */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h3 className="font-semibold text-sm text-blue-900 mb-2">Business + Career</h3>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Current theme:</span> Clarity before momentum
                    </p>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      View work guidance/guidance →
                    </button>
                  </div>

                  {/* Finance */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h3 className="font-semibold text-sm text-green-900 mb-2">Finance <Badge className="bg-purple-200 text-purple-900 text-xs ml-2">Intention</Badge></h3>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Focus today:</span> Conscious spending habits
                    </p>
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
              <Card className="bg-gradient-to-br from-[#2F1B3E] to-[#4A2B5E] text-white border-0 overflow-hidden">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-center">Your Daily ALIVE Snapshot</h2>
                  
                  {/* System Icons */}
                  <div className="flex justify-center gap-4 mb-8">
                    {diagnosticSession?.astrologyProfile?.sunSign && (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto">
                          <Sparkles className="w-8 h-8 text-yellow-300" />
                        </div>
                        <p className="text-xs font-medium">{diagnosticSession.astrologyProfile.sunSign}</p>
                      </div>
                    )}
                    {diagnosticSession?.humanDesignProfile && (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto">
                          <Target className="w-8 h-8 text-purple-300" />
                        </div>
                        <p className="text-xs font-medium">{diagnosticSession.humanDesignProfile.type}</p>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto">
                        <Moon className="w-8 h-8 text-blue-300" />
                      </div>
                      <p className="text-xs font-medium">Luteal</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-pink-500 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-xs font-medium">Fawn</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto">
                        <Waves className="w-8 h-8 text-indigo-300" />
                      </div>
                      <p className="text-xs font-medium">{diagnosticSession?.primaryPhase || "Intention"}</p>
                    </div>
                  </div>

                  {/* Main Narrative */}
                  <div className="mb-6">
                    <p className="text-white/90 leading-relaxed mb-4">
                      {diagnosticSession?.aliveNarrative || "Today is about responding, not pushing. Sagittarius energy is activating your long-term vision but your Moon in Virgo asks for refinement, not expansion."}
                    </p>
                  </div>

                  {/* Guiding Phrase */}
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-4 mb-6 text-center">
                    <p className="font-bold text-lg">Less effort. More alignment.</p>
                  </div>

                  {/* Ask LaurAI */}
                  <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Ask LaurAI about today</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-white/20 text-white text-xs border-0">How should I work today?</Badge>
                        <Badge className="bg-white/20 text-white text-xs border-0">Why does this feel harder?</Badge>
                        <Badge className="bg-white/20 text-white text-xs border-0">What should I focus on?</Badge>
                      </div>
                    </div>
                    <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recommended For You Right Now */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-[#2F1B3E] to-[#4A2B5E] text-white border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
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
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
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
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
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
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-900">Body Patterns</CardTitle>
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
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-purple-900">Your Stress & Energy Patterns</CardTitle>
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

        {/* Bottom Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8"
        >
          <div className="grid grid-cols-4 gap-4">
            <Link to={createPageUrl("Journal")} className="block">
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-all cursor-pointer h-full">
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
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-all cursor-pointer h-full">
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
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-all cursor-pointer h-full">
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
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-all cursor-pointer h-full">
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
    </div>
  );
}