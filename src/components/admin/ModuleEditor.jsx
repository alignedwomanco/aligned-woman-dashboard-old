import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

export default function ModuleEditor({ open, onOpenChange, module, sectionId }) {
  const [formData, setFormData] = useState({
    title: "",
    phase: "Awareness",
    summary: "",
    order: 0,
    isEnabled: true,
    durationMinutes: 0,
    outcomes: [],
    sectionId: sectionId || "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (module) {
      setFormData(module);
    } else {
      setFormData({
        title: "",
        phase: "Awareness",
        summary: "",
        order: 0,
        isEnabled: true,
        durationMinutes: 0,
        outcomes: [],
        sectionId: sectionId || "",
      });
    }
  }, [module, open, sectionId]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const saveData = {
        ...data,
        sectionId: data.sectionId || sectionId,
      };
      
      if (module) {
        return base44.entities.Module.update(module.id, saveData);
      } else {
        return base44.entities.Module.create(saveData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{module ? "Edit Module" : "Create Module"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Module Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Nervous System Regulation"
            />
          </div>

          <div>
            <Label>Phase</Label>
            <Select
              value={formData.phase}
              onValueChange={(value) => setFormData({ ...formData, phase: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Awareness">Awareness</SelectItem>
                <SelectItem value="Liberation">Liberation</SelectItem>
                <SelectItem value="Intention">Intention</SelectItem>
                <SelectItem value="VisionEmbodiment">Vision & Embodiment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Summary</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief module summary..."
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={formData.durationMinutes}
              onChange={(e) =>
                setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })
              }
              min={0}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label>Enabled</Label>
              <p className="text-sm text-gray-600">Make this module visible</p>
            </div>
            <Switch
              checked={formData.isEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isEnabled: checked })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.title}
              className="bg-[#6B1B3D] hover:bg-[#4A1228]"
            >
              {module ? "Save Changes" : "Create Module"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}