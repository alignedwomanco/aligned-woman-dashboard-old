import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const experts = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Nervous System & Trauma Specialist",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80",
    bio: "PhD in Clinical Psychology with 15 years experience in somatic therapy and nervous system regulation.",
  },
  {
    name: "Dr. Emily Chen",
    role: "Women's Health & Hormones",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
    bio: "Board-certified OB/GYN specializing in hormonal health and female physiology.",
  },
  {
    name: "Jessica Williams",
    role: "Financial Strategist",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    bio: "CFP and wealth advisor focused on helping women build financial independence and literacy.",
  },
  {
    name: "Maria Rodriguez",
    role: "Leadership & Executive Coach",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    bio: "Former Fortune 500 executive turned coach, specializing in women's leadership development.",
  },
  {
    name: "Dr. Amanda Foster",
    role: "Behavioral Psychologist",
    image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&q=80",
    bio: "Research psychologist focusing on habit formation, identity change, and sustainable transformation.",
  },
  {
    name: "Claire Thompson",
    role: "Nutrition & Movement Specialist",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
    bio: "Registered dietitian and movement coach with expertise in female-specific nutrition protocols.",
  },
];

export default function Experts() {
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
              <span className="text-white/90 text-sm font-medium">Our Team</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
              EXPERT FACULTY
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Real experts across nervous system regulation, hormones, psychology, finance, leadership, and embodiment.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Experts Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {experts.map((expert, index) => (
              <motion.div
                key={expert.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={expert.image}
                    alt={expert.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#4A1228] mb-1">
                    {expert.name}
                  </h3>
                  <p className="text-[#C67793] font-medium text-sm mb-4">
                    {expert.role}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {expert.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-pink-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xl text-gray-600 mb-4">
              Education is taught by real experts.
            </p>
            <p className="text-xl font-bold text-[#6B1B3D]">
              Integration is supported by AI. Authority always remains with you.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}