import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, CheckCircle, BookOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FIRST_QUESTION = {
  questionNumber: 1,
  questionText: "What is the biggest belief you currently hold about yourself that might be limiting your potential?",
  format: "short_text",
  helperText: "Take your time. Be honest with yourself.",
  storeAs: "dyp_q1",
};

export default function DefineMyPurpose() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [toolRun, setToolRun] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(FIRST_QUESTION);
  const [currentAnswer, setCurrentAnswer] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMirror, setShowMirror] = useState(false);
  const [mirrorHtml, setMirrorHtml] = useState("");
  const [finalQuestion, setFinalQuestion] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [resultsHtml, setResultsHtml] = useState("");

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    const userData = await base44.auth.me();
    setUser(userData);

    // Check for existing in-progress session
    const runs = await base44.entities.ToolRun.filter(
      { toolSlug: "define-my-purpose", status: "InProgress" },
      "-created_date",
      1
    );

    if (runs && runs.length > 0) {
      const run = runs[0];
      setToolRun(run);

      const sessions = await base44.entities.DefineMyPurposeSession.filter(
        { toolRunId: run.id },
        null,
        1
      );

      if (sessions && sessions.length > 0) {
        const s = sessions[0];
        setSession(s);
        
        // Always restart from Q1 with the hardcoded question
        setCurrentStep(1);
        setCurrentQuestion(FIRST_QUESTION);
        
        // Load existing answer if any
        if (s.dyp_ans1) {
          setCurrentAnswer(s.dyp_ans1);
        }

        if (s.currentStep === 10 && s.mirrorSummaryHtml) {
          setShowMirror(true);
          setMirrorHtml(s.mirrorSummaryHtml);
          setFinalQuestion(s.finalQuestionHtml);
        }
      }
    }
  };

  const startSession = async () => {
    setIsLoading(true);
    try {
      const run = await base44.entities.ToolRun.create({
        toolSlug: "define-my-purpose",
        status: "InProgress",
      });

      const newSession = await base44.entities.DefineMyPurposeSession.create({
        toolRunId: run.id,
        currentStep: 1,
        dyp_q1: FIRST_QUESTION.questionText,
        transcript: [],
      });

      setToolRun(run);
      setSession(newSession);
      setCurrentStep(1);
      setCurrentQuestion(FIRST_QUESTION);
    } catch (error) {
      console.error("Error starting session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextQuestion = async (step, sessionId) => {
    setIsLoading(true);
    try {
      // Refresh session data to get latest answers
      const sessions = await base44.entities.DefineMyPurposeSession.filter(
        { id: sessionId || session.id },
        null,
        1
      );
      
      if (sessions && sessions.length > 0) {
        const s = sessions[0];
        setSession(s);
        
        // Check if question already exists in session
        const existingQuestion = s[`dyp_q${step}`];
        const existingAnswer = s[`dyp_ans${step}`];
        
        if (existingQuestion) {
          // Use existing question from session
          setCurrentQuestion({
            questionNumber: step,
            questionText: existingQuestion,
            format: "short_text",
            helperText: "Explore any underlying fears or patterns.",
            storeAs: `dyp_q${step}`,
          });
          setCurrentAnswer(existingAnswer || "");
          setIsLoading(false);
          return;
        }
      }
      
      // Generate new question only if it doesn't exist
      const { data } = await base44.functions.invoke("defineMyPurposeNextQuestion", {
        sessionId: sessionId || session.id,
        currentStep: step,
      });

      setCurrentQuestion(data.question);
      setCurrentAnswer("");
    } catch (error) {
      console.error("Error loading question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async () => {
    setIsLoading(true);
    try {
      const answerValue =
        Array.isArray(currentAnswer) ? currentAnswer.join(", ") : currentAnswer;

      // Save answer and update step
      await base44.entities.DefineMyPurposeSession.update(session.id, {
        [`dyp_ans${currentStep}`]: answerValue,
        currentStep: currentStep + 1,
      });
      
      // Refresh session
      const sessions = await base44.entities.DefineMyPurposeSession.filter(
        { id: session.id },
        null,
        1
      );
      if (sessions && sessions.length > 0) {
        setSession(sessions[0]);
      }

      if (currentStep === 9) {
        // Generate mirror summary
        const { data } = await base44.functions.invoke("defineMyPurposeMirror", {
          sessionId: session.id,
        });

        setMirrorHtml(data.mirrorSummaryHtml);
        setFinalQuestion(data.finalQuestion);
        setShowMirror(true);
      } else {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        await loadNextQuestion(nextStep, session.id);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalAnswer = async () => {
    setIsLoading(true);
    try {
      await base44.entities.DefineMyPurposeSession.update(session.id, {
        dyp_ans10: finalAnswer,
      });

      const { data } = await base44.functions.invoke("defineMyPurposeFinal", {
        sessionId: session.id,
      });

      setResultsHtml(data.finalResultHtml);
      setShowResults(true);
    } catch (error) {
      console.error("Error generating results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      // For Q1, always use the hardcoded question
      if (prevStep === 1) {
        setCurrentQuestion(FIRST_QUESTION);
        setCurrentAnswer(session.dyp_ans1 || "");
      } else {
        // Load previous question and answer from session
        const prevAnswer = session[`dyp_ans${prevStep}`];
        const prevQuestion = session[`dyp_q${prevStep}`];
        
        if (prevQuestion) {
          setCurrentQuestion({
            questionNumber: prevStep,
            questionText: prevQuestion,
            format: "short_text",
            helperText: "Explore any underlying fears or patterns.",
            storeAs: `dyp_q${prevStep}`,
          });
        }
        
        // Restore previous answer
        setCurrentAnswer(prevAnswer || "");
      }
    }
  };

  const saveToJournal = async () => {
    await base44.entities.JournalEntry.create({
      entry: "My Purpose Report",
      phase: "Intention",
      aiResponse: resultsHtml,
    });
    alert("Saved to journal!");
  };

  const canProceed = () => {
    return currentAnswer && currentAnswer.toString().trim() !== "";
  };

  // Results view
  if (showResults) {
    return (
      <div className="min-h-screen bg-[#611836] p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="py-6 mb-6 text-center">
            <div className="w-20 h-20 bg-[#FECDD4]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-[#FECDD4]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Your Purpose Report
            </h1>
            <p className="text-white/60">
              The truth you are ready to live
            </p>
          </div>

          <Card className="bg-white/5 border-white/10 p-6 mb-6">
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: resultsHtml }}
            />
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={saveToJournal}
              variant="outline"
              className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Save to Journal
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="flex-1 bg-[#FECDD4] hover:bg-[#FDB8C3] text-[#611836]"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Mirror view
  if (showMirror) {
    return (
      <div className="min-h-screen bg-[#611836] p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Mirror Summary
            </h1>
            <p className="text-white/60">Reflecting back what I see...</p>
          </div>

          <Card className="bg-white/5 border-white/10 p-6 mb-6">
            <div
              className="prose prose-invert max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: mirrorHtml }}
            />

            <div className="space-y-4 mt-6 pt-6 border-t border-white/10">
              <label className="text-white font-medium">Your Answer</label>
              <Textarea
                value={finalAnswer}
                onChange={(e) => setFinalAnswer(e.target.value)}
                placeholder="Take your time. This is important..."
                className="min-h-[150px] bg-white/10 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
          </Card>

          <Button
            onClick={handleFinalAnswer}
            disabled={!finalAnswer.trim() || isLoading}
            className="w-full bg-[#FECDD4] hover:bg-[#FDB8C3] text-[#611836] py-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Your Report...
              </>
            ) : (
              "Generate My Purpose Report"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Start screen
  if (!session) {
    return (
      <div className="min-h-screen bg-[#611836] p-4 md:p-6 flex items-center justify-center">
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 bg-[#FECDD4]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-[#FECDD4]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Define My Purpose
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Uncover the masks you wear and the truth you are ready to live
          </p>
          <Button
            onClick={startSession}
            disabled={isLoading}
            size="lg"
            className="bg-[#FECDD4] hover:bg-[#FDB8C3] text-[#611836] px-10 py-6 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              "Begin Journey"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Question flow
  return (
    <div className="min-h-screen bg-[#611836] p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-white">Define My Purpose</h1>
              <p className="text-white/50 text-sm">
                Question {currentStep} of 10
              </p>
            </div>
          </div>
          <Progress
            value={(currentStep / 10) * 100}
            className="h-3 [&>div]:bg-[#FECDD4] [&>div]:bg-[length:30px_30px] [&>div]:animate-[progress_1s_linear_infinite] [&>div]:bg-[repeating-linear-gradient(45deg,#FECDD4,#FECDD4_10px,rgba(255,255,255,.6)_10px,rgba(255,255,255,.6)_20px)]"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentQuestion.questionText}
                </h2>
                {currentQuestion.helperText && (
                  <p className="text-white/60">{currentQuestion.helperText}</p>
                )}
              </div>

              {/* Short Text */}
              {(currentQuestion.format === "short_text" || !currentQuestion.format) && (
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Share what comes up for you..."
                  className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl text-lg p-6"
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {currentStep > 1 && (
            <Button
              onClick={handleBack}
              variant="outline"
              size="lg"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleAnswer}
            disabled={!canProceed() || isLoading}
            size="lg"
            className="flex-1 bg-[#FECDD4] hover:bg-[#FDB8C3] text-[#611836] py-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : currentStep === 9 ? (
              "Generate Mirror Summary"
            ) : (
              "Continue →"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}