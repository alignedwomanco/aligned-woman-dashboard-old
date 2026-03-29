import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, MessageCircle, UserPlus, X } from "lucide-react";

export default function ExpertsDirectory() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedExpert, setSelectedExpert] = useState(null);

  const { data: experts = [] } = useQuery({
    queryKey: ["experts-directory"],
    queryFn: () => base44.entities.Expert.filter({ isPublished: true }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["expert-categories"],
    queryFn: () => base44.entities.ExpertCategory.list(),
  });

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.name || "";
  };

  const getCategoryColor = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.color || "#7340B9";
  };

  const sortedExperts = [...experts].sort((a, b) => {
    const aCat = categories.find((c) => c.id === a.category);
    const bCat = categories.find((c) => c.id === b.category);
    const aOrder = aCat?.order ?? 9999;
    const bOrder = bCat?.order ?? 9999;
    return aOrder - bOrder;
  });

  const filtered = sortedExperts.filter((e) => {
    const matchesSearch =
      !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.title?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
         {/* Header with Search */}
         <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold text-[#3C224F] mb-1">Our Experts</h1>
             <p className="text-gray-600">Connect with specialists who can guide your journey.</p>
           </div>
           <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <Input
               placeholder="Search experts..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9"
             />
           </div>
         </div>

         {/* Category Filters */}
         <div className="mb-6">
           <button
             onClick={() => setSelectedCategory("all")}
             className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
               selectedCategory === "all"
                 ? "bg-[#3C224F] text-white border-[#3C224F]"
                 : "bg-white text-gray-600 border-gray-300 hover:border-[#3C224F]"
             }`}
           >
             All
           </button>
           {[...categories].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)).map((cat) => (
             <button
               key={cat.id}
               onClick={() => setSelectedCategory(cat.id)}
               className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                 selectedCategory === cat.id
                   ? "text-white border-transparent"
                   : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
               }`}
               style={
                 selectedCategory === cat.id
                   ? { backgroundColor: "#7A1B33", borderColor: "#7A1B33" }
                   : {}
               }
             >
               {cat.name}
             </button>
           ))}
           </div>
           </div>

           {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((expert) => (
            <div
              key={expert.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedExpert(expert)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-purple-100 flex-shrink-0">
                  {expert.profile_picture ? (
                    <img src={expert.profile_picture} alt={expert.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-700 font-bold text-xl">
                      {expert.name?.[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#3C224F] truncate">{expert.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{expert.title}</p>
                  {expert.category && (
                    <span
                      className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(expert.category) }}
                    >
                      {getCategoryName(expert.category)}
                    </span>
                  )}
                </div>
              </div>

              {expert.bio && (
                <p className="text-sm text-gray-600 line-clamp-3">{expert.bio}</p>
              )}

              {expert.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {expert.specialties.slice(0, 3).map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              )}

              <Button
                size="sm"
                className="mt-auto"
                style={{ backgroundColor: "#7340B9" }}
                onClick={(e) => { e.stopPropagation(); setSelectedExpert(expert); }}
              >
                View Profile
              </Button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">No experts found.</div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedExpert && (
        <Dialog open={!!selectedExpert} onOpenChange={() => setSelectedExpert(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-purple-100 flex-shrink-0">
                  {selectedExpert.profile_picture ? (
                    <img src={selectedExpert.profile_picture} alt={selectedExpert.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-700 font-bold text-2xl">
                      {selectedExpert.name?.[0]}
                    </div>
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl text-[#3C224F]">{selectedExpert.name}</DialogTitle>
                  <p className="text-gray-500">{selectedExpert.title}</p>
                  {selectedExpert.category && (
                    <span
                      className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(selectedExpert.category) }}
                    >
                      {getCategoryName(selectedExpert.category)}
                    </span>
                  )}
                </div>
              </div>
            </DialogHeader>

            {selectedExpert.bio && (
              <div>
                <h4 className="font-semibold text-[#3C224F] mb-2">About</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedExpert.bio}</p>
              </div>
            )}

            {selectedExpert.specialties?.length > 0 && (
              <div>
                <h4 className="font-semibold text-[#3C224F] mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExpert.specialties.map((s, i) => (
                    <Badge key={i} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedExpert.services?.length > 0 && (
              <div>
                <h4 className="font-semibold text-[#3C224F] mb-3">Services</h4>
                <div className="space-y-3">
                  {selectedExpert.services.map((svc, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{svc.name}</p>
                          {svc.description && <p className="text-sm text-gray-500 mt-1">{svc.description}</p>}
                          {svc.duration && <p className="text-xs text-gray-400 mt-1">{svc.duration}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {svc.price != null && (
                            <span className="font-semibold text-[#7340B9]">
                              {svc.price === 0 ? "Free" : `$${svc.price}`}
                            </span>
                          )}
                          <Button size="sm" style={{ backgroundColor: "#7340B9" }}>
                            Buy Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" style={{ backgroundColor: "#7340B9" }}>
                <UserPlus className="w-4 h-4 mr-2" /> Connect
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" /> Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}