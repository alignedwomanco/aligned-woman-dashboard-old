import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import {
  Clock,
  Eye,
  Unlock,
  Target,
  Compass,
  Search,
  Play,
  Lock,
  CheckCircle,
} from "lucide-react";
import GamificationStats from "@/components/classroom/GamificationStats";
import LeaderboardCard from "@/components/classroom/LeaderboardCard";

const phaseIcons = {
  Awareness: Eye,
  Liberation: Unlock,
  Intention: Target,
  VisionEmbodiment: Compass,
};

const phaseColors = {
  Awareness: "bg-blue-100 text-blue-700 border-blue-200",
  Liberation: "bg-purple-100 text-purple-700 border-purple-200",
  Intention: "bg-pink-100 text-[#6B1B3D] border-pink-200",
  VisionEmbodiment: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function Classroom() {
  const [activePhase, setActivePhase] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Load modules
        const modules = await base44.entities.Module.list("order");
        setAllModules(modules);

        // Load module progress
        const progress = await base44.entities.UserModuleProgress.list();
        setModuleProgress(progress);

        // Load user points
        const points = await base44.entities.UserPoints.filter({});
        setUserPoints(points[0] || null);

        // Load user badges
        const badges = await base44.entities.UserBadge.list("-earnedDate");
        setUserBadges(badges);

        // Load leaderboard
        const allUsers = await base44.entities.User.list();
        const allPoints = await base44.entities.UserPoints.list("-points");
        
        const leaderboardData = allPoints
          .map((pts) => {
            const usr = allUsers.find((u) => u.email === pts.created_by);
            return {
              ...pts,
              email: pts.created_by,
              full_name: usr?.full_name,
              profile_picture: usr?.profile_picture,
            };
          })
          .slice(0, 10);
        
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error("Error loading classroom data:", error);
      }
    };
    loadData();
  }, []);

  const getModuleStatus = (moduleId) => {
    const progress = moduleProgress.find(p => p.moduleId === moduleId);
    if (!progress) return "Available";
    return progress.status;
  };

  const filteredModules = allModules
    .filter((module) => module.isEnabled) // Only show enabled modules
    .filter((module) => {
      const phaseMatch = activePhase === "all" || module.phase === activePhase;
      const searchMatch = 
        module.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      return phaseMatch && searchMatch;
    });

  const getStatusIcon = (status) => {
    switch (status) {
      case "Complete": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "InProgress": return <Play className="w-5 h-5 text-[#6B1B3D]" />;
      case "Available": return <Play className="w-5 h-5 text-gray-400" />;
      default: return <Lock className="w-5 h-5 text-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">Classroom</h1>
          <p className="text-gray-600">
            Browse all available modules across the ALIVE Method phases.
          </p>
        </motion.div>

        {/* Gamification Stats */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GamificationStats userPoints={userPoints} userBadges={userBadges} />
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Left Column - Modules */}
          <div>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex flex-col sm:flex-row gap-4"
            >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules..."
              className="pl-10 rounded-xl border-gray-200"
            />
          </div>
              <Tabs value={activePhase} onValueChange={setActivePhase}>
                <TabsList className="bg-white border">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="Awareness">Awareness</TabsTrigger>
                  <TabsTrigger value="Liberation">Liberation</TabsTrigger>
                  <TabsTrigger value="Intention">Intention</TabsTrigger>
                  <TabsTrigger value="VisionEmbodiment">Vision</TabsTrigger>
                </TabsList>
              </Tabs>
            </motion.div>

            {/* Modules Grid */}
            <div className="grid md:grid-cols-2 gap-6">
          {filteredModules.map((module, index) => {
            const PhaseIcon = phaseIcons[module.phase];
            const status = getModuleStatus(module.id);
            const isClickable = status !== "Locked";

            const cardContent = (
              <Card className={`h-full transition-all ${isClickable ? "hover:shadow-lg cursor-pointer" : "opacity-60"}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={`${phaseColors[module.phase]} border`}>
                      <PhaseIcon className="w-3 h-3 mr-1" />
                      {module.phase === "VisionEmbodiment" ? "Vision" : module.phase}
                    </Badge>
                    {getStatusIcon(status)}
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-2 ${status === "Locked" ? "text-gray-400" : "text-[#4A1228]"}`}>
                    {module.title}
                  </h3>
                  
                  <p className={`text-sm mb-4 line-clamp-2 ${status === "Locked" ? "text-gray-400" : "text-gray-600"}`}>
                    {module.summary}
                  </p>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {module.durationMinutes || 45} min
                    </span>
                    {status === "Locked" && (
                      <span className="text-gray-400">Locked</span>
                    )}
                    {status === "Complete" && (
                      <span className="text-green-600 font-medium">Complete</span>
                    )}
                    {status === "InProgress" && (
                      <span className="text-[#6B1B3D] font-medium">In Progress</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {isClickable ? (
                  <Link to={createPageUrl("ModulePlayer") + `?id=${module.id}`}>
                    {cardContent}
                  </Link>
                ) : (
                  cardContent
                )}
              </motion.div>
            );
          })}
        </div>

            {allModules.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Modules Yet</h3>
                <p className="text-gray-500 mb-6">Modules haven't been created yet. Check back soon!</p>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500">No modules found matching your criteria.</p>
              </div>
            ) : null}
          </div>

          {/* Right Column - Leaderboard */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-6"
            >
              <LeaderboardCard 
                leaderboard={leaderboard} 
                currentUserEmail={currentUser?.email} 
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}