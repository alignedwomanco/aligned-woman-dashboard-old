import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CompanyHeroSection() {
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
          src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80"
          alt="Serene background"
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#6E1D40]/90 via-[#8B3A5C]/80 to-[#943A59]/85 transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(184, 90, 122, 0.4) 0%, rgba(139, 58, 92, 0.8) 50%, rgba(110, 29, 64, 0.9) 100%)`
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 sm:px-6 py-2 mb-2 sm:mb-4">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#E8B4C8' }} />
            <span className="text-white text-xs sm:text-sm font-medium">The Education Women Were Never Given</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white tracking-tight leading-tight">
            THE ALIGNED WOMAN<sup className="text-lg sm:text-2xl lg:text-3xl">™</sup>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed px-4">
            The education women were never given
            <br />
            <span className="text-white/70">And the system they have been trying to build alone ever since</span>
          </p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base sm:text-lg lg:text-xl text-white/80 max-w-4xl mx-auto leading-relaxed px-4"
          >
            A modern education company for women who want{" "}
            <span style={{ color: '#E8B4C8' }} className="font-semibold">clarity, confidence, and success</span>{" "}
            without burnout, self-abandonment, or fragmentation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-8 px-4"
          >
            <Button
              onClick={() => window.location.href = createPageUrl("OnboardingForm")}
              size="lg"
              className="bg-white text-[#6E1D40] hover:bg-white/90 px-8 sm:px-12 py-5 sm:py-7 text-base sm:text-lg font-bold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group w-full sm:w-auto"
            >
              Create Your Free Account
              <ArrowRight className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={() => window.location.href = createPageUrl("AWBlueprint")}
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white hover:text-[#6E1D40] px-8 sm:px-10 py-5 sm:py-7 text-base sm:text-lg font-semibold rounded-full transition-all duration-300 w-full sm:w-auto"
            >
              Explore The Blueprint
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