import React from "react";

export default function ExpertBioCard({ expert }) {
  if (!expert) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="text-base font-bold text-[#3B224E] mb-3">Expert bio</h3>
        <p className="text-sm text-gray-400">Expert information coming soon.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <h3 className="text-base font-bold text-[#3B224E] mb-4">Expert bio</h3>
      <div className="flex items-start gap-4">
        {expert.profile_picture && (
          <img
            src={expert.profile_picture}
            alt={expert.name}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#3B224E]">{expert.name}</p>
          {expert.title && (
            <p className="text-xs text-gray-400 mt-0.5">{expert.title}</p>
          )}
        </div>
      </div>
      {expert.bio && (
        <p className="text-sm text-gray-600 leading-relaxed mt-3">{expert.bio}</p>
      )}
      {expert.specialties && expert.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {expert.specialties.map((s, i) => (
            <span key={i} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}