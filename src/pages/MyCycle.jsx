import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Moon,
  X,
  Heart,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Activity,
  Clock,
  BookOpen,
  Edit3,
  Target
} from "lucide-react";

const CYCLE_PHASES = {
  menstrual: {
    name: "Menstrual",
    color: "from-red-400 to-pink-500",
    purpose: "Rest, insight, closure, recalibration"
  },
  follicular: {
    name: "Follicular",
    color: "from-green-400 to-emerald-500",
    purpose: "Vision, planning, lightness, curiosity"
  },
  ovulatory: {
    name: "Ovulatory",
    color: "from-yellow-400 to-orange-500",
    purpose: "Communication, visibility, collaboration, output"
  },
  luteal: {
    name: "Luteal",
    color: "from-purple-400 to-indigo-500",
    purpose: "Discernment, editing, boundaries, truth-telling"
  }
};

export default function MyCycle() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [todaysState, setTodaysState] = useState(null);
  const [isGeneratingState, setIsGeneratingState] = useState(false);
  const [lauraiQuestion, setLauraiQuestion] = useState("");
  const [lauraiResponse, setLauraiResponse] = useState("");
  const [isLauraiThinking, setIsLauraiThinking] = useState(false);
  const [showPhaseDeepDive, setShowPhaseDeepDive] = useState(false);
  const [phaseDeepDive, setPhaseDeepDive] = useState(null);
  const [showSymptomLog, setShowSymptomLog] = useState(false);
  const [symptomLog, setSymptomLog] = useState({
    energy: 5,
    mood: 5,
    focus: 5,
    bodySymptoms: "",
    emotionalTone: ""
  });

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: diagnosticSession } = useQuery({
    queryKey: ["diagnosticSession"],
    queryFn: async () => {
      const sessions = await base44.entities.DiagnosticSession.filter(
        { isComplete: true },
        "-created_date",
        1
      );
      return sessions[0] || null;
    },
  });

  const { data: checkIns } = useQuery({
    queryKey: ["checkIns"],
    queryFn: () => base44.entities.CheckIn.list("-created_date", 7),
    initialData: [],
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["cycleCourses"],
    queryFn: () => base44.entities.Course.list(),
    initialData: [],
  });

  // Determine current phase
  const getCurrentPhase = () => {
    const latestCheckIn = checkIns?.[0];
    if (latestCheckIn?.cycle_phase) {
      return latestCheckIn.cycle_phase.toLowerCase();
    }
    
    if (diagnosticSession?.cycleProfile?.cycleStage === "Cycling") {
      const lastPeriod = diagnosticSession?.cycleProfile?.lastPeriodDate;
      if (lastPeriod) {
        const daysSince = Math.floor((new Date() - new Date(lastPeriod)) / (1000 * 60 * 60 * 24));
        const cycleLength = diagnosticSession?.cycleProfile?.cycleLength || 28;
        const cycleDay = daysSince % cycleLength;
        
        if (cycleDay <= 6) return "menstrual";
        if (cycleDay <= Math.floor(cycleLength * 0.4)) return "follicular";
        if (cycleDay <= Math.floor(cycleLength * 0.5)) return "ovulatory";
        return "luteal";
      }
    }
    
    return "luteal"; // default
  };

  const currentPhase = getCurrentPhase();
  const phaseInfo = CYCLE_PHASES[currentPhase];

  // Generate Today's State
  const generateTodaysState = async () => {
    if (!diagnosticSession || !currentUser) return;
    
    setIsGeneratingState(true);
    
    try {
      const recentSymptoms = checkIns?.slice(0, 3).map(c => ({
        energy: c.energy,
        mood: c.mood,
        stress: c.stress,
        notes: c.notes
      })) || [];

      const prompt = `You are generating a compassionate daily cycle state for ${currentUser.full_name}.

CYCLE CONTEXT:
- Current Phase: ${phaseInfo.name}
- Phase Purpose: ${phaseInfo.purpose}
- Capacity: ${diagnosticSession.capacityScore || 5}/10
- Recent symptoms: ${JSON.stringify(recentSymptoms)}
- Current concerns: ${diagnosticSession.concerns?.join(", ")}

GENERATE:
1. phaseSummary (2-3 sentences explaining where they are and what hormones are doing, plain English)
2. capacityMeaning (what ${diagnosticSession.capacityScore || 5}/10 capacity actually means practically TODAY)
3. todaysGuidance (one clear guiding principle, not a to-do list)

CRITICAL TONE:
- Compassionate, not demanding
- Normalize rest and slowing down
- Never "push through"
- Speak to the body's wisdom
- Make them feel RELIEF, not pressure

Example tone (don't copy): "You're in your luteal phase. Energy naturally turns inward here. Your body is prioritizing discernment and completion rather than expansion."`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            phaseSummary: { type: "string" },
            capacityMeaning: { type: "string" },
            todaysGuidance: { type: "string" }
          }
        }
      });
      
      // Generate what helps/avoid
      const supportPrompt = `Generate phase-specific support for ${phaseInfo.name} phase.

CONTEXT:
- Capacity: ${diagnosticSession.capacityScore || 5}/10
- Concerns: ${diagnosticSession.concerns?.join(", ")}

GENERATE:
- helps: array of 4-5 specific things (work style, movement, food, nervous system support, social energy)
- avoid: array of 3-4 things (behavioral mismatches, overstimulation, self-betrayal patterns)

Be SPECIFIC to ${phaseInfo.name} phase, not generic.`;

      const support = await base44.integrations.Core.InvokeLLM({
        prompt: supportPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            helps: { type: "array", items: { type: "string" } },
            avoid: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      setTodaysState({ ...result, ...support });
    } catch (error) {
      console.error("Failed to generate today's state:", error);
    } finally {
      setIsGeneratingState(false);
    }
  };

  // Generate Phase Deep Dive
  const generatePhaseDeepDive = async () => {
    if (!diagnosticSession) return;
    
    try {
      const prompt = `Generate a transformational deep dive for ${phaseInfo.name} phase.

CONTEXT:
- User capacity: ${diagnosticSession.capacityScore}/10
- User concerns: ${diagnosticSession.concerns?.join(", ")}

GENERATE:
1. whatThisPhaseIs (biological explanation, plain English, 2-3 sentences)
2. whatItsGoodFor (list 3-4 things this phase excels at)
3. whyWomenStruggle (conditioning/cultural pressure that makes this phase hard)
4. whatAlignmentLooks (what working WITH this phase feels like)
5. whatBurnoutLooks (what fighting this phase looks like)
6. microPractice (one tiny supportive ritual)
7. suggestedCourse (course title that would support this phase)

TONE:
- Make this phase feel PURPOSEFUL, not limiting
- Normalize the biological reality
- Remove guilt and judgment`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            whatThisPhaseIs: { type: "string" },
            whatItsGoodFor: { type: "array", items: { type: "string" } },
            whyWomenStruggle: { type: "string" },
            whatAlignmentLooks: { type: "string" },
            whatBurnoutLooks: { type: "string" },
            microPractice: { type: "string" },
            suggestedCourse: { type: "string" }
          }
        }
      });
      
      setPhaseDeepDive(result);
    } catch (error) {
      console.error("Failed to generate phase deep dive:", error);
    }
  };

  useEffect(() => {
    if (diagnosticSession && currentUser && !todaysState) {
      generateTodaysState();
      generatePhaseDeepDive();
    }
  }, [diagnosticSession, currentUser]);

  // Ask LaurAI
  const askLaurAI = async (question) => {
    if (!question.trim() || !diagnosticSession) return;
    
    setIsLauraiThinking(true);
    setLauraiResponse("");
    
    try {
      const recentSymptoms = checkIns?.slice(0, 3) || [];
      
      const contextPrompt = `You are LaurAI, providing cycle-aware guidance on the My Cycle page.

CYCLE CONTEXT:
- Current Phase: ${phaseInfo.name}
- Phase Purpose: ${phaseInfo.purpose}
- Capacity: ${diagnosticSession.capacityScore || 5}/10
- Recent logged symptoms: ${JSON.stringify(recentSymptoms.map(c => ({ energy: c.energy, mood: c.mood, stress: c.stress })))}

TODAY'S STATE:
${todaysState?.phaseSummary || "Analyzing cycle phase..."}

USER QUESTION: "${question}"

RESPONSE REQUIREMENTS:
1. Phase-aware recommendation
2. Why that suits the body TODAY
3. What to watch for (overdoing signals)
4. One gentle alternative

CRITICAL RULES:
- Prioritize compassion over optimization
- NEVER say "push through"
- NEVER override fatigue signals
- ALWAYS normalize rest and slowing down
- Speak to the body, not just behavior
- Lower cortisol, don't raise it
- NO bootcamp energy, NO discipline talk, NO shame

This should feel RELIEVING, not demanding.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt
      });
      
      setLauraiResponse(response);
    } catch (error) {
      console.error("LaurAI error:", error);
      setLauraiResponse("I'm having trouble connecting right now. Please try again.");
    } finally {
      setIsLauraiThinking(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setLauraiQuestion(question);
    askLaurAI(question);
  };

  const handleCustomQuestion = () => {
    askLaurAI(lauraiQuestion);
  };

  // Handle symptom logging
  const handleLogSymptoms = async () => {
    try {
      await base44.entities.CheckIn.create({
        energy: symptomLog.energy,
        mood: symptomLog.mood,
        capacity: symptomLog.focus,
        stress: 5,
        bodySignals: symptomLog.bodySymptoms,
        notes: symptomLog.emotionalTone,
        cycle_phase: phaseInfo.name
      });
      
      setShowSymptomLog(false);
      setSymptomLog({
        energy: 5,
        mood: 5,
        focus: 5,
        bodySymptoms: "",
        emotionalTone: ""
      });
    } catch (error) {
      console.error("Failed to log symptoms:", error);
    }
  };

  // Get recommended courses
  const getRecommendedCourses = () => {
    if (courses.length === 0) return [];
    
    // Phase-aligned recommendations
    return courses.slice(0, 2).map(course => ({
      ...course,
      reason: `Support for ${phaseInfo.name} phase`
    }));
  };

  const recommendedCourses = getRecommendedCourses();

  if (!diagnosticSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Moon className="w-12 h-12 text-indigo-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your cycle profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${phaseInfo.color} rounded-2xl flex items-center justify-center`}>
              <Moon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Cycle</h1>
              <Badge className="bg-indigo-200 text-indigo-900 mt-1">
                {phaseInfo.name} Phase
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </motion.div>

        {/* Today's State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`mb-6 border-l-4 border-indigo-500`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Today's State
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isGeneratingState ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full" />
                  <span className="text-gray-600">Understanding your cycle today...</span>
                </div>
              ) : todaysState ? (
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    {todaysState.phaseSummary}
                  </p>

                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-900">Capacity Today</span>
                      <span className="text-2xl font-bold text-indigo-600">{diagnosticSession.capacityScore || 5}/10</span>
                    </div>
                    <p className="text-sm text-gray-700">{todaysState.capacityMeaning}</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg p-4 text-white text-center">
                    <p className="font-semibold text-lg">{todaysState.todaysGuidance}</p>
                  </div>
                </div>
              ) : (
                <Button onClick={generateTodaysState} className="bg-indigo-500 hover:bg-indigo-600">
                  Generate Today's State
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Support Your System Today */}
        {todaysState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Support Your System Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      What Helps Today
                    </h3>
                    <ul className="space-y-2">
                      {todaysState.helps?.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      What to Avoid Today
                    </h3>
                    <ul className="space-y-2">
                      {todaysState.avoid?.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Log & Plan Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex gap-3 mb-6"
        >
          <Button
            onClick={() => setShowSymptomLog(!showSymptomLog)}
            variant="outline"
            className="flex-1"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Log Symptoms
          </Button>
          <Button
            onClick={() => setShowPhaseDeepDive(!showPhaseDeepDive)}
            variant="outline"
            className="flex-1"
          >
            <Activity className="w-4 h-4 mr-2" />
            Understanding This Phase
          </Button>
        </motion.div>

        {/* Symptom Log */}
        <AnimatePresence>
          {showSymptomLog && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="mb-6 bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">How are you feeling today?</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-700 mb-2 block">Energy: {symptomLog.energy}/10</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={symptomLog.energy}
                        onChange={(e) => setSymptomLog({ ...symptomLog, energy: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 mb-2 block">Mood: {symptomLog.mood}/10</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={symptomLog.mood}
                        onChange={(e) => setSymptomLog({ ...symptomLog, mood: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 mb-2 block">Focus: {symptomLog.focus}/10</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={symptomLog.focus}
                        onChange={(e) => setSymptomLog({ ...symptomLog, focus: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <Textarea
                      placeholder="Body symptoms (optional)"
                      value={symptomLog.bodySymptoms}
                      onChange={(e) => setSymptomLog({ ...symptomLog, bodySymptoms: e.target.value })}
                      className="bg-white"
                    />
                    <Textarea
                      placeholder="Emotional tone (optional)"
                      value={symptomLog.emotionalTone}
                      onChange={(e) => setSymptomLog({ ...symptomLog, emotionalTone: e.target.value })}
                      className="bg-white"
                    />
                    <Button onClick={handleLogSymptoms} className="w-full bg-purple-500 hover:bg-purple-600">
                      Save Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase Deep Dive */}
        <AnimatePresence>
          {showPhaseDeepDive && phaseDeepDive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Understanding Your {phaseInfo.name} Phase</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What This Phase Is</h3>
                    <p className="text-sm text-gray-700">{phaseDeepDive.whatThisPhaseIs}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">What It's Good For</h3>
                    <ul className="space-y-1">
                      {phaseDeepDive.whatItsGoodFor?.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h3 className="font-semibold text-amber-900 mb-2">Why Women Struggle Here</h3>
                    <p className="text-sm text-gray-700">{phaseDeepDive.whyWomenStruggle}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 text-sm mb-1">What Alignment Looks Like</h4>
                      <p className="text-xs text-gray-700">{phaseDeepDive.whatAlignmentLooks}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <h4 className="font-semibold text-red-900 text-sm mb-1">What Burnout Looks Like</h4>
                      <p className="text-xs text-gray-700">{phaseDeepDive.whatBurnoutLooks}</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2">Micro-Practice</h3>
                    <p className="text-sm text-gray-700">{phaseDeepDive.microPractice}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ask LaurAI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ask LaurAI</p>
                  <p className="text-xs text-gray-600">Cycle-aware guidance</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {[
                  "How should I train today?",
                  "What should I eat today?",
                  "How should I plan my week?"
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(prompt)}
                    className="bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <Input
                  value={lauraiQuestion}
                  onChange={(e) => setLauraiQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
                  placeholder="Ask your own question..."
                  className="flex-1 bg-white"
                  disabled={isLauraiThinking}
                />
                <Button 
                  onClick={handleCustomQuestion}
                  disabled={isLauraiThinking || !lauraiQuestion.trim()}
                  className="bg-gradient-to-r from-indigo-400 to-purple-500 text-white"
                >
                  {isLauraiThinking ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <AnimatePresence>
                {lauraiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <p className="text-sm text-gray-900 whitespace-pre-line leading-relaxed">
                      {lauraiResponse}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recipes for This Phase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Recipes for {phaseInfo.name} Phase
              </CardTitle>
              <p className="text-sm text-gray-600">Nourish your body with what it needs now</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop" 
                      alt="Nourishing bowl"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Warming Root Bowl</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80">15 min</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-indigo-600 border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop" 
                      alt="Woman cooking"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Hormone Balancing Tea</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80">5 min</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-indigo-600 border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop" 
                      alt="Healthy salad"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Anti-Inflammatory Bowl</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80">20 min</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-indigo-600 border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Movement for This Phase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.37 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Movement for {phaseInfo.name} Phase
              </CardTitle>
              <p className="text-sm text-gray-600">Move in ways that support your body today</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop" 
                      alt="Gentle yoga"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Restorative Flow</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80">20 min</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-pink-600 border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop" 
                      alt="Woman stretching"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Gentle Stretching</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80">10 min</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-pink-600 border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1540206395-68808572332f?w=400&h=300&fit=crop" 
                      alt="Walking in nature"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Mindful Walking</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80">30 min</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-pink-600 border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Meditations for Luteal Phase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.39 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Meditations for {phaseInfo.name} Phase
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Calm your nervous system and find your center</p>
                </div>
                <Button variant="ghost" className="text-indigo-600 text-sm">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop" 
                      alt="Woman meditating"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Letting Go Meditation</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80">15 min</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-purple-600 border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1593811167562-9cef47bfc4a7?w=400&h=300&fit=crop" 
                      alt="Peaceful meditation"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Body Scan for Rest</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80">10 min</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-purple-600 border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=300&fit=crop" 
                      alt="Evening meditation"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Inner Wisdom Practice</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80">12 min</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-purple-600 border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tools Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.41 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    Tools
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Calculators and trackers to support your cycle awareness</p>
                </div>
                <Button variant="ghost" className="text-indigo-600 text-sm">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop" 
                      alt="Ovulation calculator"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Ovulation Calculator</h3>
                      <p className="text-xs text-white/80">Figure out your most fertile days</p>
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1616443023859-c0c3e2c0a5d3?w=400&h=300&fit=crop" 
                      alt="Period calculator"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Period Calculator</h3>
                      <p className="text-xs text-white/80">Predict when your next period will arrive</p>
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1611432579699-484f7990b127?w=400&h=300&fit=crop" 
                      alt="Cycle tracker"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Cycle Length Tracker</h3>
                      <p className="text-xs text-white/80">Understand your unique rhythm</p>
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop" 
                      alt="Menstrual cycle calculator"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Menstrual Cycle Calculator</h3>
                      <p className="text-xs text-white/80">Track your full cycle</p>
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop" 
                      alt="Fertility window"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Fertility Window</h3>
                      <p className="text-xs text-white/80">Identify your peak conception days</p>
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-video relative">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" 
                      alt="Hormone tracker"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold mb-1">Hormone Pattern Tracker</h3>
                      <p className="text-xs text-white/80">See your body's wisdom</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommended For You */}
        {recommendedCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Recommended For You
                </CardTitle>
                <p className="text-sm text-gray-600">Support for {phaseInfo.name} phase</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendedCourses.map((course) => (
                    <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{course.title}</h4>
                          <p className="text-xs text-indigo-600 mb-2">{course.reason}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.durationMinutes || "15"} min
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              Video
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-indigo-400 to-purple-500 text-white"
                        >
                          Start
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}