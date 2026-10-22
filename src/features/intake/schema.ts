import { z } from "zod";
import { ALLOWED_PRESETS } from "@/lib/themes/tokens";

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const ConfidenceFieldSchema = z.object({
  confidence: ConfidenceLevelSchema,
  source: z.string().nullable().default(null),
});

export const DraftCoupleSchema = z.object({
  partnerAName: z.string().min(1).max(100),
  partnerBName: z.string().min(1).max(100),
  scriptHint: z.string().max(50).default("latin"),
  transliterationSuggestions: z.array(z.string().max(100)).optional(),
});

export const DraftDateSchema = z.object({
  value: z.string().nullable().default(null), // ISO date string (YYYY-MM-DD) or null
  confidence: ConfidenceLevelSchema,
  source: z.string().nullable().default(null),
});

export const DraftCitySchema = z.object({
  value: z.string().nullable().default(null),
  confidence: ConfidenceLevelSchema,
  source: z.string().nullable().default(null),
});

export const DraftEventSchema = z.object({
  typeTag: z.string().max(50).default("Ceremony"),
  title: z.string().min(1).max(120),
  date: z.string().nullable().default(null),
  startTime: z.string().nullable().default(null), // Formatted string e.g. "7:00 PM"
  endTime: z.string().nullable().default(null),
  timeZoneFlagged: z.boolean().default(true), // Flagged when assumed Asia/Kolkata
  venueName: z.string().nullable().default(null),
  venueAddress: z.string().nullable().default(null),
  mapQuery: z.string().nullable().default(null),
  dressCode: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  confidence: ConfidenceLevelSchema,
  source: z.string().nullable().default(null),
});

export const DraftContactSchema = z.object({
  role: z.string().max(80).default("Family / Coordinator"),
  name: z.string().max(100),
  phoneRaw: z.string().max(40),
  phoneE164: z.string().nullable().default(null),
  confidence: ConfidenceLevelSchema,
  source: z.string().nullable().default(null),
});

export const DraftUpiCandidateSchema = z.object({
  value: z.string().max(100),
  confidence: ConfidenceLevelSchema,
  source: z.string().nullable().default(null),
});

export const DraftThemeFeelingSchema = z.object({
  value: z.string().nullable().default(null),
  suggestedPreset: z.enum(ALLOWED_PRESETS).nullable().default(null),
  confidence: ConfidenceLevelSchema,
});

export const DraftConflictSchema = z.object({
  field: z.string(),
  values: z.array(z.string()),
  note: z.string(),
});

/**
 * Canonical Zod schema for DraftExtraction output.
 * Every field is strictly parsed and verified.
 */
export const DraftExtractionSchema = z.object({
  couple: DraftCoupleSchema.nullable().default(null),
  weddingDate: DraftDateSchema,
  city: DraftCitySchema,
  events: z.array(DraftEventSchema).default([]),
  contacts: z.array(DraftContactSchema).default([]),
  upiVpaCandidates: z.array(DraftUpiCandidateSchema).default([]),
  themeFeeling: DraftThemeFeelingSchema,
  languages: z.array(z.string().max(50)).default(["en"]),
  conflicts: z.array(DraftConflictSchema).default([]),
  missingRequired: z.array(z.string()).default([]),
});

export type DraftExtraction = z.infer<typeof DraftExtractionSchema>;
