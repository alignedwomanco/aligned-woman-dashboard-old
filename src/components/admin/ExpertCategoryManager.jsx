import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Tag } from "lucide-react";

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
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white hover:shadow-sm transition-shadow"
              >
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: cat.color || "#7340B9" }}
                >
                  {cat.name}
                </span>
                {cat.description && (
                  <span className="text-xs text-gray-500 hidden sm:inline">— {cat.description}</span>
                )}
                <button
                  onClick={() => openEdit(cat)}
                  className="ml-1 text-gray-400 hover:text-[#7340B9] transition-colors"
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
            ))}
          </div>
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
            <div>
              <Label>Badge Colour</Label>
              <div className="mt-2 space-y-3">
                {/* Template swatches */}
                <div className="flex gap-2 flex-wrap items-center">
                  {colorTemplates.map((t, idx) => (
                    <div key={idx} className="relative group">
                      <button
                        type="button"
                        title={t.label}
                        onClick={() => setForm({ ...form, color: t.value })}
                        className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: t.value,
                          borderColor: form.color === t.value ? "#6B21A8" : "#e5e7eb",
                        }}
                      />
                      {/* Edit tooltip on hover */}
                      {editingTemplateIdx !== idx && (
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-auto">
                          Click to select, right-click to edit
                        </div>
                      )}
                      {/* Edit input overlay */}
                      {editingTemplateIdx === idx && (
                        <div className="absolute top-0 left-0 flex items-center gap-1 bg-white border rounded shadow-lg p-1 z-10">
                          <input
                            type="text"
                            value={tempTemplateColor}
                            onChange={(e) => setTempTemplateColor(e.target.value)}
                            placeholder="#000000"
                            className="w-20 px-2 py-1 text-xs font-mono border rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveTemplate(idx)}
                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTemplateIdx(null)}
                            className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Hex input + preview */}
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-8 h-8 rounded-full cursor-pointer border border-gray-200 p-0.5"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="#F3E8FF"
                    className="font-mono w-28"
                    maxLength={7}
                  />
                  {/* Badge preview */}
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: form.color }}
                  >
                    {form.name || "Preview"}
                  </span>
                </div>
              </div>
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