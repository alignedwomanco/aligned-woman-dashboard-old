import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ChartInsightsPanel({ insights = [], onInsightClick }) {
  const [expandedInsight, setExpandedInsight] = useState(null);

  const handleToggle = (idx) => {
    const newExpanded = expandedInsight === idx ? null : idx;
    setExpandedInsight(newExpanded);
    if (newExpanded !== null && onInsightClick) {
      onInsightClick(insights[newExpanded]);
    }
  };

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-400" />
          <p>Generating personalized insights...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Chart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => handleToggle(idx)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                  {insight.badge && (
                    <Badge variant="outline" className="text-xs">
                      {insight.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{insight.summary}</p>
              </div>
              {expandedInsight === idx ? (
                <ChevronDown className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {expandedInsight === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-3">
                      {insight.description && (
                        <div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {insight.description}
                          </p>
                        </div>
                      )}

                      {insight.strengths && insight.strengths.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <h4 className="text-xs font-semibold text-green-900 mb-2">Strengths</h4>
                          <ul className="space-y-1">
                            {insight.strengths.map((strength, i) => (
                              <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                <span className="text-green-600">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.challenges && insight.challenges.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <h4 className="text-xs font-semibold text-amber-900 mb-2">Growth Areas</h4>
                          <ul className="space-y-1">
                            {insight.challenges.map((challenge, i) => (
                              <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                <span className="text-amber-600">•</span>
                                <span>{challenge}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.actionSteps && insight.actionSteps.length > 0 && (
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <h4 className="text-xs font-semibold text-purple-900 mb-2">Action Steps</h4>
                          <ul className="space-y-1">
                            {insight.actionSteps.map((step, i) => (
                              <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                <span className="text-purple-600">{i + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}