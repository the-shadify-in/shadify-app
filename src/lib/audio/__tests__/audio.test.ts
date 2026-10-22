import { describe, it, expect } from "vitest";
import {
  WeddingAudioConfigSchema,
  validateAudioForPlan,
  validateAudioUpload,
  generateSafeAudioObjectKey,
  PRESET_AUDIO_LIBRARY,
  getAudioPresetById,
  MAX_AUDIO_SIZE_BYTES,
  COPYRIGHT_LEGAL_DECLARATION,
} from "../index";
import { ThemeConfigSchema, THEME_PRESETS, resolveTheme } from "@/lib/themes/tokens";

describe("Audio Architecture & Plan Entitlements", () => {
  describe("Schema Validation (WeddingAudioConfigSchema)", () => {
    it("validates disabled audio (mode: none)", () => {
      const parsed = WeddingAudioConfigSchema.safeParse({
        enabled: false,
        mode: "none",
      });
      expect(parsed.success).toBe(true);
    });

    it("validates preset audio with valid title and url", () => {
      const parsed = WeddingAudioConfigSchema.safeParse({
        enabled: true,
        mode: "preset",
        title: "Mangala Vathiyam (Nadaswaram & Thavil)",
        url: "/audio/presets/nadaswaram-muhurtham.mp3",
      });
      expect(parsed.success).toBe(true);
    });

    it("validates custom audio upload object with valid title and secure url", () => {
      const parsed = WeddingAudioConfigSchema.safeParse({
        enabled: true,
        mode: "custom",
        title: "Aarav & Meera Wedding Theme",
        url: "https://media.shadify.in/weddings/w_123/audio/uuid-456.mp3",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid audio combinations", () => {
      // Enabled but mode is none
      const res1 = WeddingAudioConfigSchema.safeParse({
        enabled: true,
        mode: "none",
        title: "Invalid",
        url: "/audio/test.mp3",
      });
      expect(res1.success).toBe(false);

      // Missing title
      const res2 = WeddingAudioConfigSchema.safeParse({
        enabled: true,
        mode: "preset",
        url: "/audio/test.mp3",
      });
      expect(res2.success).toBe(false);

      // Missing url
      const res3 = WeddingAudioConfigSchema.safeParse({
        enabled: true,
        mode: "custom",
        title: "Song",
      });
      expect(res3.success).toBe(false);
    });
  });

  describe("Commercial Entitlements (validateAudioForPlan)", () => {
    it("allows disabled mode (none) on all plans", () => {
      const config = { enabled: false, mode: "none" } as const;
      expect(validateAudioForPlan(config, "lite").allowed).toBe(true);
      expect(validateAudioForPlan(config, "premium").allowed).toBe(true);
      expect(validateAudioForPlan(config, "platinum").allowed).toBe(true);
    });

    it("allows curated pre-cleared preset tracks on all plans (including Essential ₹2,999)", () => {
      const config = {
        enabled: true,
        mode: "preset",
        title: "Kalyana Veenai",
        url: "/audio/presets/kalyana-veenai.mp3",
      } as const;
      expect(validateAudioForPlan(config, "lite").allowed).toBe(true);
      expect(validateAudioForPlan(config, "premium").allowed).toBe(true);
      expect(validateAudioForPlan(config, "platinum").allowed).toBe(true);
    });

    it("restricts custom audio upload strictly to Platinum / Premium tiers", () => {
      const config = {
        enabled: true,
        mode: "custom",
        title: "Custom Wedding Song",
        url: "https://media.shadify.in/custom.mp3",
      } as const;

      // Essential / Lite: must be rejected
      const liteResult = validateAudioForPlan(config, "lite");
      expect(liteResult.allowed).toBe(false);
      expect(liteResult.reason).toContain("exclusive to Platinum tier");

      // Premium / Platinum: allowed
      expect(validateAudioForPlan(config, "premium").allowed).toBe(true);
      expect(validateAudioForPlan(config, "platinum").allowed).toBe(true);
    });
  });

  describe("Upload Validation (validateAudioUpload)", () => {
    it("enforces the 8 MB ceiling constant", () => {
      expect(MAX_AUDIO_SIZE_BYTES).toBe(8 * 1024 * 1024);
    });

    it("accepts valid audio files within 8 MB ceiling", () => {
      const validFiles = [
        { size: 4 * 1024 * 1024, mimeType: "audio/mpeg" },
        { size: 7.9 * 1024 * 1024, mimeType: "audio/mp4" },
        { size: 2 * 1024 * 1024, mimeType: "audio/aac" },
        { size: 1.5 * 1024 * 1024, mimeType: "audio/x-m4a" },
      ];

      for (const file of validFiles) {
        const res = validateAudioUpload(file);
        expect(res.valid).toBe(true);
        expect(res.error).toBeUndefined();
      }
    });

    it("rejects files exceeding 8 MB ceiling", () => {
      const oversizeFile = { size: 8.5 * 1024 * 1024, mimeType: "audio/mpeg" };
      const res = validateAudioUpload(oversizeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("exceeds the 8 MB maximum limit");
    });

    it("rejects empty files (0 bytes)", () => {
      const emptyFile = { size: 0, mimeType: "audio/mpeg" };
      const res = validateAudioUpload(emptyFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("empty");
    });

    it("rejects unsupported MIME types", () => {
      const invalidFiles = [
        { size: 2 * 1024 * 1024, mimeType: "video/mp4" },
        { size: 1 * 1024 * 1024, mimeType: "application/pdf" },
        { size: 500 * 1024, mimeType: "image/jpeg" },
        { size: 100 * 1024, mimeType: "text/plain" },
      ];

      for (const file of invalidFiles) {
        const res = validateAudioUpload(file);
        expect(res.valid).toBe(false);
        expect(res.error).toContain("Unsupported audio format");
      }
    });
  });

  describe("PII-Safe Object Key Generation (generateSafeAudioObjectKey)", () => {
    it("generates random, scoped UUID object keys without PII or couple names", () => {
      const weddingId = "wed_cm789abc";
      const key1 = generateSafeAudioObjectKey(weddingId, "mp3");
      const key2 = generateSafeAudioObjectKey(weddingId, "m4a");

      expect(key1).toMatch(/^weddings\/wed_cm789abc\/audio\/[0-9a-f-]{36}\.mp3$/);
      expect(key2).toMatch(/^weddings\/wed_cm789abc\/audio\/[0-9a-f-]{36}\.m4a$/);
      expect(key1).not.toBe(key2);

      // Verify no PII patterns
      expect(key1).not.toContain("aarav");
      expect(key1).not.toContain("meera");
    });
  });

  describe("Curated Pre-Cleared Preset Library", () => {
    it("contains 8 curated South Indian and classical instrumental presets", () => {
      expect(PRESET_AUDIO_LIBRARY.length).toBe(8);
      const ids = PRESET_AUDIO_LIBRARY.map((t) => t.id);
      expect(ids).toContain("nadaswaram-muhurtham");
      expect(ids).toContain("kalyana-veenai");
      expect(ids).toContain("carnatic-flute");
      expect(ids).toContain("shehnai-yaman");
      expect(ids).toContain("sitar-santoor");
    });

    it("can look up presets by ID", () => {
      const track = getAudioPresetById("nadaswaram-muhurtham");
      expect(track).toBeDefined();
      expect(track?.title).toContain("Mangala Vathiyam");
      expect(track?.instruments).toContain("Nadaswaram");
    });

    it("has comprehensive legal disclaimer for customer terms", () => {
      expect(COPYRIGHT_LEGAL_DECLARATION).toContain("indemnify Shadify");
      expect(COPYRIGHT_LEGAL_DECLARATION).toContain("copyright laws");
    });
  });

  describe("Theme Integration & Backward Compatibility", () => {
    it("defaults audio to enabled: false and mode: none when omitted", () => {
      const legacyTheme = {
        version: 1,
        presetId: "royal-crimson",
        palette: THEME_PRESETS["royal-crimson"].palette,
        typography: THEME_PRESETS["royal-crimson"].typography,
        monogram: THEME_PRESETS["royal-crimson"].monogram,
        ornaments: THEME_PRESETS["royal-crimson"].ornaments,
        sections: THEME_PRESETS["royal-crimson"].sections,
      };

      const parsed = ThemeConfigSchema.safeParse(legacyTheme);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.audio).toEqual({
          enabled: false,
          mode: "none",
        });
      }
    });

    it("merges custom audio config in getThemeConfig", () => {
      const rawWithAudio = {
        audio: {
          enabled: true,
          mode: "preset",
          title: "Mangala Vathiyam",
          url: "/audio/presets/nadaswaram-muhurtham.mp3",
        },
      };

      const { theme } = resolveTheme("royal-crimson", rawWithAudio);
      expect(theme.audio).toEqual({
        enabled: true,
        mode: "preset",
        title: "Mangala Vathiyam",
        url: "/audio/presets/nadaswaram-muhurtham.mp3",
      });
    });
  });
});
