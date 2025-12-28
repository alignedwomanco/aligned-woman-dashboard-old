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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .slice(-4)
        .map((m) => `${m.role === "user" ? "User" : "LaurAI"}: ${m.content}`)
        .join("\n");

      const systemPrompt = `You are LaurAI, the helpful AI assistant for The Aligned Woman Blueprint platform. You help users understand:

- The ALIVE Method: A framework with 4 phases (Awareness, Liberation, Intention, Vision & Embodiment) for personal transformation
- Classroom: Browse and complete learning modules organized by phase, track progress with points and badges, view leaderboards
- Module Player: Watch videos, read lesson content, download resources, mark lessons complete, ask questions in comments
- Tools Hub: Access tools for journaling, check-ins, purpose work, and more - unlocked by completing modules
- Daily Check-In: Log energy, mood, stress, capacity, and receive personalized daily snapshots
- Dashboard: View personalized learning path, ALIVE profile, cycle insights, design/energetics, daily guidance
- Profile Settings: Manage account, social links, background image, restart onboarding
- Community: Connect with other members, share posts, direct messaging
- Support: Get help with platform features
- Onboarding: Complete diagnostic to get personalized pathway based on concerns, capacity, cycle, values, and goals

Be warm, supportive, and concise. Keep responses under 150 words. If you don't know something specific, suggest they reach out to support.

Previous conversation:
${conversationHistory}

User's question: ${userMessage}`;

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
            className="fixed bottom-6 right-6 w-16 h-16 bg-[#3C224F] hover:bg-[#2A1438] rounded-full shadow-2xl flex items-center justify-center z-50 transition-colors"
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
            <div className="bg-gradient-to-r from-[#3C224F] to-[#5B2E84] p-4 flex items-center justify-between">
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
                        ? "bg-[#3C224F] text-white"
                        : "bg-white text-gray-800 shadow-sm"
                    }`}
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
                  className="bg-[#3C224F] hover:bg-[#2A1438] rounded-full w-10 h-10 p-0"
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