import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const qualifiers = [
  "You feel ambitious but exhausted",
  "Your life looks good on paper but feels heavy in your body",
  "You have tried courses, apps, or coaching that felt incomplete",
  "Your ambition keeps clashing with your wellbeing",
  "You want clarity without pressure",
  "You want growth without abandoning yourself",
  "You want tools that actually work in real life",
];

export default function WhoIsForSection() {
  return (
    <section className="py-24 lg:py-32 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80"
                alt="Confident professional woman"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-[#7340B9] to-[#8B4FC9] rounded-2xl p-6 text-white shadow-xl">
              <p className="text-sm font-medium opacity-80">For the woman who</p>
              <p className="text-xl font-bold">Knows she is capable of more</p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-5 py-2 mb-6">
              <Sparkles className="w-4 h-4" style={{ color: '#7340B9' }} />
              <span style={{ color: '#7340B9' }} className="text-sm font-medium">Is This For You?</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-light text-gray-900 tracking-tight mb-6">
              This Is For You If
            </h2>
            <p className="text-lg text-gray-600 mb-10 font-light">
              The Aligned Woman Blueprint™ is for the woman who knows she is capable of more, 
              but <span className="font-semibold" style={{ color: '#7340B9' }}>no longer wants to sacrifice herself to get there</span>.
            </p>

            <ul className="space-y-4">
              {qualifiers.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" style={{ color: '#7340B9' }} />
                  </div>
                  <span className="text-gray-700 font-light">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}