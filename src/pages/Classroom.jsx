import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Search, BookOpen, Clock, Users, ArrowRight, Star } from "lucide-react";

export default function Classroom() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [enrollment, setEnrollment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load published courses, sorted by created_date (oldest first)
        const allCourses = await base44.entities.Course.filter({ isPublished: true }, "created_date");
        setCourses(allCourses);

        // Load user's enrollment/progress
        const prog = await base44.entities.CourseProgress.filter({});
        setEnrollment(prog);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCourseProgress = (courseId) => {
    const courseProgress = enrollment.filter((p) => p.courseId === courseId);
    if (courseProgress.length === 0) return 0;
    const completed = courseProgress.filter((p) => p.status === "completed").length;
    return Math.round((completed / courseProgress.length) * 100);
  };

  const filteredCourses = courses.filter((course) =>
    !searchQuery ||
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: "#DEBECC" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-[#6E1D40] mb-2">Classroom</h1>
          <p className="text-gray-600">Explore your courses and continue your learning journey.</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="pl-10 rounded-xl border-gray-200 bg-white"
            />
          </div>
        </motion.div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-[#3B224E] border-t-transparent rounded-full" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery ? "No courses found" : "No courses available yet"}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? "Try a different search term." : "Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, idx) => {
              const progress = getCourseProgress(course.id);
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                >
                  <Link to={createPageUrl("CourseDetail") + `?courseId=${course.id}`}>
                    <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer bg-white overflow-hidden group">
                      {/* Cover Image */}
                      <div className="h-44 bg-gradient-to-br from-[#6E1D40] to-[#9B3A6A] relative overflow-hidden">
                        {course.coverImage ? (
                          <img
                            src={course.coverImage}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-white/40" />
                          </div>
                        )}
                        {course.isFeatured && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-amber-400 text-amber-900 border-0 text-xs font-semibold">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
                          <div
                            className="h-full bg-green-400 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <CardContent className="p-5">
                        {course.category && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-xs mb-3">
                            {course.category}
                          </Badge>
                        )}
                        <h3 className="font-bold text-[#6E1D40] text-lg leading-snug mb-2 group-hover:text-[#9B3A6A] transition-colors">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                            {course.description}
                          </p>
                        )}

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Progress</span>
                            <span className="text-xs font-semibold text-[#3B224E]">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-400 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {course.enrollmentCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {course.enrollmentCount}
                              </span>
                            )}
                            {course.price > 0 ? (
                              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                                ${course.price}
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                Free
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[#3B224E] text-sm font-medium">
                            {progress > 0 ? `${progress}% done` : "Start"}
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}