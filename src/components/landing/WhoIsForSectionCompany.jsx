import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";

const qualities = [
  "You feel ambitious but exhausted",
  "Your life looks good on paper but feels heavy in your body",
  "You have tried courses, apps, or coaching that felt incomplete",
  "Your ambition keeps clashing with your wellbeing",
  "You want clarity without pressure",
  "You want growth without abandoning yourself",
  "You want tools that actually work in real life",
];

export default function WhoIsForSectionCompany() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-light text-[#3B224E] tracking-tight mb-8">
            Who The Aligned Woman Is For
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            The Aligned Woman is for the woman who knows she is capable of more, but{" "}
            <span className="font-semibold text-[#6B1B3D]">no longer wants to sacrifice herself to get there.</span>
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 border border-pink-100">
              <h3 className="text-2xl font-semibold text-[#3B224E] mb-6">This is for you if:</h3>
              <ul className="space-y-4">
                {qualities.map((quality, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-[#A962E9] to-[#8B4FC9] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 leading-relaxed">{quality}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-[#3B224E] to-[#4A2B5E] rounded-3xl p-12 text-white">
              <h3 className="text-3xl font-light mb-6">Why This Has Never Existed Before</h3>
              <p className="text-xl mb-8 text-white/90">
                Because <span className="font-semibold text-[#A962E9]">coherence is harder than scale.</span>
              </p>

              <div className="space-y-4 mb-8">
                <p className="text-white/80">Most platforms choose:</p>
                <div className="space-y-2 pl-4">
                  <p className="text-white/70">• Speed over safety</p>
                  <p className="text-white/70">• Content over integration</p>
                  <p className="text-white/70">• Noise over depth</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-lg text-white/90 mb-4">
                  The Aligned Woman was built slowly and intentionally, requiring:
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
                  <p>• Medical literacy</p>
                  <p>• Psychological depth</p>
                  <p>• Nervous system awareness</p>
                  <p>• Behavioural science</p>
                  <p>• Ethical AI design</p>
                  <p>• Female-centred leadership</p>
                </div>
              </div>

              <p className="text-xl font-semibold mt-8 text-[#A962E9]">
                We chose coherence over hype.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 rounded-2xl p-12 border border-pink-100">
            <h3 className="text-3xl font-light text-[#3B224E] mb-8">Begin With The Blueprint</h3>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              The Aligned Woman Blueprint™ is where most women begin.
            </p>
            <p className="text-lg text-gray-600 mb-10">
              Create a free account, complete the onboarding, and receive your personalised ALIVE Pathway.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.href = createPageUrl("OnboardingForm")}
                size="lg"
                className="bg-gradient-to-r from-[#7340B9] to-[#8B4FC9] hover:from-[#5B2FA9] hover:to-[#7340B9] text-white px-10 py-7 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                Create Your Free Account
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => window.location.href = createPageUrl("AWBlueprint")}
                size="lg"
                variant="outline"
                className="border-2 border-[#7340B9] text-[#7340B9] hover:bg-[#7340B9] hover:text-white px-10 py-7 text-lg font-semibold rounded-full transition-all duration-300"
              >
                Explore The Blueprint
              </Button>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              No credit card required to begin onboarding
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}