import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wrench,
  Lock,
  Eye,
  Unlock,
  Target,
  Compass,
  ArrowRight,
  Sparkles,
  Heart,
  Activity,
  Calendar,
  Apple,
  MessageSquare,
  DollarSign,
  Scale,
  Lightbulb,
  Crown,
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

const tools = [
  { id: "1", title: "Regulation Toolkit", phase: "Awareness", icon: Activity, purpose: "Quick regulation exercises to return to safety", unlocked: true },
  { id: "2", title: "Burnout Radar Check", phase: "Awareness", icon: Heart, purpose: "Assess your current burnout stage", unlocked: true },
  { id: "3", title: "Cycle and Capacity Planner", phase: "Awareness", icon: Calendar, purpose: "Plan your week around your cycle", unlocked: true },
  { id: "4", title: "Energy Stable Meal Builder", phase: "Awareness", icon: Apple, purpose: "Create meals that support stable energy", unlocked: false },
  { id: "5", title: "Movement Rhythm Builder", phase: "Awareness", icon: Activity, purpose: "Build a sustainable movement practice", unlocked: false },
  { id: "6", title: "Shame Release Journal", phase: "Liberation", icon: MessageSquare, purpose: "Process shame safely through writing", unlocked: false },
  { id: "7", title: "Boundary Script Builder", phase: "Liberation", icon: MessageSquare, purpose: "Create clear boundary statements", unlocked: false },
  { id: "8", title: "Grounding Library", phase: "Liberation", icon: Heart, purpose: "Safe grounding practices for dysregulation", unlocked: false },
  { id: "9", title: "Inner Child Dialogue Prompts", phase: "Liberation", icon: Heart, purpose: "Connect with your younger self", unlocked: false },
  { id: "10", title: "Decision Clarity Tool", phase: "Liberation", icon: Lightbulb, purpose: "Make decisions using your intuition filter", unlocked: false },
  { id: "11", title: "Money Story Rewriter", phase: "Intention", icon: DollarSign, purpose: "Identify and rewrite limiting money beliefs", unlocked: false },
  { id: "12", title: "Simple Budget Planner", phase: "Intention", icon: DollarSign, purpose: "Create a realistic financial plan", unlocked: false },
  { id: "13", title: "Career Clarity Map", phase: "Intention", icon: Target, purpose: "Define your next career chapter", unlocked: false },
  { id: "14", title: "Boundary Response Coach", phase: "Intention", icon: MessageSquare, purpose: "Practice boundary conversations", unlocked: false },
  { id: "15", title: "Advocacy Checklist", phase: "Intention", icon: Scale, purpose: "Know your rights and next steps", unlocked: false },
  { id: "16", title: "Identity Shift Tracker", phase: "VisionEmbodiment", icon: Crown, purpose: "Track your identity evolution", unlocked: false },
  { id: "17", title: "Voice and Visibility Planner", phase: "VisionEmbodiment", icon: Compass, purpose: "Build sustainable visibility", unlocked: false },
  { id: "18", title: "Aligned Blueprint Builder", phase: "VisionEmbodiment", icon: Sparkles, purpose: "Design your integrated life system", unlocked: false },
];

export default function ToolsHub() {
  const [activePhase, setActivePhase] = useState("all");

  const unlockedCount = tools.filter(t => t.unlocked).length;
  const filteredTools = tools.filter(t => activePhase === "all" || t.phase === activePhase);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">Tools Hub</h1>
          <p className="text-gray-600">
            Practical tools that unlock as you progress. {unlockedCount} of {tools.length} available.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {Object.entries(phaseIcons).map(([phase, Icon], index) => {
            const phaseTools = tools.filter(t => t.phase === phase);
            const unlockedPhaseTools = phaseTools.filter(t => t.unlocked).length;
            return (
              <Card key={phase} className="text-center">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${phaseColors[phase]} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    {phase === "VisionEmbodiment" ? "Vision" : phase}
                  </p>
                  <p className="text-lg font-bold text-[#4A1228]">
                    {unlockedPhaseTools}/{phaseTools.length}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Tabs value={activePhase} onValueChange={setActivePhase}>
            <TabsList className="bg-white border">
              <TabsTrigger value="all">All Tools</TabsTrigger>
              <TabsTrigger value="Awareness">Awareness</TabsTrigger>
              <TabsTrigger value="Liberation">Liberation</TabsTrigger>
              <TabsTrigger value="Intention">Intention</TabsTrigger>
              <TabsTrigger value="VisionEmbodiment">Vision</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => {
            const PhaseIcon = phaseIcons[tool.phase];
            const ToolIcon = tool.icon;

            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className={`h-full transition-all ${tool.unlocked ? "hover:shadow-lg cursor-pointer" : "opacity-60"}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${phaseColors[tool.phase]} rounded-2xl flex items-center justify-center`}>
                        <ToolIcon className="w-7 h-7 text-white" />
                      </div>
                      {tool.unlocked ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 border">
                          Available
                        </Badge>
                      ) : (
                        <Lock className="w-5 h-5 text-gray-300" />
                      )}
                    </div>

                    <h3 className={`text-lg font-bold mb-2 ${tool.unlocked ? "text-[#4A1228]" : "text-gray-400"}`}>
                      {tool.title}
                    </h3>

                    <p className={`text-sm mb-4 ${tool.unlocked ? "text-gray-600" : "text-gray-400"}`}>
                      {tool.purpose}
                    </p>

                    <div className="flex items-center gap-2">
                      <PhaseIcon className={`w-4 h-4 ${tool.unlocked ? "text-[#6B1B3D]" : "text-gray-400"}`} />
                      <span className={`text-sm ${tool.unlocked ? "text-gray-600" : "text-gray-400"}`}>
                        {tool.phase === "VisionEmbodiment" ? "Vision & Embodiment" : tool.phase}
                      </span>
                    </div>

                    {tool.unlocked && (
                      <Button
                        className="w-full mt-4 bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] text-white"
                      >
                        Open Tool
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    )}

                    {!tool.unlocked && (
                      <p className="text-xs text-gray-400 mt-4 text-center">
                        Complete more modules to unlock
                      </p>
                    )}
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