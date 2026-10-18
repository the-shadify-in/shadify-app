import { z } from "zod";

export const ValidatePromoSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Promo code must be at least 3 characters")
    .max(20, "Promo code cannot exceed 20 characters")
    .regex(/^[A-Z0-9_-]+$/, "Promo code may only contain uppercase letters, numbers, and hyphens"),
  plan: z.enum(["lite", "premium", "platinum"]),
});

export type ValidatePromoInput = z.infer<typeof ValidatePromoSchema>;
