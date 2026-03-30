import React from "react";

export default function NotesPanel({ value, onChange }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#3B224E]">My Notes</h3>
        <span className="text-[10px] text-gray-300 uppercase tracking-wider">Session only</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your notes here…"
        className="flex-1 min-h-[120px] w-full resize-none border-0 bg-gray-50 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3B224E]/20"
      />
    </div>
  );
}