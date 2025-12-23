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

  const completedModules = moduleProgress?.filter((p) => p.status === "Complete").length || 0;
  const inProgressModule = moduleProgress?.find((p) => p.status === "InProgress");
  const checkInStreak = checkIns?.length || 0;
  const latestCheckIn = checkIns?.[0];

  const phaseProgress = {
    Awareness: 40,
    Liberation: 20,
    Intention: 0,
    VisionEmbodiment: 0,
  };

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
            <Link to={createPageUrl("OnboardingDiagnostic")}>
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

  useEffect(() => {
    if (diagnosticSession?.snapshotFrequency) {
      setSnapshotView(diagnosticSession.snapshotFrequency);
    }
  }, [diagnosticSession]);

  const getSnapshotContent = () => {
    const todayDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    return (
      <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {snapshotView === "daily" && "Today's Snapshot"}
              {snapshotView === "weekly" && "This Week's Overview"}
              {snapshotView === "monthly" && "This Month's Reflection"}
            </CardTitle>
            <Badge className="bg-[#6B1B3D] text-white">{todayDate}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Focus Areas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Current Focus</h3>
            <div className="flex flex-wrap gap-2">
              {diagnosticSession.concerns?.slice(0, 5).map((concern) => (
                <Badge key={concern} variant="outline" className="bg-white">
                  {concern}
                </Badge>
              ))}
            </div>
          </div>

          {/* Emotional State */}
          {latestCheckIn && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Current State</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Energy</div>
                  <div className="text-2xl font-bold text-[#6B1B3D]">{latestCheckIn.energy}/10</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Capacity</div>
                  <div className="text-2xl font-bold text-[#6B1B3D]">{latestCheckIn.capacity}/10</div>
                </div>
              </div>
            </div>
          )}

          {/* Cycle Insight */}
          {diagnosticSession.cycleProfile?.cycleStage && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Cycle Phase</h3>
              <Badge className="bg-purple-100 text-purple-800">
                {diagnosticSession.cycleProfile.cycleStage}
              </Badge>
            </div>
          )}

          {/* Suggested Action */}
          <div className="bg-rose-50 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-[#6B1B3D] mb-2">Suggested Action</h3>
            <p className="text-gray-700">
              Based on your capacity ({diagnosticSession.capacityScore}/10), consider a {diagnosticSession.timeAvailable} session today.
            </p>
          </div>

          {/* Progress Note */}
          <div className="bg-[#6B1B3D] text-white p-4 rounded-xl">
            <h3 className="text-sm font-semibold mb-2">Phase Progress</h3>
            <p className="text-sm">
              You're working through <strong>{diagnosticSession.primaryPhase}</strong> with a focus on {diagnosticSession.secondaryPhase}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
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

        {/* Snapshot Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
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

        {/* Quick Actions & Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
            transition={{ delay: 0.4 }}
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
            transition={{ delay: 0.5 }}
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
            transition={{ delay: 0.6 }}
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
            transition={{ delay: 0.7 }}
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