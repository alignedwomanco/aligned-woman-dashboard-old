import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle, Play } from "lucide-react";

const CANONICAL_PHASES = [
  { label: "Phase 1", name: "Awareness", count: 5, color: "#7340B9", light: "#EDE0FF" },
  { label: "Phase 2", name: "Liberation", count: 3, color: "#C4687D", light: "#FCE8EC" },
  { label: "Phase 3", name: "Intention", count: 3, color: "#4B7BB5", light: "#E0ECFF" },
  { label: "Phase 4", name: "Vision & Embodiment", count: 3, color: "#5B9B6A", light: "#E0F5E8" },
];
const CANONICAL_TOTAL = 14;

export default function CourseDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get("courseId");

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
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

        const sorted = courseSections.sort((a, b) => {
          if (a.order != null && b.order != null) return a.order - b.order;
          if (a.order != null) return -1;
          if (b.order != null) return 1;
          return (a.created_date || "").localeCompare(b.created_date || "");
        });
        setSections(sorted);

        setModules(courseModules.sort((a, b) => {
          if (a.order != null && b.order != null) return a.order - b.order;
          return (a.created_date || "").localeCompare(b.created_date || "");
        }));
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
      .sort((a, b) => {
        if (a.order != null && b.order != null) return a.order - b.order;
        return (a.created_date || "").localeCompare(b.created_date || "");
      });

  const getModuleStatus = (moduleId) => {
    const p = progress.find((p) => p.moduleId === moduleId);
    if (!p || p.status === "not_started") return "available";
    if (p.status === "completed") return "completed";
    return "in_progress";
  };

  const totalBasis = Math.max(modules.length, CANONICAL_TOTAL);
  const completedModules = modules.filter(m => getModuleStatus(m.id) === "completed").length;
  const overallProgress = totalBasis > 0 ? Math.round((completedModules / totalBasis) * 100) : 0;

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

  // Build the displayed phases — merge canonical with real section data
  const displayPhases = CANONICAL_PHASES.map((canon, idx) => {
    const section = sections[idx] || null;
    const mods = section ? getSectionModules(section.id) : [];
    return { canon, section, mods };
  });

  const selectedPhase = displayPhases[selectedPhaseIdx];
  const selectedPhaseMods = selectedPhase.mods;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4CAFB" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="mb-5 inline-block">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Classroom
          </Button>
        </button>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Left: Course intro + actions ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Course intro card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="h-40 bg-gradient-to-br from-[#3B224E] to-[#7340B9] relative">
                {course.coverImage && (
                  <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
              </div>
              <div className="p-5">
                <h1 className="text-xl font-bold text-[#3B224E] leading-tight mb-2">
                  The Aligned Woman Blueprint™
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {course.description || "Your personal operating system for embodied success — 4 phases, 14 masterclasses."}
                </p>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">{completedModules} of {CANONICAL_TOTAL} complete</span>
                    <span className="text-xs font-bold text-[#3B224E]">{overallProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#7340B9] rounded-full" style={{ width: `${overallProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Overview actions */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              {resumeModule && (
                <Link
                  to={createPageUrl("ModulePlayer") + `?moduleId=${resumeModule.id}&courseId=${courseId}`}
                  className="flex items-center justify-between w-full px-4 py-3 bg-[#3B224E] text-white rounded-xl hover:bg-[#5B2E84] transition-colors text-sm font-semibold group"
                >
                  {completedModules > 0 ? "Resume last masterclass" : "Start from Phase 1"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              {sections[0] && (
                <Link
                  to={createPageUrl("SectionDetail") + `?sectionId=${sections[0].id}&courseId=${courseId}`}
                  className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 text-[#3B224E] rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold group"
                >
                  Start from Phase 1
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              <button
                onClick={() => {
                  document.getElementById("phase-map")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 text-[#3B224E] rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
              >
                View all {CANONICAL_TOTAL} masterclasses
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Right: Phase Map (two-column) ── */}
          <div className="lg:col-span-3" id="phase-map">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              4 Phases · {CANONICAL_TOTAL} Masterclasses
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              {displayPhases.map(({ canon, section, mods }, idx) => {
                const sectionCompleted = mods.filter(m => getModuleStatus(m.id) === "completed").length;
                const displayCount = mods.length > 0 ? mods.length : canon.count;
                const isSelected = selectedPhaseIdx === idx;

                return (
                  <button
                    key={canon.label}
                    onClick={() => setSelectedPhaseIdx(idx)}
                    className={`text-left rounded-2xl p-4 border-2 transition-all ${
                      isSelected ? "shadow-md" : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                    style={isSelected ? { backgroundColor: canon.light, borderColor: canon.color } : {}}
                  >
                    <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: canon.color }}>
                      {canon.label}
                    </p>
                    <p className="font-bold text-[#3B224E] text-sm mb-1">{section?.title || canon.name}</p>
                    <p className="text-xs text-gray-400">
                      {sectionCompleted > 0 ? `${sectionCompleted} of ${displayCount} complete` : `${displayCount} masterclasses`}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Phase Detail */}
            {selectedPhase && (
              <motion.div
                key={selectedPhaseIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
              >
                <div
                  className="px-5 py-4 border-b border-gray-50 flex items-center justify-between"
                  style={{ borderLeftWidth: 4, borderLeftColor: selectedPhase.canon.color, borderLeftStyle: "solid" }}
                >
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: selectedPhase.canon.color }}>
                      Selected Phase Detail
                    </p>
                    <h3 className="font-bold text-[#3B224E]">
                      {selectedPhase.canon.label}: {selectedPhase.section?.title || selectedPhase.canon.name}
                    </h3>
                  </div>
                  {selectedPhase.section && (
                    <Link
                      to={createPageUrl("SectionDetail") + `?sectionId=${selectedPhase.section.id}&courseId=${courseId}`}
                      className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      style={{ backgroundColor: selectedPhase.canon.light, color: selectedPhase.canon.color }}
                    >
                      View phase <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Module list for selected phase */}
                {selectedPhaseMods.length > 0 ? (
                  <div>
                    {selectedPhaseMods.map((mod, mIdx) => {
                      const status = getModuleStatus(mod.id);
                      return (
                        <Link
                          key={mod.id}
                          to={createPageUrl("ModulePlayer") + `?moduleId=${mod.id}&courseId=${courseId}`}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                        >
                          <div className="flex-shrink-0 w-5">
                            {status === "completed" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : status === "in_progress" ? (
                              <Play className="w-4 h-4" style={{ color: selectedPhase.canon.color }} />
                            ) : (
                              <span className="text-xs font-bold text-gray-300">{mIdx + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Masterclass {mIdx + 1}</p>
                            <p className={`text-sm font-medium leading-snug group-hover:text-[#5B2E84] transition-colors ${status === "completed" ? "text-gray-400 line-through" : "text-[#3B224E]"}`}>
                              {mod.title}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#7340B9] flex-shrink-0 transition-colors" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  // No modules loaded yet — show canonical placeholder rows
                  <div>
                    {Array.from({ length: selectedPhase.canon.count }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-bold text-gray-200 w-5">{i + 1}</span>
                        <div>
                          <p className="text-xs text-gray-300 uppercase tracking-wider mb-0.5">Masterclass {i + 1}</p>
                          <div className="h-3 bg-gray-100 rounded w-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}