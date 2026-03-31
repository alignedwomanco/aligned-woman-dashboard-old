import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, CheckCircle, Play, Zap, Award } from "lucide-react";

export default function SectionDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sectionId = searchParams.get("sectionId");
  const courseId = searchParams.get("courseId");
  
  const [section, setSection] = useState(null);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sectionId) return;
    const loadData = async () => {
      try {
        const sections = await base44.entities.CourseSection.filter({ id: sectionId });
        const sectionData = sections[0];
        setSection(sectionData);

        if (courseId) {
          const courses = await base44.entities.Course.filter({ id: courseId });
          setCourse(courses[0]);
        }

        // Load modules for this section
        const sectionModules = await base44.entities.CourseModule.filter({ sectionId });
        // Sort: items with explicit order first (by order), then by created_date
        const sorted = sectionModules.sort((a, b) => {
          const aHasOrder = a.order !== undefined && a.order !== null;
          const bHasOrder = b.order !== undefined && b.order !== null;
          if (aHasOrder && bHasOrder) return a.order - b.order;
          if (aHasOrder) return -1;
          if (bHasOrder) return 1;
          return (a.created_date || "").localeCompare(b.created_date || "");
        });
        setModules(sorted);

        // Load progress
        const prog = await base44.entities.CourseProgress.filter({});
        setProgress(prog);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [sectionId, courseId]);

  const getModuleProgress = (moduleId) => {
    const p = progress.find((p) => p.moduleId === moduleId);
    return p?.progressPercentage || 0;
  };

  const getModuleStatus = (moduleId) => {
    const p = progress.find((p) => p.moduleId === moduleId);
    if (!p || p.status === "not_started") return "Available";
    if (p.status === "completed") return "Complete";
    return "InProgress";
  };

  const completedCount = modules.filter(m => getModuleStatus(m.id) === "Complete").length;
  const sectionProgress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#3B224E] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Section not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4CAFB" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={() => navigate(-1)} className="inline-block mb-4">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </button>

        {/* Section Banner */}
        <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: "var(--theme-secondary, #5B2E84)" }}>
          <div className="h-48 bg-gradient-to-br from-[#3B224E] to-[#5B2E84] relative">
            {section.coverImage ? (
              <img src={section.coverImage} alt={section.title} className="w-full h-full object-cover opacity-70" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600" />
            )}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h1 className="text-3xl font-bold text-white">{section.title}</h1>
              {section.description && (
                <p className="text-white/80 text-sm mt-1">{section.description}</p>
              )}
            </div>
          </div>

          {/* Progress Info */}
          <div className="bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{modules.length} modules</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#3B224E]">{sectionProgress}% Complete</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 transition-all" style={{ width: `${sectionProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {modules.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No modules in this section yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((module, idx) => {
              const status = getModuleStatus(module.id);
              const prog = getModuleProgress(module.id);
              const isCompleted = status === "Complete";

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link to={createPageUrl("ModulePlayer") + `?moduleId=${module.id}&courseId=${courseId}`}>
                    <Card className={`hover:shadow-lg transition-all cursor-pointer ${isCompleted ? "bg-green-50 border-green-200" : "bg-white"}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Number Badge */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#3B224E] text-white flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className={`font-semibold leading-snug ${isCompleted ? "text-gray-600 line-through" : "text-[#3B224E]"}`}>
                                  {module.title}
                                </h3>
                                {module.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                    {module.description}
                                  </p>
                                )}
                              </div>

                              {/* Status Icon */}
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : status === "InProgress" ? (
                                  <Zap className="w-5 h-5 text-purple-500" />
                                ) : (
                                  <Play className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {!isCompleted && (
                              <div className="mt-3 space-y-1">
                                <div className="flex justify-between items-center text-xs text-gray-600">
                                  <span>
                                    {module.durationMinutes > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {module.durationMinutes} min
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-semibold">{prog}%</span>
                                </div>
                                <Progress value={prog} className="h-1.5 max-w-[200px]" />
                              </div>
                            )}

                            {/* Completed Badge */}
                            {isCompleted && (
                              <div className="mt-2 flex items-center gap-1">
                                <Award className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-medium text-green-600">Completed</span>
                              </div>
                            )}
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