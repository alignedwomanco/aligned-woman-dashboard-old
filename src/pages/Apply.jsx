import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Sparkles, ArrowRight, Check } from "lucide-react";

const benefits = [
  "Personalised ALIVE Pathway based on your diagnostic",
  "Expert-led video modules across all four phases",
  "AI-assisted integration checks and coaching",
  "Unlockable tools that grow with your readiness",
  "Daily check-ins and journaling with AI support",
  "Your evolving personal Blueprint",
  "Progress tracking and pattern recognition",
  "Community of like-minded women",
];

export default function Apply() {
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
              <span className="text-white/90 text-sm font-medium">Join Us</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
              BEGIN YOUR JOURNEY
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Create your free account and receive your personalised ALIVE Pathway after onboarding.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-[#4A1228] mb-6">
                What You'll Receive
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                The Aligned Woman Blueprint™ is a complete system for sustainable transformation — not another course to add to your list.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#6B1B3D]" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-gradient-to-br from-pink-50 to-white rounded-3xl p-10 border border-pink-100 shadow-xl"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#4A1228] mb-2">
                  Create Your Free Account
                </h3>
                <p className="text-gray-600 mb-8">
                  Begin with the diagnostic to build your pathway
                </p>
                
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] hover:from-[#4A1228] hover:to-[#6B1B3D] text-white py-6 text-lg font-semibold rounded-xl shadow-lg group"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-gray-400 text-sm mt-4">
                  No credit card required to begin
                </p>

                <div className="mt-8 pt-8 border-t border-pink-100">
                  <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      className="text-[#6B1B3D] font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}