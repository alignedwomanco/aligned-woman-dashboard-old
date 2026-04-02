import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, CheckCircle, Play, Zap, Award, User } from "lucide-react";

export default function SectionDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sectionId = searchParams.get("sectionId");
  const courseId = searchParams.get("courseId");
  
  const [section, setSection] = useState(null);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [experts, setExperts] = useState([]);
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

        // Load experts
        const allExperts = await base44.entities.Expert.list();
        setExperts(allExperts);

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
        <div className="animate-spin w-8 h-8 border-4 border-[#6E1D40] border-t-transparent rounded-full" />
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
    <div className="min-h-screen" style={{ backgroundColor: "#DEBECC" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={() => navigate(-1)} className="inline-block mb-4">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </button>

        {/* Section Banner */}
        <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: "#6E1D40" }}>
          <div className="h-48 bg-gradient-to-br from-[#6E1D40] to-[#943A59] relative">
            {section.coverImage ? (
              <img src={section.coverImage} alt={section.title} className="w-full h-full object-cover opacity-70" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#6E1D40] to-[#943A59]" />
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
                <span className="text-sm font-semibold text-[#6E1D40]">{sectionProgress}% Complete</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${sectionProgress}%`,
                      background: sectionProgress >= 100
                        ? '#22c55e'
                        : `repeating-linear-gradient(-45deg, #6E1D40, #6E1D40 4px, #943A59 4px, #943A59 8px)`,
                    }}
                  />
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
          <div className="space-y-6">
            {modules.map((module, idx) => {
              const status = getModuleStatus(module.id);
              const prog = getModuleProgress(module.id);
              const isCompleted = status === "Complete";
              const expert = module.expertId ? experts.find(e => e.id === module.expertId) : null;

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link to={createPageUrl("ModulePlayer") + `?moduleId=${module.id}&courseId=${courseId}`}>
                    <div className="relative">
                      {/* Number badge - overlapping left edge */}
                      <div className="absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-xl bg-[#6E1D40] text-white flex items-center justify-center font-bold text-lg shadow-md" style={{ left: '18px' }}>
                        {idx + 1}
                      </div>

                      {/* Card */}
                      <div className={`bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all cursor-pointer ${isCompleted ? "border-green-200" : "border-[#DEBECC]/60"}`}>
                        <div className="pl-16 pr-5 pt-5 pb-2 flex items-start gap-3">
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-base leading-snug ${isCompleted ? "text-gray-500 line-through" : "text-[#6E1D40]"}`}>
                              {module.title}
                            </h3>
                            {expert && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F5E8EE] rounded-md border border-[#DEBECC]">
                                <User className="w-3 h-3 text-[#6E1D40]" />
                                <span className="text-xs font-medium text-[#6E1D40]">{expert.name}</span>
                              </div>
                            )}
                            {module.description && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                                {module.description}
                              </p>
                            )}
                          </div>

                          {/* Play / Status Icon */}
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle className="w-8 h-8 text-green-500" />
                            ) : (
                              <Play className="w-8 h-8 text-[#6E1D40]" />
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="pl-16 pr-5 pb-4 pt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.max(prog, 2)}%`,
                                  background: isCompleted
                                    ? '#22c55e'
                                    : `repeating-linear-gradient(
                                        -45deg,
                                        #6E1D40,
                                        #6E1D40 5px,
                                        #943A59 5px,
                                        #943A59 10px
                                      )`,
                                }}
                              />
                            </div>
                            <span className={`text-base font-bold flex-shrink-0 ${isCompleted ? "text-green-600" : "text-[#6E1D40]"}`}>
                              {prog}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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