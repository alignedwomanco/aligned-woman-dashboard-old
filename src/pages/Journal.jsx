import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  PenLine,
  Sparkles,
  Send,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Unlock,
  Target,
  Compass,
} from "lucide-react";
import { format } from "date-fns";

const phasePrompts = {
  Awareness: [
    "What signals is your body sending you today?",
    "When did you last feel truly rested?",
    "What pattern keeps repeating in your stress response?",
  ],
  Liberation: [
    "What belief about yourself feels heavy today?",
    "When do you abandon yourself to keep others comfortable?",
    "What would your younger self need to hear?",
  ],
  Intention: [
    "What boundary needs to be spoken?",
    "Where are you spending energy that doesn't serve you?",
    "What does aligned action look like for you this week?",
  ],
  VisionEmbodiment: [
    "Who are you becoming?",
    "What would you do if you trusted yourself fully?",
    "What does embodied leadership mean to you?",
  ],
};

const phaseIcons = {
  Awareness: Eye,
  Liberation: Unlock,
  Intention: Target,
  VisionEmbodiment: Compass,
};

const phaseColors = {
  Awareness: "bg-blue-100 text-blue-700",
  Liberation: "bg-[#F5E8EE] text-[#6E1D40]",
  Intention: "bg-pink-100 text-[#6B1B3D]",
  VisionEmbodiment: "bg-rose-100 text-rose-700",
};

export default function Journal() {
  const [selectedPhase, setSelectedPhase] = useState("Awareness");
  const [selectedPrompt, setSelectedPrompt] = useState(phasePrompts.Awareness[0]);
  const [entry, setEntry] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [expandedEntries, setExpandedEntries] = useState({});

  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journalEntries"],
    queryFn: () => base44.entities.JournalEntry.list("-created_date", 20),
    initialData: [],
  });

  const createEntryMutation = useMutation({
    mutationFn: (data) => base44.entities.JournalEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journalEntries"] });
      setEntry("");
      setAiResponse(null);
    },
  });

  const handleSubmit = async () => {
    if (!entry.trim()) return;

    setIsProcessing(true);

    // Get AI response
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a compassionate journal coach for The Aligned Woman Blueprint. The user is in the ${selectedPhase} phase and responded to this prompt: "${selectedPrompt}"

Their entry: "${entry}"

Provide a brief, supportive reflection (2-3 sentences). Do not give advice. Do not diagnose. Mirror their insight, validate their experience, or ask a gentle follow-up question. Keep it grounded and warm.`,
    });

    setAiResponse(response);
    setIsProcessing(false);

    // Save entry
    await createEntryMutation.mutateAsync({
      phase: selectedPhase,
      prompt: selectedPrompt,
      entry: entry,
      aiResponse: response,
    });
  };

  const toggleExpanded = (id) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const PhaseIcon = phaseIcons[selectedPhase];

  return (
    <div className="min-h-screen bg-[#F5E8EE]/50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-[#6E1D40] mb-2">Journal</h1>
          <p className="text-gray-600">
            Reflect, process, and integrate with AI-supported journaling.
          </p>
        </motion.div>

        {/* New Entry Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6E1D40] to-[#943A59] rounded-xl flex items-center justify-center">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                <CardTitle>New Entry</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phase Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Choose a phase
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(phasePrompts).map((phase) => {
                    const Icon = phaseIcons[phase];
                    return (
                      <button
                        key={phase}
                        onClick={() => {
                          setSelectedPhase(phase);
                          setSelectedPrompt(phasePrompts[phase][0]);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                          selectedPhase === phase
                            ? "border-[#6E1D40] bg-[#F5E8EE]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {phase === "VisionEmbodiment" ? "Vision" : phase}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Choose a prompt
                </label>
                <div className="space-y-2">
                  {phasePrompts[selectedPhase].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPrompt(prompt)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedPrompt === prompt
                          ? "border-[#6E1D40] bg-[#F5E8EE]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry Input */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Your response
                </label>
                <Textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="Write freely. This is your space..."
                  className="min-h-[200px] rounded-xl border-gray-200 focus:border-[#6E1D40] focus:ring-[#6E1D40]"
                />
              </div>

              {/* AI Response */}
              <AnimatePresence>
                {aiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gradient-to-r from-[#F5E8EE] to-[#DEBECC]/30 rounded-xl p-6 border border-[#DEBECC]"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-[#6E1D40]" />
                      <span className="font-medium text-[#6E1D40]">Reflection</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{aiResponse}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!entry.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-[#6E1D40] to-[#943A59] text-white py-6"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Entry
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Past Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-[#6E1D40] mb-6">Past Entries</h2>
          <div className="space-y-4">
            {entries.map((journalEntry, index) => {
              const Icon = phaseIcons[journalEntry.phase] || Eye;
              const isExpanded = expandedEntries[journalEntry.id];

              return (
                <motion.div
                  key={journalEntry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Badge className={phaseColors[journalEntry.phase] || "bg-gray-100"}>
                            <Icon className="w-3 h-3 mr-1" />
                            {journalEntry.phase === "VisionEmbodiment" ? "Vision" : journalEntry.phase}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(journalEntry.created_date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleExpanded(journalEntry.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <p className="text-sm text-gray-500 italic mb-3">
                        {journalEntry.prompt}
                      </p>

                      <p className={`text-gray-700 ${isExpanded ? "" : "line-clamp-3"}`}>
                        {journalEntry.entry}
                      </p>

                      {isExpanded && journalEntry.aiResponse && (
                        <div className="mt-4 bg-[#F5E8EE] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#6E1D40]" />
                            <span className="text-sm font-medium text-[#6E1D40]">Reflection</span>
                          </div>
                          <p className="text-sm text-gray-600">{journalEntry.aiResponse}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {entries.length === 0 && !isLoading && (
              <div className="text-center py-12 text-gray-500">
                No journal entries yet. Start writing above.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}