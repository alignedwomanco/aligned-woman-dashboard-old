import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, BookOpen, Upload } from "lucide-react";

export default function WorkbooksManagerContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "", subtitle: "", expert_id: "", course_id: "",
    intro_text: "", closing_text: "", status: "draft", order: 0,
    cover_image_url: "", blank_pdf_url: "",
  });
  const queryClient = useQueryClient();

  const { data: workbooks = [] } = useQuery({
    queryKey: ["adminWorkbooks"],
    queryFn: () => base44.entities.Workbook.list("order"),
  });

  const { data: experts = [] } = useQuery({
    queryKey: ["experts"],
    queryFn: () => base44.entities.Expert.list(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Workbook.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["adminWorkbooks"]); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Workbook.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["adminWorkbooks"]); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workbook.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["adminWorkbooks"]),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ title: "", subtitle: "", expert_id: "", course_id: "", intro_text: "", closing_text: "", status: "draft", order: 0, cover_image_url: "", blank_pdf_url: "" });
  };

  const openEdit = (wb) => {
    setEditing(wb);
    setForm({
      title: wb.title || "",
      subtitle: wb.subtitle || "",
      expert_id: wb.expert_id || "",
      course_id: wb.course_id || "",
      intro_text: wb.intro_text || "",
      closing_text: wb.closing_text || "",
      status: wb.status || "draft",
      order: wb.order || 0,
      cover_image_url: wb.cover_image_url || "",
      blank_pdf_url: wb.blank_pdf_url || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, [field]: file_url }));
  };

  const getExpertName = (id) => experts.find((e) => e.id === id)?.name || "—";
  const getCourseName = (id) => courses.find((c) => c.id === id)?.title || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#6E1D40" }}>Workbooks</h2>
          <p className="text-gray-600">Manage workbooks linked to your courses</p>
        </div>
        <Button onClick={() => { closeDialog(); setDialogOpen(true); }} className="text-white" style={{ backgroundColor: "#6E1D40" }}>
          <Plus className="w-4 h-4 mr-2" /> Add Workbook
        </Button>
      </div>

      {workbooks.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No workbooks yet</p>
          <p className="text-sm">Click "Add Workbook" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workbooks.map((wb) => (
            <Card key={wb.id} className="hover:border-[#DEBECC] transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#6E1D40] to-[#943A59] flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {wb.cover_image_url ? (
                    <img src={wb.cover_image_url} alt={wb.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-white/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#6E1D40] truncate">{wb.title}</h3>
                  {wb.subtitle && <p className="text-xs text-gray-500 truncate">{wb.subtitle}</p>}
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge className={wb.status === "published" ? "bg-green-100 text-green-700 border-0 text-xs" : "bg-gray-100 text-gray-600 border-0 text-xs"}>
                      {wb.status === "published" ? "Published" : "Draft"}
                    </Badge>
                    {wb.expert_id && <Badge className="bg-[#F5E8EE] text-[#6E1D40] border-0 text-xs">{getExpertName(wb.expert_id)}</Badge>}
                    {wb.course_id && <span className="text-xs text-gray-400">{getCourseName(wb.course_id)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(wb)} className="p-2 hover:bg-gray-100 rounded" title="Edit">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => { if (confirm("Delete this workbook?")) deleteMutation.mutate(wb.id); }} className="p-2 hover:bg-gray-100 rounded" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Workbook" : "Create Workbook"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., The Hormones Workbook" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g., Companion to the Hormones Module" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expert</Label>
                <Select value={form.expert_id} onValueChange={(v) => setForm({ ...form, expert_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select expert" /></SelectTrigger>
                  <SelectContent>{experts.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Course</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Intro Text</Label>
              <Textarea value={form.intro_text} onChange={(e) => setForm({ ...form, intro_text: e.target.value })} placeholder="How to use this workbook..." className="min-h-[80px]" />
            </div>
            <div>
              <Label>Closing Text</Label>
              <Textarea value={form.closing_text} onChange={(e) => setForm({ ...form, closing_text: e.target.value })} placeholder="Shown on completion..." className="min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cover Image</Label>
                {form.cover_image_url && <img src={form.cover_image_url} alt="cover" className="w-full h-24 object-cover rounded-lg mb-2" />}
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer text-sm font-medium text-gray-700">
                  <Upload className="w-4 h-4" /> {form.cover_image_url ? "Change" : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "cover_image_url")} />
                </label>
              </div>
              <div>
                <Label>Blank PDF</Label>
                {form.blank_pdf_url && <p className="text-xs text-green-600 mb-2 truncate">PDF uploaded ✓</p>}
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer text-sm font-medium text-gray-700">
                  <Upload className="w-4 h-4" /> {form.blank_pdf_url ? "Change PDF" : "Upload PDF"}
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, "blank_pdf_url")} />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.status === "published"} onCheckedChange={(checked) => setForm({ ...form, status: checked ? "published" : "draft" })} />
                <Label>Published</Label>
              </div>
              <div>
                <Label>Order</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="w-20 ml-2 inline-block" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={!form.title} className="w-full text-white" style={{ backgroundColor: "#6E1D40" }}>
              {editing ? "Update Workbook" : "Create Workbook"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}