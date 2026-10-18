// src/lib/themes/presets.ts
import type { ThemeColors } from "./contrast";

export const PRESET_COLORS: Record<string, ThemeColors> = {
  "royal-crimson": {
    canvas: "#0E0709",
    surface: "#1A0E11",
    text: "#F6EBDD",
    textMuted: "#BFA99B",
    primary: "#941C2F",
    onPrimary: "#FFFFFF",
    accent: "#C9933A",
    onAccent: "#0E0709",
  },
  "emerald-gold": {
    canvas: "#051811",
    surface: "#0C2A1E",
    text: "#F4EFE0",
    textMuted: "#B7C4B5",
    primary: "#0D4D33",
    onPrimary: "#FFFFFF",
    accent: "#D4AF37",
    onAccent: "#051811",
  },
  "ivory-minimal": {
    canvas: "#FAF7F2",
    surface: "#FFFFFF",
    text: "#2B2118",
    textMuted: "#6B5B4E",
    primary: "#7A5A40",
    onPrimary: "#FFFFFF",
    accent: "#8F6418",
    onAccent: "#FFFFFF",
  },
  "sunset-day": {
    canvas: "#FFF8F5",
    surface: "#FFFFFF",
    text: "#3A1F26",
    textMuted: "#7A5A62",
    primary: "#B8435A",
    onPrimary: "#FFFFFF",
    accent: "#A8502F",
    onAccent: "#FFFFFF",
  },
  "sunset-dusk": {
    canvas: "#12080D",
    surface: "#1E0F16",
    text: "#FBEAEA",
    textMuted: "#C9A8B0",
    primary: "#D46A7E",
    onPrimary: "#12080D",
    accent: "#E29578",
    onAccent: "#12080D",
  },
};

// Backward-compatibility alias for previous iterations
PRESET_COLORS["sunset-pastel"] = PRESET_COLORS["sunset-dusk"];
