import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Wrench,
  Clock,
  Eye,
} from "lucide-react";

// Mock module data
const moduleData = {
  id: "1",
  title: "Nervous System Regulation",
  phase: "Awareness",
  duration: 45,
  videoUrl: "https://www.youtube.com/embed/SDKOedKFSf4",
  summary: "Learn how your system responds to stress, and how to return to safety without forcing yourself.",
  outcomes: [
    "Identify your stress response pattern",
    "Name your earliest warning signs",
    "Use two regulation tools in real time",
  ],
  lessonText: `
    Your nervous system is not your enemy. It is doing exactly what it was designed to do: keep you safe.

    When you understand how your system works, you stop fighting yourself and start working with your biology.

    The autonomic nervous system has two main branches:
    
    **Sympathetic** - Your activation response (fight or flight)
    **Parasympathetic** - Your rest and restoration response (rest and digest)

    Neither is good or bad. Both are necessary. The goal is not to be calm all the time — it is to be able to return to safety when you need to.

    Most women are stuck in chronic low-grade activation. Not full panic, but never fully at rest either.

    The first step is simply noticing: Where do you feel stress in your body? How does activation show up for you?
  `,
  toolUnlocks: ["Regulation Toolkit"],
};

export default function ModulePlayer() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lesson");
  const [videoProgress, setVideoProgress] = useState(65);
  const [assessmentStarted, setAssessmentStarted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("MyPathway")}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 border mb-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Awareness
                </Badge>
                <h1 className="text-xl font-bold text-[#4A1228]">{moduleData.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {moduleData.duration} min
              </span>
              <Progress value={videoProgress} className="w-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div className="aspect-video bg-gray-900">
                  <iframe
                    src={moduleData.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Card>
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white border w-full justify-start">
                  <TabsTrigger value="lesson" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Lesson
                  </TabsTrigger>
                  <TabsTrigger value="assessment" className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    Assessment
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Tools
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="lesson" className="mt-6">
                  <Card>
                    <CardContent className="p-8">
                      <div className="prose prose-lg prose-pink max-w-none">
                        {moduleData.lessonText.split('\n').map((paragraph, i) => {
                          if (paragraph.trim().startsWith('**')) {
                            const text = paragraph.replace(/\*\*/g, '');
                            return <p key={i} className="font-semibold text-[#4A1228]">{text}</p>;
                          }
                          return <p key={i} className="text-gray-700">{paragraph}</p>;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assessment" className="mt-6">
                  <Card>
                    <CardContent className="p-8">
                      {!assessmentStarted ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ClipboardCheck className="w-8 h-8 text-[#6B1B3D]" />
                          </div>
                          <h3 className="text-2xl font-bold text-[#4A1228] mb-4">
                            Integration Check
                          </h3>
                          <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            This is not a test. It is proof of readiness. Complete the assessment to unlock the next module and tools.
                          </p>
                          <Button
                            onClick={() => setAssessmentStarted(true)}
                            size="lg"
                            className="bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] text-white"
                          >
                            Begin Assessment
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600">Assessment interface would appear here...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tools" className="mt-6">
                  <Card>
                    <CardContent className="p-8">
                      <h3 className="text-lg font-bold text-[#4A1228] mb-4">
                        Tools Unlocked by This Module
                      </h3>
                      {moduleData.toolUnlocks.map((tool, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 bg-green-50 rounded-xl p-4 border border-green-200"
                        >
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Wrench className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-[#4A1228]">{tool}</h4>
                            <p className="text-sm text-gray-600">
                              Complete the assessment to unlock
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Learning Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {moduleData.outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[#4A1228] mb-2">Your Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Video</span>
                        <span className="font-medium">{videoProgress}%</span>
                      </div>
                      <Progress value={videoProgress} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Assessment</span>
                        <span className="font-medium">Not started</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                className="w-full bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] text-white"
                onClick={() => navigate(createPageUrl("MyPathway"))}
              >
                Back to Pathway
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}