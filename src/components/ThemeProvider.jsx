import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { THEME_OPTIONS } from "./settings/ThemeSelector";

export default function ThemeProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        applyTheme(userData.theme || "burgundy");
        applyBackground(userData.background_image);
      } catch (e) {
        // Not authenticated or error
      }
    };
    loadUser();
  }, []);

  const applyTheme = (themeId) => {
    const theme = THEME_OPTIONS.find((t) => t.id === themeId) || THEME_OPTIONS[0];
    document.documentElement.style.setProperty("--color-primary", theme.colors.primary);
    document.documentElement.style.setProperty("--color-secondary", theme.colors.secondary);
    document.documentElement.style.setProperty("--color-accent", theme.colors.accent);
  };

  const applyBackground = (backgroundUrl) => {
    if (backgroundUrl) {
      document.body.style.backgroundImage = `url(${backgroundUrl})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage = "none";
    }
  };

  return <>{children}</>;
}