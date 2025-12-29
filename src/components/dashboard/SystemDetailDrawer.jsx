import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Heart, 
  Target, 
  Moon, 
  Sparkles, 
  ArrowRight,
  Clock,
  Play,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function SystemDetailDrawer({ 
  isOpen, 
  onClose, 
  system, 
  systemData,
  snapshotContext,
  currentUser,
  courses = []
}) {
  const [lauraiQuestion, setLauraiQuestion] = useState("");
  const [lauraiResponse, setLauraiResponse] = useState("");
  const [isLauraiThinking, setIsLauraiThinking] = useState(false);

  const systemConfig = {
    nervous_system: {
      icon: Heart,
      title: "My Nervous System",
      color: "from-pink-500 to-rose-600",
      quickPrompts: [
        "How do I regulate fast right now?",
        "Why am I in Fawn mode today?",
        "What should I say no to today?"
      ]
    },
    human_design: {
      icon: Target,
      title: "My Human Design",
      color: "from-purple-500 to-indigo-600",
      quickPrompts: [
        "How should I make decisions today?",
        "What's my best way to work today?",
        "Where am I forcing things?"
      ]
    },
    cycle: {
      icon: Moon,
      title: "My Cycle",
      color: "from-blue-500 to-cyan-600",
      quickPrompts: [
        "How should I train/work today in this phase?",
        "What should I eat today for this phase?",
        "Why is my motivation low?"
      ]
    },
    astrology: {
      icon: Sparkles,
      title: "My Astrology",
      color: "from-yellow-500 to-orange-600",
      quickPrompts: [
        "What is this transit teaching me?",
        "How do I use this energy productively?",
        "What should I avoid today?"
      ]
    }
  };

  const config = systemConfig[system] || systemConfig.nervous_system;
  const Icon = config.icon;

  const askLaurAI = async (question) => {
    if (!question.trim()) return;
    
    setIsLauraiThinking(true);
    setLauraiResponse("");
    
    try {
      const systemContextMap = {
        nervous_system: `Nervous System State: ${systemData.state}\nRecent Pattern: ${systemData.recentPattern || "Stable"}`,
        human_design: `Type: ${systemData.type}\nAuthority: ${systemData.authority}\nStrategy: ${systemData.strategy}`,
        cycle: `Phase: ${systemData.phase}\nDay: ${systemData.dayOfCycle || "Unknown"}\nCapacity: ${systemData.capacityGuidance}`,
        astrology: `Current Sign: ${systemData.currentSign}\nTheme: ${systemData.theme}\nEmotional Tone: ${systemData.emotionalTone}`
      };

      const contextPrompt = `You are LaurAI, focused on ${config.title}.

SYSTEM CONTEXT:
${systemContextMap[system]}

FULL SNAPSHOT CONTEXT:
- User: ${currentUser.full_name}
- Date: ${new Date().toLocaleDateString()}
- Cycle: ${snapshotContext.cyclePhase}
- Nervous System: ${snapshotContext.nervousSystemState}
- Capacity: ${snapshotContext.capacityScore}/10
- ALIVE Phase: ${snapshotContext.alivePhase}

USER QUESTION: "${question}"

RESPONSE REQUIREMENTS:
- Focus specifically on ${config.title}
- Reference their current state in this system
- Connect to today's snapshot when relevant
- Be warm, grounded, actionable (2-3 paragraphs)
- Make it feel personalized to TODAY`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt
      });
      
      setLauraiResponse(response);
    } catch (error) {
      console.error("LaurAI error:", error);
      setLauraiResponse("I'm having trouble connecting right now. Please try again.");
    } finally {
      setIsLauraiThinking(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setLauraiQuestion(question);
    askLaurAI(question);
  };

  const handleCustomQuestion = () => {
    askLaurAI(lauraiQuestion);
  };

  const getRecommendationReason = (course) => {
    const reasons = {
      nervous_system: systemData.state === "Fawn" ? "Support for current state" : "Build resilience",
      human_design: `Optimize your ${systemData.type} strategy`,
      cycle: `Perfect for ${systemData.phase} phase`,
      astrology: "Aligned with current transits"
    };
    return course.recommendationReason || reasons[system] || "Recommended for you";
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className={`w-16 h-16 bg-gradient-to-br ${config.color} rounded-2xl flex items-center justify-center mb-4`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <SheetTitle className="text-2xl">{config.title}</SheetTitle>
        </SheetHeader>

        {/* Current State Summary */}
        <Card className="mb-6 border-l-4" style={{ borderLeftColor: config.color.split(' ')[1] }}>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-3">Today's State</h3>
            <div className="space-y-3">
              {systemData.summary && (
                <p className="text-gray-700 leading-relaxed">{systemData.summary}</p>
              )}
              {systemData.guidance && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">Today's Guidance</p>
                  <p className="text-sm text-gray-700">{systemData.guidance}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* What Helps / What to Avoid */}
        {systemData.helps && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    What Helps Today
                  </h3>
                  <ul className="space-y-2">
                    {systemData.helps.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {systemData.avoid && (
                  <div>
                    <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      What to Avoid Today
                    </h3>
                    <ul className="space-y-2">
                      {systemData.avoid.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Tools */}
        {systemData.actions && (
          <div className="mb-6 flex gap-3">
            {systemData.actions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="flex-1"
                onClick={() => action.onClick?.()}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* LaurAI Chat */}
        <Card className="mb-6 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ask LaurAI</p>
                <p className="text-xs text-gray-600">Context-aware guidance for {config.title}</p>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="flex gap-2 flex-wrap mb-4">
              {config.quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(prompt)}
                  className="bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Custom Question */}
            <div className="flex gap-2 mb-4">
              <Input
                value={lauraiQuestion}
                onChange={(e) => setLauraiQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
                placeholder="Ask your own question..."
                className="flex-1 bg-white"
                disabled={isLauraiThinking}
              />
              <Button 
                onClick={handleCustomQuestion}
                disabled={isLauraiThinking || !lauraiQuestion.trim()}
                className={`bg-gradient-to-r ${config.color} text-white`}
              >
                {isLauraiThinking ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Response */}
            <AnimatePresence>
              {lauraiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-sm text-gray-900 whitespace-pre-line leading-relaxed">
                    {lauraiResponse}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Recommended Courses */}
        {courses.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4">Recommended for You</h3>
            <div className="space-y-3">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{course.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{getRecommendationReason(course)}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.durationMinutes || "15"} min
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {course.format || "Video"}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={`bg-gradient-to-r ${config.color} text-white`}
                        onClick={() => window.location.href = createPageUrl("ModulePlayer") + `?courseId=${course.id}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}