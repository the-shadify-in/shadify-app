import { describe, it, expect } from "vitest";
import { isReservedSlug } from "@/lib/config/reserved-slugs";

// Regex matching DB constraints
const ALIAS_REGEX = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/;
const QR_URL_REGEX = /^https:\/\/[a-z0-9.-]+\/[a-z0-9-]+$/;
const SHA256_HEX_REGEX = /^[0-9a-f]{64}$/;

describe("Wedding Aliases & QR Asset DB Constraints", () => {
  describe("A1 - A4: Alias Format & Reserved Words", () => {
    it("validates legitimate alias format", () => {
      const validAliases = ["priya-rahul-2027", "pg-1311", "ananya-kabir-run1", "save-the-date-ak"];
      for (const a of validAliases) {
        expect(ALIAS_REGEX.test(a)).toBe(true);
      }
    });

    it("rejects reserved words as aliases", () => {
      const reserved = ["pricing", "terms", "admin", "api", "sample", "demo", "health"];
      for (const r of reserved) {
        expect(isReservedSlug(r)).toBe(true);
      }
    });

    it("rejects malformed aliases (leading/trailing hyphen, uppercase, dots, invalid length)", () => {
      const invalid = [
        "a", // too short (< 3)
        "-leading-dash",
        "trailing-dash-",
        "Upper-Case-Slug",
        "has.dot.com",
        "has_underscore",
        "too-long-alias-name-exceeding-the-maximum-forty-characters-limit",
      ];
      for (const inv of invalid) {
        expect(ALIAS_REGEX.test(inv)).toBe(false);
      }
    });
  });

  describe("Q1: QR Asset URL and Hash Validation", () => {
    it("accepts clean HTTPS URLs without query strings", () => {
      const validUrls = [
        "https://shadify.in/priya-rahul",
        "https://shadify.in/demo-one",
        "https://shadify.in/pg-1311",
      ];
      for (const url of validUrls) {
        expect(QR_URL_REGEX.test(url)).toBe(true);
      }
    });

    it("strictly rejects HTTP and query parameters on QR URLs", () => {
      const invalidUrls = [
        "http://shadify.in/priya-rahul", // unencrypted
        "https://shadify.in/priya-rahul?utm_source=qr", // contains query string
        "https://shadify.in/priya-rahul#hash", // contains fragment
        "https://shadify.in/", // missing slug
      ];
      for (const url of invalidUrls) {
        expect(QR_URL_REGEX.test(url)).toBe(false);
      }
    });

    it("enforces strict 64-char lowercase SHA-256 hex file hashes", () => {
      const validHash = "a".repeat(64);
      expect(SHA256_HEX_REGEX.test(validHash)).toBe(true);

      const invalidHashes = [
        "NOTHEX".padEnd(64, "0"),
        "A".repeat(64), // uppercase
        "b".repeat(63), // 63 chars
        "b".repeat(65), // 65 chars
      ];
      for (const h of invalidHashes) {
        expect(SHA256_HEX_REGEX.test(h)).toBe(false);
      }
    });
  });

  describe("Q2 - Q5: QR Lifecycle State Machine Logic", () => {
    const STATUS_RANKS: Record<string, number> = {
      draft: 1,
      proofed: 2,
      approved_for_print: 3,
      printed: 4,
      superseded: 5,
    };

    function canTransitionStatus(current: string, next: string): boolean {
      if (next === "superseded") return true;
      if (current === "superseded") return false; // superseded cannot be revived
      const nextRank = STATUS_RANKS[next] ?? 0;
      const currentRank = STATUS_RANKS[current] ?? 0;
      return nextRank >= currentRank;
    }

    it("allows forward progress from draft to printed", () => {
      expect(canTransitionStatus("draft", "proofed")).toBe(true);
      expect(canTransitionStatus("proofed", "approved_for_print")).toBe(true);
      expect(canTransitionStatus("approved_for_print", "printed")).toBe(true);
    });

    it("allows any active status to transition to superseded", () => {
      expect(canTransitionStatus("draft", "superseded")).toBe(true);
      expect(canTransitionStatus("approved_for_print", "superseded")).toBe(true);
      expect(canTransitionStatus("printed", "superseded")).toBe(true);
    });

    it("rejects backwards movement (e.g. approved_for_print -> draft)", () => {
      expect(canTransitionStatus("approved_for_print", "draft")).toBe(false);
      expect(canTransitionStatus("printed", "proofed")).toBe(false);
    });

    it("strictly blocks reviving superseded assets", () => {
      expect(canTransitionStatus("superseded", "printed")).toBe(false);
      expect(canTransitionStatus("superseded", "draft")).toBe(false);
    });
  });
});
