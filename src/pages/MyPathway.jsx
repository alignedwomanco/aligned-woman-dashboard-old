import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lock,
  CheckCircle,
  Play,
  Clock,
  Eye,
  Unlock,
  Target,
  Compass,
  ArrowRight,
} from "lucide-react";

const phaseIcons = {
  Awareness: Eye,
  Liberation: Unlock,
  Intention: Target,
  VisionEmbodiment: Compass,
};

const phaseColors = {
  Awareness: "from-blue-500 to-indigo-600",
  Liberation: "from-purple-500 to-violet-600",
  Intention: "from-[#6B1B3D] to-[#8B2E4D]",
  VisionEmbodiment: "from-rose-500 to-pink-600",
};

const phaseBgColors = {
  Awareness: "bg-blue-50 border-blue-100",
  Liberation: "bg-purple-50 border-purple-100",
  Intention: "bg-pink-50 border-pink-100",
  VisionEmbodiment: "bg-rose-50 border-rose-100",
};

// Mock pathway data - in real app, this would come from the diagnostic
const pathwayModules = [
  { id: "1", title: "Nervous System Regulation", phase: "Awareness", duration: 45, status: "Complete" },
  { id: "2", title: "Understanding Burnout", phase: "Awareness", duration: 30, status: "InProgress" },
  { id: "3", title: "Hormones and The Female Body", phase: "Awareness", duration: 40, status: "Available" },
  { id: "4", title: "Nutrition for Women", phase: "Awareness", duration: 35, status: "Locked" },
  { id: "5", title: "Movement and The Body", phase: "Awareness", duration: 30, status: "Locked" },
  { id: "6", title: "Releasing Shame", phase: "Liberation", duration: 45, status: "Locked" },
  { id: "7", title: "People Pleasing Patterns", phase: "Liberation", duration: 40, status: "Locked" },
  { id: "8", title: "Trauma and The Body", phase: "Liberation", duration: 50, status: "Locked" },
  { id: "9", title: "Inner Child Work", phase: "Liberation", duration: 45, status: "Locked" },
  { id: "10", title: "Reclaiming Intuition", phase: "Liberation", duration: 35, status: "Locked" },
  { id: "11", title: "Money Mindset", phase: "Intention", duration: 40, status: "Locked" },
  { id: "12", title: "Financial Literacy", phase: "Intention", duration: 45, status: "Locked" },
  { id: "13", title: "Career Strategy", phase: "Intention", duration: 40, status: "Locked" },
];

export default function MyPathway() {
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

  const getStatusStyles = (status) => {
    switch (status) {
      case "Complete":
        return {
          icon: CheckCircle,
          iconColor: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          badge: "bg-green-100 text-green-700",
        };
      case "InProgress":
        return {
          icon: Play,
          iconColor: "text-[#6B1B3D]",
          bgColor: "bg-white",
          borderColor: "border-[#6B1B3D] border-2",
          badge: "bg-pink-100 text-[#6B1B3D]",
        };
      case "Available":
        return {
          icon: Play,
          iconColor: "text-gray-400",
          bgColor: "bg-white",
          borderColor: "border-gray-200",
          badge: "bg-gray-100 text-gray-600",
        };
      default:
        return {
          icon: Lock,
          iconColor: "text-gray-300",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-100",
          badge: "bg-gray-100 text-gray-400",
        };
    }
  };

  const groupedModules = pathwayModules.reduce((acc, module) => {
    if (!acc[module.phase]) acc[module.phase] = [];
    acc[module.phase].push(module);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">Your Modules</h1>
          <p className="text-gray-600">
            This is prescribed learning. You are not here to binge content. You are here to integrate.
          </p>
        </motion.div>

        {/* Pathway */}
        <div className="space-y-8">
          {Object.entries(groupedModules).map(([phase, modules], phaseIndex) => {
            const PhaseIcon = phaseIcons[phase];
            return (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: phaseIndex * 0.1 }}
              >
                <div className={`rounded-3xl p-6 ${phaseBgColors[phase]} border`}>
                  {/* Phase Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${phaseColors[phase]} rounded-xl flex items-center justify-center`}>
                      <PhaseIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#4A1228]">
                        {phase === "VisionEmbodiment" ? "Vision & Embodiment" : phase}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {modules.filter(m => m.status === "Complete").length} of {modules.length} complete
                      </p>
                    </div>
                  </div>

                  {/* Modules List */}
                  <div className="space-y-3">
                    {modules.map((module, index) => {
                      const styles = getStatusStyles(module.status);
                      const StatusIcon = styles.icon;
                      const isClickable = module.status !== "Locked";

                      return (
                        <motion.div
                          key={module.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: phaseIndex * 0.1 + index * 0.05 }}
                        >
                          {isClickable ? (
                            <Link to={createPageUrl("ModulePlayer") + `?id=${module.id}`}>
                              <Card className={`${styles.bgColor} ${styles.borderColor} border hover:shadow-md transition-all cursor-pointer`}>
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${module.status === "Complete" ? "bg-green-100" : "bg-gray-100"}`}>
                                      <StatusIcon className={`w-5 h-5 ${styles.iconColor}`} />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className={`font-medium ${module.status === "Locked" ? "text-gray-400" : "text-[#4A1228]"}`}>
                                        {module.title}
                                      </h3>
                                      <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          {module.duration} min
                                        </span>
                                        <Badge className={styles.badge}>
                                          {module.status === "InProgress" ? "In Progress" : module.status}
                                        </Badge>
                                      </div>
                                    </div>
                                    {isClickable && (
                                      <ArrowRight className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ) : (
                            <Card className={`${styles.bgColor} ${styles.borderColor} border opacity-60`}>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                                    <StatusIcon className={`w-5 h-5 ${styles.iconColor}`} />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-400">
                                      {module.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                      Complete the previous assessment to unlock
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}