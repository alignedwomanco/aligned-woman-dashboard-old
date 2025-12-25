import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Star, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function CommunityLeaderboard({ currentUser }) {
  const { data: allUsers = [] } = useQuery({
    queryKey: ["usersWithPoints"],
    queryFn: () => base44.entities.User.list(),
  });

  const sortedUsers = allUsers
    .filter(user => user.total_community_points > 0)
    .sort((a, b) => (b.total_community_points || 0) - (a.total_community_points || 0))
    .slice(0, 10);

  const currentUserRank = sortedUsers.findIndex(u => u.email === currentUser?.email) + 1;

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3: return <Trophy className="w-5 h-5 text-amber-600" />;
      default: return <Star className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentUserRank > 0 && currentUserRank <= 10 && (
          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-700">
              You're #{currentUserRank} 🎉
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {currentUser.total_community_points} points
            </p>
          </div>
        )}

        <div className="space-y-2">
          {sortedUsers.map((user, idx) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                user.email === currentUser?.email
                  ? "bg-purple-50 border-2 border-purple-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center w-6">
                {getRankIcon(idx + 1)}
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.profile_picture} />
                <AvatarFallback className="bg-[#6B1B3D] text-white text-xs">
                  {user.full_name?.[0] || user.email[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Level {user.level || 1}
                  </Badge>
                  <span className="text-xs text-gray-600">{user.total_community_points} pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedUsers.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">
            Be the first to earn points!
          </p>
        )}
      </CardContent>
    </Card>
  );
}