import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export const BACKGROUND_OPTIONS = [
  { id: "none", label: "No Background", url: null },
  { id: "abstract1", label: "Pink Flow", url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&q=80" },
  { id: "abstract2", label: "Rose Gradient", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80" },
  { id: "abstract3", label: "Coral Wave", url: "https://images.unsplash.com/photo-1557672199-6987e0a1d6e4?w=1920&q=80" },
  { id: "abstract4", label: "Purple Mist", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80" },
  { id: "abstract5", label: "Blush Abstract", url: "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=1920&q=80" },
  { id: "abstract6", label: "Sunset Bloom", url: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=1920&q=80" },
  { id: "abstract7", label: "Mauve Dream", url: "https://images.unsplash.com/photo-1620503374956-c942862f0372?w=1920&q=80" },
  { id: "abstract8", label: "Feminine Flow", url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1920&q=80" },
  { id: "abstract9", label: "Rose Smoke", url: "https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=1920&q=80" },
  { id: "abstract10", label: "Pink Whisper", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1920&q=80" },
  { id: "abstract11", label: "Coral Embrace", url: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1920&q=80" },
];

export default function BackgroundSelector({ currentBackground, onBackgroundChange }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ background_image: file_url });
      onBackgroundChange(file_url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Background Image</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {BACKGROUND_OPTIONS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => onBackgroundChange(bg.url)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all h-24 ${
                currentBackground === bg.url
                  ? "border-[#601735] ring-2 ring-[#601735]/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {bg.url ? (
                <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center text-xs text-gray-500">
                  None
                </div>
              )}
              {currentBackground === bg.url && (
                <div className="absolute inset-0 bg-[#601735]/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white drop-shadow" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2 text-center">
                {bg.label}
              </div>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Label htmlFor="bg-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors border border-pink-200">
              <Upload className="w-4 h-4 text-[#601735]" />
              <span className="text-sm font-medium text-[#601735]">
                {isUploading ? "Uploading..." : "Upload Custom Background"}
              </span>
            </div>
            <Input
              id="bg-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}