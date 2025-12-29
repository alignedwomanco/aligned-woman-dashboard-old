import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  X,
  ChevronRight,
  Sun,
  Moon as MoonIcon,
  Eye,
  MessageCircle,
  Heart,
  Target,
  ArrowRight,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import NatalChartWheel from "@/components/astrology/NatalChartWheel";
import ChartInsightsPanel from "@/components/astrology/ChartInsightsPanel";

const BIG_SIX = [
  { key: "sun", label: "Sun", icon: Sun, color: "from-yellow-400 to-orange-500", desc: "Your core identity & life force" },
  { key: "moon", label: "Moon", icon: MoonIcon, color: "from-blue-400 to-indigo-500", desc: "Your emotional nature & needs" },
  { key: "rising", label: "Rising", icon: Eye, color: "from-purple-400 to-pink-500", desc: "How you show up in the world" },
  { key: "mercury", label: "Mercury", icon: MessageCircle, color: "from-cyan-400 to-blue-500", desc: "Your communication & thinking style" },
  { key: "venus", label: "Venus", icon: Heart, color: "from-pink-400 to-rose-500", desc: "Your relationships & values" },
  { key: "mars", label: "Mars", icon: Target, color: "from-red-400 to-orange-500", desc: "Your action & desire nature" }
];

export default function MyAstrology() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [todaysState, setTodaysState] = useState(null);
  const [isGeneratingState, setIsGeneratingState] = useState(false);
  const [lauraiQuestion, setLauraiQuestion] = useState("");
  const [lauraiResponse, setLauraiResponse] = useState("");
  const [isLauraiThinking, setIsLauraiThinking] = useState(false);
  const [expandedPlanet, setExpandedPlanet] = useState(null);
  const [expandedTheme, setExpandedTheme] = useState(null);
  const [currentThemes, setCurrentThemes] = useState([]);
  const [chartInsights, setChartInsights] = useState([]);

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
    queryKey: ["astroCourses"],
    queryFn: () => base44.entities.Course.list(),
    initialData: [],
  });

  // Generate Today's State
  const generateTodaysState = async () => {
    if (!diagnosticSession || !currentUser) return;
    
    setIsGeneratingState(true);
    
    try {
      const prompt = `You are generating a personalized daily astrology state for ${currentUser.full_name}.

NATAL CHART:
- Sun: ${diagnosticSession.astrologyProfile?.sunSign || "Sagittarius"}
- Moon: ${diagnosticSession.astrologyProfile?.moonSign || "Unknown"}
- Rising: ${diagnosticSession.astrologyProfile?.risingSign || "Unknown"}

CURRENT CONTEXT:
- Date: ${new Date().toLocaleDateString()}
- Current transit summary: ${diagnosticSession.astrologyProfile?.currentTransitSummary || "Supporting vision and refinement"}
- Capacity: ${diagnosticSession.capacityScore || 5}/10
- ALIVE Phase: ${diagnosticSession.primaryPhase || "Intention"}
- Recent concerns: ${diagnosticSession.concerns?.join(", ") || "General wellbeing"}

GENERATE:
1. A 2-3 sentence daily state summary (what today highlights energetically)
2. Three short cues:
   - Focus (one clear thing to prioritize)
   - Energy (how energy flows today)
   - Emotional Tone (what to expect emotionally)

REQUIREMENTS:
- NO jargon or symbols
- NO doom language
- Grounded and actionable
- Reference how transits interact with their chart internally (don't show technical details)
- Connect to their life context
- Make it feel personal to TODAY`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            focus: { type: "string" },
            energy: { type: "string" },
            emotionalTone: { type: "string" }
          }
        }
      });
      
      setTodaysState(result);
    } catch (error) {
      console.error("Failed to generate today's state:", error);
    } finally {
      setIsGeneratingState(false);
    }
  };

  // Generate Chart Insights
  const generateChartInsights = async () => {
    if (!diagnosticSession || !currentUser) return;
    
    try {
      const prompt = `Generate 4-5 structured chart insights for ${currentUser.full_name}.

NATAL CHART:
- Sun: ${diagnosticSession.astrologyProfile?.sunSign || "Sagittarius"}
- Moon: ${diagnosticSession.astrologyProfile?.moonSign || "Unknown"}
- Rising: ${diagnosticSession.astrologyProfile?.risingSign || "Unknown"}
- Current concerns: ${diagnosticSession.concerns?.join(", ")}
- Current goals: ${diagnosticSession.values?.join(", ")}
- ALIVE Phase: ${diagnosticSession.primaryPhase}

Generate insights about:
- Core personality patterns (Sun/Moon/Rising combination)
- Communication style (Mercury)
- Relationship patterns (Venus)
- Action & desire patterns (Mars)
- Current life lessons (based on transits)

For each insight:
- title (clear, e.g., "Your Emotional Foundation")
- badge (optional, e.g., "Core Pattern", "Current Focus")
- summary (1-2 lines)
- description (2-3 paragraphs, grounded and personal)
- strengths (2-3 bullet points)
- challenges (2-3 bullet points)
- actionSteps (2-3 practical steps)

Return as array of insight objects.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  badge: { type: "string" },
                  summary: { type: "string" },
                  description: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  challenges: { type: "array", items: { type: "string" } },
                  actionSteps: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });
      
      setChartInsights(result.insights || []);
    } catch (error) {
      console.error("Failed to generate insights:", error);
    }
  };

  // Generate Current Themes
  const generateCurrentThemes = async () => {
    if (!diagnosticSession || !currentUser) return;
    
    try {
      const prompt = `Generate 3-4 current astrological themes for ${currentUser.full_name}.

CHART CONTEXT:
- Sun: ${diagnosticSession.astrologyProfile?.sunSign || "Sagittarius"}
- Moon: ${diagnosticSession.astrologyProfile?.moonSign || "Unknown"}
- Primary concerns: ${diagnosticSession.concerns?.join(", ")}
- ALIVE Phase: ${diagnosticSession.primaryPhase}
- Capacity: ${diagnosticSession.capacityScore}/10

GENERATE THEMES LIKE:
- Emotional focus right now
- Relationship patterns being activated
- Career/visibility lessons
- Boundaries and energy management
- Identity upgrades
- Rest vs action tension

For each theme provide:
- title (short, e.g. "Emotional Intensity Rising")
- summary (2-3 lines)
- whenMisaligned (what happens when fighting it)
- whenAligned (what happens when working with it)
- suggestedPractice (one micro-action)

Return as array of theme objects.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            themes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  whenMisaligned: { type: "string" },
                  whenAligned: { type: "string" },
                  suggestedPractice: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setCurrentThemes(result.themes || []);
    } catch (error) {
      console.error("Failed to generate themes:", error);
    }
  };

  useEffect(() => {
    if (diagnosticSession && currentUser && !todaysState) {
      generateTodaysState();
      generateCurrentThemes();
      generateChartInsights();
    }
  }, [diagnosticSession, currentUser]);

  // Ask LaurAI
  const askLaurAI = async (question) => {
    if (!question.trim() || !diagnosticSession) return;
    
    setIsLauraiThinking(true);
    setLauraiResponse("");
    
    try {
      const contextPrompt = `You are LaurAI, providing astrological guidance on the My Astrology page.

NATAL CHART CONTEXT:
- Sun: ${diagnosticSession.astrologyProfile?.sunSign || "Sagittarius"}
- Moon: ${diagnosticSession.astrologyProfile?.moonSign || "Unknown"}  
- Rising: ${diagnosticSession.astrologyProfile?.risingSign || "Unknown"}
- Current transits: ${diagnosticSession.astrologyProfile?.currentTransitSummary || "Supporting vision"}

TODAY'S STATE:
${todaysState?.summary || "Analyzing current transits..."}

USER QUESTION: "${question}"

RESPONSE REQUIREMENTS:
1. Direct answer to their question
2. What this means practically TODAY
3. One thing to try
4. One thing to avoid (if relevant)

CRITICAL RULES:
- NO jargon or symbols
- Reference chart factors internally, don't teach astrology
- Connect to self-trust, regulation, alignment, choice
- Be grounded and actionable
- Make it feel personal to them (2-3 paragraphs max)`;

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

  // Get planet details
  const getPlanetDetails = async (planet) => {
    if (!diagnosticSession) return null;
    
    const sign = diagnosticSession.astrologyProfile?.[`${planet.key}Sign`] || 
                 (planet.key === "sun" ? diagnosticSession.astrologyProfile?.sunSign : "Unknown");
    
    const prompt = `Generate detailed guidance for ${planet.label} in ${sign}.

CONTEXT:
- User's ${planet.label}: ${sign}
- Current capacity: ${diagnosticSession.capacityScore}/10
- Current concerns: ${diagnosticSession.concerns?.join(", ")}

GENERATE:
1. whatThisMeans (plain language, 2-3 sentences)
2. whenStressed (how this shows up under pressure)
3. whenAligned (what it looks like when regulated)
4. supportivePractice (one micro-practice)
5. recommendedCourse (course title suggestion based on this placement)`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          whatThisMeans: { type: "string" },
          whenStressed: { type: "string" },
          whenAligned: { type: "string" },
          supportivePractice: { type: "string" },
          recommendedCourse: { type: "string" }
        }
      }
    });

    return { ...result, sign };
  };

  const handlePlanetClick = async (planet) => {
    if (expandedPlanet?.key === planet.key) {
      setExpandedPlanet(null);
    } else {
      const details = await getPlanetDetails(planet);
      setExpandedPlanet({ ...planet, ...details });
    }
  };

  // Get recommended courses based on astrology
  const getRecommendedCourses = () => {
    if (!diagnosticSession || courses.length === 0) return [];
    
    // Simple logic - in production, this would be more sophisticated
    return courses.slice(0, 3).map(course => ({
      ...course,
      reason: "Aligned with your current astrology"
    }));
  };

  const recommendedCourses = getRecommendedCourses();

  if (!diagnosticSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your astrological profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Astrology</h1>
              <Badge className="bg-amber-200 text-amber-900 mt-1">
                ☉ {diagnosticSession.astrologyProfile?.sunSign || "Sagittarius"}
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

        {/* Natal Chart Wheel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="mb-6 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader>
              <CardTitle className="text-center">Your Natal Chart</CardTitle>
              <p className="text-sm text-gray-600 text-center">
                Birth data: {diagnosticSession.dob || "Not provided"} • {diagnosticSession.pob || "Location not provided"}
              </p>
            </CardHeader>
            <CardContent className="py-8">
              <NatalChartWheel placements={diagnosticSession.astrologyProfile || {}} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-l-4 border-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                Today's State
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isGeneratingState ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full" />
                  <span className="text-gray-600">Analyzing today's transits...</span>
                </div>
              ) : todaysState ? (
                <>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {todaysState.summary}
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs font-medium text-amber-900 mb-1">Focus</p>
                      <p className="text-sm text-gray-700">{todaysState.focus}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-xs font-medium text-orange-900 mb-1">Energy</p>
                      <p className="text-sm text-gray-700">{todaysState.energy}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <p className="text-xs font-medium text-yellow-900 mb-1">Emotional Tone</p>
                      <p className="text-sm text-gray-700">{todaysState.emotionalTone}</p>
                    </div>
                  </div>
                </>
              ) : (
                <Button onClick={generateTodaysState} className="bg-amber-500 hover:bg-amber-600">
                  Generate Today's State
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Ask LaurAI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ask LaurAI</p>
                  <p className="text-xs text-gray-600">Astrology guidance for today</p>
                </div>
              </div>

              {/* Quick Prompts */}
              <div className="flex gap-2 flex-wrap mb-4">
                {[
                  "What should I focus on today?",
                  "How can I work with today's energy?",
                  "What am I learning right now?"
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

              {/* Custom Question */}
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
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                >
                  {isLauraiThinking ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Response */}
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

        {/* Chart Insights */}
        {chartInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <ChartInsightsPanel 
              insights={chartInsights}
              onInsightClick={(insight) => {
                // Optional: can trigger additional actions when insight is clicked
                console.log("Insight clicked:", insight);
              }}
            />
          </motion.div>
        )}

        {/* Your Astrological Blueprint - Big 6 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Core Blueprint</CardTitle>
              <p className="text-sm text-gray-600">Tap any planet to explore</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {BIG_SIX.map((planet) => {
                  const Icon = planet.icon;
                  const sign = diagnosticSession.astrologyProfile?.[`${planet.key}Sign`] || 
                               (planet.key === "sun" ? diagnosticSession.astrologyProfile?.sunSign : "Unknown");
                  
                  return (
                    <button
                      key={planet.key}
                      onClick={() => handlePlanetClick(planet)}
                      className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-10 h-10 bg-gradient-to-br ${planet.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {expandedPlanet?.key === planet.key ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{planet.label} in {sign}</h3>
                      <p className="text-xs text-gray-600">{planet.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Expanded Planet Detail */}
              <AnimatePresence>
                {expandedPlanet && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${expandedPlanet.color} rounded-xl flex items-center justify-center`}>
                        <expandedPlanet.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{expandedPlanet.label} in {expandedPlanet.sign}</h3>
                        <p className="text-sm text-gray-600">{expandedPlanet.desc}</p>
                      </div>
                    </div>

                    {expandedPlanet.whatThisMeans && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">What this means for you</h4>
                          <p className="text-sm text-gray-700">{expandedPlanet.whatThisMeans}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <h4 className="font-semibold text-red-900 text-sm mb-1">When you're stressed</h4>
                            <p className="text-xs text-gray-700">{expandedPlanet.whenStressed}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <h4 className="font-semibold text-green-900 text-sm mb-1">When you're aligned</h4>
                            <p className="text-xs text-gray-700">{expandedPlanet.whenAligned}</p>
                          </div>
                        </div>

                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <h4 className="font-semibold text-amber-900 text-sm mb-1">Supportive practice</h4>
                          <p className="text-xs text-gray-700">{expandedPlanet.supportivePractice}</p>
                        </div>

                        {expandedPlanet.recommendedCourse && (
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <h4 className="font-semibold text-purple-900 text-sm mb-1">Suggested course</h4>
                            <p className="text-xs text-gray-700">{expandedPlanet.recommendedCourse}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Themes */}
        {currentThemes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Current Themes</CardTitle>
                <p className="text-sm text-gray-600">What life is asking of you right now</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentThemes.map((theme, idx) => (
                  <div key={idx}>
                    <button
                      onClick={() => setExpandedTheme(expandedTheme === idx ? null : idx)}
                      className="w-full bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{theme.title}</h3>
                        {expandedTheme === idx ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{theme.summary}</p>
                    </button>

                    <AnimatePresence>
                      {expandedTheme === idx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 ml-4 space-y-3"
                        >
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <h4 className="font-semibold text-red-900 text-sm mb-1">When misaligned</h4>
                            <p className="text-xs text-gray-700">{theme.whenMisaligned}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <h4 className="font-semibold text-green-900 text-sm mb-1">When aligned</h4>
                            <p className="text-xs text-gray-700">{theme.whenAligned}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <h4 className="font-semibold text-purple-900 text-sm mb-1">Try this</h4>
                            <p className="text-xs text-gray-700">{theme.suggestedPractice}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recommended For You */}
        {recommendedCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Recommended For You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendedCourses.map((course) => (
                    <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{course.title}</h4>
                          <p className="text-xs text-amber-600 mb-2">{course.reason}</p>
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
                          className="bg-gradient-to-r from-amber-400 to-orange-500 text-white"
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