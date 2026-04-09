import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Tag, Edit } from "lucide-react";

export default function AccessTagManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [form, setForm] = useState({ tag_key: "", label: "", description: "", tag_type: "course", is_active: true });
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["accessTags"],
    queryFn: () => base44.entities.AccessTag.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AccessTag.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessTags"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AccessTag.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessTags"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AccessTag.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accessTags"] }),
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingTag(null);
    setForm({ tag_key: "", label: "", description: "", tag_type: "course", is_active: true });
  };

  const openEdit = (tag) => {
    setEditingTag(tag);
    setForm({
      tag_key: tag.tag_key,
      label: tag.label,
      description: tag.description || "",
      tag_type: tag.tag_type || "course",
      is_active: tag.is_active !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const typeColors = {
    course: "bg-purple-100 text-purple-800",
    product: "bg-blue-100 text-blue-800",
    feature: "bg-amber-100 text-amber-800",
    other: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Access Tags</h3>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true); }}
          className="bg-[#6E1D40] hover:bg-[#5A1633] text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Create Tag
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Define tags for courses, products, or features. Assign them to members to control access.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-6 h-6 border-4 border-[#6E1D40] border-t-transparent rounded-full" />
        </div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Tag className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No access tags created yet.</p>
            <p className="text-sm">Create tags to control access to courses and products.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag Key</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">{tag.tag_key}</code>
                    </TableCell>
                    <TableCell className="font-medium">{tag.label}</TableCell>
                    <TableCell>
                      <Badge className={`${typeColors[tag.tag_type] || typeColors.other} border-0 capitalize`}>
                        {tag.tag_type || "other"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={tag.is_active !== false
                        ? "bg-green-100 text-green-700 border-0"
                        : "bg-red-100 text-red-700 border-0"
                      }>
                        {tag.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(tag)}>
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete tag "${tag.label}"?`)) deleteMutation.mutate(tag.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={resetForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Create Access Tag"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tag Key *</Label>
              <Input
                value={form.tag_key}
                onChange={(e) => setForm({ ...form, tag_key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                placeholder="e.g. blueprint_paid"
                disabled={!!editingTag}
              />
              <p className="text-xs text-gray-400 mt-1">Unique identifier, no spaces</p>
            </div>
            <div>
              <Label>Label *</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Blueprint Course"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What this tag grants access to"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.tag_type} onValueChange={(v) => setForm({ ...form, tag_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSave}
              disabled={!form.tag_key || !form.label || createMutation.isPending || updateMutation.isPending}
              className="w-full bg-[#6E1D40] hover:bg-[#5A1633] text-white"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTag ? "Update Tag" : "Create Tag"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}