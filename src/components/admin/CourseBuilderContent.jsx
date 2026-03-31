import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Star,
  Clock,
  Upload,
} from "lucide-react";

export default function CourseBuilderContent() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [expandedModules, setExpandedModules] = useState(new Set());

  const [courseForm, setCourseForm] = useState({
    title: "", description: "", coverImage: "", category: "",
    expertId: "", price: 0, isPublished: false, isComingSoon: false, isFeatured: false,
  });
  const [sectionForm, setSectionForm] = useState({ title: "", description: "", coverImage: "", order: 0, isPublished: false, isComingSoon: false });
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", expertId: "", durationMinutes: 0, isPublished: false, isComingSoon: false });
  const [pageForm, setPageForm] = useState({ title: "", pageType: "text", content: "", videoUrl: "" });

  const queryClient = useQueryClient();

  const { data: rawCourses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("created_date"),
  });

  // Sort: items with explicit order by order, then remaining by created_date
  const courses = [...rawCourses].sort((a, b) => {
    const aHasOrder = a.order !== undefined && a.order !== null;
    const bHasOrder = b.order !== undefined && b.order !== null;
    if (aHasOrder && bHasOrder) return a.order - b.order;
    if (aHasOrder) return -1;
    if (bHasOrder) return 1;
    return (a.created_date || "").localeCompare(b.created_date || "");
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["courseSections"],
    queryFn: () => base44.entities.CourseSection.list("created_date"),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["courseModules"],
    queryFn: () => base44.entities.CourseModule.list("created_date"),
  });

  const { data: pages = [] } = useQuery({
    queryKey: ["coursePages"],
    queryFn: () => base44.entities.CoursePage.list("created_date"),
  });

  const { data: experts = [] } = useQuery({
    queryKey: ["experts"],
    queryFn: () => base44.entities.Expert.list(),
  });

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["courses"]); setCourseDialogOpen(false); resetCourseForm(); },
  });
  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Course.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["courses"]); setCourseDialogOpen(false); resetCourseForm(); },
  });
  const deleteCourseMutation = useMutation({
    mutationFn: (id) => base44.entities.Course.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["courses"]); setSelectedCourse(null); },
  });

  const createSectionMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseSection.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["courseSections"]); setSectionDialogOpen(false); resetSectionForm(); },
  });
  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseSection.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["courseSections"]); setSectionDialogOpen(false); resetSectionForm(); },
  });
  const deleteSectionMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseSection.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["courseSections"]); setSelectedSection(null); },
  });

  const createModuleMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseModule.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["courseModules"]); setModuleDialogOpen(false); resetModuleForm(); },
  });
  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseModule.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["courseModules"]); setModuleDialogOpen(false); resetModuleForm(); },
  });
  const deleteModuleMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseModule.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["courseModules"]); setSelectedModule(null); },
  });

  const createPageMutation = useMutation({
    mutationFn: (data) => base44.entities.CoursePage.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["coursePages"]); setPageDialogOpen(false); resetPageForm(); },
  });
  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CoursePage.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["coursePages"]); setPageDialogOpen(false); resetPageForm(); },
  });
  const deletePageMutation = useMutation({
    mutationFn: (id) => base44.entities.CoursePage.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["coursePages"]),
  });

  // Reorder helpers — assigns sequential order to ALL items, then swaps the two targets
  const swapOrder = async (items, indexA, indexB, updateFn, queryKey) => {
    if (indexA < 0 || indexB < 0 || indexA >= items.length || indexB >= items.length) return;

    // Build the desired order: start from current display order, then swap
    const ordered = items.map((item, i) => ({ id: item.id, order: i }));
    const tempOrder = ordered[indexA].order;
    ordered[indexA].order = ordered[indexB].order;
    ordered[indexB].order = tempOrder;

    // Persist every item's order so the full list is always consistent
    await Promise.all(
      ordered.map(({ id, order }) => updateFn({ id, data: { order } }))
    );

    await queryClient.invalidateQueries({ queryKey: [queryKey] });
  };

  const moveCourse = async (course, direction) => {
    // Sort by order then created_date (same as display) to get correct index
    const sorted = [...courses].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return (a.created_date || "").localeCompare(b.created_date || "");
    });
    const idx = sorted.findIndex((c) => c.id === course.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    await swapOrder(sorted, idx, targetIdx, ({ id, data }) => base44.entities.Course.update(id, data), "courses");
  };

  const moveSection = async (section, direction) => {
    const sorted = getCourseSections(selectedCourse.id);
    const idx = sorted.findIndex((s) => s.id === section.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    await swapOrder(sorted, idx, targetIdx, ({ id, data }) => base44.entities.CourseSection.update(id, data), "courseSections");
  };

  const moveModule = async (module, sectionId, direction) => {
    const sorted = getSectionModules(sectionId);
    const idx = sorted.findIndex((m) => m.id === module.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    await swapOrder(sorted, idx, targetIdx, ({ id, data }) => base44.entities.CourseModule.update(id, data), "courseModules");
  };

  const movePage = async (page, moduleId, direction) => {
    const sorted = getModulePages(moduleId);
    const idx = sorted.findIndex((p) => p.id === page.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    await swapOrder(sorted, idx, targetIdx, ({ id, data }) => base44.entities.CoursePage.update(id, data), "coursePages");
  };

  const resetCourseForm = () => { setCourseForm({ title: "", description: "", coverImage: "", category: "", expertId: "", price: 0, isPublished: false, isComingSoon: false, isFeatured: false }); setEditingCourse(null); };
  const resetSectionForm = () => { setSectionForm({ title: "", description: "", coverImage: "", order: 0, isPublished: false, isComingSoon: false }); setEditingSection(null); };
  const resetModuleForm = () => { setModuleForm({ title: "", description: "", expertId: "", durationMinutes: 0, isPublished: false, isComingSoon: false }); setEditingModule(null); };
  const resetPageForm = () => { setPageForm({ title: "", pageType: "text", content: "", videoUrl: "" }); setEditingPage(null); };

  const handleSaveCourse = () => {
    if (editingCourse) updateCourseMutation.mutate({ id: editingCourse.id, data: courseForm });
    else createCourseMutation.mutate(courseForm);
  };
  const handleSaveSection = () => {
    const data = { ...sectionForm, courseId: selectedCourse.id };
    if (editingSection) updateSectionMutation.mutate({ id: editingSection.id, data });
    else createSectionMutation.mutate(data);
  };
  const handleSaveModule = () => {
    const data = { ...moduleForm, courseId: selectedCourse.id, sectionId: selectedSection.id };
    if (editingModule) updateModuleMutation.mutate({ id: editingModule.id, data });
    else createModuleMutation.mutate(data);
  };
  const handleSavePage = () => {
    const data = { ...pageForm, courseId: selectedCourse.id, sectionId: selectedSection.id, moduleId: selectedModule.id };
    if (editingPage) updatePageMutation.mutate({ id: editingPage.id, data });
    else createPageMutation.mutate(data);
  };

  const sortByOrderAndDate = (items) => {
    return [...items].sort((a, b) => {
      const aOrder = a.order ?? Infinity;
      const bOrder = b.order ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.created_date || "").localeCompare(b.created_date || "");
    });
  };

  const getCourseSections = (courseId) =>
    sortByOrderAndDate(sections.filter((s) => s.courseId === courseId));

  const getSectionModules = (sectionId) =>
    sortByOrderAndDate(modules.filter((m) => m.sectionId === sectionId));

  const getModulePages = (moduleId) =>
    sortByOrderAndDate(pages.filter((p) => p.moduleId === moduleId));

  const toggleSectionExpanded = (id) => setExpandedSections((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleModuleExpanded = (id) => setExpandedModules((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── COURSE DETAIL VIEW ──────────────────────────────────────────────────────
  if (selectedCourse) {
    const courseSections = getCourseSections(selectedCourse.id);
    return (
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedCourse(null); setSelectedSection(null); setSelectedModule(null); }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> All Courses
          </Button>
        </div>

        {/* Course Banner */}
        <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: "var(--theme-secondary, #5B2E84)" }}>
          <div className="h-40 bg-gradient-to-br from-[#3B224E] to-[#5B2E84] relative">
            {selectedCourse.coverImage && (
              <img src={selectedCourse.coverImage} alt={selectedCourse.title} className="w-full h-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {selectedCourse.isPublished ? <Badge className="bg-green-400 text-green-900 border-0">Published</Badge> : <Badge className="bg-gray-200 text-gray-700 border-0">Draft</Badge>}
                {selectedCourse.isComingSoon && <Badge className="bg-amber-400 text-amber-900 border-0">Coming Soon</Badge>}
                {selectedCourse.isFeatured && <Badge className="bg-yellow-300 text-yellow-900 border-0"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
                {selectedCourse.price > 0 && <Badge className="bg-blue-400 text-blue-900 border-0">${selectedCourse.price}</Badge>}
                {selectedCourse.category && <Badge className="bg-purple-200 text-purple-900 border-0">{selectedCourse.category}</Badge>}
              </div>
              <h2 className="text-2xl font-bold text-white">{selectedCourse.title}</h2>
              {selectedCourse.description && <p className="text-white/80 text-sm mt-1 line-clamp-2">{selectedCourse.description}</p>}
            </div>
          </div>
          <div className="bg-white px-6 py-3 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500">{courseSections.length} sections · {modules.filter(m => m.courseId === selectedCourse.id).length} modules</span>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => { setEditingCourse(selectedCourse); setCourseForm(selectedCourse); setCourseDialogOpen(true); }}>
              <Edit className="w-4 h-4 mr-1" /> Edit Course
            </Button>
            <Button size="sm" className="text-white" style={{ backgroundColor: "var(--theme-secondary, #5B2E84)" }} onClick={() => { resetSectionForm(); setSectionDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Section
            </Button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {courseSections.length === 0 && (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">No sections yet — click "Add Section" to get started</div>
          )}
          {courseSections.map((section, sIdx, sArr) => (
            <div key={section.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 bg-white flex items-center gap-3">
                <button onClick={() => toggleSectionExpanded(section.id)} className="flex items-center gap-2 flex-1 text-left">
                  {expandedSections.has(section.id) ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                  <BookOpen className="w-5 h-5" style={{ color: "var(--theme-primary, #3C224F)" }} />
                  <span className="font-semibold">{section.title}</span>
                  <Badge variant="outline" className="text-xs">{getSectionModules(section.id).length} modules</Badge>
                  {section.isComingSoon && <Badge className="bg-amber-100 text-amber-700 text-xs">Coming Soon</Badge>}
                  {!section.isPublished && <Badge className="bg-gray-100 text-gray-500 text-xs">Draft</Badge>}
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button disabled={sIdx === 0} onClick={() => moveSection(section, "up")} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30" title="Move up">
                    <ArrowUp className="w-4 h-4 text-gray-500" />
                  </button>
                  <button disabled={sIdx === sArr.length - 1} onClick={() => moveSection(section, "down")} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30" title="Move down">
                    <ArrowDown className="w-4 h-4 text-gray-500" />
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedSection(section); resetModuleForm(); setModuleDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Module
                  </Button>
                  <button onClick={() => { setEditingSection(section); setSectionForm(section); setSectionDialogOpen(true); }} className="p-1 hover:bg-gray-100 rounded">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => { if (confirm("Delete this section and all its content?")) deleteSectionMutation.mutate(section.id); }} className="p-1 hover:bg-gray-100 rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {expandedSections.has(section.id) && (
                <div className="bg-gray-50 p-4 space-y-2">
                  {getSectionModules(section.id).map((module, mIdx, mArr) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="p-3 flex items-center gap-2">
                        <button onClick={() => toggleModuleExpanded(module.id)} className="flex items-center gap-2 flex-1 text-left">
                          {expandedModules.has(module.id) ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                          <span className="inline-block px-2.5 py-1 bg-[#3B224E] text-white rounded-md text-xs font-semibold mr-2">{mIdx + 1}</span>
                          <span className="font-medium text-sm">{module.title}</span>
                          <Badge variant="outline" className="text-xs">{getModulePages(module.id).length} pages</Badge>
                          {module.durationMinutes > 0 && <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{module.durationMinutes}m</Badge>}
                          {module.expertId && <Badge className="bg-pink-100 text-pink-700 text-xs"><Users className="w-3 h-3 mr-1" />Expert</Badge>}
                          {module.isComingSoon && <Badge className="bg-amber-100 text-amber-700 text-xs">Coming Soon</Badge>}
                          {!module.isPublished && <Badge className="bg-gray-100 text-gray-500 text-xs">Draft</Badge>}
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button disabled={mIdx === 0} onClick={() => moveModule(module, section.id, "up")} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                            <ArrowUp className="w-3 h-3 text-gray-500" />
                          </button>
                          <button disabled={mIdx === mArr.length - 1} onClick={() => moveModule(module, section.id, "down")} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                            <ArrowDown className="w-3 h-3 text-gray-500" />
                          </button>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedSection(section); setSelectedModule(module); resetPageForm(); setPageDialogOpen(true); }}>
                            <Plus className="w-3 h-3 mr-1" /> Page
                          </Button>
                          <button onClick={() => { setSelectedSection(section); setEditingModule(module); setModuleForm(module); setModuleDialogOpen(true); }} className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => { if (confirm("Delete this module and all its pages?")) deleteModuleMutation.mutate(module.id); }} className="p-1 hover:bg-gray-100 rounded">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {expandedModules.has(module.id) && (
                        <div className="bg-gray-50 p-3 space-y-1">
                          {getModulePages(module.id).map((page, pIdx, pArr) => (
                            <div key={page.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm gap-3">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="inline-block px-2.5 py-1 bg-gray-300 text-gray-800 rounded-md text-xs font-bold">{mIdx + 1}.{pIdx + 1}</span>
                                <span>{page.title}</span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button disabled={pIdx === 0} onClick={() => movePage(page, module.id, "up")} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                                  <ArrowUp className="w-3 h-3 text-gray-500" />
                                </button>
                                <button disabled={pIdx === pArr.length - 1} onClick={() => movePage(page, module.id, "down")} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                                  <ArrowDown className="w-3 h-3 text-gray-500" />
                                </button>
                                <Badge variant="outline" className="text-xs">{page.pageType}</Badge>
                                <button onClick={() => { setSelectedSection(section); setSelectedModule(module); setEditingPage(page); setPageForm(page); setPageDialogOpen(true); }} className="p-1 hover:bg-gray-100 rounded">
                                  <Edit className="w-3 h-3 text-gray-500" />
                                </button>
                                <button onClick={() => { if (confirm("Delete this page?")) deletePageMutation.mutate(page.id); }} className="p-1 hover:bg-gray-100 rounded">
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {getSectionModules(section.id).length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">No modules yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dialogs shared with detail view */}
        {renderDialogs()}
      </div>
    );
  }

  // ── COURSES LIST VIEW ────────────────────────────────────────────────────────
  function renderCourseRow(course, idx, arr) {
    const sectionCount = sections.filter((s) => s.courseId === course.id).length;
    const moduleCount = modules.filter((m) => m.courseId === course.id).length;
    return (
      <div key={course.id} className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-200 transition-colors">
        {/* Reorder */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button disabled={idx === 0} onClick={() => moveCourse(course, "up")} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30" title="Move up">
            <ArrowUp className="w-4 h-4 text-gray-400" />
          </button>
          <button disabled={idx === arr.length - 1} onClick={() => moveCourse(course, "down")} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30" title="Move down">
            <ArrowDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Cover thumbnail */}
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#3B224E] to-[#5B2E84] flex-shrink-0 overflow-hidden">
          {course.coverImage
            ? <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-6 h-6 text-white/40" /></div>}
        </div>

        {/* Info — clickable */}
        <button className="flex-1 text-left min-w-0" onClick={() => setSelectedCourse(course)}>
          <h3 className="font-bold text-[#3B224E] truncate">{course.title}</h3>
          {course.description && <p className="text-xs text-gray-500 truncate">{course.description}</p>}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {course.isPublished
              ? <Badge className="bg-green-100 text-green-700 border-0 text-xs">Published</Badge>
              : <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">Draft</Badge>}
            {course.isComingSoon && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Coming Soon</Badge>}
            {course.isFeatured && <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
            {course.price > 0 && <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">${course.price}</Badge>}
            <span className="text-xs text-gray-400">{sectionCount} sections · {moduleCount} modules</span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => { setEditingCourse(course); setCourseForm(course); setCourseDialogOpen(true); }} className="p-2 hover:bg-gray-100 rounded" title="Edit">
            <Edit className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => { if (confirm("Delete this course and all its content?")) deleteCourseMutation.mutate(course.id); }} className="p-2 hover:bg-gray-100 rounded" title="Delete">
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    );
  }

  function renderDialogs() {
    return (
      <>
        {/* Course Dialog */}
        <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Course Title *</Label><Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="e.g., The Aligned Woman Blueprint" /></div>
              <div><Label>Description</Label><Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Course description" className="min-h-[80px]" /></div>
              <div>
                <Label>Cover Image</Label>
                <div className="space-y-3">
                  {courseForm.coverImage && (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
                      <img src={courseForm.coverImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer text-sm font-medium text-gray-700">
                    <Upload className="w-4 h-4" />
                    {courseForm.coverImage ? "Change Image" : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const { file_url } = await base44.integrations.Core.UploadFile({ file });
                          setCourseForm({ ...courseForm, coverImage: file_url });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Category</Label><Input value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} placeholder="e.g., Personal Development" /></div>
                <div><Label>Price ($)</Label><Input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} placeholder="0 for free" /></div>
              </div>
              <div>
                <Label>Course Creator / Expert</Label>
                <Select value={courseForm.expertId} onValueChange={(value) => setCourseForm({ ...courseForm, expertId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select expert (optional)" /></SelectTrigger>
                  <SelectContent>{experts.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={courseForm.isPublished} onCheckedChange={(checked) => setCourseForm({ ...courseForm, isPublished: checked })} />
                  <Label>Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={courseForm.isComingSoon} onCheckedChange={(checked) => setCourseForm({ ...courseForm, isComingSoon: checked })} />
                  <Label>Coming Soon</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={courseForm.isFeatured} onCheckedChange={(checked) => setCourseForm({ ...courseForm, isFeatured: checked })} />
                  <Label>Featured</Label>
                </div>
              </div>
              <Button onClick={handleSaveCourse} disabled={!courseForm.title} className="w-full text-white" style={{ backgroundColor: "var(--theme-secondary, #5B2E84)" }}>
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Section Dialog */}
        <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Section Title *</Label><Input value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} placeholder="e.g., Introduction to ALIVE Method" /></div>
              <div><Label>Description</Label><Textarea value={sectionForm.description} onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })} placeholder="Section description" /></div>
              <div>
                <Label>Cover Image</Label>
                <div className="space-y-3">
                  {sectionForm.coverImage && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                      <img src={sectionForm.coverImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer text-sm font-medium text-gray-700">
                    <Upload className="w-4 h-4" />
                    {sectionForm.coverImage ? "Change Image" : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const { file_url } = await base44.integrations.Core.UploadFile({ file });
                          setSectionForm({ ...sectionForm, coverImage: file_url });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={sectionForm.isPublished} onCheckedChange={(checked) => setSectionForm({ ...sectionForm, isPublished: checked })} />
                  <Label>Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={sectionForm.isComingSoon} onCheckedChange={(checked) => setSectionForm({ ...sectionForm, isComingSoon: checked })} />
                  <Label>Coming Soon</Label>
                </div>
              </div>
              <Button onClick={handleSaveSection} disabled={!sectionForm.title} className="w-full text-white" style={{ backgroundColor: "var(--theme-secondary, #5B2E84)" }}>
                {editingSection ? "Update Section" : "Create Section"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Module Dialog */}
        <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingModule ? "Edit Module" : "Add Module"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Module Title *</Label><Input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="e.g., Understanding Your Inner Systems" /></div>
              <div><Label>Description</Label><Textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} placeholder="Module description" /></div>
              <div><Label>Duration (minutes)</Label><Input type="number" value={moduleForm.durationMinutes} onChange={(e) => setModuleForm({ ...moduleForm, durationMinutes: Number(e.target.value) })} /></div>
              <div>
                <Label>Module Expert/Instructor</Label>
                <Select value={moduleForm.expertId} onValueChange={(value) => setModuleForm({ ...moduleForm, expertId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select expert (optional)" /></SelectTrigger>
                  <SelectContent>{experts.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={moduleForm.isPublished} onCheckedChange={(checked) => setModuleForm({ ...moduleForm, isPublished: checked })} />
                  <Label>Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={moduleForm.isComingSoon} onCheckedChange={(checked) => setModuleForm({ ...moduleForm, isComingSoon: checked })} />
                  <Label>Coming Soon</Label>
                </div>
              </div>
              <Button onClick={handleSaveModule} disabled={!moduleForm.title} className="w-full text-white" style={{ backgroundColor: "var(--theme-secondary, #5B2E84)" }}>
                {editingModule ? "Update Module" : "Create Module"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Page Dialog */}
        <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingPage ? "Edit Page" : "Add Page"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Page Title *</Label><Input value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })} placeholder="e.g., Introduction Video" /></div>
              <div>
                <Label>Page Type</Label>
                <Select value={pageForm.pageType} onValueChange={(value) => setPageForm({ ...pageForm, pageType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Text/Article</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {pageForm.pageType === "video" && (
                <div><Label>Video URL</Label><Input value={pageForm.videoUrl} onChange={(e) => setPageForm({ ...pageForm, videoUrl: e.target.value })} placeholder="https://..." /></div>
              )}
              <div><Label>Content</Label><Textarea value={pageForm.content} onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })} placeholder="Page content (HTML supported)" className="min-h-[150px]" /></div>
              <Button onClick={handleSavePage} disabled={!pageForm.title} className="w-full text-white" style={{ backgroundColor: "var(--theme-secondary, #5B2E84)" }}>
                {editingPage ? "Update Page" : "Create Page"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--theme-primary, #3C224F)" }}>Course Builder</h2>
          <p className="text-gray-600">Click a course to manage its sections and modules</p>
        </div>
        <Button onClick={() => { resetCourseForm(); setCourseDialogOpen(true); }} className="text-white" style={{ backgroundColor: "var(--theme-secondary, #5B2E84)" }}>
          <Plus className="w-4 h-4 mr-2" /> Create Course
        </Button>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No courses yet</p>
          <p className="text-sm">Click "Create Course" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course, idx, arr) => renderCourseRow(course, idx, arr))}
        </div>
      )}

      {renderDialogs()}
    </div>
  );
}