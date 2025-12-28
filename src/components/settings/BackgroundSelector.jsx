import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export const BACKGROUND_OPTIONS = [
  { id: "purple1", label: "Purple Mist", type: "color", value: "#F3E8FF" },
  { id: "lavender1", label: "Lavender", type: "color", value: "#E9D5FF" },
  { id: "pink1", label: "Pink Blush", type: "color", value: "#FEF5F9" },
  { id: "rose1", label: "Rose", type: "color", value: "#FFE4E6" },
  { id: "peach1", label: "Peach", type: "color", value: "#FFF7ED" },
  { id: "mint1", label: "Mint", type: "color", value: "#F0FDF4" },
  { id: "sky1", label: "Sky", type: "color", value: "#F0F9FF" },
  { id: "neutral1", label: "Neutral", type: "color", value: "#F9FAFB" },
  { 
    id: "pattern1", 
    label: "Purple Gradient", 
    type: "svg",
    value: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#2F1B3E;stop-opacity:1" /><stop offset="100%" style="stop-color:#482C83;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad1)"/><circle cx="85%" cy="30%" r="200" fill="rgba(72, 44, 131, 0.3)"/><circle cx="15%" cy="70%" r="150" fill="rgba(72, 44, 131, 0.2)"/></svg>`
  },
  { 
    id: "pattern2", 
    label: "Purple Waves", 
    type: "svg",
    value: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#F3E8FF;stop-opacity:1" /><stop offset="100%" style="stop-color:#E9D5FF;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad2)"/><path d="M0,100 Q250,50 500,100 T1000,100 T1500,100 T2000,100 V200 H0 Z" fill="rgba(147, 51, 234, 0.15)"/></svg>`
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
    // Immediately apply the background
    if (selectedBackground && selectedBackground.startsWith('#')) {
      document.body.style.backgroundColor = selectedBackground;
      document.body.style.backgroundImage = "none";
    } else if (selectedBackground && selectedBackground.startsWith('data:image/svg+xml')) {
      document.body.style.backgroundImage = `url("${selectedBackground}")`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundColor = "transparent";
    } else if (selectedBackground) {
      document.body.style.backgroundImage = `url(${selectedBackground})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundColor = "transparent";
    }
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
                  ? "border-[#2F1B3E] ring-2 ring-[#2F1B3E]/20"
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
                <div className="absolute inset-0 bg-[#2F1B3E]/20 flex items-center justify-center">
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
              <Upload className="w-4 h-4 text-[#2F1B3E]" />
              <span className="text-sm font-medium text-[#2F1B3E]">
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
            className="w-full bg-[#2F1B3E] hover:bg-[#482C83]"
            disabled={isUploading}
          >
            Save Background
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}