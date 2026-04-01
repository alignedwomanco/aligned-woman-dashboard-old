import React from "react";
import { motion } from "framer-motion";
import { Eye, Unlock, Target, Compass, Sparkles } from "lucide-react";

const phases = [
  {
    letter: "A",
    title: "AWARENESS",
    icon: Eye,
    description: "Understanding what is happening inside you — your body, nervous system, hormones, patterns, and signals.",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
  },
  {
    letter: "L",
    title: "LIBERATION",
    icon: Unlock,
    description: "Releasing survival identities and internal blocks — shame, people-pleasing, trauma patterns, self-censorship.",
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
  },
  {
    letter: "I",
    title: "INTENTION",
    icon: Target,
    description: "Aligned action without self-betrayal — money, career, boundaries, leadership, advocacy.",
    color: "from-[#6E1D40] to-[#943A59]",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-[#6E1D40]",
  },
  {
    letter: "V+E",
    title: "VISION & EMBODIMENT",
    icon: Compass,
    description: "Living the woman you are becoming — identity expansion, visibility, systems, sustainable integration.",
    color: "from-[#943A59] to-[#B85A7A]",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    textColor: "text-[#6E1D40]",
  },
];

export default function ALIVEMethodSection() {
  return (
    <section className="py-24 lg:py-32 bg-white">
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
            <span style={{ color: '#6E1D40' }} className="text-sm font-medium">The Framework</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#6E1D40] tracking-tight mb-6">
            THE ALIVE METHOD™
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A proprietary framework that mirrors how real, lasting change actually happens in women.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.letter}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`${phase.bgColor} ${phase.borderColor} border rounded-3xl p-8 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300`}
            >
              <div className="absolute top-4 right-4 opacity-10 text-8xl font-black text-gray-900">
                {phase.letter}
              </div>
              <div className="relative z-10">
                <div className={`w-14 h-14 bg-gradient-to-br ${phase.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <phase.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${phase.textColor} mb-4 tracking-tight`}>
                  {phase.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {phase.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gradient-to-r from-[#F5E8EE] via-white to-[#F5E8EE] rounded-2xl p-8 text-center border border-[#DEBECC]"
        >
          <p className="text-xl font-medium" style={{ color: '#6E1D40' }}>
            Learning always happens in this order.
            <br />
            <span style={{ color: '#943A59' }}>No bypassing. No forcing. No burnout disguised as growth.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}