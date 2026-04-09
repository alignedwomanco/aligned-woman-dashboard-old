import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Users, Eye, Trash2, Tag, UserPlus, ChevronDown, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import MemberDetailDialog from "./MemberDetailDialog";
import MemberAccessTagEditor from "./MemberAccessTagEditor";
import ExistingUserPicker from "./ExistingUserPicker";

export default function MembersManager({ allUsers }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [editTagsMember, setEditTagsMember] = useState(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMode, setAddMode] = useState("existing"); // "existing" or "invite"
  const [selectedExistingUser, setSelectedExistingUser] = useState(null);
  const [existingSearch, setExistingSearch] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberTags, setNewMemberTags] = useState([]);
  const queryClient = useQueryClient();

  // Members = users with role member/user OR is_member flag
  const members = allUsers.filter(
    (u) => ["user", "member"].includes(u.role) || u.is_member
  );

  // Non-member users available to add (any user not already a member)
  const nonMembers = allUsers.filter(
    (u) => !["user", "member"].includes(u.role) && !u.is_member
  );

  const filteredNonMembers = nonMembers.filter((u) =>
    !existingSearch ||
    (u.full_name || "").toLowerCase().includes(existingSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(existingSearch.toLowerCase())
  );

  const filtered = members.filter((m) =>
    !searchQuery ||
    (m.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { data: enrollments = [] } = useQuery({
    queryKey: ["allEnrollments"],
    queryFn: () => base44.entities.CourseEnrollment.filter({ isPaid: true }),
  });

  const { data: accessTags = [] } = useQuery({
    queryKey: ["accessTags"],
    queryFn: () => base44.entities.AccessTag.filter({ is_active: true }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.update(userId, { is_member: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async ({ email, tags }) => {
      await base44.users.inviteUser(email, "member");
      return { email, tags };
    },
    onSuccess: (data) => {
      setAddMemberOpen(false);
      setNewMemberEmail("");
      setNewMemberTags([]);
      setAddMode("invite");
      setSelectedExistingUser("");
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      alert(`Invitation sent to ${data.email}!`);
    },
    onError: (error) => {
      alert(`Failed to send invitation: ${error.message}`);
    },
  });

  const addExistingMutation = useMutation({
    mutationFn: async ({ userId, tags }) => {
      const updateData = { is_member: true };
      if (tags && tags.length > 0) {
        const user = allUsers.find(u => u.id === userId);
        const existing = user?.access_tags || [];
        updateData.access_tags = [...new Set([...existing, ...tags])];
      }
      await base44.entities.User.update(userId, updateData);
    },
    onSuccess: () => {
      resetAddDialog();
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });

  const resetAddDialog = () => {
    setAddMemberOpen(false);
    setSelectedExistingUser(null);
    setExistingSearch("");
    setNewMemberEmail("");
    setNewMemberTags([]);
    setAddMode("existing");
  };

  const getMembershipStatus = (user) => {
    if (user.membership_type === "paid") return "paid";
    const hasPaidEnrollment = enrollments.some(
      (e) => (e.userEmail || "").toLowerCase() === (user.email || "").toLowerCase() && e.isPaid
    );
    return hasPaidEnrollment ? "paid" : "free";
  };

  const paidCount = filtered.filter((m) => getMembershipStatus(m) === "paid").length;
  const freeCount = filtered.length - paidCount;

  const toggleNewMemberTag = (tagKey) => {
    setNewMemberTags(prev => 
      prev.includes(tagKey) ? prev.filter(t => t !== tagKey) : [...prev, tagKey]
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-2.5 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-[#6E1D40]">{members.length}</p>
            <p className="text-[10px] sm:text-sm text-gray-500">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-[10px] sm:text-sm text-gray-500">Paid Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-gray-500">{freeCount}</p>
            <p className="text-[10px] sm:text-sm text-gray-500">Free</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => { setAddMemberOpen(true); setAddMode("invite"); setSelectedExistingUser(""); }}
          className="text-white flex-shrink-0"
          style={{ backgroundColor: '#6E1D40' }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Add Member</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader className="px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="w-5 h-5" />
            Members ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">User</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Role</TableHead>
                <TableHead className="hidden xl:table-cell">Access Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((member) => {
                  const status = getMembershipStatus(member);
                  const isTeamMember = !["user", "member"].includes(member.role);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 flex-shrink-0">
                            <AvatarImage src={member.profile_picture} />
                            <AvatarFallback className="bg-[#6E1D40] text-white text-xs">
                              {member.full_name?.[0] || member.email?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{member.full_name || "Unnamed"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-gray-600">
                        {member.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={status === "paid"
                          ? "bg-green-100 text-green-800 border-0 text-xs"
                          : "bg-gray-100 text-gray-600 border-0 text-xs"
                        }>
                          {status === "paid" ? "Paid" : "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {isTeamMember ? (
                          <Badge className="bg-purple-100 text-purple-800 border-0 text-xs capitalize">
                            {member.role?.replace("_", " ")}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">Member</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(member.access_tags || []).length > 0 ? (
                            (member.access_tags || []).slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">None</span>
                          )}
                          {(member.access_tags || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">+{member.access_tags.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" title="View" onClick={() => setSelectedMember(member)} className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Tags" onClick={() => setEditTagsMember(member)} className="h-8 w-8 p-0">
                            <Tag className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Remove from members" onClick={() => { if (confirm(`Remove ${member.full_name || member.email} from members? This will NOT delete their account.`)) removeMemberMutation.mutate(member.id); }} className="h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedMember && (
        <MemberDetailDialog
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {editTagsMember && (
        <MemberAccessTagEditor
          member={editTagsMember}
          onClose={() => setEditTagsMember(null)}
        />
      )}

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={(open) => { if (!open) resetAddDialog(); else setAddMemberOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setAddMode("existing"); setSelectedExistingUser(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  addMode === "existing" ? "bg-[#6E1D40] text-white border-[#6E1D40]" : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                Existing User
              </button>
              <button
                onClick={() => { setAddMode("invite"); setSelectedExistingUser(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  addMode === "invite" ? "bg-[#6E1D40] text-white border-[#6E1D40]" : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                Invite New
              </button>
            </div>

            {addMode === "existing" ? (
              <ExistingUserPicker
                nonMembers={nonMembers}
                filteredNonMembers={filteredNonMembers}
                existingSearch={existingSearch}
                setExistingSearch={setExistingSearch}
                selectedExistingUser={selectedExistingUser}
                setSelectedExistingUser={setSelectedExistingUser}
              />
            ) : (
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="member@example.com"
                />
              </div>
            )}

            {/* Access Tags - shared for both modes */}
            {accessTags.length > 0 && (
              <div>
                <Label>Access Tags (optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {accessTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleNewMemberTag(tag.tag_key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        newMemberTags.includes(tag.tag_key)
                          ? "bg-[#6E1D40] text-white border-[#6E1D40]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#DEBECC]"
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action button */}
            {addMode === "existing" ? (
              <Button
                onClick={() => addExistingMutation.mutate({ userId: selectedExistingUser?.id, tags: newMemberTags })}
                disabled={!selectedExistingUser || addExistingMutation.isPending}
                className="w-full text-white"
                style={{ backgroundColor: '#6E1D40' }}
              >
                {addExistingMutation.isPending ? "Adding..." : `Add ${selectedExistingUser?.full_name || "User"} as Member`}
              </Button>
            ) : (
              <Button
                onClick={() => inviteMemberMutation.mutate({ email: newMemberEmail, tags: newMemberTags })}
                disabled={!newMemberEmail || inviteMemberMutation.isPending}
                className="w-full text-white"
                style={{ backgroundColor: '#6E1D40' }}
              >
                {inviteMemberMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}