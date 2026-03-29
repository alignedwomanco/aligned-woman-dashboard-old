import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, DollarSign, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Experts() {
  const [selectedExpert, setSelectedExpert] = useState(null);

  const { data: experts = [] } = useQuery({
    queryKey: ["experts"],
    queryFn: async () => {
      const allExperts = await base44.entities.Expert.list();
      return allExperts.filter(e => e.isPublished !== false);
    },
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["expertCategories"],
    queryFn: () => base44.entities.ExpertCategory.list(),
    initialData: [],
  });

  const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name || "";
  const getCategoryColor = (catId) => categories.find(c => c.id === catId)?.color || "#7340B9";

  const sortedExperts = [...experts].sort((a, b) => {
    const aIdx = categories.findIndex((c) => c.id === a.category);
    const bIdx = categories.findIndex((c) => c.id === b.category);
    const aOrder = aIdx === -1 ? 9999 : aIdx;
    const bOrder = bIdx === -1 ? 9999 : bIdx;
    return aOrder - bOrder;
  });

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-b from-[#3D2250] to-[#5B2E84]">
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
            {sortedExperts.map((expert, index) => (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setSelectedExpert(expert)}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={expert.profile_picture || "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80"}
                    alt={expert.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#3D2250] mb-1">
                    {expert.name}
                  </h3>
                  <p className="text-[#C67793] font-medium text-sm mb-2">
                    {expert.title}
                  </p>
                  {expert.category && getCategoryName(expert.category) && (
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2"
                      style={{
                        backgroundColor: getCategoryColor(expert.category) + "22",
                        color: getCategoryColor(expert.category),
                        border: `1px solid ${getCategoryColor(expert.category)}55`,
                      }}
                    >
                      {getCategoryName(expert.category)}
                    </span>
                  )}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {expert.bio}
                  </p>
                  {expert.services && expert.services.length > 0 && (
                    <div className="flex items-center gap-2 text-[#5B2E84] font-medium text-sm">
                      <span>{expert.services.length} service{expert.services.length > 1 ? 's' : ''} available</span>
                      <span>→</span>
                    </div>
                  )}
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
            <p className="text-xl font-bold text-[#3D2250]">
              Integration is supported by AI. Authority always remains with you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Expert Detail Dialog */}
      <Dialog open={!!selectedExpert} onOpenChange={() => setSelectedExpert(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedExpert && (
            <div>
              <DialogHeader>
                <div className="flex gap-4 items-start mb-4">
                  <img
                    src={selectedExpert.profile_picture || "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80"}
                    alt={selectedExpert.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <DialogTitle className="text-2xl text-[#3D2250]">{selectedExpert.name}</DialogTitle>
                    <p className="text-[#C67793] font-medium mt-1">{selectedExpert.title}</p>
                    {selectedExpert.category && getCategoryName(selectedExpert.category) && (
                      <span
                        className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 mb-1"
                        style={{
                          backgroundColor: getCategoryColor(selectedExpert.category) + "22",
                          color: getCategoryColor(selectedExpert.category),
                          border: `1px solid ${getCategoryColor(selectedExpert.category)}55`,
                        }}
                      >
                        {getCategoryName(selectedExpert.category)}
                      </span>
                    )}
                    {selectedExpert.specialties && selectedExpert.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedExpert.specialties.map((specialty, idx) => (
                          <Badge key={idx} className="bg-purple-100 text-purple-800">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">About</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedExpert.bio}</p>
                </div>

                {selectedExpert.services && selectedExpert.services.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Services</h3>
                    <div className="space-y-3">
                      {selectedExpert.services.map((service, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-[#5B2E84] transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-[#3D2250]">{service.name}</h4>
                            <div className="flex items-center gap-1 text-green-600 font-bold">
                              <DollarSign className="w-4 h-4" />
                              {service.price}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                          {service.duration && (
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <Clock className="w-4 h-4" />
                              {service.duration}
                            </div>
                          )}
                          <Button className="w-full mt-3 bg-gradient-to-r from-[#3D2250] to-[#5B2E84] hover:from-[#3D2250]/90 hover:to-[#5B2E84]/90">
                            Book Now
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}