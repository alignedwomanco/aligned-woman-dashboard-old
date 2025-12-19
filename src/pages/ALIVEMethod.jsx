import React from "react";
import { motion } from "framer-motion";
import { Eye, Unlock, Target, Compass, Sparkles, ArrowDown } from "lucide-react";

const phases = [
  {
    letter: "A",
    title: "AWARENESS",
    subtitle: "Understanding What Is Happening Inside You",
    icon: Eye,
    description: "Your body, nervous system, hormones, patterns, and signals. This is the foundation — you cannot change what you do not see.",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
    modules: [
      "Nervous System Regulation",
      "Understanding Burnout",
      "Hormones and The Female Body",
      "Nutrition for Women",
      "Movement and The Body",
    ],
  },
  {
    letter: "L",
    title: "LIBERATION",
    subtitle: "Releasing Survival Identities and Internal Blocks",
    icon: Unlock,
    description: "Shame, people-pleasing, trauma patterns, self-censorship. You cannot build new while carrying the weight of old protective armour.",
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
    modules: [
      "Releasing Shame",
      "People Pleasing Patterns",
      "Trauma and The Body",
      "Inner Child Work",
      "Reclaiming Intuition",
    ],
  },
  {
    letter: "I",
    title: "INTENTION",
    subtitle: "Aligned Action Without Self-Betrayal",
    icon: Target,
    description: "Money, career, boundaries, leadership, advocacy. Action that comes from clarity, not compensation.",
    color: "from-[#6B1B3D] to-[#8B2E4D]",
    bgColor: "bg-gradient-to-br from-pink-50 to-rose-50",
    modules: [
      "Money Mindset",
      "Financial Literacy",
      "Career Strategy",
      "Communication and Boundaries",
      "Legal Literacy for Women",
    ],
  },
  {
    letter: "V+E",
    title: "VISION & EMBODIMENT",
    subtitle: "Living the Woman You Are Becoming",
    icon: Compass,
    description: "Identity expansion, visibility, systems, sustainable integration. This is where the work becomes your life.",
    color: "from-rose-500 to-[#C67793]",
    bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
    modules: [
      "Identity Expansion",
      "Personal Branding",
      "Purpose and Leadership",
    ],
  },
];

export default function ALIVEMethod() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-b from-[#4A1228] to-[#6B1B3D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-rose-300" />
              <span className="text-white/90 text-sm font-medium">The Framework</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
              THE ALIVE METHOD™
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              A proprietary framework that mirrors how real, lasting change actually happens in women.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Phases */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.letter}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="mb-16 last:mb-0"
            >
              <div className={`${phase.bgColor} rounded-3xl p-8 lg:p-12 relative overflow-hidden`}>
                {/* Large letter background */}
                <div className="absolute -top-10 -right-10 text-[200px] font-black text-black/5 leading-none pointer-events-none">
                  {phase.letter}
                </div>

                <div className="relative z-10">
                  <div className="flex items-start gap-6 mb-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${phase.color} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <phase.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-[#4A1228] tracking-tight mb-2">
                        {phase.title}
                      </h2>
                      <p className="text-lg text-gray-600">{phase.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-xl text-gray-700 mb-8 max-w-3xl">
                    {phase.description}
                  </p>

                  <div className="bg-white/60 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Modules in this phase
                    </h3>
                    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {phase.modules.map((module, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-gray-700"
                        >
                          <span className="w-2 h-2 bg-[#C67793] rounded-full flex-shrink-0" />
                          {module}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {index < phases.length - 1 && (
                <div className="flex justify-center py-6">
                  <ArrowDown className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-pink-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-2xl font-bold text-[#6B1B3D] mb-4">
              Learning always happens in this order.
            </p>
            <p className="text-lg text-gray-600">
              No bypassing. No forcing. No burnout disguised as growth.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}