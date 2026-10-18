import { describe, it, expect } from "vitest";
import { CreateWeddingSchema } from "../schemas";
import { RESERVED_SLUGS, isReservedSlug } from "@/lib/config/reserved-slugs";

describe("Routing Rules & Reserved Slug Enforcement", () => {
  it("rejects creation of weddings using system or marketing reserved slugs", () => {
    const testCases = ["pricing", "faq", "sample", "legal", "terms", "contact", "admin", "api"];

    for (const slug of testCases) {
      expect(isReservedSlug(slug)).toBe(true);

      const parsed = CreateWeddingSchema.safeParse({
        brideName: "Priya",
        groomName: "Rahul",
        weddingDate: "2026-12-14",
        venueCity: "Udaipur",
        slug,
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toMatch(/reserved for system use|Slug must be/i);
      }
    }
  });

  it("accepts valid couple wedding slugs adhering to naming format", () => {
    const validSlugs = ["priya-rahul", "ananya-kabir", "raj-simran-2026", "vikram-neha"];

    for (const slug of validSlugs) {
      expect(RESERVED_SLUGS.has(slug)).toBe(false);

      const parsed = CreateWeddingSchema.safeParse({
        brideName: "Priya",
        groomName: "Rahul",
        weddingDate: "2026-12-14",
        venueCity: "Udaipur",
        slug,
      });

      expect(parsed.success).toBe(true);
    }
  });

  it("strictly rejects malformed slugs (trailing hyphens, uppercase, dots, invalid length)", () => {
    const malformed = [
      "pr", // < 3 chars
      "priya-rahul-celebration-at-taj-lake-palace-udaipur-rajasthan-grand-soiree-2026", // > 40 chars
      "-priya-rahul", // leading hyphen
      "priya-rahul-", // trailing hyphen
      "Priya-Rahul", // uppercase
      "priya.rahul", // dot
      "priya_rahul", // underscore
      "wp-login.php", // bot probe
    ];

    for (const slug of malformed) {
      const parsed = CreateWeddingSchema.safeParse({
        brideName: "Priya",
        groomName: "Rahul",
        weddingDate: "2026-12-14",
        venueCity: "Udaipur",
        slug,
      });

      expect(parsed.success).toBe(false);
    }
  });
});
