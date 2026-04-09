import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MemberAccessTagEditor({ member, onClose }) {
  const [tags, setTags] = useState(member.access_tags || []);
  const [membershipType, setMembershipType] = useState(member.membership_type || "free");
  const [newTag, setNewTag] = useState("");
  const queryClient = useQueryClient();

  const { data: availableTags = [] } = useQuery({
    queryKey: ["accessTags"],
    queryFn: () => base44.entities.AccessTag.filter({ is_active: true }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      base44.entities.User.update(member.id, {
        access_tags: tags,
        membership_type: membershipType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      onClose();
    },
  });

  const addTag = (tagKey) => {
    if (tagKey && !tags.includes(tagKey)) {
      setTags([...tags, tagKey]);
    }
    setNewTag("");
  };

  const removeTag = (tagKey) => {
    setTags(tags.filter((t) => t !== tagKey));
  };

  const unusedTags = availableTags.filter((t) => !tags.includes(t.tag_key));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Access — {member.full_name || member.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Membership Type */}
          <div>
            <Label className="mb-1.5">Membership Type</Label>
            <Select value={membershipType} onValueChange={setMembershipType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current Tags */}
          <div>
            <Label className="mb-1.5">Access Tags</Label>
            <div className="flex flex-wrap gap-2 min-h-[36px] p-2 border rounded-md bg-gray-50">
              {tags.length === 0 && (
                <span className="text-sm text-gray-400">No tags assigned</span>
              )}
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-[#F5E8EE] text-[#6E1D40] border-0 gap-1 pr-1"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:bg-[#6E1D40]/10 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Add from existing tags */}
          {unusedTags.length > 0 && (
            <div>
              <Label className="mb-1.5">Add Existing Tag</Label>
              <Select value="" onValueChange={addTag}>
                <SelectTrigger><SelectValue placeholder="Choose a tag..." /></SelectTrigger>
                <SelectContent>
                  {unusedTags.map((t) => (
                    <SelectItem key={t.tag_key} value={t.tag_key}>
                      {t.label} ({t.tag_key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Add custom tag */}
          <div>
            <Label className="mb-1.5">Add Custom Tag</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                placeholder="custom_tag_key"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(newTag); } }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => addTag(newTag)}
                disabled={!newTag}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full bg-[#6E1D40] hover:bg-[#5A1633] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}