import { z } from "zod";
import { ALLOWED_PRESETS } from "@/lib/themes/tokens";
import { RESERVED_SLUGS } from "@/lib/config/reserved-slugs";

export const CreateWeddingSchema = z.object({
  brideName: z.string().trim().min(1, "Bride's name is required").max(60),
  groomName: z.string().trim().min(1, "Groom's name is required").max(60),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  venueCity: z.string().trim().min(2, "Venue city is required").max(100),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/,
      "Slug must be 3-40 lowercase alphanumeric characters with hyphens",
    )
    .refine((slug) => !RESERVED_SLUGS.has(slug), {
      message: "This wedding slug is reserved for system use",
    }),
  plan: z.enum(["lite", "premium", "platinum"]).default("lite"),
  themeId: z.enum(ALLOWED_PRESETS).default("royal-crimson"),
  customPrimary: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be 6-digit hex color")
    .optional(),
  customAccent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be 6-digit hex color")
    .optional(),
  monogramText: z.string().trim().max(8).optional(),
  upiVpa: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Must be valid UPI VPA (e.g. couple@okbank)")
    .optional()
    .or(z.literal("")),
  couplePhone: z
    .string()
    .trim()
    .regex(
      /^(\+?[1-9]\d{6,14}|[6-9]\d{9})$/,
      "Must be a valid phone number with optional country code (e.g. +91 98123 45678 or +1 4155552671)",
    )
    .optional()
    .or(z.literal("")),
  coupleEmail: z.string().trim().email("Must be a valid email").optional().or(z.literal("")),
});

export type CreateWeddingInput = z.infer<typeof CreateWeddingSchema>;
