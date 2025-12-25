import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  Target, 
  TrendingUp, 
  Star, 
  ArrowRight, 
  Clock,
  Zap
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PersonalizedLearningPath({ 
  userPoints, 
  completedModules = [], 
  recommendedModules = [] 
}) {
  const level = userPoints?.level || 1;
  const currentStreak = userPoints?.currentStreak || 0;

  // Calculate progress to next level
  const pointsForNextLevel = level * 100;
  const currentLevelPoints = (level - 1) * 100;
  const progressToNextLevel = ((userPoints?.points || 0) - currentLevelPoints) / (pointsForNextLevel - currentLevelPoints) * 100;

  return (
    <div className="space-y-6">
      {/* Learning Path Header */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Your Personalized Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Level {level} Progress</span>
                <span className="text-sm text-purple-600 font-bold">{Math.round(progressToNextLevel)}%</span>
              </div>
              <Progress value={progressToNextLevel} className="h-3 bg-purple-100 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-600" />
              <p className="text-xs text-gray-600 mt-1">
                {pointsForNextLevel - (userPoints?.points || 0)} points to Level {level + 1}
              </p>
            </div>

            {currentStreak >= 3 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Zap className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    {currentStreak} Day Streak! Keep it up! 🔥
                  </p>
                  <p className="text-xs text-orange-700">
                    Bonus: +5 points for modules completed today
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Recommended For You
            </CardTitle>
            <Link to={createPageUrl("Classroom")}>
              <Button variant="ghost" size="sm" className="text-[#6B1B3D]">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendedModules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Complete your onboarding to get personalized recommendations</p>
              </div>
            ) : (
              recommendedModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl("ModulePlayer") + `?id=${module.id}`}>
                    <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-xs">
                              {module.phase}
                            </Badge>
                            {module.isRecommended && (
                              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-[#4A1228] mb-1">
                            {module.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {module.summary}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {module.duration} min
                            </span>
                            <span className="flex items-center gap-1 text-purple-600 font-medium">
                              <TrendingUp className="w-3 h-3" />
                              +{module.pointsReward || 20} pts
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#6B1B3D] flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Milestones */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Next Milestone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-[#4A1228]">Complete 5 Modules</p>
                <p className="text-sm text-gray-600">{completedModules.length}/5 completed</p>
              </div>
              <Badge className="bg-green-600 text-white">🏆 Level Up Badge</Badge>
            </div>
            <Progress 
              value={(completedModules.length / 5) * 100} 
              className="h-2 bg-green-100 [&>div]:bg-green-600" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}