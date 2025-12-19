import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, Shield, Lightbulb } from "lucide-react";

export default function OurWhy() {
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
              <span className="text-white/90 text-sm font-medium">Our Purpose</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
              OUR WHY
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Because coherence is harder than scale — and women deserve better.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="prose prose-lg prose-pink mx-auto"
          >
            <h2 className="text-3xl font-bold text-[#4A1228] mb-8">
              Why This Has Never Existed Before
            </h2>
            
            <p className="text-gray-600 text-xl leading-relaxed mb-8">
              Most platforms choose speed over safety. Noise over depth. Content over integration.
            </p>

            <div className="grid gap-6 my-12">
              {[
                { icon: Heart, text: "Medical literacy" },
                { icon: Lightbulb, text: "Psychological depth" },
                { icon: Shield, text: "Nervous system awareness" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-4 bg-pink-50 rounded-xl p-5"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg font-medium text-[#4A1228]">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-gray-600 text-xl leading-relaxed">
              This ecosystem required behavioural science, ethical AI design, and female-centred leadership.
            </p>

            <div className="bg-gradient-to-br from-[#6B1B3D] to-[#4A1228] rounded-2xl p-8 text-center my-12">
              <p className="text-2xl text-white font-medium">
                We chose coherence over noise.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}