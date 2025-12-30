import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Lock, ChevronRight, Heart, Briefcase, Brain, TrendingUp } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

// Mock data for community spaces
const communitySpaces = [
  {
    id: 1,
    tag: "Life stage • Support space • Guided",
    title: "Navigating a breakup",
    description: "A grounded space for women experiencing this chapter.",
    members: 128,
    isPrivate: true,
    gradient: "from-rose-400 to-pink-500"
  },
  {
    id: 2,
    tag: "Work & ambition • Nervous system",
    title: "Building without burnout",
    description: "For high-capacity women in a low-energy season.",
    members: 256,
    isPrivate: true,
    gradient: "from-purple-400 to-indigo-500"
  },
  {
    id: 3,
    tag: "Cycle-aware living • Relationships",
    title: "Cycle-aware work & life",
    description: "Understanding your body's rhythm in real time.",
    members: 189,
    isPrivate: false,
    gradient: "from-amber-400 to-orange-500"
  },
  {
    id: 4,
    tag: "Relationships • Support space",
    title: "Redefining love & boundaries",
    description: "A space for women redesigning their relationships.",
    members: 94,
    isPrivate: true,
    gradient: "from-teal-400 to-cyan-500"
  },
  {
    id: 5,
    tag: "Work & ambition • Life stage",
    title: "High-capacity women in a low-energy season",
    description: "For ambitious women navigating depletion.",
    members: 312,
    isPrivate: true,
    gradient: "from-violet-400 to-purple-500"
  },
  {
    id: 6,
    tag: "Nervous system • Support space",
    title: "Understanding emotional patterns in luteal",
    description: "Processing the shifts before your period.",
    members: 203,
    isPrivate: false,
    gradient: "from-pink-400 to-rose-500"
  }
];

const recommendedSpaces = [
  {
    id: 7,
    tag: "Nervous system • Cycle-aware",
    title: "Understanding emotional patterns in luteal",
    description: "Based on your recent check-ins and cycle phase.",
    members: 203,
    isPrivate: false,
    gradient: "from-blue-400 to-indigo-500"
  },
  {
    id: 8,
    tag: "Relationships • Support space",
    title: "Boundaries without guilt",
    description: "Based on your nervous system state.",
    members: 167,
    isPrivate: true,
    gradient: "from-emerald-400 to-teal-500"
  },
  {
    id: 9,
    tag: "Life stage • Support space",
    title: "Restoring safety after heartbreak",
    description: "A space to rebuild trust and stability.",
    members: 142,
    isPrivate: true,
    gradient: "from-fuchsia-400 to-pink-500"
  }
];

const communityGuides = [
  {
    id: 1,
    name: "Sarah Chen",
    area: "Nervous System",
    image: "https://i.pravatar.cc/150?img=1"
  },
  {
    id: 2,
    name: "Maya Patel",
    area: "Relationships",
    image: "https://i.pravatar.cc/150?img=5"
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    area: "Cycle Awareness",
    image: "https://i.pravatar.cc/150?img=9"
  },
  {
    id: 4,
    name: "Jasmine Lee",
    area: "Work & Ambition",
    image: "https://i.pravatar.cc/150?img=20"
  }
];

const recentActivity = [
  { text: "New women joined Navigating a Breakup", time: "2m ago" },
  { text: "Live circle tomorrow in Building Without Burnout", time: "1h ago" },
  { text: "Reflection posted in Cycle-Aware Work", time: "3h ago" },
  { text: "Weekly session starts in Boundaries Without Guilt", time: "5h ago" }
];

export default function Community() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  React.useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const filters = ["All", "Life stage", "Relationships", "Work & ambition", "Nervous system", "Cycle-aware living"];

  const filteredSpaces = activeFilter === "All" 
    ? communitySpaces 
    : communitySpaces.filter(space => space.tag.includes(activeFilter));

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6B1B3D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-indigo-50/30">
      {/* Top Bar */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900 tracking-tight">Community</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-light">You don't have to navigate this season alone.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Search className="w-5 h-5 text-gray-600" />
              </Button>
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentUser?.profile_picture} />
                <AvatarFallback className="bg-purple-100 text-purple-700">
                  {currentUser?.full_name?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left/Center */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 p-12"
            >
              <div className="relative z-10">
                <h2 className="text-3xl font-light text-white mb-3 tracking-tight">Find your people</h2>
                <p className="text-white/90 text-lg font-light mb-8 max-w-md">
                  Spaces for women in the same life stage, season, or emotional rhythm as you.
                </p>
                <div className="flex gap-3">
                  <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 rounded-full px-8 font-light shadow-lg">
                    Explore groups
                  </Button>
                  <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 rounded-full px-8 font-light">
                    How this works
                  </Button>
                </div>
              </div>
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            </motion.div>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-light text-gray-900 tracking-tight">Community spaces</h3>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {filters.map((filter) => (
                <Button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  variant="ghost"
                  size="sm"
                  className={`rounded-full whitespace-nowrap font-light ${
                    activeFilter === filter
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {filter}
                </Button>
              ))}
            </div>

            {/* Community Spaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSpaces.map((space, idx) => (
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                    {/* Gradient Header */}
                    <div className={`h-32 bg-gradient-to-br ${space.gradient} relative`}>
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 font-light text-xs">
                          {space.tag.split(' • ')[0]}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h4 className="font-medium text-gray-900 text-lg">{space.title}</h4>
                      <p className="text-sm text-gray-600 font-light line-clamp-1">{space.description}</p>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1 font-light">
                          <Users className="w-4 h-4" />
                          {space.members} women
                        </span>
                        {space.isPrivate && (
                          <span className="flex items-center gap-1 font-light">
                            <Lock className="w-4 h-4" />
                            Private
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-light">
                        Enter space
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recommended Section */}
            <div className="mt-12">
              <div className="mb-4">
                <h3 className="text-xl font-light text-gray-900 tracking-tight mb-1">Recommended for you</h3>
                <p className="text-sm text-gray-500 font-light">Based on your recent check-ins, cycle phase, and nervous system state.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedSpaces.map((space, idx) => (
                  <motion.div
                    key={space.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow bg-white/60 backdrop-blur-sm">
                      <div className={`h-24 bg-gradient-to-br ${space.gradient}`} />
                      <div className="p-4 space-y-2">
                        <h4 className="font-medium text-gray-900 text-sm">{space.title}</h4>
                        <p className="text-xs text-gray-600 font-light line-clamp-2">{space.description}</p>
                        <Button variant="ghost" size="sm" className="w-full text-gray-700 hover:bg-gray-100 rounded-lg font-light text-xs">
                          View space
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Community Guides */}
            <Card className="border-0 shadow-sm p-6 bg-white/60 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Community guides</h3>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-light">See all</button>
              </div>
              <div className="space-y-3">
                {communityGuides.map((guide) => (
                  <div key={guide.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={guide.image} />
                        <AvatarFallback className="bg-purple-100 text-purple-700">
                          {guide.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{guide.name}</p>
                        <p className="text-xs text-gray-500 font-light">{guide.area}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs font-light">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* What's Happening */}
            <Card className="border-0 shadow-sm p-6 bg-white/60 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">What's happening</h3>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-light">See all</button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-light">{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-light">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}