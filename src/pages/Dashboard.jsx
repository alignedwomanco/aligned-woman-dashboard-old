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
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);

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

  const completedModules = moduleProgress?.filter((p) => p.status === "Complete").length || 0;
  const inProgressModule = moduleProgress?.find((p) => p.status === "InProgress");
  const checkInStreak = checkIns?.length || 0;

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
          <p className="text-gray-600">Your ALIVE Pathway awaits.</p>
        </motion.div>

        {/* Hero Card */}
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
                  <span className="text-rose-200 font-medium">Your ALIVE Pathway</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Primary Phase: {diagnosticSession?.primaryPhase || "Awareness"}
                </h2>
                <p className="text-white/70 mb-6">
                  Built from your diagnostic. Updated as you evolve.
                </p>
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

        {/* Action Tiles */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to={createPageUrl("ModulePlayer")}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 border-[#6B1B3D]/10 hover:border-[#6B1B3D]/30">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-2xl flex items-center justify-center mb-4">
                    <Play className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#4A1228] mb-2">
                    Continue Module
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {inProgressModule ? "Pick up where you left off" : "Start your first module"}
                  </p>
                  <div className="flex items-center text-[#6B1B3D] font-medium text-sm">
                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to={createPageUrl("CheckIn")}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 border-pink-100 hover:border-pink-200">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#4A1228] mb-2">
                    Today's Check-In
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Track your energy, mood, and capacity
                  </p>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600">{checkInStreak} day streak</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link to={createPageUrl("ToolsHub")}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-100 hover:border-purple-200">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4">
                    <Wrench className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#4A1228] mb-2">
                    Tool for Today
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Regulation Toolkit
                  </p>
                  <div className="flex items-center text-purple-600 font-medium text-sm">
                    Open Tool <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Progress Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-[#6B1B3D]" />
                  Phase Progress
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
            transition={{ delay: 0.6 }}
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
                    <div className="text-3xl font-bold text-purple-700 mb-1">3</div>
                    <div className="text-sm text-gray-600">Tools Unlocked</div>
                  </div>
                  <div className="bg-orange-50 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">
                      {checkInStreak}
                    </div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">12</div>
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