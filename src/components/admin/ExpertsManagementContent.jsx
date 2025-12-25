import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Trash2, UserPlus, TrendingUp, DollarSign, Eye } from "lucide-react";
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

export default function ExpertsManagementContent() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("expert");
  const queryClient = useQueryClient();

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Experts & Course Creators</CardTitle>
              <p className="text-gray-600">Manage expert profiles, content, and performance metrics</p>
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
    </div>
  );
}