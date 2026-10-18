import { z } from "zod";

/**
 * HEX Color validator (e.g. #FFFFFF or #FFF)
 */
const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color code (e.g. #8B0000)");

/**
 * Whitelisted font families
 */
export const ALLOWED_DISPLAY_FONTS = [
  "Playfair Display",
  "Cinzel",
  "Cormorant Garamond",
  "Rozha One",      // Devanagari / Hindi display
  "Suranna",        // Telugu serif
  "Arima Madurai",  // Tamil elegant
] as const;

export const ALLOWED_BODY_FONTS = [
  "Inter",
  "Plus Jakarta Sans",
  "Outfit",
  "Noto Sans",      // Multilingual Indic fallback
] as const;

/**
 * Zod Schema for Wedding Theme Configuration (Stored in DB as validated JSON)
 */
export const ThemeConfigSchema = z.object({
  version: z.number().int().default(1),
  presetId: z.enum(["royal-crimson", "emerald-gold", "ivory-minimal", "sunset-pastel"]),
  palette: z.object({
    primary: hexColorSchema,        // Core theme color (e.g. Crimson / Emerald)
    accent: hexColorSchema,         // Gold / Champagne accent for borders, monograms
    background: hexColorSchema,     // Main canvas background
    surface: hexColorSchema,        // Card / Container background
    textPrimary: hexColorSchema,    // High contrast heading & reading text
    textMuted: hexColorSchema,      // Secondary labels, timestamps
    envelopeBg: hexColorSchema,     // Envelope paper texture color
    waxSeal: hexColorSchema,        // Wax seal color
  }),
  typography: z.object({
    displayFont: z.enum(ALLOWED_DISPLAY_FONTS),
    bodyFont: z.enum(ALLOWED_BODY_FONTS),
  }),
  monogram: z.object({
    text: z.string().max(8, "Monogram text cannot exceed 8 characters"),
    style: z.enum(["classic-initials", "ornate-crest", "minimal"]),
  }),
  ornaments: z.object({
    motif: z.enum(["mandala", "lotus", "paisley", "geometric", "none"]),
    borderStyle: z.enum(["royal-double", "thin-gold", "clean"]),
  }),
  sections: z.object({
    showLoveStory: z.boolean().default(true),
    showVips: z.boolean().default(true),
    showShagun: z.boolean().default(true),
    showGallery: z.boolean().default(true),
  }),
});

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

/**
 * Curated Preset Themes (Quality Floor: Tested for contrast, aesthetics, and mobile legibility)
 */
export const THEME_PRESETS: Record<string, ThemeConfig> = {
  "royal-crimson": {
    version: 1,
    presetId: "royal-crimson",
    palette: {
      primary: "#941C2F",        // Royal Crimson
      accent: "#C9933A",         // Rajasthani Gold
      background: "#0E0709",     // Deep Night Wine
      surface: "#1A0D12",        // Dark Velvet Card
      textPrimary: "#FFF9F2",    // Warm Pearl
      textMuted: "#E2D5C7",      // Soft Sand
      envelopeBg: "#1C0D12",     // Deep Crimson Envelope
      waxSeal: "#801426",        // Ruby Wax
    },
    typography: {
      displayFont: "Playfair Display",
      bodyFont: "Inter",
    },
    monogram: {
      text: "P & R",
      style: "ornate-crest",
    },
    ornaments: {
      motif: "mandala",
      borderStyle: "royal-double",
    },
    sections: {
      showLoveStory: true,
      showVips: true,
      showShagun: true,
      showGallery: true,
    },
  },

  "emerald-gold": {
    version: 1,
    presetId: "emerald-gold",
    palette: {
      primary: "#0D4D33",        // Imperial Emerald
      accent: "#D4AF37",         // Metallic Gold
      background: "#051811",     // Midnight Forest
      surface: "#0B261B",        // Emerald Surface
      textPrimary: "#FBF9F5",    // Ivory Pearl
      textMuted: "#CBD5CE",      // Sage Dust
      envelopeBg: "#0B2B1E",     // Dark Emerald Envelope
      waxSeal: "#073A25",        // Deep Forest Wax
    },
    typography: {
      displayFont: "Cinzel",
      bodyFont: "Plus Jakarta Sans",
    },
    monogram: {
      text: "A & K",
      style: "classic-initials",
    },
    ornaments: {
      motif: "paisley",
      borderStyle: "royal-double",
    },
    sections: {
      showLoveStory: true,
      showVips: true,
      showShagun: true,
      showGallery: true,
    },
  },

  "ivory-minimal": {
    version: 1,
    presetId: "ivory-minimal",
    palette: {
      primary: "#B8977E",        // Warm Sand
      accent: "#DFB15B",         // Champagne Gold
      background: "#FAF7F2",     // Soft Alabaster
      surface: "#FFFFFF",        // Pure White Panel
      textPrimary: "#262120",    // Charcoal Ink
      textMuted: "#7A736E",      // Muted Umber
      envelopeBg: "#F0EBE1",     // Textured Parchment Envelope
      waxSeal: "#C29B38",        // Gold Wax
    },
    typography: {
      displayFont: "Cormorant Garamond",
      bodyFont: "Outfit",
    },
    monogram: {
      text: "R & S",
      style: "minimal",
    },
    ornaments: {
      motif: "lotus",
      borderStyle: "thin-gold",
    },
    sections: {
      showLoveStory: true,
      showVips: true,
      showShagun: true,
      showGallery: true,
    },
  },

  "sunset-pastel": {
    version: 1,
    presetId: "sunset-pastel",
    palette: {
      primary: "#D46A7E",        // Gulabi Blush
      accent: "#E29578",         // Warm Peach
      background: "#12080D",     // Twilight Plum
      surface: "#1E0E17",        // Mauve Panel
      textPrimary: "#FFF5F7",    // Rose Quartz
      textMuted: "#D9C2CB",      // Dusty Lavender
      envelopeBg: "#1F0E18",     // Mulberry Envelope
      waxSeal: "#BA4B63",        // Berry Wax
    },
    typography: {
      displayFont: "Playfair Display",
      bodyFont: "Inter",
    },
    monogram: {
      text: "V & T",
      style: "ornate-crest",
    },
    ornaments: {
      motif: "lotus",
      borderStyle: "clean",
    },
    sections: {
      showLoveStory: true,
      showVips: true,
      showShagun: true,
      showGallery: true,
    },
  },
};

/**
 * Calculates relative luminance of a hex color
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.length === 3 ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.length === 3 ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.length === 3 ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

/**
 * Calculates WCAG Contrast Ratio between two hex colors
 */
export function calculateContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lum1 = getLuminance(foregroundHex);
  const lum2 = getLuminance(backgroundHex);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Checks if a theme passes WCAG AA contrast (at least 4.5:1 for normal text)
 */
export function validateContrast(theme: ThemeConfig): { valid: boolean; ratio: number } {
  const ratio = calculateContrastRatio(theme.palette.textPrimary, theme.palette.background);
  return {
    valid: ratio >= 4.5,
    ratio: Math.round(ratio * 10) / 10,
  };
}

/**
 * Injects theme tokens as CSS variables under the isolated `--theme-*` namespace
 */
export function getThemeCssVariables(theme: ThemeConfig): string {
  return `
    --theme-primary: ${theme.palette.primary};
    --theme-accent: ${theme.palette.accent};
    --theme-bg: ${theme.palette.background};
    --theme-surface: ${theme.palette.surface};
    --theme-text-primary: ${theme.palette.textPrimary};
    --theme-text-muted: ${theme.palette.textMuted};
    --theme-envelope-bg: ${theme.palette.envelopeBg};
    --theme-wax-seal: ${theme.palette.waxSeal};
    --theme-font-display: "${theme.typography.displayFont}", serif;
    --theme-font-body: "${theme.typography.bodyFont}", sans-serif;
  `;
}
