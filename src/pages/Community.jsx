import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Award, Plus, MessageSquare } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import CreatePostCard from "../components/community/CreatePostCard";
import PostCard from "../components/community/PostCard";
import CommunityLeaderboard from "../components/community/CommunityLeaderboard";
import confetti from "canvas-confetti";

export default function Community() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [sortBy, setSortBy] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
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
    queryFn: () => base44.entities.PostLike.filter({}),
    initialData: [],
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["postComments"],
    queryFn: () => base44.entities.PostComment.list("-created_date"),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.CommunityPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId) => {
      const existingLike = likes.find(l => l.postId === postId && l.created_by === currentUser.email);
      const post = posts.find(p => p.id === postId);
      
      if (existingLike) {
        await base44.entities.PostLike.delete(existingLike.id);
        await base44.entities.CommunityPost.update(postId, { 
          likes: Math.max(0, (post?.likes || 0) - 1) 
        });
      } else {
        await base44.entities.PostLike.create({ postId });
        await base44.entities.CommunityPost.update(postId, { 
          likes: (post?.likes || 0) + 1 
        });
        
        // Award points for engagement
        await awardPoints(2, "post_liked");
        
        // Notify post author
        if (post.created_by !== currentUser.email) {
          await base44.entities.Notification.create({
            type: "like",
            message: `${currentUser.full_name} liked your post`,
            linkTo: `/community?post=${postId}`,
            source_user_email: currentUser.email,
            target_post_id: postId,
            created_by: post.created_by,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      queryClient.invalidateQueries({ queryKey: ["postLikes"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, content, parentCommentId }) => {
      const comment = await base44.entities.PostComment.create({ 
        postId, 
        content,
        parentCommentId 
      });
      
      const post = posts.find(p => p.id === postId);
      await base44.entities.CommunityPost.update(postId, { 
        commentCount: (post?.commentCount || 0) + 1 
      });

      // Award points
      await awardPoints(5, "comment_created");

      // Notify post author
      if (post.created_by !== currentUser.email) {
        await base44.entities.Notification.create({
          type: "comment",
          message: `${currentUser.full_name} commented on your post`,
          linkTo: `/community?post=${postId}`,
          source_user_email: currentUser.email,
          target_post_id: postId,
          target_comment_id: comment.id,
          created_by: post.created_by,
        });
      }

      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postComments"] });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.CommunityPost.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const sharePostMutation = useMutation({
    mutationFn: async (post) => {
      await base44.entities.CommunityPost.create({
        content: `Reshared from ${getUserByEmail(post.created_by)?.full_name || post.created_by}`,
        reshared_from_post_id: post.id,
        media_urls: post.media_urls,
        hashtags: post.hashtags,
      });

      await base44.entities.CommunityPost.update(post.id, {
        shareCount: (post.shareCount || 0) + 1,
      });

      // Award points
      await awardPoints(3, "post_shared");

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const awardPoints = async (points, reason) => {
    try {
      const userPoints = await base44.entities.UserPoints.filter({});
      const current = userPoints[0];
      
      if (current) {
        const newTotal = (current.points || 0) + points;
        await base44.entities.UserPoints.update(current.id, {
          points: newTotal,
          level: Math.floor(newTotal / 100) + 1,
        });
      }

      await base44.auth.updateMe({
        total_community_points: ((currentUser.total_community_points || 0) + points),
      });
    } catch (error) {
      console.error("Failed to award points:", error);
    }
  };

  const getUserByEmail = (email) => {
    return users.find(u => u.email === email);
  };

  const hasLiked = (postId) => {
    return likes.some(l => l.postId === postId && l.created_by === currentUser?.email);
  };

  const getPostComments = (postId) => {
    return comments.filter(c => c.postId === postId);
  };

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      post.content.toLowerCase().includes(searchLower) ||
      post.hashtags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      getUserByEmail(post.created_by)?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6B1B3D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: currentUser?.background_image?.startsWith('#') ? currentUser.background_image : 'transparent' }}>
      {currentUser?.background_image && !currentUser.background_image.startsWith('#') && (
        <div 
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: currentUser.background_image.startsWith('data:image/svg+xml') 
              ? `url("${currentUser.background_image}")`
              : `url(${currentUser.background_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        />
      )}
      {/* Header Bar */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10"
        style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Community
          </h1>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20"
            >
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">
                {currentUser?.total_community_points || 0} pts
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto pb-20">
        {/* Stories Bar */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 py-4 border-b border-gray-200"
        >
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {users.slice(0, 8).map((user, idx) => (
              <motion.div
                key={user.email}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: idx * 0.05, type: "spring" }}
                className="flex-shrink-0 text-center"
              >
                <div className="w-16 h-16 rounded-full p-0.5 mb-1" style={{ background: `linear-gradient(to top right, var(--theme-primary, #3C224F), var(--theme-secondary, #5B2E84))` }}>
                  <div className="w-full h-full rounded-full bg-white/90 p-0.5">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={user.profile_picture} />
                      <AvatarFallback className="text-white text-xs" style={{ backgroundColor: 'var(--theme-primary, #3C224F)' }}>
                        {user.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <p className="text-xs text-gray-700 truncate w-16">{user.full_name?.split(" ")[0]}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 py-3"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, people, #tags..."
              className="pl-12 h-11 bg-white/90 border-gray-200 rounded-full"
            />
          </div>
        </motion.div>

        {/* Sort Pills */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 py-2 flex gap-2"
        >
          <Button
            onClick={() => setSortBy("new")}
            variant="ghost"
            size="sm"
            className={`rounded-full ${
              sortBy === "new"
                ? "text-white"
                : "bg-white/90 text-gray-700 hover:bg-white"
            }`}
            style={sortBy === "new" ? { backgroundColor: 'var(--theme-secondary, #5B2E84)' } : {}}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Latest
          </Button>
          <Button
            onClick={() => setSortBy("top")}
            variant="ghost"
            size="sm"
            className={`rounded-full ${
              sortBy === "top"
                ? "text-white"
                : "bg-white/90 text-gray-700 hover:bg-white"
            }`}
            style={sortBy === "top" ? { backgroundColor: 'var(--theme-secondary, #5B2E84)' } : {}}
          >
            <Award className="w-4 h-4 mr-1" />
            Popular
          </Button>
        </motion.div>

        {/* Create Post Quick Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="px-4 py-3"
        >
          <CreatePostCard 
            currentUser={currentUser} 
            onPostCreated={(data) => createPostMutation.mutate(data)}
          />
        </motion.div>

        {/* Feed */}
        <div className="space-y-0 border-t border-gray-200">
          {filteredPosts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
            >
              <PostCard
                post={post}
                currentUser={currentUser}
                author={getUserByEmail(post.created_by)}
                isLiked={hasLiked(post.id)}
                comments={getPostComments(post.id)}
                onLike={likePostMutation.mutate}
                onComment={commentMutation.mutate}
                onDelete={deletePostMutation.mutate}
                onShare={(post) => sharePostMutation.mutate(post)}
                getUserByEmail={getUserByEmail}
              />
            </motion.div>
          ))}

          {filteredPosts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center"
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)', opacity: 0.2 }}>
                <Search className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-gray-600">
                {searchQuery ? "No posts found" : "Be the first to share!"}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-white/10 z-40"
        style={{ backgroundColor: 'var(--theme-primary, #3C224F)' }}
      >
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-around">
          <Button variant="ghost" size="icon" className="text-white">
            <TrendingUp className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <Search className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full hover:scale-110 transition-transform"
            style={{ background: `linear-gradient(to right, var(--theme-primary, #3C224F), var(--theme-secondary, #5B2E84))` }}
            onClick={() => document.querySelector('.ql-editor')?.focus()}
          >
            <Plus className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <MessageSquare className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white" onClick={() => window.location.href = createPageUrl("ProfileSettings")}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={currentUser?.profile_picture} />
              <AvatarFallback className="text-white text-xs" style={{ backgroundColor: 'var(--theme-primary, #3C224F)' }}>
                {currentUser?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}