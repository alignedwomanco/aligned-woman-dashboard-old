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
import { Shield, Users, Upload, Camera, Trash2, Save, UserPlus, RefreshCw } from "lucide-react";
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
import { createPageUrl } from "@/utils";

export default function AdminSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("moderator");
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
    enabled: currentUser?.role === "admin" || currentUser?.role === "master_admin",
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.entities.User.update(userId, { role }),
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

  const sendInviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: "Invitation to The Aligned Woman Blueprint",
        body: `You've been invited to join The Aligned Woman Blueprint as ${role.replace("_", " ")}. Please sign up at ${window.location.origin}`,
      });
    },
    onSuccess: () => {
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("moderator");
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
      master_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      moderator: "bg-green-100 text-green-800",
      course_creator: "bg-orange-100 text-orange-800",
      expert: "bg-pink-100 text-pink-800",
      user: "bg-gray-100 text-gray-800",
    };
    return colors[role] || colors.user;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6B1B3D] border-t-transparent rounded-full" />
      </div>
    );
  }

  const canManageUsers = currentUser.role === "admin" || currentUser.role === "master_admin";
  const canAccessModuleBuilder = ["admin", "master_admin", "moderator", "course_creator"].includes(currentUser.role);

  const adminUsers = allUsers.filter(u => ["admin", "master_admin", "moderator", "course_creator", "expert"].includes(u.role));
  const regularUsers = allUsers.filter(u => u.role === "user");

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">Settings</h1>
          <p className="text-gray-600">Manage your profile and system settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {canManageUsers && <TabsTrigger value="users">Users</TabsTrigger>}
            {canAccessModuleBuilder && <TabsTrigger value="courses">Course Builder</TabsTrigger>}
            {canAccessModuleBuilder && <TabsTrigger value="metrics">Metrics</TabsTrigger>}
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
                    <Label>Role</Label>
                    <Badge className={getRoleBadgeColor(currentUser.role)}>
                      {currentUser.role?.replace("_", " ").toUpperCase()}
                    </Badge>
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
                    onClick={() => {
                      restartOnboardingMutation.mutate();
                      setTimeout(() => {
                        window.location.href = createPageUrl("OnboardingForm");
                      }, 100);
                    }}
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

          {/* User Management Tab */}
          {canManageUsers && (
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
                        <Button className="bg-[#6B1B3D] hover:bg-[#4A1228]">
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
                                <SelectItem value="course_creator">Course Creator</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {currentUser.role === "master_admin" && (
                                  <SelectItem value="master_admin">Master Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={() => sendInviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                            disabled={!inviteEmail}
                            className="w-full bg-[#6B1B3D]"
                          >
                            Send Invitation
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
                        <TableHead>Current Role</TableHead>
                        <TableHead>Change Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.profile_picture} />
                              <AvatarFallback className="bg-[#6B1B3D] text-white">
                                {user.full_name?.[0] || user.email?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name || "User"}</span>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role?.replace("_", " ")}
                            </Badge>
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
                                <SelectItem value="course_creator">Course Creator</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {currentUser.role === "master_admin" && (
                                  <SelectItem value="master_admin">Master Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              disabled={user.id === currentUser.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                        <TableHead>Current Role</TableHead>
                        <TableHead>Change Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regularUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.profile_picture} />
                              <AvatarFallback className="bg-[#6B1B3D] text-white">
                                {user.full_name?.[0] || user.email?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name || "User"}</span>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role?.replace("_", " ")}
                            </Badge>
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
                                <SelectItem value="course_creator">Course Creator</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {currentUser.role === "master_admin" && (
                                  <SelectItem value="master_admin">Master Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Course Builder Tab */}
          {canAccessModuleBuilder && (
            <TabsContent value="courses">
              <CourseBuilderContent />
            </TabsContent>
          )}

          {/* Metrics Tab */}
          {canAccessModuleBuilder && (
            <TabsContent value="metrics">
              <AdminMetricsContent />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}