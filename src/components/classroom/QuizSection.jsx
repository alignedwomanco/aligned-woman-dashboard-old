import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Trophy, ArrowRight } from "lucide-react";

export default function QuizSection({ quiz, onComplete, onSkip }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return null;
  }

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      const correctCount = newAnswers.reduce((count, answer, index) => {
        return answer === quiz.questions[index].correctAnswer ? count + 1 : count;
      }, 0);
      const score = Math.round((correctCount / quiz.questions.length) * 100);
      const passed = score >= (quiz.passingScore || 70);
      
      setShowResults(true);
      onComplete({
        score,
        answers: newAnswers,
        passed,
        pointsEarned: passed ? (quiz.pointsReward || 10) : 0,
      });
    }
  };

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const question = quiz.questions[currentQuestion];

  if (showResults) {
    const correctCount = answers.reduce((count, answer, index) => {
      return answer === quiz.questions[index].correctAnswer ? count + 1 : count;
    }, 0);
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= (quiz.passingScore || 70);

    return (
      <Card className="border-2 border-[#6B1B3D]">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
              passed ? "bg-green-100" : "bg-orange-100"
            }`}>
              {passed ? (
                <Trophy className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-orange-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-[#4A1228] mb-2">
                {passed ? "Great Work!" : "Keep Learning"}
              </h3>
              <p className="text-gray-600">
                You scored {score}% ({correctCount} out of {quiz.questions.length} correct)
              </p>
            </div>

            {passed && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-green-800 font-medium">
                  🎉 +{quiz.pointsReward || 10} points earned!
                </p>
              </div>
            )}

            {!passed && (
              <p className="text-sm text-gray-600">
                Review the material and try again to earn points.
              </p>
            )}
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#6B1B3D]">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#6B1B3D]" />
            Quick Quiz
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip Quiz
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-medium text-[#4A1228]">
              {question.question}
            </h3>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? "border-[#6B1B3D] bg-pink-50"
                      : "border-gray-200 hover:border-[#6B1B3D]/30 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === index ? "border-[#6B1B3D] bg-[#6B1B3D]" : "border-gray-300"
                    }`}>
                      {selectedAnswer === index && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="w-full bg-[#6B1B3D] hover:bg-[#4A1228]"
            >
              {currentQuestion < quiz.questions.length - 1 ? "Next Question" : "Submit Quiz"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}