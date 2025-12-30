import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, User } from "lucide-react";

const pillars = [
  {
    icon: BookOpen,
    title: "Expert Led",
    description: "Education is taught by real experts across nervous system science, psychology, nutrition, and more.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Sparkles,
    title: "AI Guided",
    description: "Integration is guided by ethical AI that prescribes what you need next based on your capacity.",
    color: "from-purple-500 to-violet-600",
  },
  {
    icon: User,
    title: "Woman Centered",
    description: "Authority always remains with you. This is education designed to restore self-trust.",
    color: "from-[#A962E9] to-[#8B4FC9]",
  },
];

export default function WhatWeDoDifferentlySection() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-light text-[#3B224E] tracking-tight mb-6">
            What The Aligned Woman Does Differently
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-xl text-gray-600 leading-relaxed">
              The Aligned Woman is built on one core belief:
            </p>
            <p className="text-2xl font-semibold text-[#6B1B3D]">
              Women do not need more information.
            </p>
            <p className="text-xl text-gray-700">
              They need better structure, sequencing, and integration.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl mb-16 border border-pink-100"
        >
          <p className="text-xl text-gray-700 mb-6 text-center">
            We bring together <span className="font-semibold text-[#6B1B3D]">expert-led education</span>,{" "}
            <span className="font-semibold text-[#6B1B3D]">ethical AI</span>, and{" "}
            <span className="font-semibold text-[#6B1B3D]">nervous system-informed design</span> into one unified learning environment.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="text-center space-y-2">
              <p className="text-lg text-gray-500 line-through">A course library</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg text-gray-500 line-through">Content to binge</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg text-gray-500 line-through">Motivation</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <div className="inline-block bg-gradient-to-r from-[#A962E9] to-[#8B4FC9] rounded-full px-8 py-4">
              <p className="text-2xl font-semibold text-white">
                This is an operating system for embodied living
              </p>
            </div>
          </div>
        </motion.div>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-pink-100"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${pillar.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                <pillar.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#3B224E] mb-4">{pillar.title}</h3>
              <p className="text-gray-600 leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-16 space-y-4"
        >
          <p className="text-lg text-gray-600">This is not therapy.</p>
          <p className="text-lg text-gray-600">This is not coaching dependency.</p>
          <p className="text-xl font-semibold text-[#6B1B3D]">
            This is education designed to restore self-trust.
          </p>
        </motion.div>
      </div>
    </section>
  );
}