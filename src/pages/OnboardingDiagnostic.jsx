import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from "lucide-react";

const DIAGNOSTIC_PROMPT = `You are the ALIVE Diagnostic Engine for The Aligned Woman Blueprint. You run a 10 to 15 question adaptive onboarding. Ask one question at a time. Keep it grounded, intelligent, and emotionally safe. Do not diagnose. Do not mention therapy. Do not overwhelm.

You must assess four pillars: Awareness, Liberation, Intention, Vision and Embodiment

You must adapt questions based on prior answers and rotate formats:
- Scale rating (1-10)
- Multiple choice
- Short reflection
- Scenario

You must track and update these internal fields:
- Phase signals per pillar
- Capacity estimate
- Risk flags
- Prior knowledge signals for condensing topics

When you have enough information (after 10-15 questions), stop asking questions and output a final result object.

Output rules:
If still interviewing, output JSON with:
{
  "type": "question",
  "question": "the question text",
  "format": "scale" | "multiple_choice" | "short_text" | "scenario",
  "options": ["option1", "option2"] // only for multiple_choice or scenario
}

If finished, output JSON with:
{
  "type": "complete",
  "primaryPhase": "Awareness" | "Liberation" | "Intention" | "VisionEmbodiment",
  "secondaryPhase": "Awareness" | "Liberation" | "Intention" | "VisionEmbodiment",
  "capacityScore": 1-10,
  "riskFlags": [],
  "condensedTopics": [],
  "recommendedModules": [],
  "firstWeekPlan": []
}

Always output valid JSON only.`;

export default function OnboardingDiagnostic() {
  const navigate = useNavigate();
  const [step, setStep] = useState("intro"); // intro, questions, processing, complete
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [scaleValue, setScaleValue] = useState([5]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);

  const startDiagnostic = async () => {
    setStep("questions");
    setIsLoading(true);
    await getNextQuestion([]);
  };

  const getNextQuestion = async (conversationHistory) => {
    setIsLoading(true);
    
    let prompt = DIAGNOSTIC_PROMPT + "\n\nConversation so far:\n";
    conversationHistory.forEach((qa) => {
      prompt += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
    });
    prompt += "\nProvide the next question or final result as JSON:";

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["question", "complete"] },
          question: { type: "string" },
          format: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          primaryPhase: { type: "string" },
          secondaryPhase: { type: "string" },
          capacityScore: { type: "number" },
          riskFlags: { type: "array", items: { type: "string" } },
          condensedTopics: { type: "array", items: { type: "string" } },
          recommendedModules: { type: "array", items: { type: "string" } },
          firstWeekPlan: { type: "array", items: { type: "string" } },
        },
      },
    });

    setIsLoading(false);

    if (response.type === "complete") {
      setStep("processing");
      setTimeout(async () => {
        await base44.entities.DiagnosticSession.create({
          answers: conversationHistory,
          primaryPhase: response.primaryPhase,
          secondaryPhase: response.secondaryPhase,
          capacityScore: response.capacityScore,
          riskFlags: response.riskFlags || [],
          condensedTopics: response.condensedTopics || [],
          recommendedModules: response.recommendedModules || [],
          firstWeekPlan: response.firstWeekPlan || [],
          isComplete: true,
        });
        setResult(response);
        setStep("complete");
      }, 2000);
    } else {
      setCurrentQuestion(response);
      setQuestionCount((prev) => prev + 1);
      setCurrentAnswer("");
      setScaleValue([5]);
      setSelectedOption(null);
    }
  };

  const handleSubmitAnswer = async () => {
    let answerValue = "";
    if (currentQuestion.format === "scale") {
      answerValue = scaleValue[0].toString();
    } else if (currentQuestion.format === "multiple_choice" || currentQuestion.format === "scenario") {
      answerValue = selectedOption;
    } else {
      answerValue = currentAnswer;
    }

    const newAnswers = [
      ...answers,
      {
        question: currentQuestion.question,
        answer: answerValue,
        format: currentQuestion.format,
      },
    ];
    setAnswers(newAnswers);
    await getNextQuestion(newAnswers);
  };

  const isAnswerValid = () => {
    if (currentQuestion?.format === "scale") return true;
    if (currentQuestion?.format === "multiple_choice" || currentQuestion?.format === "scenario") {
      return selectedOption !== null;
    }
    return currentAnswer.trim().length > 0;
  };

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-full flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#4A1228] mb-4">
            Build Your Personal Pathway
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Answer a few questions so the system can prescribe what you need next. 
            No guessing. No overwhelm.
          </p>
          <Button
            onClick={startDiagnostic}
            size="lg"
            className="bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] hover:from-[#4A1228] hover:to-[#6B1B3D] text-white px-10 py-6 text-lg font-semibold rounded-full shadow-xl"
          >
            Begin Diagnostic
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 text-[#6B1B3D] animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[#4A1228] mb-2">
            Building Your Pathway...
          </h2>
          <p className="text-gray-600">
            Analyzing your responses to create your personalized journey.
          </p>
        </motion.div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
        <div className="max-w-2xl mx-auto pt-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-[#4A1228] mb-4">
              Your Pathway Is Ready
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-6">
              <CardContent className="p-8">
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-pink-50 rounded-2xl p-6 text-center">
                    <p className="text-sm text-gray-600 mb-1">Primary Phase</p>
                    <p className="text-2xl font-bold text-[#6B1B3D]">
                      {result?.primaryPhase}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-6 text-center">
                    <p className="text-sm text-gray-600 mb-1">Secondary Phase</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {result?.secondaryPhase}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 mb-8">
                  <p className="text-sm text-gray-600 mb-2">Capacity Score</p>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-[#4A1228]">
                      {result?.capacityScore}/10
                    </div>
                    <Progress value={(result?.capacityScore || 0) * 10} className="flex-1" />
                  </div>
                </div>

                {result?.firstWeekPlan?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-[#4A1228] mb-3">
                      What we'll focus on first:
                    </h3>
                    <ul className="space-y-2">
                      {result.firstWeekPlan.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="w-2 h-2 bg-[#C67793] rounded-full mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result?.condensedTopics?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[#4A1228] mb-3">
                      What we'll condense:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.condensedTopics.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="bg-gray-100">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={() => navigate(createPageUrl("Dashboard"))}
              size="lg"
              className="w-full bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] hover:from-[#4A1228] hover:to-[#6B1B3D] text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Chat-style conversation
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4 md:p-6">
      <div className="max-w-3xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm rounded-t-3xl px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-[#4A1228]">ALIVE Diagnostic</h2>
                <p className="text-xs text-gray-500">Building your pathway</p>
              </div>
            </div>
            <Progress value={(questionCount / 12) * 100} className="w-24 h-2" />
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-white px-4 py-6 space-y-6">
          {/* Past Q&A */}
          {answers.map((qa, index) => (
            <div key={index} className="space-y-4">
              {/* Question from system */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                  <p className="text-gray-800">{qa.question}</p>
                </div>
              </motion.div>

              {/* Answer from user */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 justify-end"
              >
                <div className="flex-1 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-2xl rounded-tr-sm p-4 max-w-[80%] ml-auto">
                  <p className="text-white">{qa.answer}</p>
                </div>
              </motion.div>
            </div>
          ))}

          {/* Current Question */}
          {currentQuestion && !isLoading && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm p-4">
                <p className="text-gray-800 mb-4">{currentQuestion.question}</p>

                {/* Scale input */}
                {currentQuestion.format === "scale" && (
                  <div className="space-y-4 bg-white rounded-xl p-4">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                    <Slider
                      value={scaleValue}
                      onValueChange={setScaleValue}
                      max={10}
                      min={1}
                      step={1}
                      className="py-2"
                    />
                    <div className="text-center">
                      <span className="text-3xl font-bold text-[#6B1B3D]">{scaleValue[0]}</span>
                      <span className="text-gray-500 text-sm">/10</span>
                    </div>
                  </div>
                )}

                {/* Multiple choice */}
                {(currentQuestion.format === "multiple_choice" || currentQuestion.format === "scenario") && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedOption(option)}
                        className={`w-full p-3 text-left rounded-xl border-2 text-sm transition-all ${
                          selectedOption === option
                            ? "border-[#6B1B3D] bg-pink-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {/* Text input */}
                {currentQuestion.format === "short_text" && (
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your response..."
                    className="min-h-[100px] bg-white rounded-xl"
                    autoFocus
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        {currentQuestion && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 border-t border-gray-200 bg-white rounded-b-3xl p-4"
          >
            <Button
              onClick={handleSubmitAnswer}
              disabled={!isAnswerValid()}
              size="lg"
              className="w-full bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] hover:from-[#4A1228] hover:to-[#6B1B3D] text-white rounded-xl"
            >
              Send Response
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}