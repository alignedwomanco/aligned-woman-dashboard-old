import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Eye,
  Unlock,
  Target,
  Compass,
  Heart,
  Shield,
  Crown,
  Star,
  Lock,
} from "lucide-react";

const phases = [
  { key: "Awareness", icon: Eye, color: "from-blue-500 to-indigo-600", bgColor: "bg-blue-50" },
  { key: "Liberation", icon: Unlock, color: "from-purple-500 to-violet-600", bgColor: "bg-purple-50" },
  { key: "Intention", icon: Target, color: "from-[#6B1B3D] to-[#8B2E4D]", bgColor: "bg-pink-50" },
  { key: "VisionEmbodiment", icon: Compass, color: "from-rose-500 to-pink-600", bgColor: "bg-rose-50" },
];

export default function Blueprint() {
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

  const { data: blueprint } = useQuery({
    queryKey: ["blueprint"],
    queryFn: async () => {
      const blueprints = await base44.entities.Blueprint.list("-updated_date", 1);
      return blueprints[0] || null;
    },
  });

  // Mock data for display
  const blueprintData = {
    values: ["Authenticity", "Growth", "Connection", "Freedom", "Impact"],
    boundaries: [
      "I don't respond to work messages after 7pm",
      "I say no to commitments that drain my energy",
      "I protect my morning routine",
    ],
    goals: [
      "Build sustainable career without burnout",
      "Develop regulated nervous system",
      "Create aligned income streams",
    ],
    identity: {
      old: "The overachiever who must earn rest",
      new: "The grounded leader who trusts her pace",
    },
  };

  const phaseProgress = {
    Awareness: 60,
    Liberation: 30,
    Intention: 10,
    VisionEmbodiment: 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">Your Blueprint</h1>
          <p className="text-gray-600">
            Your evolving personal operating system. Updated as you grow.
          </p>
        </motion.div>

        {/* Diagnostic Summary */}
        {diagnosticSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <Card className="bg-gradient-to-br from-[#6B1B3D] to-[#4A1228] border-0 overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-rose-300" />
                    <span className="text-rose-200 font-medium">Your ALIVE Profile</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Primary Phase</p>
                      <p className="text-2xl font-bold text-white">
                        {diagnosticSession.primaryPhase}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Secondary Phase</p>
                      <p className="text-2xl font-bold text-white">
                        {diagnosticSession.secondaryPhase}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Current Capacity</p>
                      <p className="text-2xl font-bold text-white">
                        {diagnosticSession.capacityScore}/10
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Phase Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#6B1B3D]" />
                Phase Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                {phases.map((phase, index) => {
                  const progress = phaseProgress[phase.key];
                  const PhaseIcon = phase.icon;
                  return (
                    <div
                      key={phase.key}
                      className={`${phase.bgColor} rounded-2xl p-5 text-center`}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${phase.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                        <PhaseIcon className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-medium text-gray-700 mb-2">
                        {phase.key === "VisionEmbodiment" ? "Vision" : phase.key}
                      </p>
                      <Progress value={progress} className="h-2 mb-2" />
                      <p className="text-sm text-gray-500">{progress}%</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Identity Shift */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#6B1B3D]" />
                  Identity Evolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-sm text-gray-500 mb-1">Releasing</p>
                  <p className="text-gray-700 italic line-through">
                    {blueprintData.identity.old}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-100">
                  <p className="text-sm text-[#6B1B3D] mb-1">Becoming</p>
                  <p className="text-[#4A1228] font-medium">
                    {blueprintData.identity.new}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Core Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#6B1B3D]" />
                  Core Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {blueprintData.values.map((value, i) => (
                    <Badge
                      key={i}
                      className="bg-pink-100 text-[#6B1B3D] border-pink-200 border px-4 py-2"
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Boundaries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#6B1B3D]" />
                  Active Boundaries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {blueprintData.boundaries.map((boundary, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#C67793] rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{boundary}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#6B1B3D]" />
                  Current Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {blueprintData.goals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#6B1B3D] rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{goal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Locked Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-10"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="opacity-60">
              <CardContent className="p-8 text-center">
                <Lock className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  Financial Blueprint
                </h3>
                <p className="text-sm text-gray-400">
                  Complete Intention modules to unlock
                </p>
              </CardContent>
            </Card>
            <Card className="opacity-60">
              <CardContent className="p-8 text-center">
                <Lock className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  Leadership Blueprint
                </h3>
                <p className="text-sm text-gray-400">
                  Complete Vision modules to unlock
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}