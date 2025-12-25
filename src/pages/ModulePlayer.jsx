import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  Download,
  MessageCircle,
  Send,
  Check,
  Trophy,
} from "lucide-react";
import QuizSection from "@/components/classroom/QuizSection";

export default function ModulePlayer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("id");
  const [selectedSubModule, setSelectedSubModule] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const queryClient = useQueryClient();

  const { data: module } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: async () => {
      const modules = await base44.entities.Module.filter({ id: moduleId });
      return modules[0];
    },
    enabled: !!moduleId,
  });

  const { data: subModules = [] } = useQuery({
    queryKey: ["subModules", moduleId],
    queryFn: () => base44.entities.SubModule.filter({ moduleId }, "order"),
    enabled: !!moduleId,
  });

  const { data: subModuleProgress = [] } = useQuery({
    queryKey: ["subModuleProgress", moduleId],
    queryFn: () => base44.entities.SubModuleProgress.filter({ moduleId }),
    enabled: !!moduleId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", selectedSubModule?.id],
    queryFn: () =>
      base44.entities.ModuleComment.filter(
        { subModuleId: selectedSubModule.id },
        "-created_date"
      ),
    enabled: !!selectedSubModule,
  });

  const { data: quiz } = useQuery({
    queryKey: ["quiz", selectedSubModule?.id],
    queryFn: async () => {
      const quizzes = await base44.entities.Quiz.filter({ subModuleId: selectedSubModule.id });
      return quizzes[0] || null;
    },
    enabled: !!selectedSubModule,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["quizAttempts", selectedSubModule?.id],
    queryFn: () => base44.entities.QuizAttempt.filter({ subModuleId: selectedSubModule.id }),
    enabled: !!selectedSubModule,
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ subModuleId, watchedPercent, isComplete }) =>
      base44.entities.SubModuleProgress.create({
        subModuleId,
        moduleId,
        watchedPercent,
        isComplete,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subModuleProgress"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment) => base44.entities.ModuleComment.create(comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setNewComment("");
    },
  });

  useEffect(() => {
    if (subModules.length > 0 && !selectedSubModule) {
      setSelectedSubModule(subModules[0]);
    }
  }, [subModules]);

  const handleMarkComplete = async () => {
    const progress = subModuleProgress.find(
      (p) => p.subModuleId === selectedSubModule.id
    );
    const watchedPercent = progress?.watchedPercent || 0;

    if (watchedPercent >= 50) {
      // Check if there's a quiz
      if (quiz && !quizCompleted) {
        setShowQuiz(true);
      } else {
        await completeSubModule();
      }
    }
  };

  const completeSubModule = async () => {
    updateProgressMutation.mutate({
      subModuleId: selectedSubModule.id,
      watchedPercent: 100,
      isComplete: true,
    });

    // Check if all sub-modules are complete
    const allComplete = subModules.every((sm) => {
      if (sm.id === selectedSubModule.id) return true;
      const prog = subModuleProgress.find((p) => p.subModuleId === sm.id);
      return prog?.isComplete;
    });

    if (allComplete) {
      // Award points for module completion
      await awardModuleCompletion();
    }
  };

  const awardModuleCompletion = async () => {
    try {
      const pointsRecords = await base44.entities.UserPoints.filter({});
      const currentPoints = pointsRecords[0];
      
      const modulePoints = 50; // Base points for module completion
      const streakBonus = (currentPoints?.currentStreak || 0) >= 3 ? 5 : 0;
      const totalPoints = (currentPoints?.points || 0) + modulePoints + streakBonus;
      const newLevel = Math.floor(totalPoints / 100) + 1;

      if (currentPoints) {
        await base44.entities.UserPoints.update(currentPoints.id, {
          points: totalPoints,
          level: newLevel,
          lastActivityDate: new Date().toISOString().split('T')[0],
        });
      } else {
        await base44.entities.UserPoints.create({
          points: totalPoints,
          level: newLevel,
          lastActivityDate: new Date().toISOString().split('T')[0],
        });
      }

      // Award badge for module completion
      await base44.entities.UserBadge.create({
        badgeId: `module-${moduleId}`,
        badgeName: `${module.title} Complete`,
        badgeIcon: "🎓",
        earnedDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error awarding points:", error);
    }
  };

  const handleQuizComplete = async (result) => {
    try {
      // Save quiz attempt
      await base44.entities.QuizAttempt.create({
        quizId: quiz.id,
        subModuleId: selectedSubModule.id,
        moduleId,
        score: result.score,
        answers: result.answers,
        passed: result.passed,
        pointsEarned: result.pointsEarned,
      });

      // Award points
      if (result.passed) {
        const pointsRecords = await base44.entities.UserPoints.filter({});
        const currentPoints = pointsRecords[0];
        const totalPoints = (currentPoints?.points || 0) + result.pointsEarned;
        const newLevel = Math.floor(totalPoints / 100) + 1;

        if (currentPoints) {
          await base44.entities.UserPoints.update(currentPoints.id, {
            points: totalPoints,
            level: newLevel,
          });
        } else {
          await base44.entities.UserPoints.create({
            points: totalPoints,
            level: newLevel,
          });
        }
      }

      setQuizCompleted(true);
      setShowQuiz(false);
      await completeSubModule();
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({
      moduleId,
      subModuleId: selectedSubModule.id,
      comment: newComment,
      isQuestion: false,
    });
  };

  const getProgress = (subModuleId) => {
    const progress = subModuleProgress.find((p) => p.subModuleId === subModuleId);
    return progress || { watchedPercent: 0, isComplete: false };
  };

  const overallProgress =
    subModules.length > 0
      ? Math.round(
          (subModuleProgress.filter((p) => p.isComplete).length / subModules.length) * 100
        )
      : 0;

  if (!module || !selectedSubModule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6B1B3D] border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentProgress = getProgress(selectedSubModule.id);
  const canMarkComplete = currentProgress.watchedPercent >= 50;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("Classroom")}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 border mb-1">
                  <Eye className="w-3 h-3 mr-1" />
                  {module.phase}
                </Badge>
                <h1 className="text-xl font-bold text-[#4A1228]">{module.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {module.durationMinutes} min
              </span>
              <Progress value={overallProgress} className="w-32" />
              <span className="text-sm font-medium text-[#6B1B3D]">{overallProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Sub-modules List */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Course Content</CardTitle>
                <Progress value={overallProgress} className="h-1.5" />
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-1 p-4">
                    {subModules.map((subModule, idx) => {
                      const progress = getProgress(subModule.id);
                      return (
                        <button
                          key={subModule.id}
                          onClick={() => setSelectedSubModule(subModule)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedSubModule?.id === subModule.id
                              ? "bg-pink-50 border-2 border-[#6B1B3D]"
                              : "hover:bg-gray-50 border-2 border-transparent"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                progress.isComplete
                                  ? "bg-green-500"
                                  : "bg-gray-200"
                              }`}
                            >
                              {progress.isComplete ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <span className="text-xs text-gray-600">{idx + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[#4A1228] truncate">
                                {subModule.title}
                              </div>
                              {progress.watchedPercent > 0 && !progress.isComplete && (
                                <div className="mt-1">
                                  <Progress
                                    value={progress.watchedPercent}
                                    className="h-1"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 space-y-6">
            {/* Video Player */}
            <motion.div
              key={selectedSubModule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div className="aspect-video bg-gray-900">
                  {selectedSubModule.videoUrl ? (
                    <iframe
                      src={selectedSubModule.videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      No video available
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Lesson Content */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedSubModule.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedSubModule.lessonContent}
                  </p>
                </div>

                {/* Downloads */}
                {selectedSubModule.downloads && selectedSubModule.downloads.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-[#4A1228] mb-3 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Downloads
                    </h3>
                    <div className="space-y-2">
                      {selectedSubModule.downloads.map((download, idx) => (
                        <a
                          key={idx}
                          href={download.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                        >
                          <Download className="w-4 h-4 text-[#6B1B3D]" />
                          <span className="text-sm font-medium text-[#4A1228]">
                            {download.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Section */}
            {showQuiz && quiz && (
              <QuizSection
                quiz={quiz}
                onComplete={handleQuizComplete}
                onSkip={() => {
                  setShowQuiz(false);
                  completeSubModule();
                }}
              />
            )}

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="w-5 h-5" />
                  Questions & Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="flex gap-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ask a question or leave a comment..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddComment}
                      className="bg-[#6B1B3D] hover:bg-[#4A1228]"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator />

                  {/* Comments List */}
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-[#6B1B3D] rounded-full flex items-center justify-center text-white text-sm">
                              {comment.created_by?.[0]}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {comment.created_by}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Learning Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {module.outcomes?.map((outcome, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#4A1228] mb-4">Your Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Video</span>
                      <span className="font-medium">
                        {currentProgress.watchedPercent}%
                      </span>
                    </div>
                    <Progress value={currentProgress.watchedPercent} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Assessment</span>
                      <span className="font-medium">
                        {selectedSubModule.isAssessment ? "Current" : "Not started"}
                      </span>
                    </div>
                  </div>
                </div>

                {canMarkComplete && !currentProgress.isComplete && (
                  <Button
                    onClick={handleMarkComplete}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {quiz ? "Take Quiz & Complete" : "Mark as Complete"}
                  </Button>
                )}

                {quiz && quizAttempts.length > 0 && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Quiz Status</span>
                    </div>
                    <p className="text-xs text-purple-700">
                      Best Score: {Math.max(...quizAttempts.map(a => a.score))}%
                    </p>
                  </div>
                )}

                {currentProgress.isComplete && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <span className="text-sm font-medium text-green-700">
                      Completed
                    </span>
                  </div>
                )}

                {!canMarkComplete && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-800">
                      Watch at least 50% of the video to mark as complete
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] text-white"
              onClick={() => navigate(createPageUrl("Classroom"))}
            >
              Back to Classroom
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}