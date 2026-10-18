// Fails CI if guest-facing code references the platform brand namespace.
// Allowed: the `showBranding` / `show_branding` field (that is a flag, not a colour).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["src/app/w", "src/components/guest"];           // guest-facing code
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mdx"]);
const PATTERNS = [
  { re: /--brand-/, why: "CSS variable from the platform brand namespace" },
  { re: /\b(?:text|bg|border|ring|from|to|via|fill|stroke|outline|divide|shadow|accent|decoration|caret)-brand(?:-|\b)/, why: "Tailwind brand utility class" },
  { re: /(?:from\s+|import\(\s*|require\(\s*)['"][^'"]*lib\/brand[^'"]*['"]/, why: "import from lib/brand" },
];

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (EXTS.has(extname(p))) yield p;
  }
}

let failures = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      for (const { re, why } of PATTERNS) {
        if (re.test(line)) {
          console.error(`${file}:${i + 1}  ${why}\n    ${line.trim()}`);
          failures++;
        }
      }
    });
  }
}
if (failures) {
  console.error(`\n${failures} brand-isolation violation(s).`);
  process.exit(1);
}
console.log("brand isolation OK");
