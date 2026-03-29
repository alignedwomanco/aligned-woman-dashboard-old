import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Tag, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ExpertCategoryManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#7A1B33" });
  const [colorTemplates, setColorTemplates] = useState([
    { label: "Rose", value: "#99526C" },
    { label: "Lavender", value: "#F3E8FF" },
    { label: "Mint", value: "#DCFCE8" },
    { label: "Sky", value: "#DBE9FE" },
    { label: "Peach", value: "#FFE4D6" },
  ]);
  const [editingTemplateIdx, setEditingTemplateIdx] = useState(null);
  const [tempTemplateColor, setTempTemplateColor] = useState("");
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["expertCategories"],
    queryFn: () => base44.entities.ExpertCategory.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ExpertCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expertCategories"] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ExpertCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expertCategories"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ExpertCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expertCategories"] });
    },
  });

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: "", description: "", color: "#7A1B33" });
    setDialogOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, description: cat.description || "", color: cat.color || "#7A1B33" });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setForm({ name: "", description: "", color: "#7A1B33" });
    setEditingTemplateIdx(null);
    setTempTemplateColor("");
  };

  const handleEditTemplate = (idx) => {
    setEditingTemplateIdx(idx);
    setTempTemplateColor(colorTemplates[idx].value);
  };

  const handleSaveTemplate = (idx) => {
    if (tempTemplateColor.match(/^#[0-9A-F]{6}$/i)) {
      const updated = [...colorTemplates];
      updated[idx].value = tempTemplateColor;
      setColorTemplates(updated);
      setEditingTemplateIdx(null);
      setTempTemplateColor("");
    }
  };

  const handleReorderCategories = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const reordered = Array.from(categories);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    // Update order field for each category
    reordered.forEach((cat, idx) => {
      if (cat.order !== idx) {
        updateMutation.mutate({ id: cat.id, data: { order: idx } });
      }
    });
  };

  const handleSave = () => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl mb-2 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Expert Categories
            </CardTitle>
            <p className="text-gray-600">Manage categories shown in expert dropdowns and filters</p>
          </div>
          <Button onClick={openCreate} className="bg-[#3D2250] hover:bg-[#5B2E84]">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No categories yet. Add one to get started.</p>
        ) : (
          <DragDropContext onDragEnd={handleReorderCategories}>
            <Droppable droppableId="categories-list">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 ${snapshot.isDraggingOver ? "bg-purple-50 rounded-lg p-2" : ""}`}
                >
                  {categories.map((cat, idx) => (
                    <Draggable key={cat.id} draggableId={cat.id} index={idx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-2 border rounded-lg px-3 py-2 bg-white transition-all ${
                            snapshot.isDragging ? "shadow-lg bg-purple-50" : "hover:shadow-sm"
                          }`}
                        >
                          <button
                            {...provided.dragHandleProps}
                            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: "#7A1B33" }}>
                            {cat.name}
                          </span>
                          {cat.description && (
                            <span className="text-xs text-gray-500 hidden sm:inline">— {cat.description}</span>
                          )}
                          <button
                            onClick={() => openEdit(cat)}
                            className="ml-auto text-gray-400 hover:text-[#7340B9] transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(cat.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Nervous System, Business, Nutrition"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description (optional)"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="flex-1 bg-[#3D2250] hover:bg-[#5B2E84]"
              >
                {editingCategory ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}