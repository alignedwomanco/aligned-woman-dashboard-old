import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export const THEME_OPTIONS = [
  {
    id: "aligned",
    label: "Aligned",
    colors: { primary: "#2F1B3E", secondary: "#482C83" },
    isDefault: true,
  },
  {
    id: "rose",
    label: "Rose Bloom",
    colors: { primary: "#E11D48", secondary: "#F43F5E" },
  },
  {
    id: "lavender",
    label: "Lavender Dream",
    colors: { primary: "#9333EA", secondary: "#C084FC" },
  },
  {
    id: "ocean",
    label: "Ocean Depths",
    colors: { primary: "#0369A1", secondary: "#0EA5E9" },
  },
  {
    id: "forest",
    label: "Forest Green",
    colors: { primary: "#065F46", secondary: "#10B981" },
  },
  {
    id: "sunset",
    label: "Sunset Glow",
    colors: { primary: "#DC2626", secondary: "#F97316" },
  },
  {
    id: "midnight",
    label: "Midnight Sky",
    colors: { primary: "#1E293B", secondary: "#475569" },
  },
  {
    id: "blush",
    label: "Blush Pink",
    colors: { primary: "#BE185D", secondary: "#EC4899" },
  },
];

export default function ThemeSelector({ currentTheme, onThemeChange, onSave }) {
  const selectedTheme = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all p-2 ${
                currentTheme === theme.id
                  ? "border-[#2F1B3E] ring-2 ring-[#2F1B3E]/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex gap-1 mb-1">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
              </div>
              <p className="text-xs font-medium text-gray-900 truncate">{theme.label}</p>
              {currentTheme === theme.id && (
                <div className="absolute top-1 right-1">
                  <Check className="w-4 h-4 text-[#2F1B3E]" />
                </div>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onSave}
          className="w-full px-4 py-2 bg-[#2F1B3E] hover:bg-[#482C83] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Save Theme
        </button>
      </CardContent>
    </Card>
  );
}