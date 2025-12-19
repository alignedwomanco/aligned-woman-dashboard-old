import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Smile,
  Activity,
  Battery,
  CheckCircle,
  Calendar,
  TrendingUp,
  Flame,
} from "lucide-react";
import { format } from "date-fns";

const metrics = [
  { key: "energy", label: "Energy", icon: Zap, color: "text-yellow-500", bgColor: "bg-yellow-100" },
  { key: "mood", label: "Mood", icon: Smile, color: "text-green-500", bgColor: "bg-green-100" },
  { key: "stress", label: "Stress", icon: Activity, color: "text-red-500", bgColor: "bg-red-100" },
  { key: "capacity", label: "Capacity", icon: Battery, color: "text-blue-500", bgColor: "bg-blue-100" },
];

export default function CheckIn() {
  const [values, setValues] = useState({
    energy: 5,
    mood: 5,
    stress: 5,
    capacity: 5,
  });
  const [bodySignals, setBodySignals] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();

  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ["checkIns"],
    queryFn: () => base44.entities.CheckIn.list("-created_date", 14),
    initialData: [],
  });

  const createCheckInMutation = useMutation({
    mutationFn: (data) => base44.entities.CheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      setSubmitted(true);
    },
  });

  const handleSubmit = async () => {
    await createCheckInMutation.mutateAsync({
      ...values,
      bodySignals,
      notes,
    });
  };

  const todaysCheckIn = checkIns.find((c) => {
    const checkInDate = new Date(c.created_date).toDateString();
    const today = new Date().toDateString();
    return checkInDate === today;
  });

  const streak = checkIns.length;

  if (submitted || todaysCheckIn) {
    const displayData = todaysCheckIn || values;
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
        <div className="max-w-2xl mx-auto pt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-10"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#4A1228] mb-4">
              Today's Check-In Complete
            </h1>
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-gray-600">{streak} day streak</span>
            </div>
          </motion.div>

          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-6">
                {metrics.map((metric) => (
                  <div
                    key={metric.key}
                    className={`${metric.bgColor} rounded-2xl p-6 text-center`}
                  >
                    <metric.icon className={`w-8 h-8 ${metric.color} mx-auto mb-2`} />
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-3xl font-bold text-[#4A1228]">
                      {displayData[metric.key]}/10
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Past Check-ins */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-[#4A1228] mb-6">Recent History</h2>
            <div className="space-y-3">
              {checkIns.slice(0, 7).map((checkIn, index) => (
                <motion.div
                  key={checkIn.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {format(new Date(checkIn.created_date), "EEE, MMM d")}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {metrics.map((metric) => (
                            <div key={metric.key} className="flex items-center gap-1">
                              <metric.icon className={`w-4 h-4 ${metric.color}`} />
                              <span className="text-sm font-medium">{checkIn[metric.key]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">Daily Check-In</h1>
          <p className="text-gray-600">
            Track your energy, mood, and capacity to notice patterns over time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-[#6B1B3D]" />
                  {format(new Date(), "EEEE, MMMM d")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-600">{streak} day streak</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Sliders */}
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${metric.bgColor} rounded-xl flex items-center justify-center`}>
                        <metric.icon className={`w-5 h-5 ${metric.color}`} />
                      </div>
                      <span className="font-medium text-[#4A1228]">{metric.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-[#4A1228]">
                      {values[metric.key]}
                    </span>
                  </div>
                  <Slider
                    value={[values[metric.key]]}
                    onValueChange={([value]) =>
                      setValues((prev) => ({ ...prev, [metric.key]: value }))
                    }
                    max={10}
                    min={1}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </motion.div>
              ))}

              {/* Body Signals */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <label className="font-medium text-[#4A1228]">
                  What signals is your body sending? (optional)
                </label>
                <Textarea
                  value={bodySignals}
                  onChange={(e) => setBodySignals(e.target.value)}
                  placeholder="Tension in shoulders, tired eyes, restless legs..."
                  className="rounded-xl border-gray-200"
                />
              </motion.div>

              {/* Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <label className="font-medium text-[#4A1228]">
                  Any notes for today? (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Slept poorly, big meeting, feeling hopeful..."
                  className="rounded-xl border-gray-200"
                />
              </motion.div>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={createCheckInMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] text-white py-6 text-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete Check-In
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}