import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Search, BookOpen, Clock, Users, ArrowRight, Star, Play, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Classroom() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [enrollment, setEnrollment] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [paidCourseIds, setPaidCourseIds] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current user info
        const me = await base44.auth.me();
        const email = me?.email?.toLowerCase();
        setUserEmail(email);
        setIsAdmin(['owner', 'admin', 'master_admin'].includes(me?.role));

        // Load paid enrollments for this user
        if (email) {
          const myEnrollments = await base44.entities.CourseEnrollment.filter({ userEmail: email, isPaid: true });
          setPaidCourseIds(myEnrollments.map(e => e.courseId));
        }

        // Load published courses, sorted by created_date (oldest first)
        const allCourses = await base44.entities.Course.filter({ isPublished: true }, "created_date");
        setCourses(allCourses);

        // Load all course modules to know total counts
        const modules = await base44.entities.CourseModule.filter({});
        setAllModules(modules);

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
    const courseModules = allModules.filter((m) => m.courseId === courseId);
    if (courseModules.length === 0) return 0;
    const completedModules = courseModules.filter((m) => {
      const p = enrollment.find((pr) => pr.moduleId === m.id && pr.status === "completed");
      return !!p;
    }).length;
    return Math.round((completedModules / courseModules.length) * 100);
  };

  // Find most recently accessed module to resume
  const getResumeInfo = () => {
    if (enrollment.length === 0) return null;
    // Sort by lastAccessedAt or updated_date, most recent first
    const sorted = [...enrollment]
      .filter(p => p.moduleId && p.status !== "completed")
      .sort((a, b) => {
        const dateA = a.lastAccessedAt || a.updated_date || a.created_date || "";
        const dateB = b.lastAccessedAt || b.updated_date || b.created_date || "";
        return dateB.localeCompare(dateA);
      });
    const latest = sorted[0];
    if (!latest) {
      // All completed — find most recently touched
      const allSorted = [...enrollment]
        .filter(p => p.moduleId)
        .sort((a, b) => {
          const dateA = a.lastAccessedAt || a.updated_date || a.created_date || "";
          const dateB = b.lastAccessedAt || b.updated_date || b.created_date || "";
          return dateB.localeCompare(dateA);
        });
      if (allSorted.length === 0) return null;
      const mod = allModules.find(m => m.id === allSorted[0].moduleId);
      const course = courses.find(c => c.id === allSorted[0].courseId);
      return { moduleId: allSorted[0].moduleId, courseId: allSorted[0].courseId, moduleTitle: mod?.title, courseTitle: course?.title };
    }
    const mod = allModules.find(m => m.id === latest.moduleId);
    const course = courses.find(c => c.id === latest.courseId);
    return { moduleId: latest.moduleId, courseId: latest.courseId, moduleTitle: mod?.title, courseTitle: course?.title };
  };
  const resumeInfo = getResumeInfo();

  const filteredCourses = courses.filter((course) =>
    !searchQuery ||
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: "#E6E7EB" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#6E1D40] mb-2">Classroom</h1>
              <p className="text-gray-600">Explore your courses and continue your learning journey.</p>
            </div>
            {resumeInfo && (
              <Link to={createPageUrl("ModulePlayer") + `?moduleId=${resumeInfo.moduleId}&courseId=${resumeInfo.courseId}`}>
                <Button className="bg-[#6E1D40] hover:bg-[#5A1633] text-white gap-2 shadow-lg">
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Resume: </span>
                  <span className="max-w-[150px] truncate">{resumeInfo.moduleTitle || "Continue"}</span>
                </Button>
              </Link>
            )}
          </div>
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
            <div className="animate-spin w-8 h-8 border-4 border-[#6E1D40] border-t-transparent rounded-full" />
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
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${progress}%`,
                              background: progress >= 100
                                ? '#22c55e'
                                : `repeating-linear-gradient(-45deg, #6E1D40, #6E1D40 4px, #943A59 4px, #943A59 8px)`,
                            }}
                          />
                        </div>
                      </div>

                      <CardContent className="p-5">
                        {course.category && (
                          <Badge className="bg-[#943A59]/20 text-[#6E1D40] border-[#943A59]/30 border text-xs mb-3">
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
                            <span className="text-xs font-semibold text-[#6E1D40]">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${progress}%`,
                                background: progress >= 100
                                  ? '#22c55e'
                                  : `repeating-linear-gradient(-45deg, #6E1D40, #6E1D40 4px, #943A59 4px, #943A59 8px)`,
                              }}
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
                            {course.price > 0 && !paidCourseIds.includes(course.id) && !isAdmin ? (
                              <Badge className="bg-amber-100 text-amber-800 border-0 text-xs flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                ${course.price}
                              </Badge>
                            ) : course.price > 0 ? (
                              <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                Purchased
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                Free
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[#6E1D40] text-sm font-medium">
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