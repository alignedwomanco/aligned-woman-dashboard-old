import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageSquare, Pin, Trash2, Send } from "lucide-react";
import { motion } from "framer-motion";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function Community() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [sortBy, setSortBy] = useState("new");
  const [commentingOnPost, setCommentingOnPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ["communityPosts", sortBy],
    queryFn: async () => {
      const allPosts = await base44.entities.CommunityPost.list("-created_date");
      if (sortBy === "top") {
        return allPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      }
      return allPosts;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: likes = [] } = useQuery({
    queryKey: ["postLikes"],
    queryFn: () => base44.entities.PostLike.filter({ commentId: null }),
    initialData: [],
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["postComments"],
    queryFn: () => base44.entities.PostComment.list("-created_date"),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (content) => base44.entities.CommunityPost.create({ content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      setNewPostContent("");
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId) => {
      const existingLike = likes.find(l => l.postId === postId && l.created_by === currentUser.email);
      if (existingLike) {
        await base44.entities.PostLike.delete(existingLike.id);
        await base44.entities.CommunityPost.update(postId, { 
          likes: Math.max(0, (posts.find(p => p.id === postId)?.likes || 0) - 1) 
        });
      } else {
        await base44.entities.PostLike.create({ postId });
        await base44.entities.CommunityPost.update(postId, { 
          likes: (posts.find(p => p.id === postId)?.likes || 0) + 1 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      queryClient.invalidateQueries({ queryKey: ["postLikes"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }) => base44.entities.PostComment.create({ postId, content }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["postComments"] });
      const post = posts.find(p => p.id === variables.postId);
      base44.entities.CommunityPost.update(variables.postId, { 
        commentCount: (post?.commentCount || 0) + 1 
      });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      setCommentingOnPost(null);
      setCommentText("");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.CommunityPost.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const getUserByEmail = (email) => {
    return users.find(u => u.email === email);
  };

  const hasLiked = (postId) => {
    return likes.some(l => l.postId === postId && l.created_by === currentUser?.email);
  };

  const getPostComments = (postId) => {
    return comments.filter(c => c.postId === postId && !c.parentCommentId);
  };

  const isAdmin = currentUser && ["admin", "master_admin", "moderator"].includes(currentUser.role);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Create Post */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentUser?.profile_picture} />
                <AvatarFallback className="bg-[#6B1B3D] text-white">
                  {currentUser?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <ReactQuill
                  value={newPostContent}
                  onChange={setNewPostContent}
                  placeholder="Share something with the community..."
                  className="mb-4"
                  modules={{
                    toolbar: [
                      ["bold", "italic", "underline"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                    ],
                  }}
                />
                <Button
                  onClick={() => createPostMutation.mutate(newPostContent)}
                  disabled={!newPostContent.trim() || createPostMutation.isLoading}
                  className="bg-[#6B1B3D] hover:bg-[#4A1228]"
                >
                  Post
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sort Tabs */}
        <Tabs value={sortBy} onValueChange={setSortBy}>
          <TabsList>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="top">Top</TabsTrigger>
          </TabsList>

          <TabsContent value={sortBy} className="space-y-4 mt-6">
            {posts.map((post) => {
              const author = getUserByEmail(post.created_by);
              const postComments = getPostComments(post.id);
              const isLiked = hasLiked(post.id);

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={author?.profile_picture} />
                            <AvatarFallback className="bg-[#6B1B3D] text-white">
                              {author?.full_name?.[0] || post.created_by[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{author?.full_name || post.created_by}</p>
                            <div className="flex items-center gap-2">
                              {author?.role && ["admin", "expert", "moderator"].includes(author.role) && (
                                <Badge className="bg-[#6B1B3D] text-white text-xs">
                                  {author.role}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(post.created_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {(isAdmin || post.created_by === currentUser?.email) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePostMutation.mutate(post.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Post Content */}
                      <div
                        className="prose prose-sm max-w-none mb-4"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />

                      {/* Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t">
                        <button
                          onClick={() => likePostMutation.mutate(post.id)}
                          className={`flex items-center gap-2 text-sm transition-colors ${
                            isLiked ? "text-[#6B1B3D]" : "text-gray-600 hover:text-[#6B1B3D]"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                          <span>{post.likes || 0}</span>
                        </button>

                        <button
                          onClick={() => setCommentingOnPost(commentingOnPost === post.id ? null : post.id)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#6B1B3D] transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentCount || 0}</span>
                        </button>
                      </div>

                      {/* Comments */}
                      {postComments.length > 0 && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {postComments.map((comment) => {
                            const commentAuthor = getUserByEmail(comment.created_by);
                            return (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={commentAuthor?.profile_picture} />
                                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                    {commentAuthor?.full_name?.[0] || comment.created_by[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm font-medium">{commentAuthor?.full_name || comment.created_by}</p>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Comment Input */}
                      {commentingOnPost === post.id && (
                        <div className="mt-4 pt-4 border-t flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={currentUser?.profile_picture} />
                            <AvatarFallback className="bg-[#6B1B3D] text-white text-xs">
                              {currentUser?.full_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Write a comment..."
                              className="min-h-[60px]"
                            />
                            <Button
                              onClick={() => commentMutation.mutate({ postId: post.id, content: commentText })}
                              disabled={!commentText.trim()}
                              size="icon"
                              className="bg-[#6B1B3D] hover:bg-[#4A1228]"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {posts.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
                  <p>No posts yet. Be the first to share!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}