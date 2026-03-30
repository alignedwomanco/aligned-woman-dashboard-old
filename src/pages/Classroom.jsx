import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ArrowRight, BookOpen, CheckCircle } from "lucide-react";

const PHASES = [
  { name: "Awareness", color: "#7340B9", light: "#EDE0FF" },
  { name: "Liberation", color: "#C4687D", light: "#FCE8EC" },
  { name: "Intention", color: "#4B7BB5", light: "#E0ECFF" },
  { name: "Vision & Embodiment", color: "#5B9B6A", light: "#E0F5E8" },
];

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
        // Pick the first/featured course as the Blueprint
        const blueprint = allCourses.find(c => c.isFeatured) || allCourses[0];
        setBlueprintCourse(blueprint);

        if (blueprint) {
          const [courseSections, courseModules, prog] = await Promise.all([
            base44.entities.CourseSection.filter({ courseId: blueprint.id }),
            base44.entities.CourseModule.filter({ courseId: blueprint.id }),
            base44.entities.CourseProgress.filter({}),
          ]);

          setSections(courseSections.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)));
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

  const totalModules = modules.length;
  const completedModules = modules.filter(m => {
    const p = progress.find(pr => pr.moduleId === m.id);
    return p?.status === "completed";
  }).length;
  const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Find the first in-progress or not-started module to resume
  const getResumeModule = () => {
    for (const section of sections) {
      const sectionMods = modules
        .filter(m => m.sectionId === section.id)
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
      for (const mod of sectionMods) {
        const p = progress.find(pr => pr.moduleId === mod.id);
        if (!p || p.status !== "completed") {
          return { module: mod, section };
        }
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
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-sm font-semibold tracking-widest text-[#7340B9] uppercase mb-2">Your Classroom</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#3B224E] leading-tight mb-3">
            The Aligned Woman Blueprint™
          </h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-xl">
            Your personal operating system for embodied success — 4 phases, 14 masterclasses, built around how you actually work.
          </p>
        </motion.div>

        {/* Progress + CTA card */}
        {blueprintCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-purple-100"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {completedModules} of {totalModules} masterclasses complete
                  </span>
                  <span className="text-sm font-bold text-[#3B224E]">{overallProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7340B9] rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                {resumeTarget && (
                  <p className="text-xs text-gray-500 mt-2">
                    Up next: <span className="font-medium text-[#3B224E]">{resumeTarget.module.title}</span>
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {resumeTarget ? (
                  <Link
                    to={createPageUrl("ModulePlayer") + `?moduleId=${resumeTarget.module.id}&courseId=${blueprintCourse.id}`}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#3B224E] text-white font-semibold rounded-xl hover:bg-[#5B2E84] transition-colors text-sm"
                  >
                    {completedModules > 0 ? "Continue Learning" : "Start Learning"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 text-white font-semibold rounded-xl text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Completed!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* View Full Blueprint CTA */}
        {blueprintCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <Link
              to={createPageUrl("CourseDetail") + `?courseId=${blueprintCourse.id}`}
              className="flex items-center justify-between w-full bg-[#7340B9] text-white rounded-2xl px-6 py-4 hover:bg-[#5B2E84] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 opacity-80" />
                <div>
                  <p className="font-semibold text-sm">View Blueprint Overview</p>
                  <p className="text-white/70 text-xs">4 phases · 14 masterclasses · full curriculum</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}

        {/* Phase snapshot */}
        {sections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-semibold tracking-widest text-[#7340B9] uppercase mb-4">The 4 Phases</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {sections.map((section, idx) => {
                const sectionMods = modules.filter(m => m.sectionId === section.id);
                const sectionCompleted = sectionMods.filter(m => {
                  const p = progress.find(pr => pr.moduleId === m.id);
                  return p?.status === "completed";
                }).length;
                const sectionProg = sectionMods.length > 0 ? Math.round((sectionCompleted / sectionMods.length) * 100) : 0;
                const phase = PHASES[idx] || PHASES[0];

                return (
                  <Link
                    key={section.id}
                    to={createPageUrl("SectionDetail") + `?sectionId=${section.id}&courseId=${blueprintCourse?.id}`}
                  >
                    <div
                      className="bg-white rounded-2xl p-5 border hover:shadow-md transition-all group cursor-pointer"
                      style={{ borderColor: phase.light }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: phase.color }}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-xs text-gray-400">{sectionMods.length} masterclasses</span>
                      </div>
                      <h3 className="font-bold text-[#3B224E] mb-1 group-hover:text-[#5B2E84] transition-colors">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{section.description}</p>
                      )}
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${sectionProg}%`, backgroundColor: phase.color }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{sectionProg}% complete</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {!blueprintCourse && !loading && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No courses available yet. Check back soon.</p>
          </div>
        )}

      </div>
    </div>
  );
}