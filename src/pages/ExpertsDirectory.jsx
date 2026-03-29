import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Sparkles,
  Award,
  BookOpen,
  CheckCircle,
  UserPlus,
  UserCheck,
  UserMinus,
  Heart,
} from "lucide-react";

export default function ExpertsDirectory() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [connectionNote, setConnectionNote] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  // Fetch all experts (users with role: expert, course_creator, or admin)
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  // Fetch Expert entity records (managed via admin)
  const { data: expertProfiles = [] } = useQuery({
    queryKey: ["expertProfiles"],
    queryFn: () => base44.entities.Expert.list(),
  });

  // Fetch connection requests
  const { data: connectionRequests = [] } = useQuery({
    queryKey: ["connectionRequests"],
    queryFn: () => base44.entities.UserFollow.filter({ status: "connected" }),
    enabled: !!currentUser,
  });

  // Fetch follows
  const { data: myFollows = [] } = useQuery({
    queryKey: ["myFollows"],
    queryFn: () => base44.entities.UserFollow.list(),
    enabled: !!currentUser,
  });

  const requestConnectionMutation = useMutation({
    mutationFn: async ({ expertEmail, note }) => {
      // Create connection request
      await base44.entities.UserFollow.create({
        followingEmail: expertEmail,
        status: "pending",
      });
      
      // Send in-app notification
      await base44.entities.Notification.create({
        type: "connection_request",
        message: `${currentUser.full_name} wants to connect: ${note}`,
        linkTo: `/members`,
      });

      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: expertEmail,
        subject: "New Connection Request",
        body: `${currentUser.full_name} (${currentUser.email}) wants to connect with you.\n\nMessage: ${note}\n\nView your connection requests at ${window.location.origin}${createPageUrl("Members")}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
      setConnectionNote("");
      setSelectedExpert(null);
    },
  });

  const followMutation = useMutation({
    mutationFn: async (expertEmail) => {
      const existingFollow = myFollows.find(f => f.followingEmail === expertEmail && !f.status);
      if (existingFollow) {
        await base44.entities.UserFollow.delete(existingFollow.id);
      } else {
        await base44.entities.UserFollow.create({ followingEmail: expertEmail });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFollows"] });
    },
  });

  const userExperts = allUsers.filter(
    (user) =>
      ["expert", "course_creator", "admin", "master_admin"].includes(user.role) &&
      user.email !== currentUser?.email
  );

  // Merge: user accounts + Expert entity profiles (deduplicate by name)
  const userExpertNames = userExperts.map(u => u.full_name?.toLowerCase());
  const standaloneExpertProfiles = expertProfiles
    .filter(ep => ep.isPublished !== false && !userExpertNames.includes(ep.name?.toLowerCase()))
    .map(ep => ({
      id: ep.id,
      full_name: ep.name,
      bio: ep.bio,
      profile_picture: ep.profile_picture,
      title: ep.title,
      specialties: ep.specialties,
      _isExpertProfile: true,
    }));

  const experts = [...userExperts, ...standaloneExpertProfiles];

  const filteredExperts = experts.filter((expert) =>
    (expert.full_name || expert.name)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isConnected = (expertEmail) => {
    return connectionRequests.some((req) => 
      (req.followingEmail === expertEmail || req.created_by === expertEmail) && 
      req.status === "connected"
    );
  };

  const isPending = (expertEmail) => {
    return connectionRequests.some(c => 
      c.followingEmail === expertEmail && 
      c.status === "pending"
    );
  };

  const isFollowing = (expertEmail) => {
    return myFollows.some(f => f.followingEmail === expertEmail && !f.status);
  };

  const handleConnect = (expert) => {
    setSelectedExpert(expert);
  };

  const submitConnection = () => {
    if (selectedExpert && connectionNote.trim()) {
      requestConnectionMutation.mutate({
        expertEmail: selectedExpert.email,
        note: connectionNote,
      });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#E4CAFB' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#3B224E] mb-2">Expert Directory</h1>
          <p className="text-gray-600">
            Connect with our certified coaches, mentors, and specialists
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search experts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Experts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((expert) => (
            <Card
              key={expert.id}
              className="hover:shadow-xl transition-shadow border-2 border-purple-100 overflow-hidden"
            >
              <div className="h-24 bg-gradient-to-br from-[#7340B9] to-[#5B2D83]" />
              <CardContent className="relative pt-0 pb-6 px-6">
                <div className="flex flex-col items-center -mt-12 mb-4">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={expert.profile_picture} />
                    <AvatarFallback className="bg-[#7340B9] text-white text-2xl">
                      {expert.full_name?.[0] || expert.email?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-[#3B224E] mb-1">
                    {expert.full_name}
                  </h3>
                  <Badge className="bg-[#7340B9] text-white mb-3">
                    {expert.title || (expert.role === "master_admin"
                      ? "Master Coach"
                      : expert.role === "admin"
                      ? "Lead Coach"
                      : expert.role === "course_creator"
                      ? "Course Creator"
                      : "Expert")}
                  </Badge>
                  {expert.bio && (
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {expert.bio}
                    </p>
                  )}
                </div>

                {/* Expertise Areas */}
                {(expert.expertise || expert.specialties) && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(expert.specialties || expert.expertise || []).slice(0, 3).map((area, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs border-purple-200 text-gray-700"
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-purple-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-[#7340B9]">
                      {expert.years_experience || "5+"}
                    </div>
                    <div className="text-xs text-gray-600">Years</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-purple-700">
                      {expert.clients_served || "100+"}
                    </div>
                    <div className="text-xs text-gray-600">Clients</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-orange-600">
                      {expert.rating || "5.0"}
                    </div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                </div>

                {/* Action Buttons — only for users with accounts */}
                <div className="space-y-2">
                  {!expert._isExpertProfile && (
                    <Button
                      onClick={() => followMutation.mutate(expert.email)}
                      variant={isFollowing(expert.email) ? "outline" : "default"}
                      className={`w-full ${
                        !isFollowing(expert.email) && "bg-gradient-to-r from-purple-600 to-pink-600"
                      }`}
                    >
                      {isFollowing(expert.email) ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}

                  {!expert._isExpertProfile && (
                    isConnected(expert.email) ? (
                      <Button disabled className="w-full" variant="outline">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Connected
                      </Button>
                    ) : isPending(expert.email) ? (
                      <Button disabled className="w-full" variant="outline">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Pending
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full bg-[#7340B9] hover:bg-[#5B2D83]"
                            onClick={() => handleConnect(expert)}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Request Connection
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Connect with {expert.full_name}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Why would you like to connect?
                              </label>
                              <Textarea
                                value={connectionNote}
                                onChange={(e) => setConnectionNote(e.target.value)}
                                placeholder="Share what you're working on and how this expert can support you..."
                                className="min-h-[120px]"
                              />
                            </div>
                            <Button
                              onClick={submitConnection}
                              disabled={!connectionNote.trim() || requestConnectionMutation.isPending}
                              className="w-full bg-[#7340B9] hover:bg-[#5B2D83]"
                            >
                              {requestConnectionMutation.isPending ? "Sending..." : "Send Connection Request"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )
                  )}

                  {!expert._isExpertProfile && expert.offerings && expert.offerings.length > 0 && (
                    <Button variant="outline" className="w-full">
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Offerings
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExperts.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No experts found
            </h3>
            <p className="text-gray-500">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}