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
import BodygraphChart from "@/components/humandesign/BodygraphChart";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Human Design</h1>
              <p className="text-sm text-gray-600 mt-1">Your personal operating manual</p>
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

        {/* Design Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-l-4 border-purple-500">
            <CardHeader>
              <CardTitle>Your Design Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              {isGeneratingSnapshot ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-500/20 border-t-purple-500 rounded-full" />
                  <span className="text-gray-600">Understanding your design...</span>
                </div>
              ) : designSnapshot ? (
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    {designSnapshot.orientation}
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs font-medium text-green-900 mb-1">How you work best</p>
                      <p className="text-sm text-gray-700">{designSnapshot.howYouWorkBest}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-xs font-medium text-red-900 mb-1">What drains you</p>
                      <p className="text-sm text-gray-700">{designSnapshot.whatDrainsYou}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">What supports you</p>
                      <p className="text-sm text-gray-700">{designSnapshot.whatSupportsYou}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Button onClick={generateDesignSnapshot} className="bg-purple-500 hover:bg-purple-600">
                  Generate Design Snapshot
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bodygraph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Bodygraph</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ZoomIn className="w-4 h-4 mr-2" />
                    Zoom
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BodygraphChart humanDesign={humanDesign} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Core Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Core Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Type */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleCardExpand('type')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500 uppercase">Type</p>
                      <p className="font-semibold text-gray-900">{humanDesign?.type || "Projector"}</p>
                    </div>
                  </div>
                  {expandedCard === 'type' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                <AnimatePresence>
                  {expandedCard === 'type' && coreDesignInsights.type && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 space-y-3"
                    >
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{coreDesignInsights.type.whatThisMeans}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">How to use energy</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.type.howToUseEnergy}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <p className="text-xs font-medium text-amber-900 mb-1">Common conditioning trap</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.type.commonConditioning}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs font-medium text-green-900 mb-1">What alignment feels like</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.type.whatAlignmentFeels}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-xs font-medium text-purple-900 mb-1">Supportive practice</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.type.supportivePractice}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Strategy */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleCardExpand('strategy')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500 uppercase">Strategy</p>
                      <p className="font-semibold text-gray-900">{humanDesign?.strategy || "Wait for the invitation"}</p>
                    </div>
                  </div>
                  {expandedCard === 'strategy' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                <AnimatePresence>
                  {expandedCard === 'strategy' && coreDesignInsights.strategy && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 space-y-3"
                    >
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{coreDesignInsights.strategy.whatWaitingMeans}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs font-medium text-red-900 mb-1">What forcing looks like</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.strategy.whatForcingLooks}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">How invitations show up</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.strategy.howInvitationsShow}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs font-medium text-blue-900 mb-1">Daily application</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.strategy.dailyApplication}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Authority */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleCardExpand('authority')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500 uppercase">Authority</p>
                      <p className="font-semibold text-gray-900">{humanDesign?.authority || "Emotional"}</p>
                    </div>
                  </div>
                  {expandedCard === 'authority' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                <AnimatePresence>
                  {expandedCard === 'authority' && coreDesignInsights.authority && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 space-y-3"
                    >
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{coreDesignInsights.authority.howDecisionsWork}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs font-medium text-red-900 mb-1">What not to trust</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.authority.whatNotToTrust}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs font-medium text-green-900 mb-1">What clarity feels like</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.authority.whatClarityFeels}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">How to practice</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.authority.howToPractice}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleCardExpand('profile')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500 uppercase">Profile</p>
                      <p className="font-semibold text-gray-900">{humanDesign?.profile || "2/4"}</p>
                    </div>
                  </div>
                  {expandedCard === 'profile' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                <AnimatePresence>
                  {expandedCard === 'profile' && coreDesignInsights.profile && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 space-y-3"
                    >
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{coreDesignInsights.profile.yourNaturalRole}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">How others see you</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.profile.howOthersSeeYou}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <p className="text-xs font-medium text-amber-900 mb-1">Internal tension</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.profile.internalTension}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Why rest matters</p>
                        <p className="text-sm text-gray-700">{coreDesignInsights.profile.whyRestMatters}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Energy Centres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Energy Centres</CardTitle>
              <p className="text-sm text-gray-600">Understanding your defined and undefined centres</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {ENERGY_CENTRES.map((centre, idx) => {
                const isDefined = humanDesign?.definedCentres?.includes(centre.key) || false;
                return (
                  <div key={centre.key} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleCentreExpand(centre)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${isDefined ? 'bg-purple-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                          <div className={`w-3 h-3 rounded-full ${isDefined ? 'bg-purple-600' : 'border-2 border-gray-400'}`} />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{centre.name}</p>
                            <Badge className={isDefined ? "bg-purple-200 text-purple-900" : "bg-gray-200 text-gray-700"}>
                              {isDefined ? "Defined" : "Undefined"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">{centre.governs}</p>
                        </div>
                      </div>
                      {expandedCentre === centre.key ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>
                    
                    <AnimatePresence>
                      {expandedCentre === centre.key && centreInsights[centre.key] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4 pb-4 space-y-3"
                        >
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-600 mb-1">What this governs</p>
                            <p className="text-sm text-gray-700">{centreInsights[centre.key].whatThisGoverns}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">How it works for you</p>
                            <p className="text-sm text-gray-700">{centreInsights[centre.key].howItWorksForYou}</p>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                              <p className="text-xs font-medium text-red-900 mb-1">When conditioned</p>
                              <p className="text-sm text-gray-700">{centreInsights[centre.key].whenConditioned}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-medium text-green-900 mb-1">When aligned</p>
                              <p className="text-sm text-gray-700">{centreInsights[centre.key].whenAligned}</p>
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-xs font-medium text-blue-900 mb-1">Practice</p>
                            <p className="text-sm text-gray-700">{centreInsights[centre.key].practice}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Conditioning Themes */}
        {conditioningThemes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>What You're Deconditioning Right Now</CardTitle>
                <p className="text-sm text-gray-600">Current patterns to be aware of</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {conditioningThemes.map((theme, idx) => (
                  <div key={idx} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h3 className="font-semibold text-amber-900 mb-2">{theme.themeTitle}</h3>
                    <p className="text-sm text-gray-700 mb-2">{theme.explanation}</p>
                    <div className="bg-white rounded-lg p-3 mb-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">How it shows up</p>
                      <p className="text-sm text-gray-700">{theme.howItShowsUp}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">What to try instead</p>
                      <p className="text-sm text-gray-700">{theme.whatToTry}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Ask LaurAI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="mb-6 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ask LaurAI</p>
                  <p className="text-xs text-gray-600">Design-aware guidance</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {[
                  "Why do I feel exhausted even when I rest?",
                  "How should I be making decisions?",
                  "Why does forcing things backfire for me?",
                  "How do I stop over-giving?"
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
                  className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white"
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

        {/* Recommended For You */}
        {recommendedCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Recommended For You
                </CardTitle>
                <p className="text-sm text-gray-600">Support for {humanDesign?.type || "Projector"}s</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendedCourses.map((course) => (
                    <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{course.title}</h4>
                          <p className="text-xs text-purple-600 mb-2">{course.reason}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.durationMinutes || "20"} min
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              Course
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white"
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