import React from "react";

const PHASE_COLORS = {
  awareness: { bg: "#EDE0FF", text: "#7340B9" },
  liberation: { bg: "#FCE8EC", text: "#C4687D" },
  intention: { bg: "#E0ECFF", text: "#4B7BB5" },
  "vision & embodiment": { bg: "#E0F5E8", text: "#5B9B6A" },
  "vision and embodiment": { bg: "#E0F5E8", text: "#5B9B6A" },
  visionembodiment: { bg: "#E0F5E8", text: "#5B9B6A" },
};

function resolvePhaseColors(phaseName) {
  if (!phaseName) return { bg: "#F3F0FF", text: "#6B5B95" };
  const key = phaseName.toLowerCase().trim();
  for (const [k, v] of Object.entries(PHASE_COLORS)) {
    if (key.includes(k)) return v;
  }
  return { bg: "#F3F0FF", text: "#6B5B95" };
}

export default function LessonHeader({ phaseName, masterclassNumber, totalInPhase, title, expertName, durationMinutes }) {
  const colors = resolvePhaseColors(phaseName);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
      {/* Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {phaseName && (
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {phaseName}
          </span>
        )}
        {masterclassNumber != null && (
          <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-gray-100 text-gray-500">
            Masterclass {masterclassNumber}{totalInPhase ? ` of ${totalInPhase}` : ""}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#3B224E] leading-tight">
        {title}
      </h1>

      {/* Secondary meta */}
      {(expertName || durationMinutes) && (
        <p className="text-sm text-gray-400 mt-2 flex flex-wrap items-center gap-3">
          {expertName && <span>with {expertName}</span>}
          {durationMinutes > 0 && <span>{durationMinutes} min</span>}
        </p>
      )}
    </div>
  );
}