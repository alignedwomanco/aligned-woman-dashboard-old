import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { PlayCircle, CheckCircle2, Clock, ArrowRight, Heart, Sparkles, Target, Flame } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: diagnosticSessions = [] } = useQuery({
    queryKey: ['diagnosticSessions'],
    queryFn: () => base44.entities.DiagnosticSession.filter({ created_by: user?.email }, '-created_date', 1),
    enabled: !!user,
  });

  const { data: moduleProgress = [] } = useQuery({
    queryKey: ['userModuleProgress'],
    queryFn: () => base44.entities.UserModuleProgress.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.filter({ created_by: user?.email }, '-created_date', 7),
    enabled: !!user,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: () => base44.entities.Module.list('order', 100),
  });

  const diagnosticComplete = diagnosticSessions.length > 0 && diagnosticSessions[0]?.isComplete;
  const currentDiagnostic = diagnosticSessions[0];

  const inProgressModule = moduleProgress.find(mp => mp.status === 'InProgress');
  const completedModules = moduleProgress.filter(mp => mp.status === 'Complete').length;
  const totalModules = modules.length;

  const checkInStreak = checkIns.length;

  // Calculate phase progress
  const phaseProgress = {
    Awareness: 0,
    Liberation: 0,
    Intention: 0,
    VisionEmbodiment: 0,
  };

  modules.forEach(module => {
    const progress = moduleProgress.find(mp => mp.moduleId === module.id);
    if (progress?.status === 'Complete') {
      phaseProgress[module.phase] = (phaseProgress[module.phase] || 0) + 1;
    }
  });

  const phaseModuleCounts = {
    Awareness: modules.filter(m => m.phase === 'Awareness').length,
    Liberation: modules.filter(m => m.phase === 'Liberation').length,
    Intention: modules.filter(m => m.phase === 'Intention').length,
    VisionEmbodiment: modules.filter(m => m.phase === 'VisionEmbodiment').length,
  };

  if (!diagnosticComplete) {
    return (
      <div className="min-h-screen bg-pink-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl w-full"
        >
          <Card className="border-2 border-pink-200 shadow-xl">
            <CardHeader className="text-center pb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-[#4A1228]">
                Welcome to The Aligned Woman Blueprint
              </CardTitle>
              <p className="text-gray-600 mt-4">
                Let's build your personalised ALIVE Pathway
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-pink-50 rounded-2xl p-6 space-y-3">
                <h3 className="font-semibold text-[#4A1228]">Your diagnostic will assess:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#C67793] rounded-full" />
                    Nervous system state and capacity
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#C67793] rounded-full" />
                    Current life and emotional context
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#C67793] rounded-full" />
                    Phase readiness and prior knowledge
                  </li>
                </ul>
              </div>
              <Button
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] hover:from-[#4A1228] hover:to-[#6B1B3D] text-white py-6"
              >
                <Link to={createPageUrl('OnboardingDiagnostic')}>
                  Start Your Diagnostic
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <p className="text-sm text-gray-500 text-center">
                Takes 10-15 minutes · Adaptive questions · Personalised results
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-[#6B1B3D] to-[#4A1228] text-white border-0 shadow-2xl mb-8">
            <CardHeader>
              <CardTitle className="text-3xl font-extrabold tracking-tight">
                YOUR ALIVE PATHWAY
              </CardTitle>
              <p className="text-white/70">
                Built from your diagnostic. Updated as you evolve.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-white/60 mb-1">Primary Phase</p>
                  <p className="text-xl font-bold">{currentDiagnostic?.primaryPhase || 'Awareness'}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-white/60 mb-1">Capacity Score</p>
                  <p className="text-xl font-bold">{currentDiagnostic?.capacityScore || 7}/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Tiles */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-[#4A1228]">Continue Module</CardTitle>
                  <PlayCircle className="w-6 h-6 text-[#C67793]" />
                </div>
              </CardHeader>
              <CardContent>
                {inProgressModule ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      {modules.find(m => m.id === inProgressModule.moduleId)?.title || 'Nervous System Regulation'}
                    </p>
                    <Button asChild className="w-full bg-[#6B1B3D] hover:bg-[#4A1228]">
                      <Link to={createPageUrl('ModulePlayer') + '?id=' + inProgressModule.moduleId}>
                        Continue Learning
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">Ready to begin your first module</p>
                    <Button asChild className="w-full bg-[#6B1B3D] hover:bg-[#4A1228]">
                      <Link to={createPageUrl('MyPathway')}>View Pathway</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-[#4A1228]">Today's Check-In</CardTitle>
                  <Heart className="w-6 h-6 text-[#C67793]" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Track your energy, mood, and capacity
                </p>
                <Button asChild variant="outline" className="w-full border-[#6B1B3D] text-[#6B1B3D]">
                  <Link to={createPageUrl('CheckIn')}>Start Check-In</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-[#4A1228]">Tools Hub</CardTitle>
                  <Target className="w-6 h-6 text-[#C67793]" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Access your unlocked integration tools
                </p>
                <Button asChild variant="outline" className="w-full border-[#6B1B3D] text-[#6B1B3D]">
                  <Link to={createPageUrl('ToolsHub')}>Explore Tools</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#4A1228]">Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Overall Completion</span>
                  <span className="text-sm text-gray-500">{completedModules} of {totalModules} modules</span>
                </div>
                <Progress value={(completedModules / totalModules) * 100} className="h-3" />
              </div>

              {/* Phase Progress */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Phase Progress</h3>
                {Object.entries(phaseProgress).map(([phase, count]) => (
                  <div key={phase}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        {phase === 'VisionEmbodiment' ? 'Vision & Embodiment' : phase}
                      </span>
                      <span className="text-xs text-gray-500">
                        {count} of {phaseModuleCounts[phase]}
                      </span>
                    </div>
                    <Progress
                      value={(count / phaseModuleCounts[phase]) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-pink-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-[#6B1B3D] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#4A1228]">{completedModules}</p>
                  <p className="text-xs text-gray-600">Modules Complete</p>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-xl">
                  <Target className="w-6 h-6 text-[#6B1B3D] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#4A1228]">
                    {moduleProgress.filter(mp => mp.reflectionSubmitted).length}
                  </p>
                  <p className="text-xs text-gray-600">Tools Unlocked</p>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-xl">
                  <Flame className="w-6 h-6 text-[#6B1B3D] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#4A1228]">{checkInStreak}</p>
                  <p className="text-xs text-gray-600">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}