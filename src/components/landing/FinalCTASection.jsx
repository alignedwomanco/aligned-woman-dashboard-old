import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section className="py-24 lg:py-32 bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-[#DEBECC] rounded-full px-5 py-2 shadow-sm">
            <Sparkles className="w-4 h-4" style={{ color: '#6E1D40' }} />
            <span style={{ color: '#6E1D40' }} className="text-sm font-medium">Begin Your Journey</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 tracking-tight">
            Your Pathway Is Waiting
          </h2>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
            You do not need another app.
            <br />
            <span className="font-semibold" style={{ color: '#6E1D40' }}>You need one system that actually works.</span>
          </p>

          <p className="text-lg text-gray-500 font-light">
            Create your free account, complete the onboarding, and receive your personalised ALIVE Pathway.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-4"
          >
            <Button
              onClick={() => window.location.href = createPageUrl("OnboardingForm")}
              size="lg"
              className="bg-gradient-to-r from-[#6E1D40] to-[#943A59] hover:from-[#5A1633] hover:to-[#6E1D40] text-white px-12 py-7 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              Create Your Free Account
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-gray-400 text-sm mt-4">
              No credit card required to begin onboarding.
            </p>
          </motion.div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-16 border-t border-[#DEBECC]"
        >
          <p className="text-sm text-gray-500 mb-6 uppercase tracking-widest font-medium">
            Designed for Ambitious Women
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-gray-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#943A59' }} />
              Expert-Led Education
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#943A59' }} />
              AI-Powered Integration
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#943A59' }} />
              Personalised Pathways
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}