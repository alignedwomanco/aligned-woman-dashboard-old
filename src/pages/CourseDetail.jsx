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
import { ArrowLeft, Clock, Play, CheckCircle, Lock, BookOpen, Grid2x2, Star } from "lucide-react";

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

  const getSectionModules = (sectionId) =>
    modules.filter((m) => m.sectionId === sectionId);

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
          <div className="bg-white px-6 py-4">
            <span className="text-sm text-gray-600">{sections.length} sections · {modules.length} modules</span>
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
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                 {sections.map((section, idx) => (
                   <motion.button
                     key={section.id}
                     onClick={() => setActiveSection(section.id)}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: idx * 0.05 }}
                     className={`relative h-32 rounded-2xl overflow-hidden group transition-all ${
                       activeSection === section.id ? "ring-2 ring-[#3B224E]" : ""
                     }`}
                   >
                     {section.coverImage ? (
                       <img src={section.coverImage} alt={section.title} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center">
                         <Grid2x2 className="w-8 h-8 text-white opacity-60" />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-end p-3">
                       <p className="text-white font-medium text-sm leading-tight">{section.title}</p>
                     </div>
                   </motion.button>
                 ))}
               </div>
             </div>

             {/* Modules for Active Section */}
             {activeSection && sections.length > 0 && (() => {
               const activeSection_ = sections.find(s => s.id === activeSection);
               const sectionModules = getSectionModules(activeSection);
               return (
                 <div>
                   {activeSection_.description && (
                     <p className="text-gray-600 mb-4 text-sm">{activeSection_.description}</p>
                   )}
                   {sectionModules.length === 0 ? (
                     <div className="text-center py-12 bg-white/60 rounded-2xl">
                       <p className="text-gray-500">No modules in this section yet.</p>
                     </div>
                   ) : (
                     <div className="grid md:grid-cols-2 gap-4">
                       {sectionModules.map((module, idx) => {
                         const status = getModuleStatus(module.id);
                         const prog = getModuleProgress(module.id);
                         return (
                           <motion.div
                             key={module.id}
                             initial={{ opacity: 0, y: 16 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: idx * 0.05 }}
                           >
                             <Link
                               to={createPageUrl("ModulePlayer") + `?moduleId=${module.id}&courseId=${courseId}`}
                             >
                               <Card className="h-full hover:shadow-lg transition-all cursor-pointer bg-white">
                                 <CardContent className="p-5">
                                   <div className="flex items-start justify-between mb-3">
                                     <div className="flex-1">
                                       <h3 className="font-semibold text-[#3B224E] text-base leading-snug">
                                         {module.title}
                                       </h3>
                                       {module.description && (
                                         <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                           {module.description}
                                         </p>
                                       )}
                                     </div>
                                     <div className="ml-3 flex-shrink-0">
                                       {status === "Complete" ? (
                                         <CheckCircle className="w-5 h-5 text-green-500" />
                                       ) : status === "InProgress" ? (
                                         <Play className="w-5 h-5 text-[#3B224E]" />
                                       ) : (
                                         <Play className="w-5 h-5 text-gray-400" />
                                       )}
                                     </div>
                                   </div>
                                   <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                     {module.durationMinutes > 0 && (
                                       <span className="flex items-center gap-1">
                                         <Clock className="w-3 h-3" />
                                         {module.durationMinutes} min
                                       </span>
                                     )}
                                   </div>
                                   <div className="space-y-2">
                                     <div className="flex justify-between items-center text-xs">
                                       <Badge
                                         className={
                                           status === "Complete"
                                             ? "bg-green-100 text-green-700 border-0"
                                             : status === "InProgress"
                                             ? "bg-purple-100 text-purple-700 border-0"
                                             : "bg-gray-100 text-gray-700 border-0"
                                         }
                                       >
                                         {status === "Complete" ? "✓ Completed" : status === "InProgress" ? "In Progress" : "Start"}
                                       </Badge>
                                       <span className="font-semibold text-gray-700">{prog}%</span>
                                     </div>
                                     <Progress value={prog} className="h-2" />
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
               );
             })()}
           </>
         )}
      </div>
    </div>
  );
}