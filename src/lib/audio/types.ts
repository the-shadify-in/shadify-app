import { z } from "zod";

/**
 * Zod Schema for Wedding Audio Configuration
 * Stored in PostgreSQL inside wedding theme_config or wedding record.
 */
export const WeddingAudioConfigSchema = z.discriminatedUnion("enabled", [
  z.object({
    enabled: z.literal(false),
    mode: z.literal("none"),
  }),
  z.object({
    enabled: z.literal(true),
    mode: z.enum(["preset", "custom"]),
    title: z.string().min(1, "Track title is required").max(100),
    url: z.string().min(1, "Audio URL is required"),
  }),
]);

export type WeddingAudioConfig = z.infer<typeof WeddingAudioConfigSchema>;

/**
 * Pre-cleared instrumental audio preset track
 */
export interface AudioPresetTrack {
  id: string;
  title: string;
  category: "south-indian" | "classical" | "royal" | "devotional";
  instruments: string[];
  description: string;
  durationEstimate: string;
  url: string;
}

/**
 * Result of audio plan entitlement verification
 */
export interface AudioEntitlementCheck {
  allowed: boolean;
  reason?: string;
}
