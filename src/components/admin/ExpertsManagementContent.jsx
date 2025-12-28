import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Trash2, UserPlus, TrendingUp, DollarSign, Eye, Plus, X, Edit, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import ImageCropper from "./ImageCropper";

export default function ExpertsManagementContent() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("expert");
  const [editExpertDialogOpen, setEditExpertDialogOpen] = useState(false);
  const [currentExpert, setCurrentExpert] = useState(null);
  const [expertForm, setExpertForm] = useState({
    name: "",
    title: "",
    bio: "",
    profile_picture: "",
    specialties: [],
    services: [],
    isPublished: true,
  });
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const queryClient = useQueryClient();

  const { data: expertsProfiles = [] } = useQuery({
    queryKey: ["expertsProfiles"],
    queryFn: () => base44.entities.Expert.list(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: moduleEngagement = [] } = useQuery({
    queryKey: ["moduleEngagement"],
    queryFn: () => base44.entities.ModuleEngagement.list("-created_date", 100),
  });

  const expertsAndCreators = allUsers.filter(u => 
    ["expert", "course_creator"].includes(u.role)
  );

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
        subject: "Invitation to Join as Expert - The Aligned Woman Blueprint",
        body: `You've been invited to join The Aligned Woman Blueprint as ${role.replace("_", " ")}. Please sign up at ${window.location.origin}`,
      });
    },
    onSuccess: () => {
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("expert");
    },
  });

  const createExpertMutation = useMutation({
    mutationFn: (data) => base44.entities.Expert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expertsProfiles"] });
      setEditExpertDialogOpen(false);
      resetForm();
    },
  });

  const updateExpertMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expert.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expertsProfiles"] });
      setEditExpertDialogOpen(false);
      resetForm();
    },
  });

  const deleteExpertMutation = useMutation({
    mutationFn: (id) => base44.entities.Expert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expertsProfiles"] });
    },
  });

  const resetForm = () => {
    setCurrentExpert(null);
    setExpertForm({
      name: "",
      title: "",
      bio: "",
      profile_picture: "",
      specialties: [],
      services: [],
      isPublished: true,
    });
  };

  const openEditDialog = (expert = null) => {
    if (expert) {
      setCurrentExpert(expert);
      setExpertForm(expert);
    } else {
      resetForm();
    }
    setEditExpertDialogOpen(true);
  };

  const handleSaveExpert = () => {
    if (currentExpert) {
      updateExpertMutation.mutate({ id: currentExpert.id, data: expertForm });
    } else {
      createExpertMutation.mutate(expertForm);
    }
  };

  const addService = () => {
    setExpertForm({
      ...expertForm,
      services: [...expertForm.services, { name: "", description: "", price: 0, duration: "" }],
    });
  };

  const updateService = (index, field, value) => {
    const updated = [...expertForm.services];
    updated[index][field] = value;
    setExpertForm({ ...expertForm, services: updated });
  };

  const removeService = (index) => {
    setExpertForm({
      ...expertForm,
      services: expertForm.services.filter((_, i) => i !== index),
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      course_creator: "bg-orange-100 text-orange-800",
      expert: "bg-pink-100 text-pink-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getExpertMetrics = (expertEmail) => {
    const expertModules = moduleEngagement.filter(e => e.created_by === expertEmail);
    const views = expertModules.length;
    const uniqueUsers = new Set(expertModules.map(e => e.created_by)).size;
    
    return {
      views,
      uniqueUsers,
      revenue: (views * 2.5).toFixed(2), // Mock revenue calculation
    };
  };

  return (
    <div className="space-y-6">
      {/* Expert Profiles Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Expert Profiles</CardTitle>
              <p className="text-gray-600">Manage expert profiles shown on the Experts page</p>
            </div>
            <Button onClick={() => openEditDialog()} className="bg-[#3D2250] hover:bg-[#5B2E84]">
              <Plus className="w-4 h-4 mr-2" />
              Add Expert Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expertsProfiles.map((expert) => (
              <div key={expert.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={expert.profile_picture || "https://via.placeholder.com/100"}
                    alt={expert.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#3D2250] truncate">{expert.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{expert.title}</p>
                    {expert.services && expert.services.length > 0 && (
                      <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                        {expert.services.length} service{expert.services.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(expert)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteExpertMutation.mutate(expert.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Roles Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">User Roles Management</CardTitle>
              <p className="text-gray-600">Manage expert and course creator user accounts</p>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#6B1B3D] hover:bg-[#4A1228]">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Expert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Expert or Course Creator</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="expert@example.com"
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
                <TableHead>Expert</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Change Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expertsAndCreators.map((expert) => {
                const metrics = getExpertMetrics(expert.email);
                return (
                  <TableRow key={expert.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={expert.profile_picture} />
                        <AvatarFallback className="bg-[#6B1B3D] text-white">
                          {expert.full_name?.[0] || expert.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{expert.full_name || "Expert"}</span>
                    </TableCell>
                    <TableCell>{expert.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(expert.role)}>
                        {expert.role?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-gray-500" />
                        {metrics.views}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-4 h-4" />
                        ${metrics.revenue}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={expert.role}
                        onValueChange={(role) =>
                          updateUserRoleMutation.mutate({ userId: expert.id, role })
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
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUserMutation.mutate(expert.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to={createPageUrl("AdminSettings") + "?tab=courses"}>
              <Button variant="outline" className="w-full justify-start">
                Manage Course Content
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              View Performance Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Payment Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Expert Dialog */}
      <Dialog open={editExpertDialogOpen} onOpenChange={setEditExpertDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentExpert ? "Edit Expert Profile" : "Add Expert Profile"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={expertForm.name}
                onChange={(e) => setExpertForm({ ...expertForm, name: e.target.value })}
                placeholder="Expert full name"
              />
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={expertForm.title}
                onChange={(e) => setExpertForm({ ...expertForm, title: e.target.value })}
                placeholder="e.g., Nervous System Specialist"
              />
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={expertForm.bio}
                onChange={(e) => setExpertForm({ ...expertForm, bio: e.target.value })}
                placeholder="Expert biography"
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-3">
                {expertForm.profile_picture && (
                  <img
                    src={expertForm.profile_picture}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <label htmlFor="expert-pic-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors" style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {expertForm.profile_picture ? 'Change Picture' : 'Upload Picture'}
                      </span>
                    </div>
                  </label>
                  <input
                    id="expert-pic-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setTempImage(event.target.result);
                          setCropperOpen(true);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = null;
                    }}
                  />
                  <p className="text-xs text-gray-500">JPG, PNG, max 5MB</p>
                </div>
              </div>
            </div>

            <div>
              <Label>Services</Label>
              <div className="space-y-3 mt-2">
                {expertForm.services.map((service, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Service {idx + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeService(idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Service name"
                      value={service.name}
                      onChange={(e) => updateService(idx, "name", e.target.value)}
                    />
                    <Textarea
                      placeholder="Service description"
                      value={service.description}
                      onChange={(e) => updateService(idx, "description", e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={service.price}
                        onChange={(e) => updateService(idx, "price", parseFloat(e.target.value))}
                      />
                      <Input
                        placeholder="Duration (e.g., 60 min)"
                        value={service.duration}
                        onChange={(e) => updateService(idx, "duration", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addService}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={expertForm.isPublished}
                onChange={(e) => setExpertForm({ ...expertForm, isPublished: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Publish on Experts page
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveExpert}
                disabled={!expertForm.name || !expertForm.title}
                className="flex-1 bg-[#3D2250] hover:bg-[#5B2E84]"
              >
                {currentExpert ? "Update Expert" : "Create Expert"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditExpertDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      {cropperOpen && tempImage && (
        <ImageCropper
          image={tempImage}
          onCrop={async (blob) => {
            const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setExpertForm({ ...expertForm, profile_picture: file_url });
            setCropperOpen(false);
            setTempImage(null);
          }}
          onCancel={() => {
            setCropperOpen(false);
            setTempImage(null);
          }}
        />
      )}
    </div>
  );
}