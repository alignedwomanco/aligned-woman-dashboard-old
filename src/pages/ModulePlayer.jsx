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
} from "lucide-react";

export default function ModulePlayer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("moduleId");
  const courseId = searchParams.get("courseId");
  const [selectedPage, setSelectedPage] = useState(null);
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: module } = useQuery({
    queryKey: ["courseModule", moduleId],
    queryFn: async () => {
      const modules = await base44.entities.CourseModule.filter({ id: moduleId });
      return modules[0];
    },
    enabled: !!moduleId,
  });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ["coursePages", moduleId],
    queryFn: () => base44.entities.CoursePage.filter({ moduleId }, "order"),
    enabled: !!moduleId,
  });

  const { data: moduleProgress = [] } = useQuery({
    queryKey: ["courseProgress", moduleId],
    queryFn: () => base44.entities.CourseProgress.filter({ moduleId }),
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
    mutationFn: async ({ status, progressPercentage }) => {
      const existing = moduleProgress[0];
      if (existing) {
        return base44.entities.CourseProgress.update(existing.id, {
          status,
          progressPercentage: progressPercentage || existing.progressPercentage || 0,
        });
      } else {
        return base44.entities.CourseProgress.create({
          courseId,
          moduleId,
          status,
          progressPercentage: progressPercentage || 0,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseProgress"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment) => base44.entities.ModuleComment.create(comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setNewComment("");
    },
  });

  const togglePageCompleteMutation = useMutation({
    mutationFn: async ({ pageId, isComplete }) => {
      const existing = moduleProgress.find(p => p.pageId === pageId);
      if (existing) {
        return base44.entities.CourseProgress.update(existing.id, {
          status: isComplete ? "completed" : "in_progress",
          progressPercentage: isComplete ? 100 : existing.progressPercentage,
        });
      } else {
        return base44.entities.CourseProgress.create({
          courseId,
          moduleId,
          pageId,
          status: isComplete ? "completed" : "in_progress",
          progressPercentage: isComplete ? 100 : 0,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseProgress"] });
    },
  });

  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0]);
    }
  }, [pages]);

  const handleTogglePageComplete = async () => {
    const pageProgress = moduleProgress.find(p => p.pageId === selectedPage.id);
    const isCurrentlyComplete = pageProgress?.status === "completed" || false;
    
    await togglePageCompleteMutation.mutateAsync({
      pageId: selectedPage.id,
      isComplete: !isCurrentlyComplete,
    });

    // If marking as complete and it's the last page, complete the module
    if (!isCurrentlyComplete) {
      const allPagesCompleted = pages.every(page => {
        if (page.id === selectedPage.id) return true;
        const progress = moduleProgress.find(p => p.pageId === page.id);
        return progress?.status === "completed";
      });

      if (allPagesCompleted) {
        await completeModule();
      }
    }
  };

  const completeModule = async () => {
    updateProgressMutation.mutate({
      status: "completed",
      progressPercentage: 100,
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

  const currentProgress = moduleProgress[0] || { progressPercentage: 0, status: "not_started" };
  const overallProgress = currentProgress.progressPercentage || 0;

  if (!module || !selectedPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6B1B3D] border-t-transparent rounded-full" />
      </div>
    );
  }

  const canMarkComplete = currentProgress.progressPercentage >= 50;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to={createPageUrl("Classroom")} className="flex-shrink-0">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="min-w-0">
                {course && (
                  <Badge className="bg-[#F5E8EE] text-[#6E1D40] border-[#DEBECC] border mb-1 max-w-full">
                    <Eye className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{course.title}</span>
                  </Badge>
                )}
                <h1 className="text-base sm:text-xl font-bold text-[#4A1228] break-words">{module?.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <span className="text-sm text-gray-500 items-center gap-1 hidden sm:flex">
                <Clock className="w-4 h-4" />
                {module.durationMinutes} min
              </span>
              <Progress value={overallProgress} className="w-20 sm:w-32" />
              <span className="text-sm font-medium text-[#6B1B3D]">{overallProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 overflow-hidden">
          {/* Left Sidebar - Pages List & Resources */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Course Content</CardTitle>
                <Progress value={overallProgress} className="h-1.5" />
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-1 p-4">
                    {pages.map((page, idx) => {
                      const pageProgress = moduleProgress.find(p => p.pageId === page.id);
                      const isCompleted = pageProgress?.status === "completed" || false;
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
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? "bg-green-100" : "bg-gray-200"
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <span className="text-xs text-gray-600">{idx + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[#4A1228] break-words">
                                {page.title}
                              </div>
                              {page.videoDuration && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {Math.round(page.videoDuration / 60)} min
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

            {/* Resources Section */}
            {selectedPage.downloads && selectedPage.downloads.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedPage.downloads.map((download, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Download className="w-4 h-4 text-[#6B1B3D] flex-shrink-0" />
                        <span className="text-sm font-medium text-[#4A1228] truncate">
                          {download.name}
                        </span>
                      </div>
                      <a
                        href={download.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2"
                      >
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Video Player */}
            <motion.div
              key={selectedPage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div style={{ paddingTop: '56.25%', position: 'relative' }} className="bg-gray-900">
                  {selectedPage.videoUrl ? (
                    (() => {
                      const url = selectedPage.videoUrl.trim();
                      
                      // YouTube — use thumbnail + link (iframe embeds get Error 153 in sandboxed environments)
                      if (url.includes('youtube.com') || url.includes('youtu.be')) {
                        let videoId = null;
                        try {
                          if (url.includes('youtu.be')) {
                            videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0];
                          } else {
                            videoId = new URL(url).searchParams.get('v');
                          }
                        } catch (e) {
                          const match = url.match(/[?&]v=([^&#]+)/);
                          videoId = match ? match[1] : null;
                        }
                        if (videoId) {
                          return (
                            <a
                              href={`https://www.youtube.com/watch?v=${videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-0 left-0 w-full h-full group"
                            >
                              <img
                                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                alt="Video thumbnail"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }}
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                              </div>
                              <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                                ▶ Watch on YouTube
                              </div>
                            </a>
                          );
                        }
                      }
                      
                      // Google Drive
                      let embedUrl = url;
                      if (url.includes('drive.google.com')) {
                        const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] || url.match(/[-\w]{25,}/)?.[0];
                        if (fileId) embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                      }
                      // Wistia
                      else if (url.includes('wistia.com')) {
                        const videoId = url.match(/medias\/([a-zA-Z0-9]+)/)?.[1] || url.split('/').pop();
                        embedUrl = `https://fast.wistia.net/embed/iframe/${videoId}`;
                      }
                      
                      // For Google Drive, Wistia, and other URLs — use iframe
                      return (
                        <iframe
                          src={embedUrl}
                          className="absolute top-0 left-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          style={{ border: 0 }}
                        />
                      );
                    })()
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white">
                      No video available
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Lesson Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle>{selectedPage.title}</CardTitle>
                {(() => {
                  const pageProgress = moduleProgress.find(p => p.pageId === selectedPage.id);
                  const isPageComplete = pageProgress?.status === "completed" || false;
                    
                    return (
                      <Button
                        onClick={handleTogglePageComplete}
                        variant={isPageComplete ? "outline" : "default"}
                        className={isPageComplete ? "border-green-600 text-green-600 hover:bg-green-50" : "bg-green-600 hover:bg-green-700 text-white"}
                      >
                        <span className="font-medium">{isPageComplete ? "Completed" : "Mark Complete"}</span>
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </Button>
                    );
                  })()}
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none" 
                  dangerouslySetInnerHTML={{ __html: selectedPage.content || '' }}
                />
              </CardContent>
            </Card>

            {/* Next/Complete Actions */}
            <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100">
              <CardContent className="p-6">
                <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
}