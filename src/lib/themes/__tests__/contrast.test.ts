import { describe, it, expect } from "vitest";
import { PRESET_COLORS } from "../presets";
import { validateContrast } from "../contrast";

describe("WCAG Theme Contrast Matrix", () => {
  it("all defined preset color palettes pass WCAG AA contrast rules", () => {
    for (const [id, colors] of Object.entries(PRESET_COLORS)) {
      const report = validateContrast(colors);
      expect(
        report.ok,
        `Preset "${id}" failed contrast validation: ${JSON.stringify(report.errors)}`,
      ).toBe(true);
      expect(report.ratios["text-canvas"]).toBeGreaterThanOrEqual(4.5);
      expect(report.ratios["muted-canvas"]).toBeGreaterThanOrEqual(3.0);
    }
  });

  it("regression: pale gold (#DFB15B) on ivory canvas correctly fails accentTextAllowed", () => {
    const failingIvory = {
      ...PRESET_COLORS["ivory-minimal"],
      accent: "#DFB15B",
    };
    const report = validateContrast(failingIvory);
    expect(report.accentTextAllowed).toBe(false);
  });
});
