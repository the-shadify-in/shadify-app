import type { WeddingAudioConfig, AudioEntitlementCheck } from "./types";

export const MAX_AUDIO_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB strict ceiling

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
] as const;

/**
 * Legal declaration required before any custom audio file is processed.
 */
export const COPYRIGHT_LEGAL_DECLARATION =
  "I confirm and warrant that I hold all necessary rights, licenses, or direct authorization from the copyright holders to broadcast this audio recording on the wedding invitation website. I acknowledge that private/unlisted websites are subject to applicable copyright laws and agree to indemnify Shadify against any infringement claims.";

/**
 * Validates audio mode against the wedding plan's commercial entitlements.
 * - Essential / Lite (₹2,999): Off or Curated Pre-Cleared Library only.
 * - Premium / Platinum (₹7,999+): Custom audio upload permitted.
 */
export function validateAudioForPlan(
  config: WeddingAudioConfig,
  plan: "lite" | "premium" | "platinum",
): AudioEntitlementCheck {
  if (!config.enabled) {
    return { allowed: true };
  }

  if (config.mode === "preset") {
    return { allowed: true };
  }

  if (config.mode === "custom") {
    if (plan === "lite") {
      return {
        allowed: false,
        reason:
          "Custom audio upload is exclusive to Platinum tier. Essential tier includes the pre-cleared instrumental library.",
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Unrecognized audio mode" };
}

/**
 * Validates an uploaded audio file size and MIME type.
 */
export function validateAudioUpload(file: { size: number; mimeType: string }): {
  valid: boolean;
  error?: string;
} {
  if (file.size <= 0) {
    return { valid: false, error: "Audio file is empty" };
  }

  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Audio file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 8 MB maximum limit.`,
    };
  }

  const normalizedMime = file.mimeType.toLowerCase().trim();
  const isAllowed = (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(normalizedMime);
  if (!isAllowed) {
    return {
      valid: false,
      error: `Unsupported audio format "${file.mimeType}". Please upload an MP3, AAC, or M4A audio track.`,
    };
  }

  return { valid: true };
}

/**
 * Generates an unpredictable, PII-free object key for R2 storage.
 * Does not expose couple names or sensitive IDs in public asset URLs.
 */
export function generateSafeAudioObjectKey(weddingId: string, ext = "mp3"): string {
  const cleanExt = ext.replace(/^\./, "").toLowerCase();
  const randomUuid = crypto.randomUUID();
  return `weddings/${weddingId}/audio/${randomUuid}.${cleanExt}`;
}
