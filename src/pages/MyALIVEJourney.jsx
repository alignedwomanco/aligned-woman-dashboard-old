import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const phases = [
  {
    letter: "A",
    name: "Awareness",
    title: "Awareness",
    description: "See what is. The patterns, the conditioning, the truth beneath the noise.",
    bgGradient: "from-rose-500 to-pink-600",
    lightBg: "bg-rose-50",
    textColor: "text-rose-900",
  },
  {
    letter: "L",
    name: "Liberation",
    title: "Liberation",
    description: "Release what no longer serves. The beliefs, the roles, the identities you've outgrown.",
    bgGradient: "from-purple-500 to-indigo-600",
    lightBg: "bg-purple-50",
    textColor: "text-purple-900",
  },
  {
    letter: "I",
    name: "Intention",
    title: "Intention",
    description: "Choose what comes next. Your vision, your values, your aligned path forward.",
    bgGradient: "from-blue-500 to-cyan-600",
    lightBg: "bg-blue-50",
    textColor: "text-blue-900",
  },
  {
    letter: "V",
    name: "Vision & Embodiment",
    title: "Vision & Embodiment",
    description: "Become her. Live it, lead it, embody the woman you were always meant to be.",
    bgGradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    textColor: "text-emerald-900",
  },
];

export default function MyALIVEJourney() {
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

  const { data: allModules = [] } = useQuery({
    queryKey: ["allModules"],
    queryFn: () => base44.entities.Module.list(),
  });

  const { data: moduleProgress = [] } = useQuery({
    queryKey: ["moduleProgress"],
    queryFn: () => base44.entities.UserModuleProgress.list(),
  });

  const calculatePhaseProgress = (phaseName) => {
    const modulesInPhase = allModules.filter(m => m.phase === phaseName);
    const completedInPhase = moduleProgress.filter(p => 
      p.status === "Complete" && 
      modulesInPhase.some(m => m.id === p.moduleId)
    );
    return modulesInPhase.length > 0 
      ? Math.round((completedInPhase.length / modulesInPhase.length) * 100)
      : 0;
  };

  const getPhaseStatus = (phaseName) => {
    const progress = calculatePhaseProgress(phaseName);
    if (progress === 100) return "complete";
    if (progress > 0) return "in-progress";
    if (diagnosticSession?.primaryPhase === phaseName) return "current";
    return "locked";
  };

  const getPhaseModuleCount = (phaseName) => {
    const modulesInPhase = allModules.filter(m => m.phase === phaseName);
    const completedInPhase = moduleProgress.filter(p => 
      p.status === "Complete" && 
      modulesInPhase.some(m => m.id === p.moduleId)
    );
    return { completed: completedInPhase.length, total: modulesInPhase.length };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold text-[#4A1228] mb-2">My ALIVE Journey</h1>
          <p className="text-gray-600 text-lg">Your personalized pathway through transformation</p>
        </motion.div>

        {diagnosticSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <Card className="bg-gradient-to-br from-[#6B1B3D] to-[#4A1228] border-0 text-white">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-2">Your Current Phase</h2>
                <div className="flex items-center gap-4 mb-4">
                  <Badge className="bg-white/20 text-white text-lg px-4 py-2">
                    Primary: {diagnosticSession.primaryPhase}
                  </Badge>
                  {diagnosticSession.secondaryPhase && (
                    <Badge className="bg-rose-500/30 text-rose-200 text-lg px-4 py-2">
                      Secondary: {diagnosticSession.secondaryPhase}
                    </Badge>
                  )}
                </div>
                {diagnosticSession.aliveNarrative && (
                  <p className="text-white/90 leading-relaxed">
                    {diagnosticSession.aliveNarrative}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="space-y-6">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(phase.name);
            const progress = calculatePhaseProgress(phase.name);
            const { completed, total } = getPhaseModuleCount(phase.name);
            const isPrimary = diagnosticSession?.primaryPhase === phase.name;
            const isSecondary = diagnosticSession?.secondaryPhase === phase.name;

            return (
              <motion.div
                key={phase.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`overflow-hidden border-2 ${
                  isPrimary ? "border-[#6B1B3D] shadow-lg" : 
                  isSecondary ? "border-rose-300" : 
                  "border-gray-200"
                }`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Phase Letter */}
                      <div className={`w-full md:w-32 bg-gradient-to-br ${phase.bgGradient} flex items-center justify-center p-6`}>
                        <span className="text-6xl font-bold text-white">{phase.letter}</span>
                      </div>

                      {/* Phase Content */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-bold text-[#4A1228]">{phase.title}</h3>
                              {status === "complete" && (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              )}
                              {status === "in-progress" && (
                                <Circle className="w-6 h-6 text-blue-600 fill-current" />
                              )}
                              {status === "locked" && (
                                <Lock className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            {isPrimary && (
                              <Badge className="bg-[#6B1B3D] text-white mb-2">Your Primary Phase</Badge>
                            )}
                            {isSecondary && (
                              <Badge className="bg-rose-500 text-white mb-2">Your Secondary Phase</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-[#6B1B3D]">{progress}%</div>
                            <div className="text-sm text-gray-500">{completed}/{total} modules</div>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4">{phase.description}</p>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <Progress value={progress} className="h-3" />
                        </div>

                        {/* Action Button */}
                        <Link to={createPageUrl("Classroom")}>
                          <button className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                            status === "locked" 
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : `bg-gradient-to-r ${phase.bgGradient} text-white hover:opacity-90`
                          }`}
                          disabled={status === "locked"}>
                            {status === "complete" ? "Review Modules" :
                             status === "in-progress" ? "Continue Learning" :
                             status === "current" ? "Start Phase" :
                             "Locked"}
                          </button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}