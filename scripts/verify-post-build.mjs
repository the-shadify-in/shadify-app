import fs from "fs";
import path from "path";

/**
 * Post-build verification script for Shadify.
 * Verifies that placeholder or test WhatsApp numbers (e.g., 919876543210, 918000000000)
 * are never baked into production build artifacts (.next).
 */

const PLACEHOLDER_NUMBERS = ["919876543210", "918000000000"];
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.BUILD_TARGET === "production" ||
  (process.env.NODE_ENV === "production" && process.env.CI !== "true");

function scanDirectory(dir, issues = []) {
  if (!fs.existsSync(dir)) return issues;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, issues);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".js") ||
        entry.name.endsWith(".html") ||
        entry.name.endsWith(".json") ||
        entry.name.endsWith(".rsc"))
    ) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const num of PLACEHOLDER_NUMBERS) {
          if (content.includes(num)) {
            issues.push({ file: fullPath, placeholder: num });
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }
  return issues;
}

console.log("[POST-BUILD AUDIT] Scanning .next build output for placeholder phone numbers...");

const nextDir = path.join(process.cwd(), ".next");
const findings = scanDirectory(nextDir);

if (findings.length > 0) {
  const summary = findings
    .map((f) => ` - Found '${f.placeholder}' in: ${path.relative(process.cwd(), f.file)}`)
    .join("\n");

  if (isProduction) {
    console.error(
      "\n❌ FATAL: Production build contains baked-in placeholder contact numbers!\n" +
        "Ensure NEXT_PUBLIC_CONCIERGE_WHATSAPP is set to a real business phone number in Vercel.\n" +
        summary,
    );
    process.exit(1);
  } else {
    console.warn(
      `\n⚠️  [AUDIT-NOTICE] Placeholder numbers detected in non-production/CI build output (${findings.length} occurrences).\n` +
        "This is permissible in local test/CI builds, but strictly forbidden in production.\n",
    );
  }
} else {
  console.log("✅ [POST-BUILD AUDIT] Zero placeholder phone numbers found in build output.");
}
