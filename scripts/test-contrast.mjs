// scripts/test-contrast.mjs
import { PRESET_COLORS } from "../src/lib/themes/presets.ts";
import { validateContrast } from "../src/lib/themes/contrast.ts";

console.log("=== Testing All Presets Against Full Contrast Matrix ===\n");

let allPassed = true;

for (const [id, colors] of Object.entries(PRESET_COLORS)) {
  const report = validateContrast(colors);
  if (!report.ok) {
    console.error(`❌ Preset "${id}" FAILED contrast check:`, report.errors);
    allPassed = false;
  } else {
    console.log(
      `✅ Preset "${id}": PASS (text/canvas: ${report.ratios["text-canvas"]}:1, muted/canvas: ${report.ratios["muted-canvas"]}:1)`,
    );
    if (report.primaryNeedsBorder) {
      console.log(
        `   ℹ️  Note: Primary button fill is <3:1 against canvas; requires accent/text border.`,
      );
    }
  }
}

// Regression test: Old failing ivory accent #DFB15B
console.log("\n=== Testing Regression Case (Old failing ivory accent #DFB15B) ===");
const failingIvory = {
  ...PRESET_COLORS["ivory-minimal"],
  accent: "#DFB15B", // Old pale gold on cream
};

const regressionReport = validateContrast(failingIvory);
if (!regressionReport.accentTextAllowed) {
  console.log(
    `✅ Regression Test Passed: Old #DFB15B correctly flagged as accentTextAllowed: false (ratio: ${regressionReport.ratios["accent-canvas"]}:1)`,
  );
} else {
  console.error("❌ Regression Test FAILED: Old #DFB15B was incorrectly allowed to style text!");
  process.exit(1);
}

if (!allPassed) {
  process.exit(1);
}

console.log("\n🎉 All theme contrast tests passed successfully!");
