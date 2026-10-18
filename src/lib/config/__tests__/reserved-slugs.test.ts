import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { RESERVED_SLUGS, isReservedSlug } from "../reserved-slugs";

describe("Reserved Slugs Configuration & CI Guard", () => {
  it("includes all marketing, system, and critical customer routes in RESERVED_SLUGS", () => {
    const essentialSlugs = [
      "pricing",
      "samples",
      "sample",
      "faq",
      "legal",
      "privacy",
      "terms",
      "refunds",
      "contact",
      "about",
      "partners",
      "admin",
      "api",
      "login",
      "logout",
      "checkout",
      "robots",
      "sitemap",
      "events",
      "rsvp",
      "shagun",
      "gallery",
    ];

    for (const slug of essentialSlugs) {
      expect(RESERVED_SLUGS.has(slug), `Slug '${slug}' must be present in RESERVED_SLUGS`).toBe(
        true,
      );
      expect(isReservedSlug(slug)).toBe(true);
    }
  });

  it("ensures all top-level route directories in src/app are registered in RESERVED_SLUGS", () => {
    const appDir = path.resolve(__dirname, "../../../app");
    if (!fs.existsSync(appDir)) return;

    const entries = fs.readdirSync(appDir, { withFileTypes: true });

    for (const entry of entries) {
      // Ignore files, dynamic params [slug], and route groups (marketing)
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("(") && entry.name.endsWith(")")) continue;
      if (entry.name.startsWith("[") && entry.name.endsWith("]")) continue;

      const dirName = entry.name.toLowerCase();
      expect(
        RESERVED_SLUGS.has(dirName),
        `Directory 'src/app/${entry.name}' is an exposed top-level route and MUST be in RESERVED_SLUGS to avoid collision with wedding slugs`,
      ).toBe(true);
    }
  });

  it("ensures public directory root files and folders are registered in RESERVED_SLUGS", () => {
    const publicDir = path.resolve(__dirname, "../../../../public");
    if (!fs.existsSync(publicDir)) return;

    const entries = fs.readdirSync(publicDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      // Strip extension to check slug (e.g., robots.txt -> robots)
      const baseName = entry.name.replace(/\.[^/.]+$/, "").toLowerCase();
      expect(
        RESERVED_SLUGS.has(baseName) || RESERVED_SLUGS.has(entry.name.toLowerCase()),
        `Public asset '${entry.name}' (base '${baseName}') should be protected in RESERVED_SLUGS`,
      ).toBe(true);
    }
  });

  it("correctly allows valid couple wedding slugs and rejects reserved slugs", () => {
    expect(isReservedSlug("priya-rahul")).toBe(false);
    expect(isReservedSlug("ananya-kabir-2026")).toBe(false);
    expect(isReservedSlug("raj-simran")).toBe(false);

    expect(isReservedSlug("PRICING")).toBe(true);
    expect(isReservedSlug("  admin  ")).toBe(true);
    expect(isReservedSlug("faq")).toBe(true);
  });
});
