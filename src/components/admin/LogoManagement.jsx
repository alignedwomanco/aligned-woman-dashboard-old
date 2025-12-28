import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Save } from "lucide-react";

export default function LogoManagement() {
  const [isUploading, setIsUploading] = useState({});
  const queryClient = useQueryClient();

  const { data: siteSettings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: async () => {
      const settings = await base44.entities.SiteSettings.list();
      return settings[0] || null;
    },
  });

  const [logos, setLogos] = useState({
    light_logo: siteSettings?.light_logo || "",
    dark_logo: siteSettings?.dark_logo || "",
    light_favicon: siteSettings?.light_favicon || "",
    dark_favicon: siteSettings?.dark_favicon || "",
  });

  React.useEffect(() => {
    if (siteSettings) {
      setLogos({
        light_logo: siteSettings.light_logo || "",
        dark_logo: siteSettings.dark_logo || "",
        light_favicon: siteSettings.light_favicon || "",
        dark_favicon: siteSettings.dark_favicon || "",
      });
    }
  }, [siteSettings]);

  const handleUpload = async (field, file) => {
    if (!file) return;
    
    setIsUploading({ ...isUploading, [field]: true });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogos({ ...logos, [field]: file_url });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading({ ...isUploading, [field]: false });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (siteSettings) {
        await base44.entities.SiteSettings.update(siteSettings.id, data);
      } else {
        await base44.entities.SiteSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
  });

  const logoFields = [
    { key: "light_logo", label: "Light Logo", description: "Used on light backgrounds (dark purple logo)" },
    { key: "dark_logo", label: "Dark Logo", description: "Used on dark backgrounds (white logo)" },
    { key: "light_favicon", label: "Light Favicon", description: "Favicon for light theme (dark icon)" },
    { key: "dark_favicon", label: "Dark Favicon", description: "Favicon for dark theme (white icon)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo Management</CardTitle>
        <p className="text-gray-600 text-sm">Upload and manage site logos and favicons</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {logoFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <p className="text-xs text-gray-500">{field.description}</p>
            
            {logos[field.key] && (
              <div className="mb-2">
                <img
                  src={logos[field.key]}
                  alt={field.label}
                  className={`h-16 object-contain ${field.key.includes('favicon') ? 'w-16' : 'w-auto'} bg-gray-100 p-2 rounded`}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={logos[field.key]}
                onChange={(e) => setLogos({ ...logos, [field.key]: e.target.value })}
                placeholder="https://... or upload below"
                className="flex-1"
              />
              <Label htmlFor={`upload-${field.key}`} className="cursor-pointer">
                <Button type="button" variant="outline" disabled={isUploading[field.key]} asChild>
                  <div>
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading[field.key] ? "Uploading..." : "Upload"}
                  </div>
                </Button>
                <Input
                  id={`upload-${field.key}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(field.key, e.target.files[0])}
                />
              </Label>
            </div>
          </div>
        ))}

        <Button
          onClick={() => saveMutation.mutate(logos)}
          className="w-full bg-[#3D2250] hover:bg-[#5B2E84] text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Logo Settings
        </Button>
      </CardContent>
    </Card>
  );
}