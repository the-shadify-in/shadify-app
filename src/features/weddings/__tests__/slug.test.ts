import { describe, it, expect } from "vitest";
import { CreateWeddingSchema } from "../schemas";

describe("Wedding Slug Validation", () => {
  const baseValid = {
    brideName: "Priya",
    groomName: "Rahul",
    weddingDate: "2026-12-18",
    venueCity: "Jaipur",
    plan: "lite" as const,
    themeId: "royal-crimson" as const,
  };

  it("accepts valid lowercase alphanumeric slugs with hyphens", () => {
    const validSlugs = ["priya-rahul", "ananya-kabir", "vikram-ananya-2026", "a-b-c"];
    for (const slug of validSlugs) {
      const result = CreateWeddingSchema.safeParse({ ...baseValid, slug });
      expect(result.success, `Expected slug "${slug}" to be valid`).toBe(true);
    }
  });

  it("rejects invalid slugs: too short, uppercase, symbols, leading/trailing hyphens", () => {
    const invalidSlugs = [
      "ab", // <3 chars
      "-priya-rahul", // leading hyphen
      "priya-rahul-", // trailing hyphen
      "priya rahul", // space
      "priya_rahul", // underscore
      "Priya-Rahul", // uppercase
      "priya@rahul", // special chars
    ];

    for (const slug of invalidSlugs) {
      const result = CreateWeddingSchema.safeParse({ ...baseValid, slug });
      expect(result.success, `Expected slug "${slug}" to fail validation`).toBe(false);
    }
  });

  it("rejects reserved system slugs", () => {
    const reservedSlugs = ["admin", "api", "dashboard", "preview", "pricing", "login", "w"];
    for (const slug of reservedSlugs) {
      const result = CreateWeddingSchema.safeParse({ ...baseValid, slug });
      expect(result.success, `Expected reserved slug "${slug}" to be rejected`).toBe(false);
    }
  });
});
