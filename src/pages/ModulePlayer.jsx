import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Monitor, StickyNote, Maximize } from "lucide-react";

import VideoEmbed from "../components/module-player/VideoEmbed";
import LessonHeader from "../components/module-player/LessonHeader";
import OverviewCard from "../components/module-player/OverviewCard";
import ExpertBioCard from "../components/module-player/ExpertBioCard";
import BottomNav from "../components/module-player/BottomNav";

const CANONICAL_PHASES = [
  { name: "Awareness" },
  { name: "Liberation" },
  { name: "Intention" },
  { name: "Vision & Embodiment" },
];

export default function ModulePlayer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("moduleId");
  const courseId = searchParams.get("courseId");
  const queryClient = useQueryClient();

  // ── Data queries (preserved from original) ──

  const { data: module } = useQuery({
    queryKey: ["courseModule", moduleId],
    queryFn: async () => {
      const modules = await base44.entities.CourseModule.filter({ id: moduleId });
      return modules[0];
    },
    enabled: !!moduleId,
  });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ["coursePages", moduleId],
    queryFn: () => base44.entities.CoursePage.filter({ moduleId }, "order"),
    enabled: !!moduleId,
  });

  const { data: section } = useQuery({
    queryKey: ["courseSection", module?.sectionId],
    queryFn: async () => {
      const sections = await base44.entities.CourseSection.filter({ id: module.sectionId });
      return sections[0];
    },
    enabled: !!module?.sectionId,
  });

  const { data: expert } = useQuery({
    queryKey: ["expert", module?.expertId],
    queryFn: async () => {
      const experts = await base44.entities.Expert.filter({ id: module.expertId });
      return experts[0];
    },
    enabled: !!module?.expertId,
  });

  // All modules in the course, for numbering & prev/next
  const { data: allModules = [] } = useQuery({
    queryKey: ["allCourseModules", courseId],
    queryFn: async () => {
      const mods = await base44.entities.CourseModule.filter({ courseId });
      return mods.sort((a, b) => {
        if (a.order != null && b.order != null) return a.order - b.order;
        return (a.created_date || "").localeCompare(b.created_date || "");
      });
    },
    enabled: !!courseId,
  });

  // All sections for grouping modules into phases
  const { data: allSections = [] } = useQuery({
    queryKey: ["allCourseSections", courseId],
    queryFn: async () => {
      const secs = await base44.entities.CourseSection.filter({ courseId });
      return secs.sort((a, b) => {
        if (a.order != null && b.order != null) return a.order - b.order;
        return (a.created_date || "").localeCompare(b.created_date || "");
      });
    },
    enabled: !!courseId,
  });

  const { data: moduleProgress = [] } = useQuery({
    queryKey: ["courseProgress", moduleId],
    queryFn: () => base44.entities.CourseProgress.filter({ moduleId }),
    enabled: !!moduleId,
  });

  // ── Progress mutations (preserved) ──

  const updateProgressMutation = useMutation({
    mutationFn: async ({ status, progressPercentage }) => {
      const existing = moduleProgress[0];
      if (existing) {
        return base44.entities.CourseProgress.update(existing.id, { status, progressPercentage: progressPercentage || existing.progressPercentage || 0 });
      } else {
        return base44.entities.CourseProgress.create({ courseId, moduleId, status, progressPercentage: progressPercentage || 0 });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courseProgress"] }),
  });

  const togglePageCompleteMutation = useMutation({
    mutationFn: async ({ pageId, isComplete }) => {
      const existing = moduleProgress.find(p => p.pageId === pageId);
      if (existing) {
        return base44.entities.CourseProgress.update(existing.id, { status: isComplete ? "completed" : "in_progress", progressPercentage: isComplete ? 100 : existing.progressPercentage });
      } else {
        return base44.entities.CourseProgress.create({ courseId, moduleId, pageId, status: isComplete ? "completed" : "in_progress", progressPercentage: isComplete ? 100 : 0 });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courseProgress"] }),
  });

  // ── Derived data ──

  // Flatten all modules in canonical phase order for global numbering & prev/next
  const orderedModules = useMemo(() => {
    if (!allSections.length || !allModules.length) return [];
    const result = [];
    for (const sec of allSections) {
      const secMods = allModules
        .filter(m => m.sectionId === sec.id)
        .sort((a, b) => {
          if (a.order != null && b.order != null) return a.order - b.order;
          return (a.created_date || "").localeCompare(b.created_date || "");
        });
      result.push(...secMods);
    }
    return result;
  }, [allSections, allModules]);

  const currentGlobalIndex = orderedModules.findIndex(m => m.id === moduleId);
  const previousModule = currentGlobalIndex > 0 ? orderedModules[currentGlobalIndex - 1] : null;
  const nextModule = currentGlobalIndex >= 0 && currentGlobalIndex < orderedModules.length - 1 ? orderedModules[currentGlobalIndex + 1] : null;
  const masterclassNumber = currentGlobalIndex >= 0 ? currentGlobalIndex + 1 : null;
  const totalMasterclasses = orderedModules.length || 14;

  // Phase name from section title
  const phaseName = useMemo(() => {
    if (!section) return null;
    const title = (section.title || "").toLowerCase();
    for (const phase of CANONICAL_PHASES) {
      if (title.includes(phase.name.toLowerCase())) return phase.name;
    }
    return section.title || null;
  }, [section]);

  // Resolve video URL — first page with a video, or first page
  const primaryVideoUrl = useMemo(() => {
    if (!pages.length) return null;
    const videoPage = pages.find(p => p.videoUrl);
    return videoPage?.videoUrl || null;
  }, [pages]);

  const primaryVideoDuration = useMemo(() => {
    if (!pages.length) return null;
    const videoPage = pages.find(p => p.videoUrl);
    return videoPage?.videoDuration ? Math.round(videoPage.videoDuration / 60) : null;
  }, [pages]);

  // ── Loading state ──

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#E4CAFB" }}>
        <div className="animate-spin w-8 h-8 border-4 border-[#3B224E] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4CAFB" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

        {/* ── 1. Top utility row ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <button
            onClick={() => navigate(courseId ? createPageUrl("CourseDetail") + `?courseId=${courseId}` : createPageUrl("Classroom"))}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#3B224E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blueprint overview</span>
          </button>

          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#3B224E] bg-white border border-[#3B224E]/20 rounded-full px-3 py-1.5">
              <Monitor className="w-3.5 h-3.5" />
              Standard view
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-300 rounded-full px-3 py-1.5 cursor-default">
              <StickyNote className="w-3.5 h-3.5" />
              Notes view
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-300 rounded-full px-3 py-1.5 cursor-default">
              <Maximize className="w-3.5 h-3.5" />
              Full-screen
            </span>
          </div>
        </div>

        {/* ── 2. Lesson header ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <LessonHeader
            phaseName={phaseName}
            masterclassNumber={masterclassNumber}
            totalInPhase={totalMasterclasses}
            title={module.title}
            expertName={expert?.name}
            durationMinutes={module.durationMinutes}
          />
        </motion.div>

        {/* ── 3. Primary video ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-4">
          <VideoEmbed videoUrl={primaryVideoUrl} />
        </motion.div>

        {/* Video meta row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-6 px-1">
          {primaryVideoDuration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {primaryVideoDuration} min lesson
            </span>
          )}
          {module.durationMinutes && !primaryVideoDuration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {module.durationMinutes} min
            </span>
          )}
        </div>

        {/* ── 4. Supporting content cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-2 gap-4 mb-8"
        >
          <OverviewCard description={module.description} pages={pages} />
          <ExpertBioCard expert={expert} />
        </motion.div>

        {/* ── 5. Bottom navigation row ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <BottomNav
            previousModule={previousModule}
            nextModule={nextModule}
            courseId={courseId}
          />
        </motion.div>

      </div>
    </div>
  );
}