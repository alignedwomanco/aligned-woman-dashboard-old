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
  const [selectedPage, setSelectedPage] = useState(null);
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

  const { data: pages = [] } = useQuery({
    queryKey: ["modulePages", moduleId],
    queryFn: () => base44.entities.ModulePage.filter({ moduleId }, "order"),
    enabled: !!moduleId,
  });

  const { data: moduleProgress = [] } = useQuery({
    queryKey: ["moduleProgress", moduleId],
    queryFn: () => base44.entities.UserModuleProgress.filter({ moduleId }),
    enabled: !!moduleId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", moduleId],
    queryFn: () =>
      base44.entities.ModuleComment.filter(
        { moduleId },
        "-created_date"
      ),
    enabled: !!moduleId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ status, videoWatchedPercent }) => {
      const existing = moduleProgress[0];
      if (existing) {
        return base44.entities.UserModuleProgress.update(existing.id, {
          status,
          videoWatchedPercent: videoWatchedPercent || existing.videoWatchedPercent || 0,
        });
      } else {
        return base44.entities.UserModuleProgress.create({
          moduleId,
          status,
          videoWatchedPercent: videoWatchedPercent || 0,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moduleProgress"] });
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
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0]);
    }
  }, [pages]);

  const handleMarkComplete = async () => {
    const progress = moduleProgress[0];
    const watchedPercent = progress?.videoWatchedPercent || 0;

    if (watchedPercent >= 50) {
      await completeModule();
    }
  };

  const completeModule = async () => {
    updateProgressMutation.mutate({
      status: "Complete",
      videoWatchedPercent: 100,
    });

    // Award points for module completion
    await awardModuleCompletion();
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



  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({
      moduleId,
      comment: newComment,
      isQuestion: false,
    });
  };

  const currentProgress = moduleProgress[0] || { videoWatchedPercent: 0, status: "Available" };
  const overallProgress = currentProgress.videoWatchedPercent || 0;

  if (!module || !selectedPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6B1B3D] border-t-transparent rounded-full" />
      </div>
    );
  }

  const canMarkComplete = currentProgress.videoWatchedPercent >= 50;

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
          {/* Left Sidebar - Pages List */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Course Content</CardTitle>
                <Progress value={overallProgress} className="h-1.5" />
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-1 p-4">
                    {pages.map((page, idx) => {
                      return (
                        <button
                          key={page.id}
                          onClick={() => setSelectedPage(page)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedPage?.id === page.id
                              ? "bg-pink-50 border-2 border-[#6B1B3D]"
                              : "hover:bg-gray-50 border-2 border-transparent"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200">
                              <span className="text-xs text-gray-600">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[#4A1228] truncate">
                                {page.title}
                              </div>
                              {page.estimatedMinutes && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {page.estimatedMinutes} min
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
              key={selectedPage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div className="aspect-video bg-gray-900">
                  {selectedPage.videoUrl ? (
                    <iframe
                      src={selectedPage.videoUrl}
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
                <CardTitle>{selectedPage.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none" 
                  dangerouslySetInnerHTML={{ __html: selectedPage.content || '' }}
                />

                {/* Downloads */}
                {selectedPage.downloads && selectedPage.downloads.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-[#4A1228] mb-3 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Downloads
                    </h3>
                    <div className="space-y-2">
                      {selectedPage.downloads.map((download, idx) => (
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
                      <span className="text-gray-600">Video Progress</span>
                      <span className="font-medium">
                        {currentProgress.videoWatchedPercent}%
                      </span>
                    </div>
                    <Progress value={currentProgress.videoWatchedPercent} className="h-2" />
                  </div>

                  {/* Simulate video progress */}
                  {currentProgress.status !== "Complete" && currentProgress.videoWatchedPercent < 100 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPercent = Math.min(currentProgress.videoWatchedPercent + 25, 100);
                        updateProgressMutation.mutate({
                          status: newPercent >= 100 ? "Complete" : "InProgress",
                          videoWatchedPercent: newPercent,
                        });
                      }}
                      className="w-full text-xs"
                    >
                      Simulate +25% Watch Progress
                    </Button>
                  )}
                </div>

                {!canMarkComplete && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-800">
                      ⏳ Watch at least 50% of the video to unlock completion
                    </p>
                  </div>
                )}

                {canMarkComplete && currentProgress.status !== "Complete" && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <input
                        type="checkbox"
                        id="complete-checkbox"
                        className="w-4 h-4 text-green-600 rounded"
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleMarkComplete();
                          }
                        }}
                      />
                      <label htmlFor="complete-checkbox" className="text-sm text-green-900 cursor-pointer">
                        I've completed this module
                      </label>
                    </div>
                  </div>
                )}

                {currentProgress.status === "Complete" && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <span className="text-sm font-medium text-green-700">
                      ✓ Module Completed
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Button */}
            {(() => {
              const currentIndex = pages.findIndex(p => p.id === selectedPage.id);
              const nextPage = pages[currentIndex + 1];
              return nextPage ? (
                <Button
                  className="w-full bg-[#6B1B3D] hover:bg-[#4A1228] text-white"
                  onClick={() => setSelectedPage(nextPage)}
                >
                  Next Lesson →
                </Button>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] text-white"
                  onClick={() => navigate(createPageUrl("Classroom"))}
                >
                  Back to Classroom
                </Button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}