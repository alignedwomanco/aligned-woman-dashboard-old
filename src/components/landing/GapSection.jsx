import React from "react";
import { motion } from "framer-motion";
import { X, AlertCircle } from "lucide-react";

const gaps = [
  "Understand what is happening inside her body and nervous system",
  "Process emotional and identity shifts safely",
  "Build ambition without burnout",
  "Make aligned decisions around money, work, and visibility",
  "Track patterns over time instead of guessing",
  "Integrate learning into daily life without cognitive overload",
];

const defaults = [
  { from: "Overthinking", to: "self-trust" },
  { from: "Hustle", to: "regulation" },
  { from: "External validation", to: "internal authority" },
  { from: "Starting over", to: "integrating" },
];

export default function GapSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#3D2250]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            There Has Never Been One Place
            <br />
            <span style={{ color: '#a861e9' }}>That Holds the Whole Woman</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* What's missing */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[#C67793]" />
              </div>
              <h3 className="text-xl font-semibold text-white">There is no single environment where a woman can:</h3>
            </div>
            <ul className="space-y-4">
              {gaps.map((gap, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 bg-[#C67793] rounded-full mt-2.5 flex-shrink-0" />
                  <span className="text-white/80">{gap}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* What women default to */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-white mb-8">So women default to:</h3>
            {defaults.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-4 bg-white/5 rounded-2xl p-5 border border-white/10"
              >
                <div className="flex-1 flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-white/70 line-through">{item.from}</span>
                </div>
                <div className="text-white/40">instead of</div>
                <div className="flex-1 text-right">
                  <span className="text-[#C67793] font-medium">{item.to}</span>
                </div>
              </motion.div>
            ))}

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-lg text-white/60 text-center pt-6 italic"
            >
              That is the gap The Aligned Woman Blueprint™ exists to fill.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}