import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Users,
  Clock,
  TrendingUp,
  Video,
  CheckCircle,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminMetricsContent() {
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: () => base44.entities.Module.list("order"),
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ["allProgress"],
    queryFn: () => base44.entities.UserModuleProgress.list(),
  });

  const { data: allEngagement = [] } = useQuery({
    queryKey: ["allEngagement"],
    queryFn: () => base44.entities.ModuleEngagement.list("-created_date"),
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ["allSessions"],
    queryFn: () => base44.entities.UserSession.list("-loginTime"),
  });

  const regularUsers = allUsers.filter(u => u.role === "user");

  const getUserStats = (userId) => {
    const userProgress = allProgress.filter(p => p.created_by === userId);
    const userEngagement = allEngagement.filter(e => e.created_by === userId);
    const userSessions = allSessions.filter(s => s.created_by === userId);

    const completedModules = userProgress.filter(p => p.status === "Complete").length;
    const totalTimeSpent = userEngagement.reduce((sum, e) => sum + (e.sessionDuration || 0), 0);
    const totalSessions = userSessions.length;
    const avgSessionTime = totalSessions > 0 
      ? userSessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / totalSessions 
      : 0;

    return {
      completedModules,
      totalTimeSpent,
      totalSessions,
      avgSessionTime,
      lastLogin: userSessions[0]?.loginTime,
    };
  };

  const getModuleStats = (moduleId) => {
    const moduleProgress = allProgress.filter(p => p.moduleId === moduleId);
    const moduleEngagement = allEngagement.filter(e => e.moduleId === moduleId);

    const started = moduleProgress.filter(p => p.status === "InProgress" || p.status === "Complete").length;
    const completed = moduleProgress.filter(p => p.status === "Complete").length;
    const avgTime = moduleEngagement.length > 0
      ? moduleEngagement.reduce((sum, e) => sum + (e.sessionDuration || 0), 0) / moduleEngagement.length
      : 0;
    const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

    return { started, completed, avgTime, completionRate };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#4A1228]">Course Analytics</h2>
        <p className="text-gray-600">Track user engagement and module performance</p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4A1228]">{regularUsers.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4A1228]">
                  {allProgress.filter(p => p.status === "Complete").length}
                </div>
                <div className="text-sm text-gray-600">Total Completions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4A1228]">
                  {formatTime(allEngagement.reduce((sum, e) => sum + (e.sessionDuration || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Watch Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4A1228]">{allSessions.length}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Modules Completed</TableHead>
                    <TableHead>Total Time</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Avg Session</TableHead>
                    <TableHead>Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularUsers.map((user) => {
                    const stats = getUserStats(user.email);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.profile_picture} />
                              <AvatarFallback className="bg-[#6B1B3D] text-white">
                                {user.full_name?.[0] || user.email?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.full_name || "User"}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            {stats.completedModules}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTime(stats.totalTimeSpent)}</TableCell>
                        <TableCell>{stats.totalSessions}</TableCell>
                        <TableCell>{formatTime(stats.avgSessionTime)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {stats.lastLogin 
                            ? new Date(stats.lastLogin).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Module Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Avg Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => {
                    const stats = getModuleStats(module.id);
                    return (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{module.phase}</Badge>
                        </TableCell>
                        <TableCell>{stats.started}</TableCell>
                        <TableCell>{stats.completed}</TableCell>
                        <TableCell>
                          <Badge className={
                            stats.completionRate >= 70 
                              ? "bg-green-100 text-green-800"
                              : stats.completionRate >= 40
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }>
                            {stats.completionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTime(stats.avgTime)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allEngagement.slice(0, 20).map((engagement) => {
                  const user = allUsers.find(u => u.email === engagement.created_by);
                  const module = modules.find(m => m.id === engagement.moduleId);
                  return (
                    <motion.div
                      key={engagement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <Avatar>
                        <AvatarImage src={user?.profile_picture} />
                        <AvatarFallback className="bg-[#6B1B3D] text-white">
                          {user?.full_name?.[0] || user?.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">
                          {user?.full_name || "User"} - {module?.title || "Unknown Module"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {engagement.activityType.replace("_", " ")} • {formatTime(engagement.sessionDuration || 0)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(engagement.created_date).toLocaleString()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}