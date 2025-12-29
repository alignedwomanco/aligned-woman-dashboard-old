import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Download,
  ZoomIn,
  Clock,
  BookOpen,
  Heart
} from "lucide-react";
import BodygraphVisualization from "../components/humandesign/BodygraphVisualization";

const ENERGY_CENTRES = [
  { key: "head", name: "Head", governs: "Inspiration & mental pressure" },
  { key: "ajna", name: "Ajna", governs: "Processing & conceptualizing" },
  { key: "throat", name: "Throat", governs: "Communication & manifestation" },
  { key: "g_center", name: "G-Center", governs: "Identity & direction" },
  { key: "heart", name: "Heart/Ego", governs: "Willpower & self-worth" },
  { key: "sacral", name: "Sacral", governs: "Life force & work energy" },
  { key: "solar_plexus", name: "Solar Plexus", governs: "Emotions & sensitivity" },
  { key: "spleen", name: "Spleen", governs: "Intuition & survival" },
  { key: "root", name: "Root", governs: "Pressure & adrenaline" }
];

export default function MyHumanDesign() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [designSnapshot, setDesignSnapshot] = useState(null);
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedCentre, setExpandedCentre] = useState(null);
  const [centreInsights, setCentreInsights] = useState({});
  const [conditioningThemes, setConditioningThemes] = useState(null);
  const [lauraiQuestion, setLauraiQuestion] = useState("");
  const [lauraiResponse, setLauraiResponse] = useState("");
  const [isLauraiThinking, setIsLauraiThinking] = useState(false);
  const [coreDesignInsights, setCoreDesignInsights] = useState({});

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

  const { data: courses = [] } = useQuery({
    queryKey: ["humanDesignCourses"],
    queryFn: () => base44.entities.Course.list(),
    initialData: [],
  });

  const humanDesign = diagnosticSession?.humanDesignProfile || null;

  // Generate Design Snapshot
  const generateDesignSnapshot = async () => {
    if (!diagnosticSession) return;
    
    setIsGeneratingSnapshot(true);
    
    try {
      const prompt = `You are generating a Design Snapshot for ${currentUser.full_name}.

HUMAN DESIGN DATA:
- Type: ${humanDesign?.type || "Projector"}
- Strategy: ${humanDesign?.strategy || "Wait for the invitation"}
- Authority: ${humanDesign?.authority || "Emotional"}
- Profile: ${humanDesign?.profile || "2/4"}

GENERATE:
1. orientation (1 short paragraph explaining how their energy works and what they are not meant to force)
2. howYouWorkBest (one clear statement)
3. whatDrainsYou (one clear statement)
4. whatSupportsYou (one clear statement)

CRITICAL TONE:
- Calm and grounding
- This is orientation, not education
- Don't explain everything yet
- Make them feel understood
- Use "you" language, not "this type"

Example tone: "Your energy isn't designed to initiate. You're here to see what others can't, and that recognition comes through invitation, not pursuit."`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            orientation: { type: "string" },
            howYouWorkBest: { type: "string" },
            whatDrainsYou: { type: "string" },
            whatSupportsYou: { type: "string" }
          }
        }
      });
      
      setDesignSnapshot(result);
    } catch (error) {
      console.error("Failed to generate design snapshot:", error);
    } finally {
      setIsGeneratingSnapshot(false);
    }
  };

  // Generate Core Design Insight
  const generateCoreDesignInsight = async (cardType) => {
    if (!diagnosticSession) return;
    
    const designType = humanDesign?.type || "Projector";
    const designStrategy = humanDesign?.strategy || "Wait for the invitation";
    const designAuthority = humanDesign?.authority || "Emotional";
    const designProfile = humanDesign?.profile || "2/4";
    
    try {
      const prompts = {
        type: `Generate deep insight about ${designType} type.

INCLUDE:
1. whatThisMeans (practical explanation)
2. howToUseEnergy (specific to this type)
3. commonConditioning (trap they fall into)
4. whatAlignmentFeels (what it feels like when aligned)
5. supportivePractice (one concrete practice)
6. suggestedCourse (course title that would help)

Be personal, not textbook. Use "you" language.`,
        
        strategy: `Generate deep insight about "${designStrategy}" strategy.

INCLUDE:
1. whatWaitingMeans (demystified explanation)
2. whatForcingLooks (how forcing shows up)
3. howInvitationsShow (what invitations actually look like)
4. dailyApplication (how to practice this today)
5. supportivePractice (one concrete practice)
6. suggestedCourse (course title that would help)`,
        
        authority: `Generate deep insight about ${designAuthority} authority.

INCLUDE:
1. howDecisionsWork (how they are meant to make decisions)
2. whatNotToTrust (urgency, pressure, mental logic)
3. whatClarityFeels (how clarity shows up in the body)
4. howToPractice (how to practice this safely)
5. supportivePractice (one concrete practice)
6. suggestedCourse (course title that would help)`,
        
        profile: `Generate deep insight about ${designProfile} profile.

INCLUDE:
1. yourNaturalRole (what role they naturally play)
2. howOthersSeeYou (external perception)
3. internalTension (what tension they may feel)
4. whyRestMatters (why rest and recognition matter)
5. supportivePractice (one concrete practice)
6. suggestedCourse (course title that would help)`
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[cardType],
        response_json_schema: {
          type: "object",
          additionalProperties: { type: "string" }
        }
      });
      
      setCoreDesignInsights(prev => ({ ...prev, [cardType]: result }));
    } catch (error) {
      console.error(`Failed to generate ${cardType} insight:`, error);
    }
  };

  // Generate Centre Insight
  const generateCentreInsight = async (centre) => {
    if (!diagnosticSession) return;
    
    try {
      const isDefined = humanDesign?.definedCentres?.includes(centre.key) || false;
      const designType = humanDesign?.type || "Projector";
      const designAuthority = humanDesign?.authority || "Emotional";
      
      const prompt = `Generate insight about ${centre.name} centre (${isDefined ? "DEFINED" : "UNDEFINED"}) for ${currentUser.full_name}.

HUMAN DESIGN: ${designType}, ${designAuthority}

INCLUDE:
1. whatThisGoverns (what this centre governs in real life)
2. howItWorksForYou (how it specifically works for them - defined or undefined)
3. whenConditioned (when this centre is conditioned/not-self)
4. whenAligned (when this centre is aligned/self)
5. practice (one regulation or awareness practice)
6. suggestedCourse (course title that would help)

CRITICAL: 
- For undefined centres: focus on openness, amplification, wisdom
- For defined centres: focus on consistent energy, reliability, what's true for them
- Make it personal and practical`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            whatThisGoverns: { type: "string" },
            howItWorksForYou: { type: "string" },
            whenConditioned: { type: "string" },
            whenAligned: { type: "string" },
            practice: { type: "string" },
            suggestedCourse: { type: "string" }
          }
        }
      });
      
      setCentreInsights(prev => ({ ...prev, [centre.key]: result }));
    } catch (error) {
      console.error(`Failed to generate ${centre.name} insight:`, error);
    }
  };

  // Generate Conditioning Themes
  const generateConditioningThemes = async () => {
    if (!diagnosticSession || !currentUser) return;
    
    try {
      const designType = humanDesign?.type || "Projector";
      const designAuthority = humanDesign?.authority || "Emotional";
      const undefinedCentres = ENERGY_CENTRES.filter(c => 
        !humanDesign?.definedCentres?.includes(c.key)
      ).map(c => c.name);

      const prompt = `Generate 3-4 current conditioning themes for ${currentUser.full_name}.

DESIGN:
- Type: ${designType}
- Authority: ${designAuthority}
- Undefined Centres: ${undefinedCentres.join(", ")}

Each theme should include:
1. themeTitle (short, clear)
2. explanation (what this conditioning is)
3. howItShowsUp (day-to-day examples)
4. whatToTry (experiment to try instead)
5. suggestedCourse (course title)

FOCUS ON:
- Where they're overcompensating
- Where they're picking up energy that isn't theirs
- Why life may feel harder than it needs to

Make it specific to their design, not generic.`;

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
                  themeTitle: { type: "string" },
                  explanation: { type: "string" },
                  howItShowsUp: { type: "string" },
                  whatToTry: { type: "string" },
                  suggestedCourse: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setConditioningThemes(result.themes);
    } catch (error) {
      console.error("Failed to generate conditioning themes:", error);
    }
  };

  useEffect(() => {
    if (diagnosticSession && currentUser && !designSnapshot) {
      generateDesignSnapshot();
      generateConditioningThemes();
    }
  }, [diagnosticSession, currentUser]);

  // Handle card expansion
  const handleCardExpand = async (cardType) => {
    if (expandedCard === cardType) {
      setExpandedCard(null);
    } else {
      setExpandedCard(cardType);
      if (!coreDesignInsights[cardType]) {
        await generateCoreDesignInsight(cardType);
      }
    }
  };

  // Handle centre expansion
  const handleCentreExpand = async (centre) => {
    if (expandedCentre === centre.key) {
      setExpandedCentre(null);
    } else {
      setExpandedCentre(centre.key);
      if (!centreInsights[centre.key]) {
        await generateCentreInsight(centre);
      }
    }
  };

  // Ask LaurAI
  const askLaurAI = async (question) => {
    if (!question.trim() || !diagnosticSession) return;
    
    const designType = humanDesign?.type || "Projector";
    const designStrategy = humanDesign?.strategy || "Wait for the invitation";
    const designAuthority = humanDesign?.authority || "Emotional";
    const designProfile = humanDesign?.profile || "2/4";
    
    setIsLauraiThinking(true);
    setLauraiResponse("");
    
    try {
      const contextPrompt = `You are LaurAI, providing Human Design guidance on the My Human Design page.

DESIGN CONTEXT:
- Type: ${designType}
- Strategy: ${designStrategy}
- Authority: ${designAuthority}
- Profile: ${designProfile}

DESIGN SNAPSHOT:
${designSnapshot?.orientation || "Understanding their design..."}

USER QUESTION: "${question}"

RESPONSE REQUIREMENTS:
1. Direct explanation from Human Design logic
2. Which design elements this relates to
3. What to try instead (experiment, not prescription)
4. One reflective question

CRITICAL RULES:
- Never override their authority
- Never say "you should"
- Encourage experimentation, not obedience
- Normalize rest, slowness, and discernment
- Reduce pressure, don't increase it
- Body-based decision-making focus
- Deconditioning principles

This should feel embodied and personal.`;

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

  // Get recommended courses
  const getRecommendedCourses = () => {
    if (courses.length === 0) return [];
    
    // Intelligent recommendations based on design
    const designType = humanDesign?.type || "Projector";
    const designAuthority = humanDesign?.authority || "Emotional";
    return courses.slice(0, 2).map(course => ({
      ...course,
      reason: `Support for ${designType}s with ${designAuthority} authority`
    }));
  };

  const recommendedCourses = getRecommendedCourses();

  if (!diagnosticSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Target className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your Human Design...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/30 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Minimal Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-16"
        >
          <div>
            <h1 className="text-4xl font-light text-gray-900 tracking-tight">Your Design</h1>
            <p className="text-gray-500 mt-2 font-light">A guide to how you're built to move through the world</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </Button>
        </motion.div>

        {/* Design Snapshot - Hero Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-20"
        >
          {isGeneratingSnapshot ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <div className="animate-spin w-6 h-6 border-2 border-purple-300/30 border-t-purple-400 rounded-full" />
              <span className="text-gray-500 font-light">Understanding your design...</span>
            </div>
          ) : designSnapshot ? (
            <div className="space-y-8">
              {/* Main Insight */}
              <div className="bg-gradient-to-br from-purple-50/50 to-transparent rounded-3xl p-12 max-w-3xl mx-auto">
                <p className="text-xl text-gray-700 leading-relaxed font-light text-center">
                  {designSnapshot.orientation}
                </p>
              </div>

              {/* Three Soft Cards */}
              <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-emerald-50/50 to-transparent rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-wider text-emerald-700 mb-3 font-medium">How you work best</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{designSnapshot.howYouWorkBest}</p>
                </div>
                <div className="bg-gradient-to-br from-rose-50/50 to-transparent rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-wider text-rose-700 mb-3 font-medium">What drains you</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{designSnapshot.whatDrainsYou}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-wider text-blue-700 mb-3 font-medium">What supports you</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{designSnapshot.whatSupportsYou}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Button onClick={generateDesignSnapshot} className="bg-purple-400 hover:bg-purple-500 text-white rounded-full px-8 py-6 text-base shadow-sm">
                Generate Your Snapshot
              </Button>
            </div>
          )}
        </motion.div>

        {/* Bodygraph - Floating Prominence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-gray-900 mb-2">Your Bodygraph</h2>
            <p className="text-gray-500 text-sm font-light">The map of your energy centres and channels</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100/50">
            <BodygraphVisualization humanDesign={humanDesign} />
          </div>
        </motion.div>

        {/* Core Design - Identity Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-2">Your Operating System</h2>
            <p className="text-gray-500 text-sm font-light max-w-xl mx-auto">The four pillars of how you're designed to work</p>
          </div>

          <div className="space-y-6 max-w-3xl mx-auto">
              {/* Type */}
              <div className="bg-gradient-to-br from-purple-50/40 to-transparent rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => handleCardExpand('type')}
                  className="w-full p-8 hover:bg-white/30 transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-purple-600 mb-2 font-medium">Your Type</p>
                      <p className="text-2xl font-light text-gray-900 mb-3">{humanDesign?.type || "Projector"}</p>
                      <p className="text-sm text-gray-600 font-light leading-relaxed">
                        {expandedCard === 'type' ? 'Tap to close' : 'Your energy signature and how you\'re meant to interact'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {expandedCard === 'type' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedCard === 'type' && coreDesignInsights.type && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-8 pb-8 space-y-6"
                    >
                      <div className="bg-white/60 rounded-xl p-6">
                        <p className="text-gray-700 leading-relaxed">{coreDesignInsights.type.whatThisMeans}</p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">How to use your energy</p>
                          <p className="text-gray-700 leading-relaxed">{coreDesignInsights.type.howToUseEnergy}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50/50 to-transparent rounded-xl p-5">
                          <p className="text-xs uppercase tracking-wider text-amber-700 mb-2">Watch for this pattern</p>
                          <p className="text-gray-700 leading-relaxed">{coreDesignInsights.type.commonConditioning}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50/50 to-transparent rounded-xl p-5">
                          <p className="text-xs uppercase tracking-wider text-emerald-700 mb-2">Alignment feels like</p>
                          <p className="text-gray-700 leading-relaxed">{coreDesignInsights.type.whatAlignmentFeels}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50/50 to-transparent rounded-xl p-5">
                          <p className="text-xs uppercase tracking-wider text-purple-700 mb-2">Try this</p>
                          <p className="text-gray-700 leading-relaxed">{coreDesignInsights.type.supportivePractice}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Authority */}
              <div className="bg-gradient-to-br from-pink-50/40 to-transparent rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => handleCardExpand('authority')}
                  className="w-full p-8 hover:bg-white/30 transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-pink-600 mb-2 font-medium">Your Authority</p>
                      <p className="text-2xl font-light text-gray-900 mb-3">{humanDesign?.authority || "Emotional"}</p>
                      <p className="text-sm text-gray-600 font-light leading-relaxed">
                        {expandedCard === 'authority' ? 'Tap to close' : 'How you're designed to make decisions'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {expandedCard === 'authority' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedCard === 'authority' && coreDesignInsights.authority && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-8 pb-8 space-y-6"
                    >
                      <div className="bg-white/60 rounded-xl p-6">
                        <p className="text-gray-700 leading-relaxed">{coreDesignInsights.authority.howDecisionsWork}</p>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-rose-50/50 to-transparent rounded-xl p-5">
                          <p className="text-xs uppercase tracking-wider text-rose-700 mb-2">Don't trust this</p>
                          <p className="text-gray-700 leading-relaxed">{coreDesignInsights.authority.whatNotToTrust}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50/50 to-transparent rounded-xl p-5">
                          <p className="text-xs uppercase tracking-wider text-emerald-700 mb-2">Clarity feels like</p>
                          <p className="text-gray-700 leading-relaxed">{coreDesignInsights.authority.whatClarityFeels}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">How to practice</p>
                          <p className="text-gray-700 leading-relaxed">{coreDesignInsights.authority.howToPractice}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Strategy */}
              <div className="bg-gradient-to-br from-indigo-50/40 to-transparent rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => handleCardExpand('strategy')}
                  className="w-full p-6 hover:bg-white/30 transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-indigo-600 mb-1 font-medium">Strategy</p>
                      <p className="text-lg font-light text-gray-900 mb-2">{humanDesign?.strategy || "Wait for the invitation"}</p>
                      <p className="text-xs text-gray-500 font-light">{expandedCard === 'strategy' ? 'Tap to close' : 'Your approach to life'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {expandedCard === 'strategy' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedCard === 'strategy' && coreDesignInsights.strategy && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-6 space-y-4"
                    >
                      <p className="text-sm text-gray-700 leading-relaxed">{coreDesignInsights.strategy.whatWaitingMeans}</p>
                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider mb-1">Forcing looks like</p>
                          <p className="text-gray-700">{coreDesignInsights.strategy.whatForcingLooks}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider mb-1">Daily practice</p>
                          <p className="text-gray-700">{coreDesignInsights.strategy.dailyApplication}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile */}
              <div className="bg-gradient-to-br from-amber-50/40 to-transparent rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => handleCardExpand('profile')}
                  className="w-full p-6 hover:bg-white/30 transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-amber-600 mb-1 font-medium">Profile</p>
                      <p className="text-lg font-light text-gray-900 mb-2">{humanDesign?.profile || "2/4"}</p>
                      <p className="text-xs text-gray-500 font-light">{expandedCard === 'profile' ? 'Tap to close' : 'Your life theme'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {expandedCard === 'profile' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedCard === 'profile' && coreDesignInsights.profile && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-6 space-y-3 text-xs"
                    >
                      <p className="text-sm text-gray-700">{coreDesignInsights.profile.yourNaturalRole}</p>
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider mb-1">How others see you</p>
                        <p className="text-gray-700">{coreDesignInsights.profile.howOthersSeeYou}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider mb-1">Why rest matters</p>
                        <p className="text-gray-700">{coreDesignInsights.profile.whyRestMatters}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
        </motion.div>

        {/* Energy Centres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-2">Your Energy Centres</h2>
            <p className="text-gray-500 text-sm font-light max-w-xl mx-auto">Where you have consistent energy, and where you're taking in others'</p>
          </div>

          <div className="space-y-8 max-w-3xl mx-auto">
            {/* Defined Centres Group */}
            <div>
              <p className="text-xs uppercase tracking-wider text-purple-600 mb-4 font-medium">Defined — Consistent for you</p>
              <div className="space-y-3">
                {ENERGY_CENTRES.filter(c => humanDesign?.definedCentres?.includes(c.key)).map((centre) => (
                  <div key={centre.key} className="bg-gradient-to-br from-purple-50/40 to-transparent rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => handleCentreExpand(centre)}
                      className="w-full p-5 hover:bg-white/30 transition-all text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900 mb-1">{centre.name}</p>
                          <p className="text-xs text-gray-600 font-light">{centre.governs}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {expandedCentre === centre.key ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedCentre === centre.key && centreInsights[centre.key] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-5 pb-5 space-y-4"
                        >
                          <p className="text-sm text-gray-700 leading-relaxed">{centreInsights[centre.key].howItWorksForYou}</p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-gradient-to-br from-rose-50/50 to-transparent rounded-xl p-3">
                              <p className="text-rose-700 uppercase tracking-wider mb-1">Not-self</p>
                              <p className="text-gray-700">{centreInsights[centre.key].whenConditioned}</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50/50 to-transparent rounded-xl p-3">
                              <p className="text-emerald-700 uppercase tracking-wider mb-1">Aligned</p>
                              <p className="text-gray-700">{centreInsights[centre.key].whenAligned}</p>
                            </div>
                          </div>
                          <div className="bg-white/60 rounded-xl p-3 text-xs">
                            <p className="text-gray-500 uppercase tracking-wider mb-1">Practice</p>
                            <p className="text-gray-700">{centreInsights[centre.key].practice}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Undefined Centres Group */}
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">Undefined — Open to others</p>
              <div className="space-y-3">
                {ENERGY_CENTRES.filter(c => !humanDesign?.definedCentres?.includes(c.key)).map((centre) => (
                  <div key={centre.key} className="bg-white/40 rounded-2xl overflow-hidden border border-gray-100/50">
                    <button
                      onClick={() => handleCentreExpand(centre)}
                      className="w-full p-5 hover:bg-gray-50/30 transition-all text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-700 mb-1">{centre.name}</p>
                          <p className="text-xs text-gray-500 font-light">{centre.governs}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {expandedCentre === centre.key ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedCentre === centre.key && centreInsights[centre.key] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-5 pb-5 space-y-4"
                        >
                          <p className="text-sm text-gray-700 leading-relaxed">{centreInsights[centre.key].howItWorksForYou}</p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-gradient-to-br from-rose-50/50 to-transparent rounded-xl p-3">
                              <p className="text-rose-700 uppercase tracking-wider mb-1">Conditioning</p>
                              <p className="text-gray-700">{centreInsights[centre.key].whenConditioned}</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50/50 to-transparent rounded-xl p-3">
                              <p className="text-emerald-700 uppercase tracking-wider mb-1">Wisdom</p>
                              <p className="text-gray-700">{centreInsights[centre.key].whenAligned}</p>
                            </div>
                          </div>
                          <div className="bg-white/60 rounded-xl p-3 text-xs">
                            <p className="text-gray-500 uppercase tracking-wider mb-1">Practice</p>
                            <p className="text-gray-700">{centreInsights[centre.key].practice}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Conditioning Themes */}
        {conditioningThemes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-20"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light text-gray-900 mb-2">What You're Unlearning</h2>
              <p className="text-gray-500 text-sm font-light max-w-xl mx-auto">Patterns that aren't yours to carry</p>
              <p className="text-xs text-gray-400 mt-2 italic">This is common. Nothing is wrong with you.</p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
              {conditioningThemes.map((theme, idx) => (
                <div key={idx} className="bg-gradient-to-br from-amber-50/40 to-transparent rounded-2xl p-8 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{theme.themeTitle}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mb-6">{theme.explanation}</p>
                  <div className="space-y-4">
                    <div className="bg-white/60 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">This shows up as</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{theme.howItShowsUp}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50/50 to-transparent rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wider text-emerald-700 mb-2">Try this instead</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{theme.whatToTry}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Ask LaurAI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-20"
        >
          <div className="bg-gradient-to-br from-pink-50/50 via-purple-50/30 to-transparent rounded-3xl p-8 shadow-sm max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg font-light text-gray-900">Ask LaurAI</p>
              <p className="text-xs text-gray-500 font-light">Design-aware guidance just for you</p>
            </div>

            <div className="flex gap-2 flex-wrap justify-center mb-6">
              {[
                "Why do I feel exhausted even when I rest?",
                "How should I be making decisions?",
                "Why does forcing things backfire for me?"
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(prompt)}
                  className="bg-white/80 text-gray-600 text-xs px-4 py-2 rounded-full hover:bg-white transition-colors shadow-sm font-light"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mb-6">
              <Input
                value={lauraiQuestion}
                onChange={(e) => setLauraiQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomQuestion()}
                placeholder="Or ask your own question..."
                className="flex-1 bg-white/80 border-0 rounded-full px-5 shadow-sm font-light"
                disabled={isLauraiThinking}
              />
              <Button 
                onClick={handleCustomQuestion}
                disabled={isLauraiThinking || !lauraiQuestion.trim()}
                className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-full shadow-sm"
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
                  className="bg-white/80 rounded-2xl p-6 shadow-sm"
                >
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-light">
                    {lauraiResponse}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Recommended For You */}
        {recommendedCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h3 className="text-xl font-light text-gray-900 mb-2">Aligned Support</h3>
              <p className="text-xs text-gray-500 font-light">Courses designed for {humanDesign?.type || "Projector"}s</p>
            </div>
            <div className="space-y-4">
              {recommendedCourses.map((course) => (
                <div key={course.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 hover:shadow-md transition-all border border-gray-100/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{course.title}</h4>
                      <p className="text-xs text-purple-600 mb-3 font-light">{course.reason}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.durationMinutes || "20"} min
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-full shadow-sm"
                    >
                      Start
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}