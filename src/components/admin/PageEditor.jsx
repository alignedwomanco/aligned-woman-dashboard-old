import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Upload, Youtube, Film, X, Loader2 } from "lucide-react";

export default function PageEditor({ open, onOpenChange, page, moduleId }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    videoUrl: "",
    requireCompletion: false,
    estimatedMinutes: 0,
    order: 0,
    moduleId: moduleId || "",
    downloads: [],
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (page) {
      setFormData(page);
    } else {
      setFormData({
        title: "",
        content: "",
        videoUrl: "",
        requireCompletion: false,
        estimatedMinutes: 0,
        order: 0,
        moduleId: moduleId || "",
        downloads: [],
      });
    }
  }, [page, open, moduleId]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (page) {
        return base44.entities.ModulePage.update(page.id, data);
      } else {
        return base44.entities.ModulePage.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["modulePages"]);
      onOpenChange(false);
    },
  });

  const [videoUploading, setVideoUploading] = useState(false);

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      alert("File size must be under 500MB");
      return;
    }
    setVideoUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData((prev) => ({ ...prev, videoUrl: file_url }));
    setVideoUploading(false);
  };

  const handleResourceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const newDownload = {
      name: file.name,
      url: file_url,
    };
    setFormData({
      ...formData,
      downloads: [...(formData.downloads || []), newDownload],
    });
  };

  const removeDownload = (index) => {
    const newDownloads = formData.downloads.filter((_, i) => i !== index);
    setFormData({ ...formData, downloads: newDownloads });
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      ["bold", "italic", "strike"],
      ["code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote"],
      ["link", "image", "video"],
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? "Edit Page" : "Add Page"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Page Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Module 1. Nervous System Regulation"
            />
          </div>

          <div>
            <Label>Page Type</Label>
            <select
              value={formData.pageType || "video"}
              onChange={(e) => setFormData({ ...formData, pageType: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="video">Video</option>
              <option value="text">Text Only</option>
            </select>
          </div>

          {/* Video Source Preview */}
          {formData.videoUrl && (
            <div className="relative rounded-lg overflow-hidden bg-gray-900" style={{ paddingTop: '56.25%' }}>
              {(() => {
                const url = formData.videoUrl.trim();
                // YouTube — playable embed
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                  let videoId = null;
                  try {
                    if (url.includes('youtu.be')) videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0];
                    else videoId = new URL(url).searchParams.get('v');
                  } catch (e) {
                    const match = url.match(/[?&]v=([^&#]+)/);
                    videoId = match ? match[1] : null;
                  }
                  if (videoId) return (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      style={{ border: 0 }}
                    />
                  );
                }
                // Google Drive / Docs — playable embed
                if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
                  const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] || url.match(/[-\w]{25,}/)?.[0];
                  if (fileId) return <iframe src={`https://drive.google.com/file/d/${fileId}/preview`} className="absolute top-0 left-0 w-full h-full" allow="autoplay; fullscreen" allowFullScreen style={{ border: 0 }} />;
                }
                // Direct video file
                return <video src={url} controls className="absolute top-0 left-0 w-full h-full" />;
              })()}
              <button onClick={() => setFormData({ ...formData, videoUrl: "" })} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 z-10">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* YouTube URL */}
          <div>
            <Label className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-600" />
              YouTube URL
            </Label>
            <Input
              value={formData.videoUrl?.includes('youtube.com') || formData.videoUrl?.includes('youtu.be') ? formData.videoUrl : ''}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-1"
            />
          </div>

          {/* Google Drive / Video URL */}
          <div>
            <Label className="flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-600" />
              Google Drive / Video URL
            </Label>
            <p className="text-xs text-gray-500 mb-1">Paste a Google Drive share link or any other video URL</p>
            <Input
              value={formData.videoUrl && !formData.videoUrl.includes('youtube.com') && !formData.videoUrl.includes('youtu.be') && !formData.videoUrl.startsWith('https://qtrypzzcjebvfcihiynt') ? formData.videoUrl : ''}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://drive.google.com/file/d/... or any video URL"
              className="mt-1"
            />
          </div>

          {/* Upload Video */}
          <div>
            <Label className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#6B1B3D]" />
              Upload Video
            </Label>
            <p className="text-xs text-gray-500 mb-1">Max 500MB • MP4, MOV, WebM</p>
            <Label htmlFor="video-upload" className="cursor-pointer block mt-1">
              <div className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed transition-colors ${videoUploading ? 'bg-gray-50 border-gray-300' : 'bg-pink-50 hover:bg-pink-100 border-pink-300'}`}>
                {videoUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-[#6B1B3D] animate-spin" />
                    <span className="text-sm text-[#6B1B3D]">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#6B1B3D]" />
                    <span className="text-sm text-[#6B1B3D]">Click to upload video file</span>
                  </>
                )}
              </div>
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
                disabled={videoUploading}
              />
            </Label>
          </div>

          <div>
            <Label>Content</Label>
            <div className="mt-2 bg-white rounded-lg border">
              <ReactQuill
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                modules={modules}
                theme="snow"
                placeholder="Write your lesson content here..."
                className="h-64"
              />
            </div>
          </div>

          <div>
            <Label>Resources & Downloads</Label>
            <p className="text-xs text-gray-600 mb-2">Upload PDFs, worksheets, or other resources for students</p>
            <div className="space-y-2">
              {formData.downloads?.map((download, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{download.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDownload(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Label htmlFor="resource-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors border border-dashed border-pink-300">
                  <Upload className="w-4 h-4 text-[#6B1B3D]" />
                  <span className="text-sm text-[#6B1B3D]">Upload Resource</span>
                </div>
                <Input
                  id="resource-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                  className="hidden"
                  onChange={handleResourceUpload}
                />
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estimated Minutes</Label>
              <Input
                type="number"
                value={formData.estimatedMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedMinutes: parseInt(e.target.value),
                  })
                }
                min={0}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label>Require Completion</Label>
                <p className="text-xs text-gray-600">Must complete before next</p>
              </div>
              <Switch
                checked={formData.requireCompletion}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireCompletion: checked })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Published</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.title}
                className="bg-[#6B1B3D] hover:bg-[#4A1228]"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}