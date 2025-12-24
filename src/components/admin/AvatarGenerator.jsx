import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Upload, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function AvatarGenerator({ currentUser, onAvatarGenerated }) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [textPrompt, setTextPrompt] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImageUrl(file_url);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const generateFromText = async () => {
    if (!textPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Professional portrait avatar: ${textPrompt}`,
      });
      setGeneratedImage(result.url);
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromImage = async () => {
    if (!uploadedImageUrl) return;

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: "Transform this into a professional, artistic avatar portrait with vibrant colors and modern style",
        existing_image_urls: [uploadedImageUrl],
      });
      setGeneratedImage(result.url);
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const setAsProfilePicture = async () => {
    if (!generatedImage) return;

    try {
      await base44.auth.updateMe({ profile_picture: generatedImage });
      onAvatarGenerated(generatedImage);
      setOpen(false);
      setGeneratedImage(null);
      setTextPrompt("");
      setUploadedImageUrl(null);
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-[#6B1B3D] text-[#6B1B3D] hover:bg-pink-50">
          <Sparkles className="w-4 h-4 mr-2" />
          Avatar Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6B1B3D]" />
            AI Avatar Generator
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text Prompt</TabsTrigger>
            <TabsTrigger value="image">From Photo</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div>
              <Label>Describe your avatar</Label>
              <Textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="e.g., Professional woman with warm smile, wearing elegant blazer, soft lighting, artistic style..."
                className="min-h-[120px] mt-2"
              />
            </div>
            <Button
              onClick={generateFromText}
              disabled={!textPrompt.trim() || isGenerating}
              className="w-full bg-[#6B1B3D] hover:bg-[#4A1228]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Avatar
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div>
              <Label>Upload a photo</Label>
              <div className="mt-2 flex flex-col items-center gap-4">
                {uploadedImageUrl && (
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={uploadedImageUrl} />
                    <AvatarFallback>Preview</AvatarFallback>
                  </Avatar>
                )}
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors border-2 border-dashed border-pink-200">
                    <Upload className="w-4 h-4 text-[#6B1B3D]" />
                    <span className="text-sm font-medium text-[#6B1B3D]">
                      {uploadedImageUrl ? "Change Photo" : "Upload Photo"}
                    </span>
                  </div>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </Label>
              </div>
            </div>
            <Button
              onClick={generateFromImage}
              disabled={!uploadedImageUrl || isGenerating}
              className="w-full bg-[#6B1B3D] hover:bg-[#4A1228]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Avatar
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {generatedImage && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-center">
              <Label className="mb-3 block">Your Generated Avatar</Label>
              <Avatar className="w-40 h-40 mx-auto">
                <AvatarImage src={generatedImage} />
                <AvatarFallback>Avatar</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedImage(null);
                  setTextPrompt("");
                  setUploadedImageUrl(null);
                }}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={setAsProfilePicture}
                className="flex-1 bg-[#6B1B3D] hover:bg-[#4A1228]"
              >
                Set as Profile Picture
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}