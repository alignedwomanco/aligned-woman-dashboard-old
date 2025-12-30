import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CompanyHeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2A1A3C] via-[#3B224E] to-[#4A2B5E]" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#A962E9]" />
            <span className="text-white text-sm font-medium">The Education Women Were Never Given</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-white tracking-tight">
            THE ALIGNED WOMAN<sup className="text-2xl">™</sup>
          </h1>

          <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto font-light leading-relaxed">
            And the system they have been trying to build alone ever since
          </p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg text-white/80 max-w-4xl mx-auto leading-relaxed"
          >
            The Aligned Woman is a modern education and development company for women who want{" "}
            <span className="text-[#A962E9] font-semibold">clarity, confidence, and success</span>{" "}
            without burnout, self-abandonment, or fragmentation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
          >
            <Button
              onClick={() => window.location.href = createPageUrl("AWBlueprint")}
              size="lg"
              className="bg-gradient-to-r from-[#A962E9] to-[#8B4FC9] hover:from-[#8B4FC9] hover:to-[#7340B9] text-white px-10 py-7 text-lg font-semibold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group"
            >
              Explore The Blueprint
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={() => window.location.href = createPageUrl("OnboardingForm")}
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-10 py-7 text-lg font-semibold rounded-full transition-all duration-300"
            >
              Create Free Account
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-white/60 text-sm pt-4"
          >
            No credit card required to begin onboarding
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-white/60 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}