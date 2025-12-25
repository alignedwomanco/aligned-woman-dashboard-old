import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Award } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Feed */}
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#4A1228] mb-1">Community</h1>
                <p className="text-gray-600">Connect, share, and grow together</p>
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              >
                <Award className="w-4 h-4" />
                Leaderboard
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, people, hashtags..."
                className="pl-10 h-12 bg-white border-2"
              />
            </div>

            {/* Create Post */}
            <CreatePostCard 
              currentUser={currentUser} 
              onPostCreated={(data) => createPostMutation.mutate(data)}
            />

            {/* Sort Tabs */}
            <Tabs value={sortBy} onValueChange={setSortBy}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="new" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  New
                </TabsTrigger>
                <TabsTrigger value="top" className="gap-2">
                  <Award className="w-4 h-4" />
                  Top
                </TabsTrigger>
              </TabsList>

              <TabsContent value={sortBy} className="space-y-4 mt-6">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
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
                ))}

                {filteredPosts.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center text-gray-500">
                      <p className="text-lg">
                        {searchQuery ? "No posts found matching your search" : "No posts yet. Be the first to share!"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <CommunityLeaderboard currentUser={currentUser} />
          </div>
        </div>
      </div>
    </div>
  );
}