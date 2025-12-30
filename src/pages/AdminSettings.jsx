import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Upload, Camera, Trash2, Save, UserPlus, RefreshCw, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CourseBuilderContent from "@/components/admin/CourseBuilderContent";
import AdminMetricsContent from "@/components/admin/AdminMetricsContent";
import AvatarGenerator from "@/components/admin/AvatarGenerator";
import ExpertsManagementContent from "@/components/admin/ExpertsManagementContent";
import DashboardConfiguratorContent from "@/components/admin/DashboardConfiguratorContent";
import { createPageUrl } from "@/utils";
import BackgroundSelector from "@/components/settings/BackgroundSelector";
import AIChatWidgetSettings from "@/components/admin/AIChatWidgetSettings";
import StripeIntegrationContent from "@/components/admin/StripeIntegrationContent";
import SupportRoomContent from "@/components/admin/SupportRoomContent";
import EducatorAnalyticsContent from "@/components/admin/EducatorAnalyticsContent";
import LogoManagement from "@/components/admin/LogoManagement";

export default function AdminSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("moderator");
  const [activeTab, setActiveTab] = useState("users");
  const [editingUser, setEditingUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setProfileData({
        full_name: user.full_name,
        bio: user.bio || "",
        expertise: user.expertise || [],
      });
    };
    loadUser();
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === "admin" || currentUser?.role === "master_admin" || currentUser?.role === "owner",
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const targetUser = allUsers.find(u => u.id === userId);
      
      // Require email confirmation for owner role changes
      if (role === "owner" || targetUser?.role === "owner") {
        const confirmed = window.confirm(
          `⚠️ CRITICAL: You are ${role === "owner" ? "granting" : "removing"} OWNER privileges.\n\n` +
          `This is the highest level of system access. Please verify:\n` +
          `- Email: ${targetUser?.email}\n` +
          `- New Role: ${role}\n\n` +
          `Type "CONFIRM" in the next dialog to proceed.`
        );
        
        if (!confirmed) return;
        
        const verification = window.prompt(
          `Please type "CONFIRM" to verify this owner role change:`
        );
        
        if (verification !== "CONFIRM") {
          throw new Error("Owner role change cancelled - verification failed");
        }
      }
      
      return base44.entities.User.update(userId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });

  const updateUserDataMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      setEditDialogOpen(false);
      setEditingUser(null);
      setEditData({});
    },
  });

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditData({
      custom_title: user.custom_title || "",
      bio: user.bio || "",
      is_expert: user.is_expert || false,
      is_educator: user.is_educator || false,
      expertise: user.expertise || [],
      years_experience: user.years_experience || "",
      clients_served: user.clients_served || "",
      rating: user.rating || "",
      profile_picture: user.profile_picture || "",
    });
    setEditDialogOpen(true);
  };

  const sendInviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
    },
    onSuccess: () => {
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("moderator");
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      alert("Invitation sent successfully!");
    },
    onError: (error) => {
      alert(`Failed to send invitation: ${error.message}`);
    },
  });

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
      window.location.href = createPageUrl("OnboardingDiagnostic");
    },
  });

  // Apply background
  useEffect(() => {
    const bg = currentUser?.background_image || '#FBF4FD';
    if (bg.startsWith('#')) {
      document.body.style.backgroundColor = bg;
      document.body.style.backgroundImage = "none";
    } else if (bg.startsWith('data:image/svg+xml')) {
      document.body.style.backgroundImage = `url("${bg}")`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundColor = "transparent";
    } else {
      document.body.style.backgroundImage = `url(${bg})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundColor = "transparent";
    }
  }, [currentUser?.background_image]);

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

  const getRoleBadgeColor = (role) => {
    const colors = {
      owner: "text-white",
      master_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      moderator: "bg-green-100 text-green-800",
      educator: "bg-orange-100 text-orange-800",
      facilitator: "bg-teal-100 text-teal-800",
      expert: "bg-pink-100 text-pink-800",
      support: "bg-indigo-100 text-indigo-800",
      user: "bg-gray-100 text-gray-800",
    };
    return colors[role] || colors.user;
  };

  const handleProfilePictureForUser = async (e, userId) => {
    const file = e.target.files[0];
    if (!file) return;

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.User.update(userId, { profile_picture: file_url });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: 'var(--theme-primary, #3C224F)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const canAccessAdmin = ["owner", "admin", "master_admin", "moderator", "expert", "educator", "facilitator", "support"].includes(currentUser.role);

  const adminUsers = allUsers.filter(u => ["owner", "admin", "master_admin", "moderator", "educator", "facilitator", "expert", "support"].includes(u.role));
  const regularUsers = allUsers.filter(u => u.role === "user");

  return (
    <div className="min-h-screen p-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--theme-primary, #3C224F)' }}>Admin Settings</h1>
          <p className="text-gray-600">Manage system settings and configurations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:text-white hover:bg-gray-100"
              style={{ backgroundColor: activeTab === "users" ? 'var(--theme-secondary, #5B2E84)' : '' }}
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="courses" 
              className="data-[state=active]:text-white hover:bg-gray-100"
              style={{ backgroundColor: activeTab === "courses" ? 'var(--theme-secondary, #5B2E84)' : '' }}
            >
              Course Builder
            </TabsTrigger>
            <TabsTrigger 
              value="experts" 
              className="data-[state=active]:text-white hover:bg-gray-100"
              style={{ backgroundColor: activeTab === "experts" ? 'var(--theme-secondary, #5B2E84)' : '' }}
            >
              Experts
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:text-white hover:bg-gray-100"
              style={{ backgroundColor: activeTab === "dashboard" ? 'var(--theme-secondary, #5B2E84)' : '' }}
            >
              Dashboard Configurator
            </TabsTrigger>
            <TabsTrigger 
              value="integrations" 
              className="data-[state=active]:text-white hover:bg-gray-100"
              style={{ backgroundColor: activeTab === "integrations" ? 'var(--theme-secondary, #5B2E84)' : '' }}
            >
              Integrations
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:text-white hover:bg-gray-100"
              style={{ backgroundColor: activeTab === "analytics" ? 'var(--theme-secondary, #5B2E84)' : '' }}
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="ai-chat" 
              className="data-[state=active]:text-white hover:bg-gray-100"
              style={{ backgroundColor: activeTab === "ai-chat" ? 'var(--theme-secondary, #5B2E84)' : '' }}
            >
              AI Chat Widget
            </TabsTrigger>
            <TabsTrigger 
              value="support" 
              className="data-[state=active]:text-white hover:bg-gray-100"
              style={{ backgroundColor: activeTab === "support" ? 'var(--theme-secondary, #5B2E84)' : '' }}
            >
              Support Room
            </TabsTrigger>
            <TabsTrigger 
              value="logos" 
              className="data-[state=active]:text-white hover:bg-gray-100"
              style={{ backgroundColor: activeTab === "logos" ? 'var(--theme-secondary, #5B2E84)' : '' }}
            >
              Logos
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              {/* Administrators Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Administrators & Team
                    </CardTitle>
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="text-white"
                          style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite Admin
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Administrator or Team Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Email Address</Label>
                            <Input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="email@example.com"
                            />
                          </div>
                          <div>
                            <Label>Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="expert">Expert</SelectItem>
                                <SelectItem value="educator">Educator</SelectItem>
                                <SelectItem value="facilitator">Facilitator</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {(currentUser.role === "master_admin" || currentUser.role === "owner") && (
                                  <SelectItem value="master_admin">Master Admin</SelectItem>
                                )}
                                {currentUser.role === "owner" && (
                                  <SelectItem value="owner">Owner</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={() => sendInviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                            disabled={!inviteEmail || sendInviteMutation.isPending}
                            className="w-full text-white"
                            style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
                          >
                            {sendInviteMutation.isPending ? "Sending..." : "Send Invitation"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role / Title</TableHead>
                        <TableHead>Change Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center gap-3">
                            <div className="relative group">
                              <Avatar className="cursor-pointer">
                                <AvatarImage src={user.profile_picture} />
                                <AvatarFallback style={{ backgroundColor: 'var(--theme-primary, #3C224F)' }} className="text-white">
                                 {user.full_name?.[0] || user.email?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <label 
                                htmlFor={`profile-pic-admin-${user.id}`}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Camera className="w-4 h-4 text-white" />
                              </label>
                              <input
                                id={`profile-pic-admin-${user.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleProfilePictureForUser(e, user.id)}
                              />
                            </div>
                            <span className="font-medium">{user.full_name || "User"}</span>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role?.replace("_", " ")}
                              </Badge>
                              {user.custom_title && (
                                <div className="text-xs text-gray-600">{user.custom_title}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(role) =>
                                updateUserRoleMutation.mutate({ userId: user.id, role })
                              }
                              disabled={user.id === currentUser.id}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                                <SelectItem value="educator">Educator</SelectItem>
                                <SelectItem value="facilitator">Facilitator</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {(currentUser.role === "master_admin" || currentUser.role === "owner") && (
                                  <SelectItem value="master_admin">Master Admin</SelectItem>
                                )}
                                {currentUser.role === "owner" && (
                                  <SelectItem value="owner">Owner</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={user.id === currentUser.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Experts & Educators Quick Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Experts & Educators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <div>
                      <p className="font-medium text-gray-900">Manage Expert & Educator Profiles</p>
                      <p className="text-sm text-gray-600">View metrics, content, and manage expert/educator accounts</p>
                    </div>
                    <Button 
                      onClick={() => setActiveTab("experts")}
                      className="text-white"
                      style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
                    >
                      Go to Experts →
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Regular Users Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role / Title</TableHead>
                        <TableHead>Change Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regularUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center gap-3">
                            <div className="relative group">
                              <Avatar className="cursor-pointer">
                                <AvatarImage src={user.profile_picture} />
                                <AvatarFallback style={{ backgroundColor: 'var(--theme-primary, #3C224F)' }} className="text-white">
                                 {user.full_name?.[0] || user.email?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <label 
                                htmlFor={`profile-pic-regular-${user.id}`}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Camera className="w-4 h-4 text-white" />
                              </label>
                              <input
                                id={`profile-pic-regular-${user.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleProfilePictureForUser(e, user.id)}
                              />
                            </div>
                            <span className="font-medium">{user.full_name || "User"}</span>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role?.replace("_", " ")}
                              </Badge>
                              {user.custom_title && (
                                <div className="text-xs text-gray-600">{user.custom_title}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(role) =>
                                updateUserRoleMutation.mutate({ userId: user.id, role })
                              }
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                                <SelectItem value="educator">Educator</SelectItem>
                                <SelectItem value="facilitator">Facilitator</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {(currentUser.role === "master_admin" || currentUser.role === "owner") && (
                                  <SelectItem value="master_admin">Master Admin</SelectItem>
                                )}
                                {currentUser.role === "owner" && (
                                  <SelectItem value="owner">Owner</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Edit User Dialog */}
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit User: {editingUser?.full_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Custom Title (e.g., "Lead Coach", "Senior Expert")</Label>
                      <Input
                        value={editData.custom_title || ""}
                        onChange={(e) => setEditData({ ...editData, custom_title: e.target.value })}
                        placeholder="Custom title or designation"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_expert"
                          checked={editData.is_expert || false}
                          onChange={(e) => setEditData({ ...editData, is_expert: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="is_expert" className="cursor-pointer">Mark as Expert</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_educator"
                          checked={editData.is_educator || false}
                          onChange={(e) => setEditData({ ...editData, is_educator: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="is_educator" className="cursor-pointer">Mark as Educator</Label>
                      </div>
                    </div>

                    <div>
                      <Label>Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={editData.profile_picture} />
                          <AvatarFallback className="bg-[#6B1B3D] text-white">
                            {editingUser?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <label htmlFor="edit-profile-pic" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Change Picture
                            </span>
                          </Button>
                        </label>
                        <input
                          id="edit-profile-pic"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                            setEditData({ ...editData, profile_picture: file_url });
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={editData.bio || ""}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        placeholder="User bio"
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Years Experience</Label>
                        <Input
                          value={editData.years_experience || ""}
                          onChange={(e) => setEditData({ ...editData, years_experience: e.target.value })}
                          placeholder="5+"
                        />
                      </div>
                      <div>
                        <Label>Clients Served</Label>
                        <Input
                          value={editData.clients_served || ""}
                          onChange={(e) => setEditData({ ...editData, clients_served: e.target.value })}
                          placeholder="100+"
                        />
                      </div>
                      <div>
                        <Label>Rating</Label>
                        <Input
                          value={editData.rating || ""}
                          onChange={(e) => setEditData({ ...editData, rating: e.target.value })}
                          placeholder="5.0"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => updateUserDataMutation.mutate({ 
                        userId: editingUser.id, 
                        data: editData 
                      })}
                      className="w-full text-white"
                      style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

          {/* Course Builder Tab */}
          <TabsContent value="courses">
            <CourseBuilderContent />
          </TabsContent>

          {/* Experts Tab */}
          <TabsContent value="experts">
            <ExpertsManagementContent />
          </TabsContent>

          {/* Dashboard Configurator Tab */}
          <TabsContent value="dashboard">
            <DashboardConfiguratorContent />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <StripeIntegrationContent currentUser={currentUser} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {["educator", "expert"].includes(currentUser?.role) || currentUser?.is_educator || currentUser?.is_expert ? (
              <EducatorAnalyticsContent currentUser={currentUser} />
            ) : (
              <AdminMetricsContent />
            )}
          </TabsContent>

          {/* AI Chat Widget Tab */}
          <TabsContent value="ai-chat">
            <AIChatWidgetSettings />
          </TabsContent>

          {/* Support Room Tab */}
          <TabsContent value="support">
            <SupportRoomContent currentUser={currentUser} />
          </TabsContent>

          {/* Logos Tab */}
          <TabsContent value="logos">
            <LogoManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}