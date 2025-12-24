import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export const THEME_OPTIONS = [
  {
    id: "burgundy",
    label: "Burgundy Rose",
    colors: { primary: "#601735", secondary: "#8B2E4D", accent: "#C67793" },
    isDefault: true,
  },
  {
    id: "pink",
    label: "Soft Pink",
    colors: { primary: "#D946A6", secondary: "#EC4899", accent: "#F9A8D4" },
  },
  {
    id: "rose",
    label: "Rose Bloom",
    colors: { primary: "#E11D48", secondary: "#F43F5E", accent: "#FDA4AF" },
  },
  {
    id: "coral",
    label: "Coral Sunset",
    colors: { primary: "#DC2626", secondary: "#F97316", accent: "#FED7AA" },
  },
  {
    id: "lavender",
    label: "Lavender Dream",
    colors: { primary: "#9333EA", secondary: "#C084FC", accent: "#E9D5FF" },
  },
  {
    id: "sky",
    label: "Baby Blue",
    colors: { primary: "#0EA5E9", secondary: "#38BDF8", accent: "#BAE6FD" },
  },
  {
    id: "mint",
    label: "Fresh Mint",
    colors: { primary: "#10B981", secondary: "#34D399", accent: "#A7F3D0" },
  },
  {
    id: "sunshine",
    label: "Sunshine Yellow",
    colors: { primary: "#F59E0B", secondary: "#FBBF24", accent: "#FDE68A" },
  },
];

export default function ThemeSelector({ currentTheme, onThemeChange }) {
  const selectedTheme = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Theme</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all p-4 ${
                currentTheme === theme.id
                  ? "border-[#601735] ring-2 ring-[#601735]/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>
              <p className="text-sm font-medium text-gray-900">{theme.label}</p>
              {theme.isDefault && (
                <span className="text-xs text-gray-500 mt-1 block">Default</span>
              )}
              {currentTheme === theme.id && (
                <div className="absolute top-2 right-2">
                  <Check className="w-5 h-5 text-[#601735]" />
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}