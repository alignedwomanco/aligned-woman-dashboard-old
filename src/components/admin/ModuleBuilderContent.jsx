import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Upload,
  Video,
  Download,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ModuleBuilderContent() {
  const [selectedModule, setSelectedModule] = useState(null);
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [isCreatingSubModule, setIsCreatingSubModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    title: "",
    phase: "Awareness",
    summary: "",
    outcomes: [],
    durationMinutes: 0,
    order: 1,
    isEnabled: true,
  });
  const [subModuleForm, setSubModuleForm] = useState({
    title: "",
    order: 1,
    videoUrl: "",
    videoDuration: 0,
    lessonContent: "",
    downloads: [],
  });

  const queryClient = useQueryClient();

  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: () => base44.entities.Module.list("order"),
  });

  const { data: subModules = [] } = useQuery({
    queryKey: ["subModules", selectedModule?.id],
    queryFn: () =>
      base44.entities.SubModule.filter({ moduleId: selectedModule.id }, "order"),
    enabled: !!selectedModule,
  });

  const createModuleMutation = useMutation({
    mutationFn: (data) => base44.entities.Module.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      setIsCreatingModule(false);
      setModuleForm({ title: "", phase: "Awareness", summary: "", outcomes: [], durationMinutes: 0, order: 1, isEnabled: true });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Module.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id) => base44.entities.Module.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      setSelectedModule(null);
    },
  });

  const createSubModuleMutation = useMutation({
    mutationFn: (data) => base44.entities.SubModule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subModules"] });
      setIsCreatingSubModule(false);
      setSubModuleForm({
        title: "",
        order: 1,
        videoUrl: "",
        videoDuration: 0,
        lessonContent: "",
        downloads: [],
      });
    },
  });

  const deleteSubModuleMutation = useMutation({
    mutationFn: (id) => base44.entities.SubModule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subModules"] });
    },
  });

  const handleCreateModule = () => {
    createModuleMutation.mutate(moduleForm);
  };

  const handleToggleModule = (module) => {
    updateModuleMutation.mutate({
      id: module.id,
      data: { isEnabled: !module.isEnabled },
    });
  };

  const handleMoveModule = (module, direction) => {
    const currentIndex = modules.findIndex((m) => m.id === module.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= modules.length) return;

    const swapModule = modules[swapIndex];

    updateModuleMutation.mutate({
      id: module.id,
      data: { order: swapModule.order },
    });

    updateModuleMutation.mutate({
      id: swapModule.id,
      data: { order: module.order },
    });
  };

  const handleDeleteModule = (module) => {
    if (window.confirm(`Delete "${module.title}"? This cannot be undone.`)) {
      deleteModuleMutation.mutate(module.id);
    }
  };

  const handleCreateSubModule = () => {
    createSubModuleMutation.mutate({
      ...subModuleForm,
      moduleId: selectedModule.id,
    });
  };

  const handleUploadVideo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSubModuleForm({ ...subModuleForm, videoUrl: file_url });
  };

  const handleUploadDownload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSubModuleForm({
      ...subModuleForm,
      downloads: [...subModuleForm.downloads, { name: file.name, url: file_url }],
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#4A1228]">Module Builder</h2>
          <p className="text-gray-600">Create and manage learning modules</p>
        </div>
        <Dialog open={isCreatingModule} onOpenChange={setIsCreatingModule}>
          <DialogTrigger asChild>
            <Button className="bg-[#6B1B3D] hover:bg-[#4A1228]">
              <Plus className="w-4 h-4 mr-2" />
              Create Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Module Title</Label>
                <Input
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="e.g., Nervous System Regulation"
                />
              </div>
              <div>
                <Label>Phase</Label>
                <select
                  value={moduleForm.phase}
                  onChange={(e) => setModuleForm({ ...moduleForm, phase: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Awareness">Awareness</option>
                  <option value="Liberation">Liberation</option>
                  <option value="Intention">Intention</option>
                  <option value="VisionEmbodiment">Vision & Embodiment</option>
                </select>
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea
                  value={moduleForm.summary}
                  onChange={(e) => setModuleForm({ ...moduleForm, summary: e.target.value })}
                  placeholder="Module description..."
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={moduleForm.durationMinutes}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, durationMinutes: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={moduleForm.order}
                  onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={handleCreateModule} className="w-full bg-[#6B1B3D]">
                Create Module
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Modules List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Modules ({modules.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedModule?.id === module.id
                    ? "border-[#6B1B3D] bg-pink-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => setSelectedModule(module)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#4A1228]">{module.title}</span>
                      {!module.isEnabled && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {module.phase}
                    </Badge>
                  </button>
                  
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleToggleModule(module)}
                    >
                      {module.isEnabled ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveModule(module, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveModule(module, "down")}
                      disabled={index === modules.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteModule(module)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sub-Modules */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {selectedModule ? `${selectedModule.title} - Sub-Modules` : "Select a Module"}
              </CardTitle>
              {selectedModule && (
                <Dialog open={isCreatingSubModule} onOpenChange={setIsCreatingSubModule}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-[#6B1B3D]">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Sub-Module
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Sub-Module</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={subModuleForm.title}
                          onChange={(e) =>
                            setSubModuleForm({ ...subModuleForm, title: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Order</Label>
                        <Input
                          type="number"
                          value={subModuleForm.order}
                          onChange={(e) =>
                            setSubModuleForm({
                              ...subModuleForm,
                              order: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Video Upload</Label>
                        <div className="flex items-center gap-2">
                          <Input type="file" accept="video/*" onChange={handleUploadVideo} />
                          {subModuleForm.videoUrl && (
                            <Badge className="bg-green-100 text-green-800">Uploaded</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Video Duration (seconds)</Label>
                        <Input
                          type="number"
                          value={subModuleForm.videoDuration}
                          onChange={(e) =>
                            setSubModuleForm({
                              ...subModuleForm,
                              videoDuration: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Lesson Content</Label>
                        <Textarea
                          value={subModuleForm.lessonContent}
                          onChange={(e) =>
                            setSubModuleForm({ ...subModuleForm, lessonContent: e.target.value })
                          }
                          className="min-h-[150px]"
                        />
                      </div>
                      <div>
                        <Label>Downloads</Label>
                        <Input
                          type="file"
                          onChange={handleUploadDownload}
                          className="mb-2"
                        />
                        {subModuleForm.downloads.map((download, idx) => (
                          <Badge key={idx} className="mr-2">
                            {download.name}
                          </Badge>
                        ))}
                      </div>
                      <Button onClick={handleCreateSubModule} className="w-full bg-[#6B1B3D]">
                        Create Sub-Module
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedModule ? (
              <div className="text-center py-12 text-gray-500">
                Select a module to view and manage sub-modules
              </div>
            ) : (
              <div className="space-y-3">
                {subModules.map((subModule) => (
                  <motion.div
                    key={subModule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:border-pink-200 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-[#4A1228]">{subModule.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {subModule.videoUrl && (
                          <Badge variant="outline" className="text-xs">
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </Badge>
                        )}
                        {subModule.downloads?.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            {subModule.downloads.length} files
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge>Order {subModule.order}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSubModuleMutation.mutate(subModule.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}