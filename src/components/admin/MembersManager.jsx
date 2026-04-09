import React, { useState } from "react";
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
import { Search, Users, Eye, Edit, Trash2, Tag, UserPlus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import MemberDetailDialog from "./MemberDetailDialog";
import MemberAccessTagEditor from "./MemberAccessTagEditor";

export default function MembersManager({ allUsers }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [editTagsMember, setEditTagsMember] = useState(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberTags, setNewMemberTags] = useState([]);
  const queryClient = useQueryClient();

  // Filter to only user/member roles (non-admin members)
  const members = allUsers.filter(
    (u) => ["user", "member"].includes(u.role)
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

  const deleteMemberMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async ({ email, tags }) => {
      await base44.users.inviteUser(email, "user");
      // Tags will need to be applied after user accepts invite
      return { email, tags };
    },
    onSuccess: (data) => {
      setAddMemberOpen(false);
      setNewMemberEmail("");
      setNewMemberTags([]);
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      alert(`Invitation sent to ${data.email}! Access tags will be available once they join.`);
    },
    onError: (error) => {
      alert(`Failed to send invitation: ${error.message}`);
    },
  });

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
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-[#6E1D40]">{members.length}</p>
            <p className="text-xs sm:text-sm text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-xs sm:text-sm text-gray-500">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-500">{freeCount}</p>
            <p className="text-xs sm:text-sm text-gray-500">Free</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name or email..."
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setAddMemberOpen(true)}
          className="text-white w-full sm:w-auto"
          style={{ backgroundColor: '#6E1D40' }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="w-5 h-5" />
            Members ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Member</TableHead>
                <TableHead className="hidden md:table-cell min-w-[180px]">Email</TableHead>
                <TableHead className="min-w-[80px]">Status</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[180px]">Access Tags</TableHead>
                <TableHead className="hidden sm:table-cell min-w-[60px]">Level</TableHead>
                <TableHead className="hidden sm:table-cell min-w-[60px]">Points</TableHead>
                <TableHead className="min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((member) => {
                  const status = getMembershipStatus(member);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                            <AvatarImage src={member.profile_picture} />
                            <AvatarFallback className="bg-[#6E1D40] text-white text-xs sm:text-sm">
                              {member.full_name?.[0] || member.email?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{member.full_name || "Unnamed"}</p>
                            <p className="text-xs text-gray-400 truncate md:hidden">{member.email}</p>
                            {member.location && <p className="text-xs text-gray-400 hidden md:block">{member.location}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{member.email}</TableCell>
                      <TableCell>
                        <Badge className={status === "paid"
                          ? "bg-green-100 text-green-800 border-0 text-xs"
                          : "bg-gray-100 text-gray-600 border-0 text-xs"
                        }>
                          {status === "paid" ? "Paid" : "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(member.access_tags || []).length > 0 ? (
                            (member.access_tags || []).slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                          {(member.access_tags || []).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{member.access_tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">Lv. {member.level || 1}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{member.total_community_points || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="sm" title="View Details" onClick={() => setSelectedMember(member)} className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit Tags" onClick={() => setEditTagsMember(member)} className="h-8 w-8 p-0">
                            <Tag className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Remove" onClick={() => { if (confirm(`Remove ${member.full_name || member.email}?`)) deleteMemberMutation.mutate(member.id); }} className="h-8 w-8 p-0">
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
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="member@example.com"
              />
            </div>
            <div>
              <Label>Access Tags (optional)</Label>
              <p className="text-xs text-gray-500 mb-2">Tags will be applied once the member accepts their invitation.</p>
              <div className="flex flex-wrap gap-2">
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
                {accessTags.length === 0 && <p className="text-xs text-gray-400">No access tags created yet.</p>}
              </div>
            </div>
            <Button
              onClick={() => inviteMemberMutation.mutate({ email: newMemberEmail, tags: newMemberTags })}
              disabled={!newMemberEmail || inviteMemberMutation.isPending}
              className="w-full text-white"
              style={{ backgroundColor: '#6E1D40' }}
            >
              {inviteMemberMutation.isPending ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}