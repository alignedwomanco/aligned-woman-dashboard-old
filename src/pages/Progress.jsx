import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import {
  TrendingUp,
  Calendar,
  BookOpen,
  Wrench,
  PenLine,
  Flame,
  Award,
  Target,
  Eye,
  Unlock,
  Compass,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// Mock data for charts
const checkInData = [
  { date: "Mon", energy: 6, mood: 7, capacity: 5 },
  { date: "Tue", energy: 5, mood: 6, capacity: 4 },
  { date: "Wed", energy: 7, mood: 7, capacity: 6 },
  { date: "Thu", energy: 6, mood: 5, capacity: 5 },
  { date: "Fri", energy: 8, mood: 8, capacity: 7 },
  { date: "Sat", energy: 7, mood: 8, capacity: 8 },
  { date: "Sun", energy: 6, mood: 7, capacity: 6 },
];

const stats = [
  { label: "Modules Completed", value: 3, icon: BookOpen, color: "text-blue-600", bgColor: "bg-blue-100" },
  { label: "Tools Unlocked", value: 5, icon: Wrench, color: "text-purple-600", bgColor: "bg-purple-100" },
  { label: "Journal Entries", value: 12, icon: PenLine, color: "text-pink-600", bgColor: "bg-pink-100" },
  { label: "Check-In Streak", value: 7, icon: Flame, color: "text-orange-600", bgColor: "bg-orange-100" },
];

const achievements = [
  { title: "First Week Complete", description: "Completed your first 7 days", unlocked: true },
  { title: "Regulation Master", description: "Used 10 regulation tools", unlocked: true },
  { title: "Journal Journey", description: "Wrote 10 journal entries", unlocked: true },
  { title: "Phase Pioneer", description: "Complete all Awareness modules", unlocked: false },
  { title: "Liberation Leader", description: "Complete all Liberation modules", unlocked: false },
];

const phaseProgress = [
  { phase: "Awareness", progress: 60, icon: Eye, color: "from-blue-500 to-indigo-600" },
  { phase: "Liberation", progress: 30, icon: Unlock, color: "from-purple-500 to-violet-600" },
  { phase: "Intention", progress: 10, icon: Target, color: "from-[#6B1B3D] to-[#8B2E4D]" },
  { phase: "Vision", progress: 0, icon: Compass, color: "from-rose-500 to-pink-600" },
];

export default function Progress() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">Your Progress</h1>
          <p className="text-gray-600">
            Track your journey through the ALIVE Method and celebrate your growth.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {stats.map((stat, index) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-[#4A1228] mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          {/* Check-In Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#6B1B3D]" />
                  Weekly Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={checkInData}>
                      <defs>
                        <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="energy"
                        stroke="#EAB308"
                        fillOpacity={1}
                        fill="url(#colorEnergy)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="#22C55E"
                        fillOpacity={1}
                        fill="url(#colorMood)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="capacity"
                        stroke="#3B82F6"
                        fillOpacity={1}
                        fill="url(#colorCapacity)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-sm text-gray-600">Energy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-600">Mood</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-sm text-gray-600">Capacity</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Phase Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#6B1B3D]" />
                  Phase Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {phaseProgress.map((phase, index) => {
                  const PhaseIcon = phase.icon;
                  return (
                    <div key={phase.phase}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${phase.color} rounded-xl flex items-center justify-center`}>
                            <PhaseIcon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-[#4A1228]">{phase.phase}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {phase.progress}%
                        </span>
                      </div>
                      <ProgressBar value={phase.progress} className="h-3" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#6B1B3D]" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`text-center p-5 rounded-2xl border-2 transition-all ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-pink-50 to-white border-[#6B1B3D]/20"
                        : "bg-gray-50 border-gray-100 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        achievement.unlocked
                          ? "bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D]"
                          : "bg-gray-200"
                      }`}
                    >
                      <Award
                        className={`w-7 h-7 ${
                          achievement.unlocked ? "text-white" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <h3
                      className={`font-medium mb-1 ${
                        achievement.unlocked ? "text-[#4A1228]" : "text-gray-400"
                      }`}
                    >
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-gray-500">{achievement.description}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}