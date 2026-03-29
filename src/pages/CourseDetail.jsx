import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Play, CheckCircle, Lock, BookOpen, Grid2x2, Star, ArrowRight } from "lucide-react";

export default function CourseDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get("courseId");
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    const loadData = async () => {
      try {
        const courses = await base44.entities.Course.filter({ id: courseId });
        const courseData = courses[0];
        setCourse(courseData);

        // Load sections sorted by created_date (oldest first)
        const courseSections = await base44.entities.CourseSection.filter({ courseId }, "created_date");
        setSections(courseSections);
        if (courseSections.length > 0) setActiveSection(courseSections[0].id);

        // Load all modules for this course sorted by created_date (oldest first)
        const courseModules = await base44.entities.CourseModule.filter({ courseId }, "created_date");
        setModules(courseModules);

        // Load progress
        const prog = await base44.entities.CourseProgress.filter({ courseId });
        setProgress(prog);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId]);

  const getSectionModules = (sectionId) => {
    const sectionMods = modules.filter((m) => m.sectionId === sectionId);
    return sectionMods.sort((a, b) => {
      const aHasOrder = a.order !== undefined && a.order !== null;
      const bHasOrder = b.order !== undefined && b.order !== null;
      if (aHasOrder && bHasOrder) return a.order - b.order;
      if (aHasOrder) return -1;
      if (bHasOrder) return 1;
      return (a.created_date || "").localeCompare(b.created_date || "");
    });
  };

  const getSectionProgress = (sectionId) => {
    const sectionMods = getSectionModules(sectionId);
    if (sectionMods.length === 0) return 0;
    const completed = sectionMods.filter(m => {
      const p = progress.find(pr => pr.moduleId === m.id);
      return p?.status === "completed";
    }).length;
    return Math.round((completed / sectionMods.length) * 100);
  };

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

  const getCourseProgress = () => {
    if (modules.length === 0) return 0;
    const completed = modules.filter(m => {
      const p = progress.find(pr => pr.moduleId === m.id);
      return p?.status === "completed";
    }).length;
    return Math.round((completed / modules.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#3B224E] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4CAFB" }}>
      {/* Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Link to={createPageUrl("Classroom")} className="inline-block mb-4">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Classroom
          </Button>
        </Link>
        
        <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: "var(--theme-secondary, #5B2E84)" }}>
          <div className="h-48 bg-gradient-to-br from-[#3B224E] to-[#5B2E84] relative">
            {course.coverImage && (
              <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {course.isPublished ? <Badge className="bg-green-400 text-green-900 border-0">Published</Badge> : <Badge className="bg-gray-200 text-gray-700 border-0">Draft</Badge>}
                {course.isFeatured && <Badge className="bg-yellow-300 text-yellow-900 border-0"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
                {course.price > 0 && <Badge className="bg-blue-400 text-blue-900 border-0">${course.price}</Badge>}
                {course.category && <Badge className="bg-purple-200 text-purple-900 border-0">{course.category}</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-white">{course.title}</h1>
              {course.description && <p className="text-white/80 text-sm mt-1 line-clamp-2">{course.description}</p>}
            </div>
          </div>
          <div className="bg-white px-6 py-4 space-y-3">
           <div className="flex items-center justify-between">
             <span className="text-sm text-gray-600">{sections.length} sections · {modules.length} modules</span>
             <span className="text-sm font-semibold text-[#3B224E]">{getCourseProgress()}% Complete</span>
           </div>
           <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
             <div
               className="h-full bg-green-400 transition-all duration-300"
               style={{ width: `${getCourseProgress()}%` }}
             />
           </div>
          </div>
          </div>
          </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
         {sections.length === 0 ? (
           <div className="text-center py-16">
             <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
             <p className="text-gray-500">No sections available yet.</p>
           </div>
         ) : (
           <>
             {/* Sections Grid */}
             <div className="mb-8">
               <h2 className="text-lg font-semibold text-[#3B224E] mb-4">Course Sections</h2>
               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {sections.map((section, idx) => {
                   const sectionProg = getSectionProgress(section.id);
                   const modulesInSection = getSectionModules(section.id).length;
                   return (
                     <motion.div
                       key={section.id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.07 }}
                     >
                       <Link to={createPageUrl("SectionDetail") + `?sectionId=${section.id}&courseId=${courseId}`}>
                         <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer bg-white overflow-hidden group">
                           {/* Cover Image */}
                           <div className="h-44 bg-gradient-to-br from-purple-300 to-purple-500 relative overflow-hidden">
                             {section.coverImage ? (
                               <img
                                 src={section.coverImage}
                                 alt={section.title}
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                               />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center">
                                 <Grid2x2 className="w-12 h-12 text-white/40" />
                               </div>
                             )}
                             <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
                               <div
                                 className="h-full bg-green-400 transition-all duration-300"
                                 style={{ width: `${sectionProg}%` }}
                               />
                             </div>
                           </div>

                           <CardContent className="p-5 flex flex-col gap-4">
                             <div>
                               <h3 className="font-bold text-[#3B224E] text-lg leading-snug mb-2 group-hover:text-[#5B2E84] transition-colors">
                                 {section.title}
                               </h3>
                               {section.description && (
                                 <p className="text-sm text-gray-500 line-clamp-2">
                                   {section.description}
                                 </p>
                               )}
                             </div>

                             <div className="space-y-2">
                               <div className="flex items-center justify-between">
                                 <span className="text-xs text-gray-500">{modulesInSection} modules</span>
                                 <span className="text-xs font-semibold text-[#3B224E]">{sectionProg}%</span>
                               </div>
                               <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                 <div
                                   className="h-full bg-green-400 transition-all duration-300"
                                   style={{ width: `${sectionProg}%` }}
                                 />
                               </div>
                             </div>

                             <div className="flex items-center gap-1 text-[#3B224E] text-sm font-medium mt-auto">
                               {sectionProg > 0 ? `Continue` : "Start"}
                               <ArrowRight className="w-4 h-4" />
                             </div>
                           </CardContent>
                         </Card>
                       </Link>
                     </motion.div>
                   );
                 })}
               </div>
             </div>


           </>
         )}
      </div>
    </div>
  );
}