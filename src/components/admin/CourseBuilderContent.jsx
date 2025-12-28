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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Users,
  DollarSign,
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
    title: "",
    description: "",
    coverImage: "",
    category: "",
    expertId: "",
    price: 0,
    isPublished: false,
  });

  const [sectionForm, setSectionForm] = useState({
    title: "",
    description: "",
    order: 0,
  });

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    expertId: "",
    durationMinutes: 0,
  });

  const [pageForm, setPageForm] = useState({
    title: "",
    pageType: "text",
    content: "",
    videoUrl: "",
  });

  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("order"),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["courseSections"],
    queryFn: () => base44.entities.CourseSection.list("order"),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["courseModules"],
    queryFn: () => base44.entities.CourseModule.list("order"),
  });

  const { data: pages = [] } = useQuery({
    queryKey: ["coursePages"],
    queryFn: () => base44.entities.CoursePage.list("order"),
  });

  const { data: experts = [] } = useQuery({
    queryKey: ["experts"],
    queryFn: () => base44.entities.Expert.list(),
  });

  const createCourseMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      setCourseDialogOpen(false);
      resetCourseForm();
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Course.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      setCourseDialogOpen(false);
      resetCourseForm();
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id) => base44.entities.Course.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      setSelectedCourse(null);
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseSection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["courseSections"]);
      setSectionDialogOpen(false);
      resetSectionForm();
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseSection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["courseSections"]);
      setSectionDialogOpen(false);
      resetSectionForm();
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseSection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["courseSections"]);
      setSelectedSection(null);
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseModule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["courseModules"]);
      setModuleDialogOpen(false);
      resetModuleForm();
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseModule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["courseModules"]);
      setModuleDialogOpen(false);
      resetModuleForm();
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseModule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["courseModules"]);
      setSelectedModule(null);
    },
  });

  const createPageMutation = useMutation({
    mutationFn: (data) => base44.entities.CoursePage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["coursePages"]);
      setPageDialogOpen(false);
      resetPageForm();
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CoursePage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["coursePages"]);
      setPageDialogOpen(false);
      resetPageForm();
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id) => base44.entities.CoursePage.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["coursePages"]),
  });

  const resetCourseForm = () => {
    setCourseForm({
      title: "",
      description: "",
      coverImage: "",
      category: "",
      expertId: "",
      price: 0,
      isPublished: false,
    });
    setEditingCourse(null);
  };

  const resetSectionForm = () => {
    setSectionForm({ title: "", description: "", order: 0 });
    setEditingSection(null);
  };

  const resetModuleForm = () => {
    setModuleForm({ title: "", description: "", expertId: "", durationMinutes: 0 });
    setEditingModule(null);
  };

  const resetPageForm = () => {
    setPageForm({ title: "", pageType: "text", content: "", videoUrl: "" });
    setEditingPage(null);
  };

  const handleSaveCourse = () => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: courseForm });
    } else {
      createCourseMutation.mutate(courseForm);
    }
  };

  const handleSaveSection = () => {
    const data = { ...sectionForm, courseId: selectedCourse.id };
    if (editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, data });
    } else {
      createSectionMutation.mutate(data);
    }
  };

  const handleSaveModule = () => {
    const data = {
      ...moduleForm,
      courseId: selectedCourse.id,
      sectionId: selectedSection.id,
    };
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data });
    } else {
      createModuleMutation.mutate(data);
    }
  };

  const handleSavePage = () => {
    const data = {
      ...pageForm,
      courseId: selectedCourse.id,
      sectionId: selectedSection.id,
      moduleId: selectedModule.id,
    };
    if (editingPage) {
      updatePageMutation.mutate({ id: editingPage.id, data });
    } else {
      createPageMutation.mutate(data);
    }
  };

  const getCourseSections = (courseId) => {
    return sections.filter((s) => s.courseId === courseId).sort((a, b) => a.order - b.order);
  };

  const getSectionModules = (sectionId) => {
    return modules.filter((m) => m.sectionId === sectionId).sort((a, b) => a.order - b.order);
  };

  const getModulePages = (moduleId) => {
    return pages.filter((p) => p.moduleId === moduleId).sort((a, b) => a.order - b.order);
  };

  const toggleSectionExpanded = (sectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleModuleExpanded = (moduleId) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-primary, #3C224F)' }}>
            Course Builder
          </h2>
          <p className="text-gray-600">Create courses with sections, modules, and pages</p>
        </div>
        <Button
          onClick={() => {
            resetCourseForm();
            setCourseDialogOpen(true);
          }}
          className="text-white"
          style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Courses List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Courses ({courses.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => {
                  setSelectedCourse(course);
                  setSelectedSection(null);
                  setSelectedModule(null);
                }}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedCourse?.id === course.id
                    ? "bg-purple-50"
                    : "border-gray-200 hover:border-purple-200"
                }`}
                style={{
                  borderColor: selectedCourse?.id === course.id ? 'var(--theme-secondary, #5B2E84)' : ''
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{course.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCourse(course);
                        setCourseForm(course);
                        setCourseDialogOpen(true);
                      }}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this course and all its content?"))
                          deleteCourseMutation.mutate(course.id);
                      }}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {course.isPublished ? (
                    <Badge className="bg-green-100 text-green-700 text-xs">Published</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 text-xs">Draft</Badge>
                  )}
                  {course.price > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      ${course.price}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Course Content */}
        <Card className="lg:col-span-9">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedCourse ? `${selectedCourse.title} - Content` : "Select a course"}
              </CardTitle>
              {selectedCourse && (
                <Button
                  onClick={() => {
                    resetSectionForm();
                    setSectionDialogOpen(true);
                  }}
                  size="sm"
                  className="text-white"
                  style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedCourse ? (
              <div className="space-y-3">
                {getCourseSections(selectedCourse.id).map((section) => (
                  <div key={section.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    {/* Section Header */}
                    <div className="p-4 bg-white flex items-center gap-3">
                      <button
                        onClick={() => toggleSectionExpanded(section.id)}
                        className="flex items-center gap-2 flex-1"
                      >
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <BookOpen className="w-5 h-5" style={{ color: 'var(--theme-primary, #3C224F)' }} />
                        <span className="font-semibold">{section.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {getSectionModules(section.id).length} modules
                        </Badge>
                      </button>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedSection(section);
                            setModuleDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Module
                        </Button>
                        <button
                          onClick={() => {
                            setEditingSection(section);
                            setSectionForm(section);
                            setSectionDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this section and all its content?"))
                              deleteSectionMutation.mutate(section.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Modules */}
                    {expandedSections.has(section.id) && (
                      <div className="bg-gray-50 p-4 space-y-2">
                        {getSectionModules(section.id).map((module) => (
                          <div
                            key={module.id}
                            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                          >
                            {/* Module Header */}
                            <div className="p-3 flex items-center gap-2">
                              <button
                                onClick={() => toggleModuleExpanded(module.id)}
                                className="flex items-center gap-2 flex-1"
                              >
                                {expandedModules.has(module.id) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                <span className="font-medium text-sm">{module.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {getModulePages(module.id).length} pages
                                </Badge>
                                {module.expertId && (
                                  <Badge className="bg-pink-100 text-pink-700 text-xs">
                                    <Users className="w-3 h-3 mr-1" />
                                    Expert
                                  </Badge>
                                )}
                              </button>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedSection(section);
                                    setSelectedModule(module);
                                    setPageDialogOpen(true);
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Page
                                </Button>
                                <button
                                  onClick={() => {
                                    setSelectedSection(section);
                                    setEditingModule(module);
                                    setModuleForm(module);
                                    setModuleDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 text-gray-500" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Delete this module and all its pages?"))
                                      deleteModuleMutation.mutate(module.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>

                            {/* Pages */}
                            {expandedModules.has(module.id) && (
                              <div className="bg-gray-50 p-3 space-y-1">
                                {getModulePages(module.id).map((page) => (
                                  <div
                                    key={page.id}
                                    className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                                  >
                                    <span>{page.title}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {page.pageType}
                                      </Badge>
                                      <button
                                        onClick={() => {
                                          setSelectedSection(section);
                                          setSelectedModule(module);
                                          setEditingPage(page);
                                          setPageForm(page);
                                          setPageDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="w-3 h-3 text-gray-500" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm("Delete this page?"))
                                            deletePageMutation.mutate(page.id);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">Select a course to view its content</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Course Title *</Label>
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                placeholder="e.g., The Aligned Woman Blueprint"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Course description"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  placeholder="e.g., Personal Development"
                />
              </div>
              <div>
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                  placeholder="0 for free"
                />
              </div>
            </div>
            <div>
              <Label>Course Creator / Expert</Label>
              <Select
                value={courseForm.expertId}
                onValueChange={(value) => setCourseForm({ ...courseForm, expertId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expert (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {experts.map((expert) => (
                    <SelectItem key={expert.id} value={expert.id}>
                      {expert.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={courseForm.isPublished}
                onCheckedChange={(checked) => setCourseForm({ ...courseForm, isPublished: checked })}
              />
              <Label>Published (visible to students)</Label>
            </div>
            <Button
              onClick={handleSaveCourse}
              disabled={!courseForm.title}
              className="w-full text-white"
              style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
            >
              {editingCourse ? "Update Course" : "Create Course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section Title *</Label>
              <Input
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                placeholder="e.g., Introduction to ALIVE Method"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                placeholder="Section description"
              />
            </div>
            <Button
              onClick={handleSaveSection}
              disabled={!sectionForm.title}
              className="w-full text-white"
              style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
            >
              {editingSection ? "Update Section" : "Create Section"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "Add Module"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Module Title *</Label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="e.g., Understanding Your Inner Systems"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Module description"
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={moduleForm.durationMinutes}
                onChange={(e) => setModuleForm({ ...moduleForm, durationMinutes: Number(e.target.value) })}
                placeholder="Estimated completion time"
              />
            </div>
            <div>
              <Label>Module Expert/Instructor</Label>
              <Select
                value={moduleForm.expertId}
                onValueChange={(value) => setModuleForm({ ...moduleForm, expertId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expert (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {experts.map((expert) => (
                    <SelectItem key={expert.id} value={expert.id}>
                      {expert.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveModule}
              disabled={!moduleForm.title}
              className="w-full text-white"
              style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
            >
              {editingModule ? "Update Module" : "Create Module"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Page Dialog */}
      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Edit Page" : "Add Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Page Title *</Label>
              <Input
                value={pageForm.title}
                onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                placeholder="e.g., Introduction Video"
              />
            </div>
            <div>
              <Label>Page Type</Label>
              <Select
                value={pageForm.pageType}
                onValueChange={(value) => setPageForm({ ...pageForm, pageType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text/Article</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pageForm.pageType === "video" && (
              <div>
                <Label>Video URL</Label>
                <Input
                  value={pageForm.videoUrl}
                  onChange={(e) => setPageForm({ ...pageForm, videoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
            <div>
              <Label>Content</Label>
              <Textarea
                value={pageForm.content}
                onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                placeholder="Page content (HTML supported)"
                className="min-h-[150px]"
              />
            </div>
            <Button
              onClick={handleSavePage}
              disabled={!pageForm.title}
              className="w-full text-white"
              style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
            >
              {editingPage ? "Update Page" : "Create Page"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}