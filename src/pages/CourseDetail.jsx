import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle, Play, Lock } from "lucide-react";

const PHASES = [
  { color: "#7340B9", light: "#EDE0FF", label: "Phase 1" },
  { color: "#C4687D", light: "#FCE8EC", label: "Phase 2" },
  { color: "#4B7BB5", light: "#E0ECFF", label: "Phase 3" },
  { color: "#5B9B6A", light: "#E0F5E8", label: "Phase 4" },
];

export default function CourseDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get("courseId");

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    const loadData = async () => {
      try {
        const [courses, courseSections, courseModules, prog] = await Promise.all([
          base44.entities.Course.filter({ id: courseId }),
          base44.entities.CourseSection.filter({ courseId }),
          base44.entities.CourseModule.filter({ courseId }),
          base44.entities.CourseProgress.filter({}),
        ]);

        setCourse(courses[0]);
        setSections(courseSections.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)));
        setModules(courseModules.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)));
        setProgress(prog);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const unsubscribe = base44.entities.CourseSection.subscribe((event) => {
      if (event.data?.courseId === courseId) {
        base44.entities.CourseSection.filter({ courseId }).then((s) => {
          setSections(s.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)));
        });
      }
    });
    return unsubscribe;
  }, [courseId]);

  const getSectionModules = (sectionId) =>
    modules
      .filter((m) => m.sectionId === sectionId)
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

  const getModuleStatus = (moduleId) => {
    const p = progress.find((p) => p.moduleId === moduleId);
    if (!p || p.status === "not_started") return "available";
    if (p.status === "completed") return "completed";
    return "in_progress";
  };

  const totalModules = modules.length;
  const completedModules = modules.filter(m => getModuleStatus(m.id) === "completed").length;
  const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Find resume module
  const getResumeModule = () => {
    for (const section of sections) {
      const mods = getSectionModules(section.id);
      for (const mod of mods) {
        if (getModuleStatus(mod.id) !== "completed") return mod;
      }
    }
    return null;
  };
  const resumeModule = getResumeModule();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#E4CAFB" }}>
        <div className="animate-spin w-8 h-8 border-4 border-[#3B224E] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#E4CAFB" }}>
        <p className="text-gray-500">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4CAFB" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="mb-6 inline-block">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Classroom
          </Button>
        </button>

        {/* Blueprint Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#3B224E] rounded-2xl overflow-hidden mb-6"
        >
          {course.coverImage && (
            <div className="h-48 relative overflow-hidden">
              <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#3B224E]" />
            </div>
          )}
          <div className="p-6">
            <p className="text-purple-300 text-xs font-semibold tracking-widest uppercase mb-2">
              The Aligned Woman Blueprint™
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-white/70 text-sm leading-relaxed mb-5">{course.description}</p>
            )}

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/70 text-xs">
                  {completedModules} of {totalModules} masterclasses complete
                </span>
                <span className="text-white text-xs font-bold">{overallProgress}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Resume CTA */}
            {resumeModule ? (
              <Link to={createPageUrl("ModulePlayer") + `?moduleId=${resumeModule.id}&courseId=${courseId}`}>
                <button className="inline-flex items-center gap-2 px-5 py-3 bg-white text-[#3B224E] font-semibold rounded-xl hover:bg-purple-50 transition-colors text-sm">
                  {completedModules > 0 ? "Continue Learning" : "Start Learning"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-green-400 text-green-900 font-semibold rounded-xl text-sm">
                <CheckCircle className="w-4 h-4" />
                Blueprint Complete!
              </div>
            )}
          </div>
        </motion.div>

        {/* Overview stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Phases", value: sections.length || 4 },
            { label: "Masterclasses", value: totalModules || 14 },
            { label: "Completed", value: completedModules },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-[#3B224E]">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Phase sections */}
        {sections.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold tracking-widest text-[#7340B9] uppercase mb-5">
              Curriculum — 4 Phases
            </h2>
            <div className="space-y-4">
              {sections.map((section, sIdx) => {
                const sectionMods = getSectionModules(section.id);
                const sectionCompleted = sectionMods.filter(m => getModuleStatus(m.id) === "completed").length;
                const sectionProg = sectionMods.length > 0 ? Math.round((sectionCompleted / sectionMods.length) * 100) : 0;
                const phase = PHASES[sIdx] || PHASES[0];

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sIdx * 0.08 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Section header */}
                    <div
                      className="px-5 py-4 flex items-center justify-between cursor-pointer"
                      style={{ borderLeft: `4px solid ${phase.color}` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: phase.color }}
                        >
                          {sIdx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-[#3B224E] text-sm leading-snug">{section.title}</p>
                          <p className="text-xs text-gray-400">{sectionMods.length} masterclasses · {sectionProg}% done</p>
                        </div>
                      </div>
                      <Link
                        to={createPageUrl("SectionDetail") + `?sectionId=${section.id}&courseId=${courseId}`}
                        className="flex-shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <div
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                          style={{ backgroundColor: phase.light, color: phase.color }}
                        >
                          Open <ArrowRight className="w-3 h-3" />
                        </div>
                      </Link>
                    </div>

                    {/* Module list */}
                    {sectionMods.length > 0 && (
                      <div className="border-t border-gray-50">
                        {sectionMods.map((mod, mIdx) => {
                          const status = getModuleStatus(mod.id);
                          return (
                            <Link
                              key={mod.id}
                              to={createPageUrl("ModulePlayer") + `?moduleId=${mod.id}&courseId=${courseId}`}
                              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                            >
                              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                {status === "completed" ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : status === "in_progress" ? (
                                  <Play className="w-4 h-4" style={{ color: phase.color }} />
                                ) : (
                                  <span className="text-xs font-bold text-gray-400">{mIdx + 1}</span>
                                )}
                              </div>
                              <p className={`text-sm flex-1 leading-snug ${status === "completed" ? "text-gray-400 line-through" : "text-[#3B224E] group-hover:text-[#5B2E84]"}`}>
                                {mod.title}
                              </p>
                              {mod.durationMinutes > 0 && (
                                <span className="text-xs text-gray-400 flex-shrink-0">{mod.durationMinutes}m</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}