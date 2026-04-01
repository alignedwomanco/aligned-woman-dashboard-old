import React from "react";
import { motion } from "framer-motion";
import { Brain, Heart, TrendingUp, Shield } from "lucide-react";

const topics = [
  {
    icon: Brain,
    title: "Nervous system regulation and burnout literacy",
  },
  {
    icon: Heart,
    title: "Hormones, cycles, and female physiology",
  },
  {
    icon: TrendingUp,
    title: "Money mindset and financial literacy",
  },
  {
    icon: Shield,
    title: "Boundaries, communication, and self-advocacy",
  },
];

export default function FoundationalEducationSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-[#6E1D40] tracking-tight mb-6 px-4">
            What should have been taught in school
            <br />
            <span className="font-bold" style={{ color: '#6E1D40' }}>but never was</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center mb-12 sm:mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                How the female nervous system works.
              </p>
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                How capacity actually functions.
              </p>
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                How identity, ambition, money, health, and leadership are meant to integrate.
              </p>
            </div>

            <div className="pt-6 space-y-3 text-gray-600">
              <p className="flex items-center gap-3">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Not through motivation.
              </p>
              <p className="flex items-center gap-3">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Not through pressure.
              </p>
              <p className="flex items-center gap-3">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Not through endless courses.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gradient-to-br from-[#F5E8EE] to-[#DEBECC]/50 rounded-3xl p-6 sm:p-8 lg:p-12"
          >
            <p className="text-2xl sm:text-3xl font-light text-[#6E1D40] mb-6">
              But through one coherent system.
            </p>
            <div className="h-1 w-20 sm:w-24 bg-gradient-to-r from-[#943A59] to-[#6E1D40] mb-6 sm:mb-8" />
            <p className="text-lg sm:text-xl text-gray-700 mb-4">This is not self-help</p>
            <p className="text-xl sm:text-2xl font-semibold" style={{ color: '#6E1D40' }}>
              This is foundational education for real life
            </p>
          </motion.div>
        </div>

        {/* Topic Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {topics.map((topic, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="bg-white border border-[#DEBECC] rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#943A59] to-[#6E1D40] rounded-xl flex items-center justify-center mb-4">
                <topic.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{topic.title}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}