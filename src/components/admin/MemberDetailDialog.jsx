import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, MessageCircle, Award, Clock, TrendingUp } from "lucide-react";
import moment from "moment";

export default function MemberDetailDialog({ member, onClose }) {
  const email = (member.email || "").toLowerCase();

  const { data: enrollments = [] } = useQuery({
    queryKey: ["memberEnrollments", email],
    queryFn: () => base44.entities.CourseEnrollment.filter({ userEmail: email }),
    enabled: !!email,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["memberProgress", member.id],
    queryFn: () => base44.entities.CourseProgress.filter({ created_by: member.email }),
    enabled: !!member.email,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["memberPosts", member.id],
    queryFn: () => base44.entities.CommunityPost.filter({ created_by: member.email }),
    enabled: !!member.email,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["memberCheckIns", member.id],
    queryFn: () => base44.entities.CheckIn.filter({ created_by: member.email }),
    enabled: !!member.email,
  });

  const { data: journals = [] } = useQuery({
    queryKey: ["memberJournals", member.id],
    queryFn: () => base44.entities.JournalEntry.filter({ created_by: member.email }),
    enabled: !!member.email,
  });

  const completedModules = progress.filter(p => p.status === "completed").length;
  const paidEnrollments = enrollments.filter(e => e.isPaid);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>

        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Avatar className="w-16 h-16">
            <AvatarImage src={member.profile_picture} />
            <AvatarFallback className="bg-[#6E1D40] text-white text-lg">
              {member.full_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-bold">{member.full_name || "Unnamed"}</h3>
            <p className="text-sm text-gray-500">{member.email}</p>
            <div className="flex gap-2 mt-1">
              <Badge className={member.membership_type === "paid" || paidEnrollments.length > 0
                ? "bg-green-100 text-green-800 border-0"
                : "bg-gray-100 text-gray-600 border-0"
              }>
                {member.membership_type === "paid" || paidEnrollments.length > 0 ? "Paid" : "Free"}
              </Badge>
              <Badge variant="outline">Level {member.level || 1}</Badge>
              <Badge variant="outline">{member.total_community_points || 0} pts</Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
          <StatCard icon={BookOpen} label="Enrollments" value={enrollments.length} color="#6E1D40" />
          <StatCard icon={TrendingUp} label="Completed" value={completedModules} color="#22c55e" />
          <StatCard icon={MessageCircle} label="Posts" value={posts.length} color="#3b82f6" />
          <StatCard icon={Clock} label="Check-ins" value={checkIns.length} color="#f59e0b" />
        </div>

        {/* Access Tags */}
        <div className="py-3 border-t">
          <h4 className="text-sm font-semibold mb-2">Access Tags</h4>
          <div className="flex flex-wrap gap-2">
            {(member.access_tags || []).length > 0 ? (
              member.access_tags.map(tag => (
                <Badge key={tag} className="bg-[#F5E8EE] text-[#6E1D40] border-0">{tag}</Badge>
              ))
            ) : (
              <p className="text-sm text-gray-400">No access tags</p>
            )}
          </div>
        </div>

        {/* Course Enrollments */}
        <div className="py-3 border-t">
          <h4 className="text-sm font-semibold mb-2">Course Enrollments</h4>
          {enrollments.length === 0 ? (
            <p className="text-sm text-gray-400">No enrollments</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{e.courseId}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {e.enrolledAt ? moment(e.enrolledAt).format("MMM D, YYYY") : ""}
                    </span>
                  </div>
                  <Badge className={e.isPaid
                    ? "bg-green-100 text-green-700 border-0"
                    : "bg-gray-100 text-gray-500 border-0"
                  }>
                    {e.isPaid ? "Paid" : "Free"} · {e.paymentSource || "—"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Summary */}
        <div className="py-3 border-t">
          <h4 className="text-sm font-semibold mb-2">Recent Activity</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>📓 {journals.length} journal entries</p>
            <p>💬 {posts.length} community posts</p>
            <p>❤️ {checkIns.length} check-ins completed</p>
            {member.community_badges?.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{member.community_badges.length} badges earned</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </CardContent>
    </Card>
  );
}