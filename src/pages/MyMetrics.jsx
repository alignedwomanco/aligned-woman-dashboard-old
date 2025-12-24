import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Clock,
  TrendingUp,
  Target,
  CheckCircle,
  Award,
  Calendar,
  Flame,
} from "lucide-react";
import { motion } from "framer-motion";

export default function MyMetrics() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: moduleProgress = [] } = useQuery({
    queryKey: ["myProgress"],
    queryFn: () => base44.entities.UserModuleProgress.list("-updated_date"),
    initialData: [],
  });

  const { data: engagement = [] } = useQuery({
    queryKey: ["myEngagement"],
    queryFn: () => base44.entities.ModuleEngagement.list("-created_date"),
    initialData: [],
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["mySessions"],
    queryFn: () => base44.entities.UserSession.list("-loginTime", 30),
    initialData: [],
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: () => base44.entities.Module.list("order"),
    initialData: [],
  });

  const completedModules = moduleProgress.filter(p => p.status === "Complete").length;
  const inProgressModules = moduleProgress.filter(p => p.status === "InProgress").length;
  const totalTimeSpent = engagement.reduce((sum, e) => sum + (e.sessionDuration || 0), 0);
  const totalSessions = sessions.length;
  const avgSessionTime = totalSessions > 0
    ? sessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / totalSessions
    : 0;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculateStreak = () => {
    if (sessions.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasSession = sessions.some(s => {
        const sessionDate = new Date(s.loginTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime();
      });

      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();
  const completionRate = modules.length > 0 
    ? Math.round((completedModules / modules.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">My Performance</h1>
          <p className="text-gray-600">Track your progress and growth</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#4A1228]">{completedModules}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
                <Progress value={completionRate} className="h-2" />
                <div className="text-xs text-gray-500 mt-2">{completionRate}% of all modules</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#4A1228]">{currentStreak}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#4A1228]">{formatTime(totalTimeSpent)}</div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#4A1228]">{inProgressModules}</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Stats */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList>
            <TabsTrigger value="progress">Module Progress</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Your Module Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {moduleProgress.map((progress) => {
                  const module = modules.find(m => m.id === progress.moduleId);
                  if (!module) return null;
                  
                  return (
                    <div key={progress.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-[#4A1228]">{module.title}</div>
                        <Badge className={
                          progress.status === "Complete"
                            ? "bg-green-100 text-green-800"
                            : progress.status === "InProgress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }>
                          {progress.status}
                        </Badge>
                      </div>
                      <Progress value={progress.videoWatchedPercent || 0} className="h-2" />
                      <div className="text-xs text-gray-500 mt-2">
                        {progress.videoWatchedPercent || 0}% watched
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {engagement.slice(0, 15).map((activity) => {
                    const module = modules.find(m => m.id === activity.moduleId);
                    return (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{module?.title || "Unknown"}</div>
                          <div className="text-xs text-gray-500">
                            {activity.activityType.replace("_", " ")} • {formatTime(activity.sessionDuration || 0)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(activity.created_date).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-6 border-2 border-green-200 rounded-xl bg-green-50">
                    <Award className="w-8 h-8 text-green-600 mb-3" />
                    <div className="font-bold text-lg text-green-900">
                      {completedModules} Modules
                    </div>
                    <div className="text-sm text-green-700">Completed</div>
                  </div>

                  <div className="p-6 border-2 border-orange-200 rounded-xl bg-orange-50">
                    <Flame className="w-8 h-8 text-orange-600 mb-3" />
                    <div className="font-bold text-lg text-orange-900">
                      {currentStreak} Days
                    </div>
                    <div className="text-sm text-orange-700">Current Streak</div>
                  </div>

                  <div className="p-6 border-2 border-purple-200 rounded-xl bg-purple-50">
                    <Clock className="w-8 h-8 text-purple-600 mb-3" />
                    <div className="font-bold text-lg text-purple-900">
                      {formatTime(totalTimeSpent)}
                    </div>
                    <div className="text-sm text-purple-700">Learning Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}