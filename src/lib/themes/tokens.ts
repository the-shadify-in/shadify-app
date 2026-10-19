import { z } from "zod";
import { PRESET_COLORS } from "./presets";
import {
  validateContrast,
  contrast,
  blend,
  type ThemeColors,
  type ContrastReport,
  FOOTER_OPACITY,
} from "./contrast";

export { validateContrast, contrast, blend, FOOTER_OPACITY };
export type { ThemeColors, ContrastReport };

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
  "Rozha One", // Devanagari / Hindi display
  "Suranna", // Telugu serif
  "Arima Madurai", // Tamil elegant
] as const;

export const ALLOWED_BODY_FONTS = [
  "Inter",
  "Plus Jakarta Sans",
  "Outfit",
  "Noto Sans", // Multilingual Indic fallback
] as const;

export const ALLOWED_PRESETS = [
  "royal-crimson",
  "emerald-gold",
  "ivory-minimal",
  "sunset-day",
  "sunset-dusk",
  "sunset-pastel", // alias of sunset-dusk for backward compatibility
] as const;

export type PresetId = (typeof ALLOWED_PRESETS)[number];

/**
 * Zod Schema for Wedding Theme Configuration (Stored in DB as validated JSON)
 */
export const ThemeConfigSchema = z.object({
  version: z.number().int().min(1).default(1),
  presetId: z.enum(ALLOWED_PRESETS),
  palette: z.object({
    canvas: hexColorSchema, // Page canvas background
    surface: hexColorSchema, // Card / Container background
    text: hexColorSchema, // High contrast heading & reading text
    textMuted: hexColorSchema, // Secondary labels, timestamps
    primary: hexColorSchema, // Key button / action fill
    onPrimary: hexColorSchema, // Label on primary fill
    accent: hexColorSchema, // Ornament, badge fill, borders (text only if it passes)
    onAccent: hexColorSchema, // Label on accent fill
    envelopeBg: hexColorSchema, // Envelope paper color
    waxSeal: hexColorSchema, // Wax seal color
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
 * Complete Theme Presets built on the vetted PRESET_COLORS
 */
export interface ThemePresetsRecord {
  "royal-crimson": ThemeConfig;
  "emerald-gold": ThemeConfig;
  "ivory-minimal": ThemeConfig;
  "sunset-day": ThemeConfig;
  "sunset-dusk": ThemeConfig;
  "sunset-pastel": ThemeConfig;
  [key: string]: ThemeConfig | undefined;
}

export const THEME_PRESETS: ThemePresetsRecord = {
  "royal-crimson": {
    version: 1,
    presetId: "royal-crimson",
    palette: {
      ...PRESET_COLORS["royal-crimson"],
      envelopeBg: "#1C0D12",
      waxSeal: "#801426",
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
      ...PRESET_COLORS["emerald-gold"],
      envelopeBg: "#0B2B1E",
      waxSeal: "#073A25",
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
      ...PRESET_COLORS["ivory-minimal"],
      envelopeBg: "#F0EBE1",
      waxSeal: "#8F6418",
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

  "sunset-day": {
    version: 1,
    presetId: "sunset-day",
    palette: {
      ...PRESET_COLORS["sunset-day"],
      envelopeBg: "#FFF1EC",
      waxSeal: "#B8435A",
    },
    typography: {
      displayFont: "Playfair Display",
      bodyFont: "Inter",
    },
    monogram: {
      text: "V & T",
      style: "clean" as "classic-initials" | "ornate-crest" | "minimal",
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

  "sunset-dusk": {
    version: 1,
    presetId: "sunset-dusk",
    palette: {
      ...PRESET_COLORS["sunset-dusk"],
      envelopeBg: "#1F0E18",
      waxSeal: "#BA4B63",
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

  "sunset-pastel": {
    version: 1,
    presetId: "sunset-pastel",
    palette: {
      ...PRESET_COLORS["sunset-dusk"],
      envelopeBg: "#1F0E18",
      waxSeal: "#BA4B63",
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

export const INDIC_DISPLAY_FALLBACK =
  '"Rozha One", "Noto Serif Devanagari", "Suranna", "Arima Madurai", "Noto Serif Gujarati", serif';

export const INDIC_BODY_FALLBACK =
  '"Noto Sans", "Noto Sans Devanagari", "Noto Sans Telugu", "Noto Sans Tamil", "Noto Sans Gujarati", sans-serif';

/**
 * Injects theme tokens as CSS variables under the isolated `--theme-*` namespace
 */
export function getThemeCssVariables(theme: ThemeConfig): string {
  const c = theme.palette;
  const report = validateContrast({
    canvas: c.canvas,
    surface: c.surface,
    text: c.text,
    textMuted: c.textMuted,
    primary: c.primary,
    onPrimary: c.onPrimary,
    accent: c.accent,
    onAccent: c.onAccent,
  });

  return `
    --theme-primary: ${c.primary};
    --theme-on-primary: ${c.onPrimary};
    --theme-accent: ${c.accent};
    --theme-on-accent: ${c.onAccent};
    --theme-bg: ${c.canvas};
    --theme-surface: ${c.surface};
    --theme-text-primary: ${c.text};
    --theme-text-muted: ${c.textMuted};
    --theme-envelope-bg: ${c.envelopeBg};
    --theme-wax-seal: ${c.waxSeal};
    --theme-primary-needs-border: ${report.primaryNeedsBorder ? "1" : "0"};
    --theme-accent-text-allowed: ${report.accentTextAllowed ? "1" : "0"};
    --theme-font-display: "${theme.typography.displayFont}", ${INDIC_DISPLAY_FALLBACK};
    --theme-font-body: "${theme.typography.bodyFont}", ${INDIC_BODY_FALLBACK};
  `;
}

/**
 * Validates and merges database theme_config with preset on read
 */
export function resolveTheme(
  themeId: string,
  rawConfig: unknown,
  themeVersion = 1,
): { theme: ThemeConfig; report: ContrastReport } {
  const fallbackPreset = THEME_PRESETS["royal-crimson"];
  const basePreset = THEME_PRESETS[themeId] ?? fallbackPreset;

  if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
    const report = validateContrast(basePreset.palette);
    return { theme: basePreset, report };
  }

  // Parse partial overrides safely
  const parsed = ThemeConfigSchema.partial().safeParse(rawConfig);
  if (!parsed.success) {
    console.warn("Invalid theme_config in database, falling back to preset:", parsed.error);
    const report = validateContrast(basePreset.palette);
    return { theme: basePreset, report };
  }

  const merged: ThemeConfig = {
    version: themeVersion || basePreset.version,
    presetId: basePreset.presetId,
    palette: {
      ...basePreset.palette,
      ...(parsed.data.palette || {}),
    },
    typography: {
      ...basePreset.typography,
      ...(parsed.data.typography || {}),
    },
    monogram: {
      ...basePreset.monogram,
      ...(parsed.data.monogram || {}),
    },
    ornaments: {
      ...basePreset.ornaments,
      ...(parsed.data.ornaments || {}),
    },
    sections: {
      ...basePreset.sections,
      ...(parsed.data.sections || {}),
    },
  };

  const report = validateContrast(merged.palette);
  return { theme: merged, report };
}
