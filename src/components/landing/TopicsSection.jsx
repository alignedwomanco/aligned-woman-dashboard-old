import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Battery,
  Heart,
  Apple,
  PersonStanding,
  MessageSquare,
  Lightbulb,
  DollarSign,
  Briefcase,
  Scale,
  Crown,
  Sparkles,
} from "lucide-react";

const topics = [
  { icon: Activity, label: "Nervous system regulation and burnout literacy" },
  { icon: Heart, label: "Hormones, cycles, and female physiology" },
  { icon: Apple, label: "Nutrition and movement that support capacity" },
  { icon: MessageSquare, label: "Shame, people-pleasing, and trauma-informed awareness" },
  { icon: Lightbulb, label: "Intuition and embodied decision-making" },
  { icon: DollarSign, label: "Money mindset and financial literacy" },
  { icon: Briefcase, label: "Career strategy, communication, and boundaries" },
  { icon: Scale, label: "Legal literacy and self-advocacy" },
  { icon: Crown, label: "Identity expansion, visibility, and leadership" },
];

export default function TopicsSection() {
  return (
    <section className="py-24 lg:py-32 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-pink-200 rounded-full px-5 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#6B1B3D]" />
            <span className="text-[#6B1B3D] text-sm font-medium">Comprehensive Curriculum</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-light text-gray-900 tracking-tight mb-4">
            Comprehensive Education
            <br />
            <span className="text-[#C67793]">For the Whole Woman</span>
          </h2>
          <p className="text-lg text-gray-500 font-light">
            Evidence-led. Integrated. Built for real lives.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 flex items-start gap-4 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300 border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-xl flex items-center justify-center flex-shrink-0">
                <topic.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-700 font-light leading-snug pt-2">
                {topic.label}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12 text-lg font-light text-gray-700"
        >
          This is not inspiration. This is foundational education.
        </motion.p>
      </div>
    </section>
  );
}