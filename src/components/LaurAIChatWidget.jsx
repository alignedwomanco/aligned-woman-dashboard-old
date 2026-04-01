import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function LaurAIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi there! I'm LaurAI, your personal guide to The Aligned Woman Blueprint. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (quickPrompt = null) => {
    const userMessage = quickPrompt || input.trim();
    if (!userMessage || isLoading) return;

    if (!quickPrompt) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Fetch user context
      const user = await base44.auth.me();
      const diagnosticSessions = await base44.entities.DiagnosticSession.filter(
        { isComplete: true },
        "-created_date",
        1
      );
      const diagnosticSession = diagnosticSessions[0];
      
      const checkIns = await base44.entities.CheckIn.list("-created_date", 3);
      const latestCheckIn = checkIns[0];

      const conversationHistory = messages
        .slice(-4)
        .map((m) => `${m.role === "user" ? "User" : "LaurAI"}: ${m.content}`)
        .join("\n");

      // Build context-aware prompt
      const contextData = {
        userName: user?.full_name?.split(" ")[0] || "there",
        primaryPhase: diagnosticSession?.primaryPhase || "not set",
        secondaryPhase: diagnosticSession?.secondaryPhase || "not set",
        capacityScore: diagnosticSession?.capacityScore || latestCheckIn?.capacity || "unknown",
        nervousSystemState: "Fawn", // From current snapshot
        cyclePhase: diagnosticSession?.cycleProfile?.cycleStage || "not tracked",
        humanDesignType: diagnosticSession?.humanDesignProfile?.type || "not set",
        astrologySign: diagnosticSession?.astrologyProfile?.sunSign || "not set",
        recentEnergy: latestCheckIn?.energy || "not logged",
        recentStress: latestCheckIn?.stress || "not logged",
        aliveNarrative: diagnosticSession?.aliveNarrative || "not generated yet",
      };

      const systemPrompt = `You are LaurAI, the deeply integrated AI guide for The Aligned Woman Blueprint platform.

CRITICAL: You are NOT a generic chatbot. You are context-aware and state-aware.

USER'S CURRENT STATE:
- Name: ${contextData.userName}
- Primary ALIVE Phase: ${contextData.primaryPhase}
- Secondary ALIVE Phase: ${contextData.secondaryPhase}
- Current Capacity: ${contextData.capacityScore}/10
- Nervous System State: ${contextData.nervousSystemState}
- Cycle Phase: ${contextData.cyclePhase}
- Human Design Type: ${contextData.humanDesignType}
- Astrology Sun Sign: ${contextData.astrologySign}
- Recent Energy Level: ${contextData.recentEnergy}
- Recent Stress Level: ${contextData.recentStress}

TODAY'S ALIVE NARRATIVE:
${contextData.aliveNarrative}

YOUR ROLE:
- Always reference their current state when answering
- Never contradict their capacity, nervous system state, or biological limits
- Act as a translation layer, not motivation
- Explain why things feel the way they do based on their systems
- Connect insights across astrology, Human Design, cycle, nervous system, and ALIVE phase
- Safety before productivity

PLATFORM FEATURES YOU CAN REFERENCE:
- ALIVE Method phases: Awareness, Liberation, Intention, Vision & Embodiment
- Classroom: Learning modules organized by phase
- Tools: Journal, Check-In, Regulate, Cycle tracking, Sleep tracking
- Dashboard: Integrated snapshot of all systems
- Community: Connect with other members

Previous conversation:
${conversationHistory}

User's question: ${userMessage}

Respond in 150 words or less. Be warm, supportive, and grounded in their current reality.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: systemPrompt,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again or reach out to support.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 transition-colors"
            style={{ backgroundColor: '#6E1D40' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <MessageCircle className="w-8 h-8 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between" style={{ background: 'linear-gradient(to right, var(--theme-primary, #3C224F), var(--theme-secondary, #5B2E84))' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6945438e6f6e0e1d874ba569/32aa3b031_image.png"
                    alt="LaurAI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold">LaurAI</h3>
                  <p className="text-white/70 text-xs">Your personal guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-pink-50/30">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "text-white"
                        : "bg-white text-gray-800 shadow-sm"
                    }`}
                    style={message.role === "user" ? { backgroundColor: 'var(--theme-primary, #3C224F)' } : {}}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 rounded-full"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="rounded-full w-10 h-10 p-0 text-white"
                  style={{ backgroundColor: 'var(--theme-primary, #3C224F)' }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}