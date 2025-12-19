import React from "react";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import GapSection from "@/components/landing/GapSection";
import SolutionSection from "@/components/landing/SolutionSection";
import ALIVEMethodSection from "@/components/landing/ALIVEMethodSection";
import TopicsSection from "@/components/landing/TopicsSection";
import WhoIsForSection from "@/components/landing/WhoIsForSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

export default function Landing() {
  return (
    <div className="bg-white">
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