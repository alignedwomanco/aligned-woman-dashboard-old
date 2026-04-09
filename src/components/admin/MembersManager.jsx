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
import { Search, Users, Eye, Edit, Trash2, Tag } from "lucide-react";
import MemberDetailDialog from "./MemberDetailDialog";
import MemberAccessTagEditor from "./MemberAccessTagEditor";

export default function MembersManager({ allUsers }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [editTagsMember, setEditTagsMember] = useState(null);
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

  const deleteMemberMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#6E1D40]">{members.length}</p>
            <p className="text-sm text-gray-500">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-sm text-gray-500">Paid Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{freeCount}</p>
            <p className="text-sm text-gray-500">Free Members</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members by name or email..."
          className="pl-9"
        />
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Members ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Access Tags</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Actions</TableHead>
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
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.profile_picture} />
                            <AvatarFallback className="bg-[#6E1D40] text-white text-sm">
                              {member.full_name?.[0] || member.email?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{member.full_name || "Unnamed"}</p>
                            <p className="text-xs text-gray-400">{member.location || ""}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{member.email}</TableCell>
                      <TableCell>
                        <Badge className={status === "paid"
                          ? "bg-green-100 text-green-800 border-0"
                          : "bg-gray-100 text-gray-600 border-0"
                        }>
                          {status === "paid" ? "Paid" : "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                      <TableCell className="text-sm">Lv. {member.level || 1}</TableCell>
                      <TableCell className="text-sm">{member.total_community_points || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Details"
                            onClick={() => setSelectedMember(member)}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit Access Tags"
                            onClick={() => setEditTagsMember(member)}
                          >
                            <Tag className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Remove Member"
                            onClick={() => {
                              if (confirm(`Remove ${member.full_name || member.email}?`))
                                deleteMemberMutation.mutate(member.id);
                            }}
                          >
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
    </div>
  );
}