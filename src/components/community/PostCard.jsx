import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Trash2, 
  Send,
  MoreHorizontal,
  Flag,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function PostCard({
  post,
  currentUser,
  author,
  isLiked,
  comments,
  onLike,
  onComment,
  onDelete,
  onShare,
  getUserByEmail,
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const isAdmin = currentUser && ["admin", "master_admin", "moderator"].includes(currentUser.role);
  const isAuthor = post.created_by === currentUser?.email;

  const handleComment = () => {
    if (commentText.trim()) {
      onComment({ postId: post.id, content: commentText, parentCommentId: replyingTo });
      setCommentText("");
      setReplyingTo(null);
    }
  };

  const getReplies = (commentId) => {
    return comments.filter(c => c.parentCommentId === commentId);
  };

  const topLevelComments = comments.filter(c => !c.parentCommentId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3 flex-1">
              <Avatar 
                className="w-12 h-12 cursor-pointer ring-2 ring-purple-500/20" 
                onClick={() => window.location.href = createPageUrl("Members") + `?user=${author?.email}`}
              >
                <AvatarImage src={author?.profile_picture} />
                <AvatarFallback className="bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] text-white">
                  {author?.full_name?.[0] || post.created_by[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p 
                    className="font-semibold text-gray-900 hover:text-[#6B1B3D] cursor-pointer"
                    onClick={() => window.location.href = createPageUrl("Members") + `?user=${author?.email}`}
                  >
                    {author?.full_name || post.created_by}
                  </p>
                  {author?.level && author.level > 1 && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                      Level {author.level}
                    </Badge>
                  )}
                  {author?.role && ["admin", "expert", "moderator"].includes(author.role) && (
                    <Badge className="bg-[#6B1B3D] text-white text-xs">
                      {author.role}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{moment(post.created_date).fromNow()}</span>
                  {post.reshared_from_post_id && (
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3 h-3" />
                      Reshared
                    </span>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(isAdmin || isAuthor) && (
                  <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save Post
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <div
              className="prose prose-sm max-w-none mb-3"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            {/* Media Gallery */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className={`grid gap-2 rounded-xl overflow-hidden ${
                post.media_urls.length === 1 ? 'grid-cols-1' :
                post.media_urls.length === 2 ? 'grid-cols-2' :
                'grid-cols-2'
              }`}>
                {post.media_urls.slice(0, 4).map((url, idx) => (
                  <div key={idx} className="relative aspect-square bg-gray-100">
                    <img 
                      src={url} 
                      alt={`Media ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                    {idx === 3 && post.media_urls.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold">
                        +{post.media_urls.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.hashtags.map((tag, idx) => (
                  <span key={idx} className="text-sm text-[#6B1B3D] hover:underline cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center gap-4 pb-3 mb-3 border-b text-sm text-gray-600">
            {post.likes > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 fill-[#6B1B3D] text-[#6B1B3D]" />
                {post.likes}
              </span>
            )}
            {post.commentCount > 0 && (
              <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
            )}
            {post.shareCount > 0 && (
              <span>{post.shareCount} {post.shareCount === 1 ? 'share' : 'shares'}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id)}
              className={`justify-center ${
                isLiked 
                  ? "text-[#6B1B3D] hover:text-[#6B1B3D]/80" 
                  : "text-gray-600 hover:text-[#6B1B3D]"
              }`}
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
              Like
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="justify-center text-gray-600 hover:text-[#6B1B3D]"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Comment
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(post)}
              className="justify-center text-gray-600 hover:text-[#6B1B3D]"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t space-y-4"
              >
                {/* Comment Input */}
                <div className="flex gap-3">
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
                      placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleComment();
                        }
                      }}
                    />
                    <Button
                      onClick={handleComment}
                      disabled={!commentText.trim()}
                      size="icon"
                      className="bg-[#6B1B3D] hover:bg-[#4A1228] flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {topLevelComments.map((comment) => {
                    const commentAuthor = getUserByEmail(comment.created_by);
                    const replies = getReplies(comment.id);
                    
                    return (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex gap-3 group">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={commentAuthor?.profile_picture} />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                              {commentAuthor?.full_name?.[0] || comment.created_by[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3 group-hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium">{commentAuthor?.full_name || comment.created_by}</p>
                                <span className="text-xs text-gray-500">{moment(comment.created_date).fromNow()}</span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-1 ml-2">
                              <button className="text-xs text-gray-600 hover:text-[#6B1B3D] font-medium">
                                Like {comment.likes > 0 && `(${comment.likes})`}
                              </button>
                              <button 
                                onClick={() => setReplyingTo(comment.id)}
                                className="text-xs text-gray-600 hover:text-[#6B1B3D] font-medium"
                              >
                                Reply
                              </button>
                            </div>

                            {/* Nested Replies */}
                            {replies.length > 0 && (
                              <div className="ml-6 mt-3 space-y-2">
                                {replies.map((reply) => {
                                  const replyAuthor = getUserByEmail(reply.created_by);
                                  return (
                                    <div key={reply.id} className="flex gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarImage src={replyAuthor?.profile_picture} />
                                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                          {replyAuthor?.full_name?.[0] || reply.created_by[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="bg-gray-50 rounded-lg p-2">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="text-xs font-medium">{replyAuthor?.full_name || reply.created_by}</p>
                                            <span className="text-xs text-gray-500">{moment(reply.created_date).fromNow()}</span>
                                          </div>
                                          <p className="text-xs text-gray-700">{reply.content}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}