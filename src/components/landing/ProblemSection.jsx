import React from "react";
import { motion } from "framer-motion";
import { Smartphone, Brain, Heart, DollarSign, Dumbbell, Calendar, Target, Pill } from "lucide-react";

const fragmentedApps = [
  { icon: Calendar, label: "Cycle tracking" },
  { icon: Brain, label: "Journaling" },
  { icon: Heart, label: "Meditation" },
  { icon: Target, label: "Manifestation" },
  { icon: Smartphone, label: "Productivity" },
  { icon: Dumbbell, label: "Fitness" },
  { icon: DollarSign, label: "Money" },
  { icon: Pill, label: "Therapy" },
];

export default function ProblemSection() {
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
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 tracking-tight leading-tight">
            Women Are Not Broken.
            <br />
            <span style={{ color: '#943A59' }}>The Systems They're Using Are.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <p className="text-xl text-gray-600 leading-relaxed font-light">
            Women make up the largest share of the wellness, education, and self-development market.
            And yet the tools available to them are <span className="font-semibold text-[#6E1D40]">fragmented, shallow, and fundamentally misaligned</span> with how women actually live, work, and grow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-16"
        >
          <p className="text-center text-gray-500 mb-8 text-sm uppercase tracking-widest font-medium">
            Right now, women are expected to manage their lives across:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {fragmentedApps.map((app, index) => (
              <motion.div
                key={app.label}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -8,
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                className="bg-white/60 backdrop-blur-sm border-0 rounded-2xl p-6 text-center hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer"
              >
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-[#DEBECC]/50 to-[#F5E8EE]/50 rounded-xl flex items-center justify-center mx-auto mb-3"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <app.icon className="w-6 h-6 text-[#6E1D40]" />
                </motion.div>
                <span className="text-sm font-light text-gray-700">{app.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 lg:p-12 max-w-3xl mx-auto border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        >
          <p className="text-xl text-gray-700 leading-relaxed text-center font-light">
            None of these tools speak to each other.
            <br />
            None of them understand the female nervous system.
            <br />
            None of them integrate body, identity, money, ambition, and leadership.
          </p>
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-lg font-light text-gray-900 text-center">
              The result is not growth.
              <br />
              <span style={{ color: '#943A59' }}>It is overwhelm disguised as self-improvement.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}