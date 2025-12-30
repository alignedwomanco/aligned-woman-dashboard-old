import React from "react";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import GapSection from "@/components/landing/GapSection";
import SolutionSection from "@/components/landing/SolutionSection";
import ALIVEMethodSection from "@/components/landing/ALIVEMethodSection";
import TopicsSection from "@/components/landing/TopicsSection";
import WhoIsForSection from "@/components/landing/WhoIsForSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-indigo-50/30">
      <HeroSection />
      <ProblemSection />
      <GapSection />
      <SolutionSection />
      <ALIVEMethodSection />
      <TopicsSection />
      <WhoIsForSection />
      <FinalCTASection />
    </div>
  );
}