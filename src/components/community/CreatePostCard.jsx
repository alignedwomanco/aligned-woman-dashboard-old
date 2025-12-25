import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image, Video, Smile, Hash } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { base44 } from "@/api/base44Client";
import confetti from "canvas-confetti";

export default function CreatePostCard({ currentUser, onPostCreated }) {
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [hashtags, setHashtags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsUploading(true);
    
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return file_url;
        })
      );
      setMediaUrls([...mediaUrls, ...uploadedUrls]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      const hashtagArray = hashtags
        .split(/[\s,]+/)
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.slice(1));

      await onPostCreated({
        content,
        media_urls: mediaUrls,
        hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
      });

      // Award points for posting
      await awardPoints(10, "post_created");

      // Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Reset form
      setContent("");
      setMediaUrls([]);
      setHashtags("");
    } catch (error) {
      console.error("Post failed:", error);
    } finally {
      setIsPosting(false);
    }
  };

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
      } else {
        await base44.entities.UserPoints.create({
          points,
          level: 1,
        });
      }

      // Update user's community points
      await base44.auth.updateMe({
        total_community_points: ((currentUser.total_community_points || 0) + points),
        last_active_community_date: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to award points:", error);
    }
  };

  const removeMedia = (index) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  return (
    <Card className="shadow-sm border-2 border-gray-100">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Avatar className="w-12 h-12 ring-2 ring-purple-500/20">
            <AvatarImage src={currentUser?.profile_picture} />
            <AvatarFallback className="bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] text-white">
              {currentUser?.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <ReactQuill
              value={content}
              onChange={setContent}
              placeholder={`What's on your mind, ${currentUser?.full_name?.split(' ')[0] || 'there'}?`}
              className="bg-white rounded-lg"
              modules={{
                toolbar: [
                  ["bold", "italic", "underline"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link"],
                ],
              }}
            />

            {/* Media Preview */}
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {mediaUrls.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden">
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hashtags Input */}
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="Add hashtags (e.g., #wellness #growth)"
              className="text-sm"
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex gap-2">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    disabled={isUploading}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Photo"}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  <Hash className="w-4 h-4 mr-2" />
                  Tag
                </Button>
              </div>

              <Button
                onClick={handlePost}
                disabled={!content.trim() || isPosting}
                className="bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] hover:from-[#4A1228] hover:to-[#6B1B3D] text-white font-medium px-6"
              >
                {isPosting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}