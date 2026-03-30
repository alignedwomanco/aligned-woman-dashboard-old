import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ArrowRight, BookOpen, CheckCircle, Clock } from "lucide-react";

const CANONICAL_PHASES = [
  { label: "Phase 1", name: "Awareness", count: 5, color: "#7340B9", light: "#EDE0FF" },
  { label: "Phase 2", name: "Liberation", count: 3, color: "#C4687D", light: "#FCE8EC" },
  { label: "Phase 3", name: "Intention", count: 3, color: "#4B7BB5", light: "#E0ECFF" },
  { label: "Phase 4", name: "Vision & Embodiment", count: 3, color: "#5B9B6A", light: "#E0F5E8" },
];
const CANONICAL_TOTAL = 14;

export default function Classroom() {
  const [blueprintCourse, setBlueprintCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allCourses = await base44.entities.Course.filter({ isPublished: true });
        const blueprint = allCourses.find(c => c.isFeatured) || allCourses[0];
        setBlueprintCourse(blueprint);

        if (blueprint) {
          const [courseSections, courseModules, prog] = await Promise.all([
            base44.entities.CourseSection.filter({ courseId: blueprint.id }),
            base44.entities.CourseModule.filter({ courseId: blueprint.id }),
            base44.entities.CourseProgress.filter({}),
          ]);

          // Sort sections by order field, fallback to created_date ASC
          const sorted = courseSections.sort((a, b) => {
            if (a.order != null && b.order != null) return a.order - b.order;
            if (a.order != null) return -1;
            if (b.order != null) return 1;
            return (a.created_date || "").localeCompare(b.created_date || "");
          });
          setSections(sorted);
          setModules(courseModules);
          setProgress(prog);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Use actual module count, but display canonical total (14) if data not yet populated
  const totalBasis = Math.max(modules.length, CANONICAL_TOTAL);
  const completedModules = modules.filter(m => {
    const p = progress.find(pr => pr.moduleId === m.id);
    return p?.status === "completed";
  }).length;
  const inProgressModules = modules.filter(m => {
    const p = progress.find(pr => pr.moduleId === m.id);
    return p?.status === "in_progress";
  }).length;
  const overallProgress = totalBasis > 0 ? Math.round((completedModules / totalBasis) * 100) : 0;

  // Find the first incomplete module to resume
  const getResumeModule = () => {
    for (const section of sections) {
      const sectionMods = modules
        .filter(m => m.sectionId === section.id)
        .sort((a, b) => {
          if (a.order != null && b.order != null) return a.order - b.order;
          return (a.created_date || "").localeCompare(b.created_date || "");
        });
      for (const mod of sectionMods) {
        const p = progress.find(pr => pr.moduleId === mod.id);
        if (!p || p.status !== "completed") return { module: mod, section };
      }
    }
    return null;
  };

  const resumeTarget = getResumeModule();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#E4CAFB" }}>
        <div className="animate-spin w-8 h-8 border-4 border-[#3B224E] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: "#E4CAFB" }}>
      <div className="max-w-4xl mx-auto">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-xs font-bold tracking-widest text-[#7340B9] uppercase mb-1">Classroom / Flagship Course</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#3B224E] leading-tight mb-2">
            The Aligned Woman Blueprint™
          </h1>
          <p className="text-gray-600 text-sm max-w-xl">
            Your personal operating system for embodied success — 4 phases, {CANONICAL_TOTAL} masterclasses.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-5">

          {/* ── Left column: Progress + Phase cards ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Progress Snapshot */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Progress Snapshot</p>
              <h2 className="text-lg font-bold text-[#3B224E] mb-3">Your Blueprint Journey</h2>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-[#7340B9] rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#3B224E]">{completedModules}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#3B224E]">{inProgressModules}</p>
                  <p className="text-xs text-gray-400 mt-0.5">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#3B224E]">{CANONICAL_TOTAL}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total Masterclasses</p>
                </div>
              </div>

              {/* Resume CTA */}
              {resumeTarget ? (
                <Link
                  to={createPageUrl("ModulePlayer") + `?moduleId=${resumeTarget.module.id}&courseId=${blueprintCourse?.id}`}
                  className="flex items-center justify-between w-full px-4 py-3 bg-[#3B224E] text-white rounded-xl hover:bg-[#5B2E84] transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {completedModules > 0 ? "Resume where you left off" : "Start Learning"}
                    </p>
                    {resumeTarget.module.title && (
                      <p className="text-xs text-white/70 mt-0.5">Continue: {resumeTarget.module.title}</p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Link>
              ) : completedModules > 0 ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-green-700">Blueprint Complete!</p>
                </div>
              ) : (
                blueprintCourse && (
                  <Link
                    to={createPageUrl("CourseDetail") + `?courseId=${blueprintCourse.id}`}
                    className="flex items-center justify-between w-full px-4 py-3 bg-[#3B224E] text-white rounded-xl hover:bg-[#5B2E84] transition-colors group"
                  >
                    <p className="text-sm font-semibold">Start Learning</p>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )
              )}
            </motion.div>

            {/* Phase Entry Cards */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Phase Entry Cards</p>
              <div className="space-y-3">
                {(sections.length > 0 ? sections : CANONICAL_PHASES.map(p => ({ id: p.name, title: p.name, _canonical: p }))).map((section, idx) => {
                  const phase = CANONICAL_PHASES[idx] || CANONICAL_PHASES[0];
                  const sectionMods = modules.filter(m => m.sectionId === section.id);
                  const sectionCompleted = sectionMods.filter(m => {
                    const p = progress.find(pr => pr.moduleId === m.id);
                    return p?.status === "completed";
                  }).length;
                  // Use canonical count as fallback if no modules loaded yet
                  const displayTotal = sectionMods.length > 0 ? sectionMods.length : phase.count;
                  const sectionProg = displayTotal > 0 ? Math.round((sectionCompleted / displayTotal) * 100) : 0;

                  // Get modules for display (up to 4 visible)
                  const sortedMods = sectionMods
                    .sort((a, b) => {
                      if (a.order != null && b.order != null) return a.order - b.order;
                      return (a.created_date || "").localeCompare(b.created_date || "");
                    })
                    .slice(0, 4);

                  return (
                    <div
                      key={section.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border-l-4"
                      style={{ borderLeftColor: phase.color }}
                    >
                      {/* Phase header */}
                      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{phase.label}</p>
                          <h3 className="font-bold text-[#3B224E] text-base">{section.title || phase.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {sectionCompleted > 0 ? `${sectionCompleted} of ${displayTotal} completed` : `${displayTotal} masterclasses`}
                          </p>
                        </div>
                        {section.id && blueprintCourse && (
                          <Link
                            to={createPageUrl("SectionDetail") + `?sectionId=${section.id}&courseId=${blueprintCourse.id}`}
                            className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            style={{ backgroundColor: phase.light, color: phase.color }}
                          >
                            <Clock className="w-3 h-3" />
                            Continue phase
                          </Link>
                        )}
                      </div>

                      {/* Module grid */}
                      {sortedMods.length > 0 && (
                        <div className="px-5 pb-4 grid grid-cols-2 gap-2">
                          {sortedMods.map(mod => {
                            const modStatus = progress.find(pr => pr.moduleId === mod.id)?.status;
                            return (
                              <Link
                                key={mod.id}
                                to={createPageUrl("ModulePlayer") + `?moduleId=${mod.id}&courseId=${blueprintCourse?.id}`}
                                className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#3B224E] py-1 group"
                              >
                                <div className="flex-shrink-0 w-4 h-4">
                                  {modStatus === "completed" ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : modStatus === "in_progress" ? (
                                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: phase.color }}>
                                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phase.color }} />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                  )}
                                </div>
                                <span className="leading-tight line-clamp-2 group-hover:underline">{mod.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Progress bar at bottom */}
                      <div className="h-1 bg-gray-100">
                        <div className="h-full transition-all" style={{ width: `${sectionProg}%`, backgroundColor: phase.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* ── Right column: Course Card + Profile CTA echo ── */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Course Card</p>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Cover image */}
                <div className="h-40 bg-gradient-to-br from-[#3B224E] to-[#7340B9] relative overflow-hidden">
                  {blueprintCourse?.coverImage && (
                    <img
                      src={blueprintCourse.coverImage}
                      alt="Blueprint"
                      className="w-full h-full object-cover opacity-60"
                    />
                  )}
                  <div className="absolute inset-0 flex items-end p-4">
                    <p className="text-white font-bold text-sm leading-snug">The Aligned Woman Blueprint™</p>
                  </div>
                </div>

                {/* Course info */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    {blueprintCourse?.description || "Your personal operating system for embodied success."}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                    <span>4 phases</span>
                    <span>·</span>
                    <span>{CANONICAL_TOTAL} masterclasses</span>
                  </div>
                  {blueprintCourse && (
                    <Link
                      to={createPageUrl("CourseDetail") + `?courseId=${blueprintCourse.id}`}
                      className="flex items-center justify-between w-full px-4 py-2.5 border-2 border-[#3B224E] text-[#3B224E] rounded-xl hover:bg-[#3B224E] hover:text-white transition-colors text-sm font-semibold group"
                    >
                      Open course overview
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Profile CTA echo */}
            {resumeTarget && blueprintCourse && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Continue the Blueprint</p>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-3">
                    {overallProgress}% complete · returns you to your last active masterclass
                  </p>
                  <Link
                    to={createPageUrl("ModulePlayer") + `?moduleId=${resumeTarget.module.id}&courseId=${blueprintCourse.id}`}
                    className="flex items-center justify-between w-full px-4 py-2.5 bg-[#7340B9] text-white rounded-xl hover:bg-[#5B2E84] transition-colors text-sm font-semibold group"
                  >
                    Continue the Blueprint
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}