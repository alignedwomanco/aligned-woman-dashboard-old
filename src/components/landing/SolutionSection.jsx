import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Route, CheckCircle, Unlock, BookOpen, Cpu, UserCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Smart Onboarding",
    icon: Cpu,
    description: "Complete a short, AI-assisted onboarding that assesses your nervous system state, emotional capacity, burnout risk, and readiness.",
    highlight: "No two women receive the same starting point.",
  },
  {
    number: "02",
    title: "Prescribed Learning Pathway",
    icon: Route,
    description: "The system assigns the exact modules you need, condenses what you already understand, and sequences learning in a nervous-system-safe order.",
    highlight: "You always know what you are working on and why.",
  },
  {
    number: "03",
    title: "Integration Before Progression",
    icon: CheckCircle,
    description: "Every module includes expert-led teaching, guided reflection, and an AI-assisted integration check.",
    highlight: "Progression is based on readiness, not time.",
  },
  {
    number: "04",
    title: "Tools That Unlock With Readiness",
    icon: Unlock,
    description: "As you move through the pathway, practical tools unlock to support daily life — from regulation tools to boundary builders.",
    highlight: "Nothing unlocks before you are ready.",
  },
];

export default function SolutionSection() {
  return (
    <section className="py-24 lg:py-32 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-[#F5E8EE] border border-[#DEBECC] rounded-full px-5 py-2 mb-6">
            <Sparkles className="w-4 h-4" style={{ color: '#6E1D40' }} />
            <span className="text-[#6E1D40] text-sm font-medium">The Solution</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-light text-gray-900 tracking-tight mb-6">
            Not Another Course.
            <br />
            <span style={{ color: '#943A59' }}>An Intelligent Learning Environment.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
            A dynamic, adaptive learning system that prescribes what you need next based on where you are right now.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-0 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-shadow duration-300"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <span className="text-5xl font-extrabold text-pink-100">{step.number}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#6E1D40] to-[#943A59] rounded-xl flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4 font-light">{step.description}</p>
                  <p className="text-[#6E1D40] font-light text-sm bg-[#F5E8EE]/50 rounded-lg px-4 py-2 inline-block">
                    {step.highlight}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gradient-to-br from-[#5A1633]/95 via-[#6E1D40]/95 to-[#8B3A5C]/95 rounded-3xl p-10 lg:p-14 text-center shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <BookOpen className="w-8 h-8" style={{ color: '#943A59' }} />
            <Sparkles className="w-6 h-6 text-white/30" />
            <UserCheck className="w-8 h-8" style={{ color: '#943A59' }} />
          </div>
          <p className="text-2xl lg:text-3xl text-white font-light leading-relaxed max-w-3xl mx-auto">
            Education is taught by real experts.
            <br />
            Integration is supported by AI.
            <br />
            <span style={{ color: '#943A59' }}>Authority always remains with you.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}