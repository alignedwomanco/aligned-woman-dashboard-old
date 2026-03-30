import React from "react";

export default function OverviewCard({ description, pages }) {
  // Show module description, or list of page titles as outcomes
  const hasDescription = description && description.trim().length > 0;
  const hasPages = pages && pages.length > 0;

  if (!hasDescription && !hasPages) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="text-base font-bold text-[#3B224E] mb-3">Masterclass overview</h3>
        <p className="text-sm text-gray-400">Overview content coming soon.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <h3 className="text-base font-bold text-[#3B224E] mb-3">Masterclass overview</h3>
      {hasDescription && (
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{description}</p>
      )}
      {hasPages && (
        <ul className="space-y-2">
          {pages.map((page, idx) => (
            <li key={page.id || idx} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-xs text-gray-400 flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{page.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}