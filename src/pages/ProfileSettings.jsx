import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, Save, RefreshCw, Users, UserCheck, Heart, FileText, Plus, X, MessageCircle, UserMinus, UserPlus, Mail, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AvatarGenerator from "@/components/admin/AvatarGenerator";
import BackgroundSelector from "@/components/settings/BackgroundSelector";
import ThemeSelector from "@/components/settings/ThemeSelector";
import { createPageUrl } from "@/utils";
import AdminMetricsContent from "@/components/admin/AdminMetricsContent";
import MessageInbox from "@/components/messages/MessageInbox";

export default function ProfileSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [socialLinks, setSocialLinks] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [showConnectionRequests, setShowConnectionRequests] = useState(false);
  const [emailChangeDialogOpen, setEmailChangeDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [validationError, setValidationError] = useState({ show: false, title: "", message: "" });
  const [selectedTheme, setSelectedTheme] = useState("aligned");
  const queryClient = useQueryClient();

  const toTitleCase = (str) => {
    if (!str) return "";
    return str
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const applyTheme = (themeId) => {
    const themeOptions = [
      { id: "aligned", colors: { primary: "#3B224E", secondary: "#5B2D83" } },
      { id: "rose", colors: { primary: "#E11D48", secondary: "#F43F5E" } },
      { id: "lavender", colors: { primary: "#9333EA", secondary: "#C084FC" } },
      { id: "ocean", colors: { primary: "#0369A1", secondary: "#0EA5E9" } },
      { id: "forest", colors: { primary: "#065F46", secondary: "#10B981" } },
      { id: "sunset", colors: { primary: "#DC2626", secondary: "#F97316" } },
      { id: "midnight", colors: { primary: "#1E293B", secondary: "#475569" } },
      { id: "blush", colors: { primary: "#BE185D", secondary: "#EC4899" } },
    ];
    
    const theme = themeOptions.find(t => t.id === themeId) || themeOptions[0];
    
    // Apply to CSS variables
    document.documentElement.style.setProperty('--theme-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.colors.secondary);
    
    // Apply to sidebar
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      sidebar.style.backgroundColor = theme.colors.primary;
    }
    
    // Apply to header
    const header = document.querySelector('header');
    if (header) {
      header.style.backgroundColor = theme.colors.secondary;
    }
  };

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    
    const themeOptions = [
      { id: "aligned", colors: { primary: "#3B224E", secondary: "#5B2D83" } },
      { id: "rose", colors: { primary: "#E11D48", secondary: "#F43F5E" } },
      { id: "lavender", colors: { primary: "#9333EA", secondary: "#C084FC" } },
      { id: "ocean", colors: { primary: "#0369A1", secondary: "#0EA5E9" } },
      { id: "forest", colors: { primary: "#065F46", secondary: "#10B981" } },
      { id: "sunset", colors: { primary: "#DC2626", secondary: "#F97316" } },
      { id: "midnight", colors: { primary: "#1E293B", secondary: "#475569" } },
      { id: "blush", colors: { primary: "#BE185D", secondary: "#EC4899" } },
    ];
    const theme = themeOptions.find(t => t.id === themeId) || themeOptions[0];
    
    // Update header
    const header = document.querySelector('header');
    if (header) {
      header.style.backgroundColor = theme.colors.secondary;
    }
    
    // Update sidebar
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      sidebar.style.backgroundColor = theme.colors.primary;
    }
    
    // Update all gradient backgrounds on dashboard
    const gradientCards = document.querySelectorAll('.bg-gradient-to-br, .bg-gradient-to-r');
    gradientCards.forEach(card => {
      if (card.classList.contains('from-[#3B224E]') || card.style.background.includes('#3B224E')) {
        card.style.background = `linear-gradient(to bottom right, ${theme.colors.primary}, ${theme.colors.secondary})`;
      }
    });
  };

  const handleThemeSave = async () => {
    await base44.auth.updateMe({ theme: selectedTheme });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  };

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const nameParts = (user.full_name || "").split(" ");
      const firstName = toTitleCase(nameParts[0] || "");
      const lastName = toTitleCase(nameParts.slice(1).join(" ") || "");
      setProfileData({
        first_name: firstName,
        last_name: lastName,
        bio: user.bio || "",
        occupation: user.occupation || "",
        date_of_birth: user.date_of_birth || "",
        time_of_birth: user.time_of_birth || "",
        location: user.location || "",
      });
      setSocialLinks(user.social_links || []);
      const userTheme = user.theme || "aligned";
      setSelectedTheme(userTheme);

      // Apply theme colors
      applyTheme(userTheme);
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
    // Validation
    if (!profileData.first_name?.trim() || !profileData.last_name?.trim()) {
      setValidationError({
        show: true,
        title: "Name Required",
        message: "Please enter both your first name and last name. This helps other members in the community identify and connect with you."
      });
      return;
    }

    if (!profileData.bio || !profileData.bio.trim()) {
      setValidationError({
        show: true,
        title: "Bio Required",
        message: "Please add a bio to your profile. Your bio helps other members understand your background, interests, and what you're working on in your journey."
      });
      return;
    }

    const full_name = `${toTitleCase(profileData.first_name)} ${toTitleCase(profileData.last_name)}`.trim();
    
    const formattedData = {
      full_name,
      bio: profileData.bio,
      occupation: profileData.occupation,
      date_of_birth: profileData.date_of_birth,
      time_of_birth: profileData.time_of_birth,
      location: profileData.location,
      social_links: socialLinks.filter(link => link.platform && link.url),
    };
    
    try {
      await updateProfileMutation.mutateAsync(formattedData);
      
      // Immediately update current user state with new data
      const updatedUserData = { ...currentUser, ...formattedData };
      setCurrentUser(updatedUserData);
      
      // Update profileData state to match what was saved
      const savedFirstName = toTitleCase(profileData.first_name);
      const savedLastName = toTitleCase(profileData.last_name);
      setProfileData({
        first_name: savedFirstName,
        last_name: savedLastName,
        bio: profileData.bio,
        occupation: profileData.occupation,
        date_of_birth: profileData.date_of_birth,
        time_of_birth: profileData.time_of_birth,
        location: profileData.location,
      });
      
      // Update query cache directly
      queryClient.setQueryData(["currentUser"], updatedUserData);
      
      // Then invalidate to sync with server
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      
      setValidationError({
        show: true,
        title: "Success!",
        message: "Your profile has been updated successfully."
      });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setValidationError({ show: false, title: "", message: "" });
      }, 3000);
    } catch (error) {
      setValidationError({
        show: true,
        title: "Update Failed",
        message: "We couldn't save your changes right now. Please check your connection and try again."
      });
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      setValidationError({
        show: true,
        title: "Invalid Email",
        message: "Please enter a valid email address with an @ symbol."
      });
      return;
    }

    try {
      await base44.integrations.Core.SendEmail({
        to: newEmail,
        subject: "Verify Your Email Change - The Aligned Woman",
        body: `You have requested to change your email address to ${newEmail}. 
        
Please click the link below to verify this change:
${window.location.origin}${createPageUrl("ProfileSettings")}?verify_email=${newEmail}

If you did not request this change, please ignore this email.

- The Aligned Woman Team`,
      });
      
      setEmailChangeDialogOpen(false);
      setNewEmail("");
      setValidationError({
        show: true,
        title: "Verification Email Sent",
        message: "We've sent a verification link to your new email address. Please check your inbox and click the link to complete the change."
      });
    } catch (error) {
      setValidationError({
        show: true,
        title: "Email Send Failed",
        message: "We couldn't send the verification email. Please check the email address and try again."
      });
    }
  };

  const handleProfilePicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ profile_picture: file_url });
    setCurrentUser({ ...currentUser, profile_picture: file_url });
  };

  const platformOptions = [
    "Facebook",
    "Instagram",
    "LinkedIn",
    "Telegram",
    "Threads",
    "TikTok",
    "Website",
    "X",
  ];

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  };

  const updateSocialLink = (index, field, value) => {
    const updated = [...socialLinks];
    updated[index][field] = value;
    setSocialLinks(updated);
  };

  const removeSocialLink = (index) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const getLevelInfo = (level = 1) => {
    const levels = {
      1: { label: "New Member", color: "from-gray-400 to-gray-500" },
      2: { label: "Active Member", color: "from-blue-400 to-blue-600" },
      3: { label: "Regular Contributor", color: "from-green-400 to-green-600" },
      4: { label: "Valued Contributor", color: "from-purple-400 to-purple-600" },
      5: { label: "Advanced Contributor", color: "from-orange-400 to-pink-600" },
    };
    return levels[level] || levels[1];
  };

  const { data: myFollows = [] } = useQuery({
    queryKey: ["myFollows"],
    queryFn: () => base44.entities.UserFollow.list(),
    initialData: [],
    enabled: !!currentUser,
  });

  const { data: connections = [] } = useQuery({
    queryKey: ["connections"],
    queryFn: () => base44.entities.UserFollow.filter({ status: "connected" }),
    initialData: [],
    enabled: !!currentUser,
  });

  const { data: connectionRequests = [] } = useQuery({
    queryKey: ["connectionRequests"],
    queryFn: () => base44.entities.UserFollow.filter({ status: "pending" }),
    initialData: [],
    enabled: !!currentUser,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
    enabled: !!currentUser,
  });

  const { data: myPosts = [] } = useQuery({
    queryKey: ["myPosts"],
    queryFn: () => base44.entities.CommunityPost.filter({ created_by: currentUser?.email }),
    initialData: [],
    enabled: !!currentUser,
  });

  const unfollowMutation = useMutation({
    mutationFn: async (followId) => {
      await base44.entities.UserFollow.delete(followId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFollows"] });
    },
  });

  const removeConnectionMutation = useMutation({
    mutationFn: async (connectionId) => {
      await base44.entities.UserFollow.delete(connectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  const acceptConnectionMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.UserFollow.update(requestId, { status: "connected" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  const rejectConnectionMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.UserFollow.delete(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
    },
  });

  const getUserName = (email) => {
    const user = allUsers.find(u => u.email === email);
    return user?.full_name || email;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#3B224E] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h1 className="text-3xl font-bold text-[#3B224E] mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="social">Social & Connections</TabsTrigger>
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
                {/* Profile Picture & Level */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getLevelInfo(currentUser?.level).color} p-1`}>
                      <Avatar className="w-full h-full border-4 border-white">
                        <AvatarImage src={currentUser.profile_picture} />
                        <AvatarFallback className="bg-[#3B224E] text-white text-3xl">
                          {currentUser.full_name?.[0] || currentUser.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <Badge className={`absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r ${getLevelInfo(currentUser?.level).color} text-white border-2 border-white`}>
                      Level {currentUser?.level || 1}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{getLevelInfo(currentUser?.level).label}</h3>
                    <p className="text-sm text-gray-600 mb-3">Keep contributing to level up!</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="profile-pic" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors">
                          <Upload className="w-4 h-4 text-[#3B224E]" />
                          <span className="text-sm font-medium text-[#3B224E]">
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={profileData.first_name || ""}
                        onChange={(e) =>
                          setProfileData({ ...profileData, first_name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        value={profileData.last_name || ""}
                        onChange={(e) =>
                          setProfileData({ ...profileData, last_name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <div className="flex gap-2">
                      <Input value={currentUser.email} disabled className="bg-gray-50 flex-1" />
                      <Dialog open={emailChangeDialogOpen} onOpenChange={setEmailChangeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Change
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Email Address</DialogTitle>
                            <DialogDescription>
                              Enter your new email address. We'll send a verification link to confirm the change.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Current email: {currentUser.email}
                              </AlertDescription>
                            </Alert>
                            <div>
                              <Label>New Email Address</Label>
                              <Input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="newemail@example.com"
                              />
                            </div>
                            <Button
                              onClick={handleEmailChange}
                              className="w-full bg-[#3B224E] hover:bg-[#3B224E]"
                            >
                              Send Verification Email
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div>
                    <Label>Bio *</Label>
                    <Textarea
                      value={profileData.bio || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Required field</p>
                  </div>

                  <div>
                    <Label>Occupation</Label>
                    <Input
                      value={profileData.occupation || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, occupation: e.target.value })
                      }
                      placeholder="What do you do?"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={profileData.date_of_birth}
                        onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tob">Time of Birth (Human Design)</Label>
                      <Input
                        id="tob"
                        type="time"
                        value={profileData.time_of_birth}
                        onChange={(e) => setProfileData({ ...profileData, time_of_birth: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Social Links & Websites</Label>
                      <Button
                        onClick={addSocialLink}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Link
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {socialLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <Select
                            value={link.platform}
                            onValueChange={(value) => updateSocialLink(index, "platform", value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Platform" />
                            </SelectTrigger>
                            <SelectContent>
                              {platformOptions.map((platform) => (
                                <SelectItem key={platform} value={platform}>
                                  {platform}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSocialLink(index)}
                            className="text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleProfileUpdate}
                    className="bg-[#3B224E] hover:bg-[#3B224E]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => restartOnboardingMutation.mutate()}
                    variant="outline"
                    className="border-[#3B224E] text-[#3B224E] hover:bg-pink-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart Onboarding
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social & Connections Tab */}
          {/* Messages Tab */}
          <TabsContent value="messages">
            <MessageInbox currentUser={currentUser} />
          </TabsContent>

          {/* Social & Connections Tab */}
          <TabsContent value="social" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-[#3B224E]" />
                  <div className="text-2xl font-bold">{connections.length}</div>
                  <div className="text-sm text-gray-600">Connections</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                  <div className="text-2xl font-bold">{myFollows.filter(f => !f.status).length}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{myFollows.length}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{myPosts.length}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </CardContent>
              </Card>
            </div>

            {/* Connections */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Connections ({connections.length})
                  </CardTitle>
                  <Dialog open={showConnectionRequests} onOpenChange={setShowConnectionRequests}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Connection Requests {connectionRequests.length > 0 && `(${connectionRequests.length})`}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Connection Requests</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {connectionRequests.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No pending connection requests</p>
                        ) : (
                          connectionRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-[#3B224E] text-white">
                                    {getUserName(request.created_by)?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{getUserName(request.created_by)}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => acceptConnectionMutation.mutate(request.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => rejectConnectionMutation.mutate(request.id)}
                                  className="text-red-600"
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connections.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No connections yet</p>
                  ) : (
                    connections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-[#3B224E] text-white">
                              {getUserName(connection.followingEmail)?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{getUserName(connection.followingEmail)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = createPageUrl("Messages") + `?user=${connection.followingEmail}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeConnectionMutation.mutate(connection.id)}
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Following */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Following ({myFollows.filter(f => !f.status).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myFollows.filter(f => !f.status).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Not following anyone yet</p>
                  ) : (
                    myFollows.filter(f => !f.status).map((follow) => (
                      <div key={follow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-[#3B224E] text-white">
                              {getUserName(follow.followingEmail)?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{getUserName(follow.followingEmail)}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unfollowMutation.mutate(follow.id)}
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Unfollow
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Posts ({myPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myPosts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No posts yet</p>
                  ) : (
                    myPosts.slice(0, 5).map((post) => (
                      <div key={post.id} className="p-4 bg-gray-50 rounded-lg">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>{post.likes} likes</span>
                          <span>{post.commentCount} comments</span>
                          <span>{new Date(post.created_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <ThemeSelector
              currentTheme={selectedTheme}
              onThemeChange={handleThemeChange}
              onSave={handleThemeSave}
            />
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

        {/* Custom Validation Dialog */}
        <Dialog open={validationError.show} onOpenChange={(open) => setValidationError({ ...validationError, show: open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                {validationError.title === "Success!" ? (
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Save className="w-6 h-6 text-green-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-[#3B224E]" />
                  </div>
                )}
                <DialogTitle className="text-xl">{validationError.title}</DialogTitle>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600 leading-relaxed">{validationError.message}</p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setValidationError({ show: false, title: "", message: "" })}
                className="bg-[#3B224E] hover:bg-[#3B224E]"
              >
                Got it
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}