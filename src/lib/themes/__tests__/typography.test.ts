import { describe, it, expect } from "vitest";
import {
  getThemeCssVariables,
  THEME_PRESETS,
  INDIC_DISPLAY_FALLBACK,
  INDIC_BODY_FALLBACK,
  ALLOWED_DISPLAY_FONTS,
  ALLOWED_BODY_FONTS,
} from "../tokens";

describe("Typography & Indic Fallback Chains", () => {
  it("includes comprehensive Indic fallback fonts for display headings", () => {
    expect(INDIC_DISPLAY_FALLBACK).toContain("Rozha One"); // Devanagari
    expect(INDIC_DISPLAY_FALLBACK).toContain("Noto Serif Devanagari"); // Hindi/Marathi
    expect(INDIC_DISPLAY_FALLBACK).toContain("Suranna"); // Telugu
    expect(INDIC_DISPLAY_FALLBACK).toContain("Arima Madurai"); // Tamil
    expect(INDIC_DISPLAY_FALLBACK).toContain("Noto Serif Gujarati"); // Gujarati
  });

  it("includes comprehensive Indic fallback fonts for body text", () => {
    expect(INDIC_BODY_FALLBACK).toContain("Noto Sans");
    expect(INDIC_BODY_FALLBACK).toContain("Noto Sans Devanagari");
    expect(INDIC_BODY_FALLBACK).toContain("Noto Sans Telugu");
    expect(INDIC_BODY_FALLBACK).toContain("Noto Sans Tamil");
    expect(INDIC_BODY_FALLBACK).toContain("Noto Sans Gujarati");
  });

  it("injects Indic fallbacks into generated CSS variables", () => {
    const css = getThemeCssVariables(THEME_PRESETS["royal-crimson"]);
    expect(css).toContain("--theme-font-display:");
    expect(css).toContain("Rozha One");
    expect(css).toContain("Suranna");
    expect(css).toContain("Arima Madurai");

    expect(css).toContain("--theme-font-body:");
    expect(css).toContain("Noto Sans Devanagari");
    expect(css).toContain("Noto Sans Telugu");
    expect(css).toContain("Noto Sans Tamil");
    expect(css).toContain("Noto Sans Gujarati");
  });

  it("whitelists direct Indic display fonts for regional themes", () => {
    expect(ALLOWED_DISPLAY_FONTS).toContain("Rozha One");
    expect(ALLOWED_DISPLAY_FONTS).toContain("Suranna");
    expect(ALLOWED_DISPLAY_FONTS).toContain("Arima Madurai");
    expect(ALLOWED_BODY_FONTS).toContain("Noto Sans");
  });

  it("handles multi-script Indic names in monograms and theme configs", () => {
    const indicNames = [
      { script: "Devanagari", bride: "प्रिया", groom: "राहुल", initials: "प्र & रा" },
      { script: "Telugu", bride: "ప్రియా", groom: "రాహుల్", initials: "ప & ర" },
      { script: "Tamil", bride: "பிரியா", groom: "ராகுல்", initials: "பி & ரா" },
      { script: "Gujarati", bride: "પ્રિયા", groom: "રાહુલ", initials: "પ્ર & રા" },
    ];

    for (const item of indicNames) {
      const themeCopy = {
        ...THEME_PRESETS["royal-crimson"],
        monogram: {
          text: item.initials,
          style: "ornate-crest" as const,
        },
      };
      const css = getThemeCssVariables(themeCopy);
      expect(css).toContain("--theme-font-display:");
      expect(themeCopy.monogram.text).toBe(item.initials);
    }
  });
});
