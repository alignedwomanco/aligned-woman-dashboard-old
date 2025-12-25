import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Sparkles,
  Target,
  Wrench,
  Calendar,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  Flame,
  BookOpen,
  Heart,
  Smile,
  Moon,
  Edit3,
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [snapshotView, setSnapshotView] = useState("daily");

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Apply background
      if (userData?.background_image) {
        const bg = userData.background_image;
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
    queryFn: () => base44.entities.CheckIn.list("-created_date", 7),
    initialData: [],
  });

  const { data: journalEntries } = useQuery({
    queryKey: ["journalEntries"],
    queryFn: () => base44.entities.JournalEntry.list("-created_date", 30),
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

  const completedModules = moduleProgress?.filter((p) => p.status === "Complete").length || 0;
  const inProgressModule = moduleProgress?.find((p) => p.status === "InProgress");
  const checkInStreak = checkIns?.length || 0;
  const latestCheckIn = checkIns?.[0];
  const latestPurposeRun = purposeRuns?.[0];
  
  const canRerunPurpose = () => {
    if (!latestPurposeRun?.completedAt) return true;
    const lastRun = new Date(latestPurposeRun.completedAt);
    const daysSince = Math.floor((new Date() - lastRun) / (1000 * 60 * 60 * 24));
    return daysSince >= 7;
  };

  const { data: allModules } = useQuery({
    queryKey: ["allModules"],
    queryFn: () => base44.entities.Module.list(),
    initialData: [],
  });

  const calculatePhaseProgress = () => {
    const phases = ["Awareness", "Liberation", "Intention", "VisionEmbodiment"];
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
  };

  const phaseProgress = calculatePhaseProgress();

  useEffect(() => {
    if (diagnosticSession?.snapshotFrequency) {
      setSnapshotView(diagnosticSession.snapshotFrequency);
    }
  }, [diagnosticSession]);

  // If no diagnostic completed, show onboarding prompt
  if (!diagnosticSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
        <div className="max-w-4xl mx-auto pt-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-full flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#4A1228] mb-4">
              Welcome{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-xl text-gray-600 max-w-xl mx-auto mb-8">
              Let's build your personalised ALIVE Pathway. Complete a short diagnostic so we can prescribe exactly what you need.
            </p>
            <Link to={createPageUrl("OnboardingForm")}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] hover:from-[#4A1228] hover:to-[#6B1B3D] text-white px-10 py-6 text-lg font-semibold rounded-full shadow-xl"
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

  const needsCheckIn = () => {
    if (!diagnosticSession?.lastCheckInDate) return true;
    const lastCheckIn = new Date(diagnosticSession.lastCheckInDate);
    const today = new Date();
    lastCheckIn.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return lastCheckIn.getTime() !== today.getTime();
  };

  const getSnapshotContent = () => {
    const todayDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    if (snapshotView === "weekly") {
      return (
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardHeader>
            <CardTitle className="text-2xl">This Week's Overview</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-line">
              {diagnosticSession.weeklySnapshotSummary || "Your weekly overview will appear here after your first check-in cycle completes."}
            </p>
          </CardContent>
        </Card>
      );
    }

    if (snapshotView === "monthly") {
      return (
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader>
            <CardTitle className="text-2xl">This Month's Reflection</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-line">
              {diagnosticSession.monthlySnapshotSummary || "Your monthly reflection will appear here as you progress through your journey."}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Today's Snapshot</CardTitle>
            <Badge className="bg-[#6B1B3D] text-white">{todayDate}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {diagnosticSession.dailySnapshot?.mainNarrative ? (
            <>
              {/* Check-in prompt if needed */}
              {needsCheckIn() && (
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-6 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Start Your Day</h3>
                      <p className="text-white/90 mb-4">Take 2 minutes to check in and get your personalized snapshot for today.</p>
                      <Link to={createPageUrl("DailyCheckIn")}>
                        <Button className="bg-white text-rose-600 hover:bg-white/90">
                          Daily Check-In <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Today Is About */}
              {diagnosticSession.dailySnapshot.todayIsAbout && (
                <div className="bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] text-white p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Today Is About
                  </h3>
                  <p className="text-white/90 text-lg leading-relaxed">
                    {diagnosticSession.dailySnapshot.todayIsAbout}
                  </p>
                </div>
              )}

              {/* Main Narrative - The Integration */}
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                  {diagnosticSession.dailySnapshot.mainNarrative}
                </p>
              </div>

              {/* Guidance Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {diagnosticSession.dailySnapshot.movementRecommendation && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h3 className="text-sm font-semibold text-green-900 mb-2">Movement</h3>
                    <p className="text-gray-700 text-sm">{diagnosticSession.dailySnapshot.movementRecommendation}</p>
                  </div>
                )}
                {diagnosticSession.dailySnapshot.nutritionRecommendation && (
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <h3 className="text-sm font-semibold text-orange-900 mb-2">Nutrition</h3>
                    <p className="text-gray-700 text-sm">{diagnosticSession.dailySnapshot.nutritionRecommendation}</p>
                  </div>
                )}
                {diagnosticSession.dailySnapshot.energyGuidance && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-900 mb-2">Energy Guidance</h3>
                    <p className="text-gray-700 text-sm">{diagnosticSession.dailySnapshot.energyGuidance}</p>
                  </div>
                )}
                {diagnosticSession.dailySnapshot.focusReminder && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Focus</h3>
                    <p className="text-gray-700 text-sm">{diagnosticSession.dailySnapshot.focusReminder}</p>
                  </div>
                )}
              </div>

              {/* ALIVE Lens */}
              {diagnosticSession.dailySnapshot.aliveLens && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-200">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-2">Your ALIVE Lens</h3>
                  <p className="text-gray-700 text-sm">{diagnosticSession.dailySnapshot.aliveLens}</p>
                </div>
              )}

              {/* Recommended Modules */}
              {diagnosticSession.dailySnapshot.recommendedModules && diagnosticSession.dailySnapshot.recommendedModules.length > 0 && (
                <div className="bg-white p-5 rounded-xl border-2 border-pink-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Recommended for Today</h3>
                  <div className="space-y-2">
                    {diagnosticSession.dailySnapshot.recommendedModules.map((module, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                        <CheckCircle className="w-4 h-4 text-[#6B1B3D]" />
                        {module}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Complete Your Daily Check-In
              </h3>
              <p className="text-gray-600 mb-6">
                Get your personalized snapshot with integrated guidance for today
              </p>
              <Link to={createPageUrl("DailyCheckIn")}>
                <Button className="bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] text-white">
                  Start Check-In <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">
            Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-600">Your personalised ALIVE operating system.</p>
        </motion.div>

        {/* ALIVE Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-[#6B1B3D] to-[#4A1228] border-0 overflow-hidden">
            <CardContent className="p-8 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-rose-300" />
                  <span className="text-rose-200 font-medium">Your ALIVE Profile</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Primary: {diagnosticSession?.primaryPhase || "Awareness"}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                    Capacity: {diagnosticSession?.capacityScore || 7}/10
                  </Badge>
                  <Badge className="bg-rose-500/30 text-rose-200 border-0 px-4 py-2">
                    Secondary: {diagnosticSession?.secondaryPhase || "Liberation"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2-Column Layout: Snapshot + Purpose */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Today's Snapshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={snapshotView} onValueChange={setSnapshotView}>
              <TabsList className="mb-4">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              <TabsContent value={snapshotView}>
                {getSnapshotContent()}
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Right Column: Purpose Tool */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#6B1B3D]" />
                  My Purpose
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!latestPurposeRun ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-[#6B1B3D]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#4A1228] mb-3">
                      Define My Purpose
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                      Uncover the masks you wear and the truth you are ready to live
                    </p>
                    <Link to={createPageUrl("DefineMyPurpose")}>
                      <Button className="bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] hover:from-[#4A1228] hover:to-[#6B1B3D] text-white px-8 py-6">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Begin Journey
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-100">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          Completed{" "}
                          {new Date(latestPurposeRun.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[#4A1228] mb-2">
                        Your Purpose Report is Ready
                      </h4>
                      <p className="text-gray-600 text-sm">
                        View your personalized insights and higher self guidance.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Link to={createPageUrl("DefineMyPurpose")}>
                        <Button className="w-full bg-[#6B1B3D] hover:bg-[#4A1228] text-white">
                          View Purpose Report
                        </Button>
                      </Link>
                      {canRerunPurpose() && (
                        <Link to={createPageUrl("DefineMyPurpose")}>
                          <Button variant="outline" className="w-full border-[#6B1B3D] text-[#6B1B3D] hover:bg-pink-50">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Redefine My Purpose
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Your ALIVE Path */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-10"
        >
          <Card className="bg-gradient-to-br from-[#6B1B3D] to-[#4A1228] border-0 text-white">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-rose-300" />
                <h2 className="text-2xl font-bold">Your ALIVE Path</h2>
              </div>
              {diagnosticSession.aliveNarrative && (
                <p className="text-white/90 mb-4 leading-relaxed">
                  {diagnosticSession.aliveNarrative}
                </p>
              )}
              {diagnosticSession.phaseFocusAdvice && (
                <div className="bg-white/10 p-4 rounded-xl mb-4">
                  <p className="text-white/90">{diagnosticSession.phaseFocusAdvice}</p>
                </div>
              )}
              {diagnosticSession.recommendedModules && diagnosticSession.recommendedModules.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-rose-200 mb-2">Recommended for You</h3>
                  <div className="space-y-2">
                    {diagnosticSession.recommendedModules.slice(0, 3).map((module, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                        <CheckCircle className="w-4 h-4 text-rose-300" />
                        {module}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Link to={createPageUrl("MyPathway")}>
                <Button className="bg-white text-[#6B1B3D] hover:bg-white/90">
                  Continue Your Path <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommended Modules */}
        {diagnosticSession.recommendedModules && diagnosticSession.recommendedModules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#4A1228]">Recommended for You</h2>
                <p className="text-gray-600">Based on your diagnostic and current phase</p>
              </div>
              <Link to={createPageUrl("Classroom")}>
                <Button variant="ghost" className="text-[#6B1B3D]">
                  See all <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {diagnosticSession.recommendedModules.slice(0, 3).map((module, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-2 border-pink-100">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-2xl flex items-center justify-center mb-4">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <Badge className="bg-pink-100 text-[#6B1B3D] mb-3">
                      {diagnosticSession.primaryPhase}
                    </Badge>
                    <h3 className="font-bold text-lg text-[#4A1228] mb-2">{module}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Aligned with your current journey
                    </p>
                    <Link to={createPageUrl("Classroom")}>
                      <Button className="w-full bg-[#6B1B3D] hover:bg-[#4A1228]">
                        Start Module <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Cycle & Body Intelligence */}
        {diagnosticSession.dailySnapshot?.cycleInsight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-10"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Your Cycle & Body Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">Phase Wisdom</h3>
                  <p className="text-gray-700">{diagnosticSession.dailySnapshot.cycleInsight}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {diagnosticSession.dailySnapshot.exerciseRecommendation && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Movement</h3>
                      <p className="text-gray-600 text-sm">{diagnosticSession.dailySnapshot.exerciseRecommendation}</p>
                    </div>
                  )}
                  {diagnosticSession.dailySnapshot.nutritionRecommendation && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Nutrition</h3>
                      <p className="text-gray-600 text-sm">{diagnosticSession.dailySnapshot.nutritionRecommendation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Design & Energetics */}
        {diagnosticSession.enableDeepPersonalisation && (diagnosticSession.astrologyProfile || diagnosticSession.humanDesignProfile) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-10"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Your Design & Energetics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {diagnosticSession.humanDesignProfile && (
                  <div className="bg-amber-50 p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-amber-900 mb-2">Human Design</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className="bg-amber-200 text-amber-900">
                        {diagnosticSession.humanDesignProfile.type}
                      </Badge>
                      <Badge variant="outline">{diagnosticSession.humanDesignProfile.authority}</Badge>
                    </div>
                    <p className="text-gray-700 text-sm">
                      <strong>Strategy:</strong> {diagnosticSession.humanDesignProfile.strategy}
                    </p>
                    <p className="text-gray-600 text-sm mt-2">{diagnosticSession.humanDesignProfile.energyPattern}</p>
                  </div>
                )}
                {diagnosticSession.astrologyProfile && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Astrology</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {diagnosticSession.astrologyProfile.sunSign && (
                        <Badge className="bg-blue-200 text-blue-900">☉ {diagnosticSession.astrologyProfile.sunSign}</Badge>
                      )}
                      {diagnosticSession.astrologyProfile.moonSign && (
                        <Badge variant="outline">☽ {diagnosticSession.astrologyProfile.moonSign}</Badge>
                      )}
                      {diagnosticSession.astrologyProfile.risingSign && (
                        <Badge variant="outline">↑ {diagnosticSession.astrologyProfile.risingSign}</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{diagnosticSession.astrologyProfile.currentTransitSummary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions & Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#4A1228]">Tools</h2>
            <Link to={createPageUrl("ToolsHub")}>
              <Button variant="ghost" className="text-[#6B1B3D]">
                See all <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <Link to={createPageUrl("Journal")}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Edit3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#4A1228]">Quick Journal</h3>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl("CheckIn")}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#4A1228]">Daily Check-In</h3>
                </CardContent>
              </Card>
            </Link>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Smile className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-[#4A1228]">Gratitude</h3>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-[#4A1228]">Sleep Check</h3>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Identity & Values Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#6B1B3D]" />
                  Identity Evolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 p-4 rounded-xl">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">Releasing</h3>
                  <p className="text-gray-700">{diagnosticSession.releasing || "Not set"}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">Becoming</h3>
                  <p className="text-gray-700">{diagnosticSession.becoming || "Not set"}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Core Values & Boundaries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Core Values</h3>
                  <div className="flex flex-wrap gap-2">
                    {diagnosticSession.values?.map((value) => (
                      <Badge key={value} className="bg-[#6B1B3D] text-white">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Active Boundaries</h3>
                  <ul className="space-y-1">
                    {diagnosticSession.boundaries?.filter(b => b).map((boundary, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#6B1B3D] flex-shrink-0 mt-0.5" />
                        {boundary}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Phase Integration & Stats */}
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-[#6B1B3D]" />
                  Phase Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {Object.entries(phaseProgress).map(([phase, progress]) => (
                  <div key={phase}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">
                        {phase === "VisionEmbodiment" ? "Vision & Embodiment" : phase}
                      </span>
                      <span className="text-gray-500">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-[#6B1B3D]" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-pink-50 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-bold text-[#6B1B3D] mb-1">
                      {completedModules}
                    </div>
                    <div className="text-sm text-gray-600">Modules Complete</div>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-bold text-purple-700 mb-1">4</div>
                    <div className="text-sm text-gray-600">Tools Unlocked</div>
                  </div>
                  <div className="bg-orange-50 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">
                      {checkInStreak}
                    </div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {journalEntries.length}
                    </div>
                    <div className="text-sm text-gray-600">Journal Entries</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}