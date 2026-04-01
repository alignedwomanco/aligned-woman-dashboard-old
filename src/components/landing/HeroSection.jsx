import React from "react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1920&q=80"
          alt="Confident woman"
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0 bg-gradient-to-b from-[#6E1D40]/90 via-[#8B3A5C]/80 to-[#943A59]/90 transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(184, 90, 122, 0.4) 0%, rgba(139, 58, 92, 0.8) 50%, rgba(110, 29, 64, 0.9) 100%)`
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 sm:px-5 py-2"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#E8B4C8' }} />
            <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide">Powered by Adaptive Pathway OS</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white tracking-tight leading-tight px-4"
          >
            THE ALIGNED WOMAN
            <br />
            <span style={{ color: '#E8B4C8' }}>BLUEPRINT™</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/80 font-light max-w-3xl mx-auto px-4"
          >
            Your personal operating system for embodied success
            <br />
            <span style={{ color: '#E8B4C8' }}>Powered by the ALIVE Method™</span>
          </motion.p>

          {/* Body Copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="max-w-2xl mx-auto text-white/70 text-base sm:text-lg leading-relaxed px-4"
          >
            You were never meant to force yourself into systems that exhaust you. This is education, embodiment, and action — unified into one intelligent system that adapts to you.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="pt-4 px-4"
          >
            <Button
              onClick={() => window.location.href = createPageUrl("OnboardingForm")}
              size="lg"
              className="bg-white text-[#6E1D40] hover:bg-rose-100 px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group w-full sm:w-auto"
            >
              Create Your Free Account
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-white/50 text-xs sm:text-sm mt-4">
              No guesswork. No overwhelm. Your pathway is built after onboarding.
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-3 bg-white/50 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}