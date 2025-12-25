import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, Save, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarGenerator from "@/components/admin/AvatarGenerator";
import BackgroundSelector from "@/components/settings/BackgroundSelector";
import { createPageUrl } from "@/utils";
import AdminMetricsContent from "@/components/admin/AdminMetricsContent";

export default function ProfileSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setProfileData({
        full_name: user.full_name,
        bio: user.bio || "",
      });
    };
    loadUser();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const restartOnboardingMutation = useMutation({
    mutationFn: async () => {
      const sessions = await base44.entities.DiagnosticSession.list();
      await Promise.all(sessions.map(session => base44.entities.DiagnosticSession.delete(session.id)));
    },
    onSuccess: () => {
      window.location.href = createPageUrl("OnboardingForm");
    },
  });

  const handleProfileUpdate = async () => {
    const formattedData = {
      ...profileData,
      full_name: profileData.full_name
        ?.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    };
    await updateProfileMutation.mutateAsync(formattedData);
    setCurrentUser({ ...currentUser, ...formattedData });
  };

  const handleProfilePicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ profile_picture: file_url });
    setCurrentUser({ ...currentUser, profile_picture: file_url });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6B1B3D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={currentUser.profile_picture} />
                    <AvatarFallback className="bg-[#6B1B3D] text-white text-2xl">
                      {currentUser.full_name?.[0] || currentUser.email?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="profile-pic" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors">
                          <Upload className="w-4 h-4 text-[#6B1B3D]" />
                          <span className="text-sm font-medium text-[#6B1B3D]">
                            Change Picture
                          </span>
                        </div>
                        <Input
                          id="profile-pic"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePicture}
                        />
                      </Label>
                      <AvatarGenerator 
                        currentUser={currentUser}
                        onAvatarGenerated={(url) => setCurrentUser({ ...currentUser, profile_picture: url })}
                      />
                    </div>
                    <p className="text-xs text-gray-500">JPG, PNG, max 5MB</p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={profileData.full_name || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, full_name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input value={currentUser.email} disabled className="bg-gray-50" />
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={profileData.bio || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleProfileUpdate}
                    className="bg-[#6B1B3D] hover:bg-[#4A1228]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => restartOnboardingMutation.mutate()}
                    variant="outline"
                    className="border-[#6B1B3D] text-[#6B1B3D] hover:bg-pink-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart Onboarding
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <BackgroundSelector
              currentBackground={currentUser.background_image || "#FEF5F9"}
              onBackgroundChange={(backgroundUrl) => {
                setCurrentUser({ ...currentUser, background_image: backgroundUrl });
              }}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminMetricsContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}