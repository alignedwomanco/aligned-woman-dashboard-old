import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export const BACKGROUND_OPTIONS = [
  { id: "pink1", label: "Soft Pink", type: "color", value: "#FEF5F9" },
  { id: "rose1", label: "Rose Blush", type: "color", value: "#FFF0F5" },
  { id: "lavender1", label: "Lavender Mist", type: "color", value: "#F8F4FF" },
  { id: "peach1", label: "Peachy Cream", type: "color", value: "#FFF5F0" },
  { id: "mint1", label: "Mint Whisper", type: "color", value: "#F0FFF8" },
  { id: "sky1", label: "Sky Softness", type: "color", value: "#F0F8FF" },
  { 
    id: "pattern1", 
    label: "Burgundy Circles", 
    type: "svg",
    value: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#601735;stop-opacity:1" /><stop offset="100%" style="stop-color:#4A1228;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad1)"/><circle cx="85%" cy="30%" r="200" fill="rgba(139, 46, 77, 0.3)"/><circle cx="15%" cy="70%" r="150" fill="rgba(139, 46, 77, 0.2)"/></svg>`
  },
  { 
    id: "pattern2", 
    label: "Rose Waves", 
    type: "svg",
    value: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#FFF0F5;stop-opacity:1" /><stop offset="100%" style="stop-color:#FFE4ED;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad2)"/><path d="M0,100 Q250,50 500,100 T1000,100 T1500,100 T2000,100 V200 H0 Z" fill="rgba(255, 182, 193, 0.2)"/></svg>`
  },
];

export default function BackgroundSelector({ currentBackground, onBackgroundChange }) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(currentBackground);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSelectedBackground(file_url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    await base44.auth.updateMe({ background_image: selectedBackground });
    onBackgroundChange(selectedBackground);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Background</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {BACKGROUND_OPTIONS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setSelectedBackground(bg.type === "color" ? bg.value : `data:image/svg+xml,${encodeURIComponent(bg.value)}`)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all h-20 ${
                selectedBackground === (bg.type === "color" ? bg.value : `data:image/svg+xml,${encodeURIComponent(bg.value)}`)
                  ? "border-[#601735] ring-2 ring-[#601735]/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {bg.type === "color" ? (
                <div className="w-full h-full" style={{ backgroundColor: bg.value }} />
              ) : (
                <div 
                  className="w-full h-full" 
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(bg.value)}")`,
                    backgroundSize: 'cover'
                  }} 
                />
              )}
              {selectedBackground === (bg.type === "color" ? bg.value : `data:image/svg+xml,${encodeURIComponent(bg.value)}`) && (
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

        <div className="pt-4 border-t space-y-3">
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

          <Button 
            onClick={handleSave} 
            className="w-full bg-[#601735] hover:bg-[#4A1228]"
            disabled={isUploading}
          >
            Save Background
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}