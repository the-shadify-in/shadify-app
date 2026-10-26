import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { THEME_PRESETS, validateContrast, ALLOWED_PRESETS } from "@/lib/themes/tokens";
import { PRICING_PLANS } from "@/lib/config/pricing";
import { getPlanDefaults } from "@/features/entitlements";
import { RESERVED_SLUGS } from "@/lib/config/reserved-slugs";
import { normalizePhoneNumber } from "@/lib/phone";
import { hashPassword } from "@/lib/auth";
import {
  ContrastValidationError,
  ReservedSlugError,
  DuplicateSlugError,
  DuplicatePhoneError,
  DuplicateEmailError,
  DuplicateDomainError,
} from "./service";

export const ProvisionWeddingSchema = z.object({
  brideName: z.string().trim().min(1, "Bride's name is required").max(60),
  groomName: z.string().trim().min(1, "Groom's name is required").max(60),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  venueCity: z.string().trim().min(2, "Venue city is required").max(100),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/,
      "Slug must be 3-40 lowercase alphanumeric characters with hyphens",
    )
    .refine((slug) => !RESERVED_SLUGS.has(slug), {
      message: "This wedding slug is reserved for platform use",
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
  couplePhone: z
    .string()
    .trim()
    .regex(
      /^(\+?[1-9]\d{6,14}|[6-9]\d{9})$/,
      "Must be a valid mobile number (e.g. +91 98123 45678)",
    )
    .optional()
    .or(z.literal("")),
  coupleEmail: z.string().trim().email("Must be a valid email").optional().or(z.literal("")),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  guestPin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Guest PIN must be exactly 6 digits")
    .optional()
    .or(z.literal("")),
  enableGuestPin: z.boolean().default(false),
});

export type ProvisionWeddingInput = z.infer<typeof ProvisionWeddingSchema>;

export interface SlugAvailabilityResult {
  available: boolean;
  slug: string;
  reason?: string;
  suggestions?: string[];
}

/**
 * Checks if a slug is available across canonical weddings, reserved list, and aliases.
 * Generates viable alternative suggestions if collision occurs.
 */
export async function checkSlugAvailability(rawSlug: string): Promise<SlugAvailabilityResult> {
  const slug = rawSlug.trim().toLowerCase();

  // 1. Format check
  if (!/^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) {
    return {
      available: false,
      slug,
      reason:
        "Slug must be 3-40 lowercase letters, numbers, and hyphens without leading/trailing hyphens.",
    };
  }

  // 2. Reserved system words
  if (RESERVED_SLUGS.has(slug)) {
    return {
      available: false,
      slug,
      reason: "This URL path is reserved for platform infrastructure.",
      suggestions: [`${slug}-wedding`, `${slug}-celebration`, `${slug}-2027`],
    };
  }

  // 3. Database uniqueness (canonical weddings + active aliases)
  const [existingWedding, existingAlias] = await Promise.all([
    prisma.wedding.findUnique({
      where: { slug },
      select: { id: true },
    }),
    prisma.weddingAlias.findUnique({
      where: { alias: slug },
      select: { id: true },
    }),
  ]);

  if (existingWedding || existingAlias) {
    const currentYear = new Date().getFullYear();
    const suggestions = [`${slug}-${currentYear}`, `${slug}-vivah`, `${slug}-celebration`];
    return {
      available: false,
      slug,
      reason: "This wedding URL is already registered. Please choose an alternative.",
      suggestions,
    };
  }

  return {
    available: true,
    slug,
  };
}

export interface ProvisionResult {
  success: true;
  weddingId: string;
  slug: string;
  url: string;
  status: "draft";
  plan: "lite" | "premium" | "platinum";
  couple: string;
  idempotentReplay?: boolean;
}

/**
 * Transactional Provisioning Engine for Shadify Concierge Studio.
 * Guarantees:
 * 1. Idempotency replay check via audit_log
 * 2. Theme color contrast safety audit
 * 3. Atomic creation of Couple user, Wedding (draft), Entitlements, Owner Member, Draft Itinerary
 * 4. Audit log entry with actor ID and idempotency key
 * 5. Safe rollback on any constraint violation or collision
 */
export async function provisionWeddingTransactional(
  data: ProvisionWeddingInput,
  actorUserId: string,
  idempotencyKey?: string,
): Promise<ProvisionResult> {
  const slug = data.slug.toLowerCase();
  const effectiveIdempotencyKey = idempotencyKey || data.idempotencyKey;

  // 1. Idempotency Check: if key provided, check for prior successful provisioning
  if (effectiveIdempotencyKey) {
    const priorLog = await prisma.auditLog.findFirst({
      where: {
        action: "wedding.provision",
        detail: {
          path: ["idempotencyKey"],
          equals: effectiveIdempotencyKey,
        },
      },
      include: {
        wedding: true,
      },
    });

    if (priorLog?.wedding) {
      return {
        success: true,
        weddingId: priorLog.wedding.id,
        slug: priorLog.wedding.slug,
        url: `/${priorLog.wedding.slug}`,
        status: "draft",
        plan: priorLog.wedding.plan,
        couple: `${priorLog.wedding.brideName} & ${priorLog.wedding.groomName}`,
        idempotentReplay: true,
      };
    }
  }

  // 2. Pre-flight contrast verification
  const basePreset = THEME_PRESETS[data.themeId] || THEME_PRESETS["royal-crimson"];
  const resolvedPalette = {
    ...basePreset.palette,
    primary: data.customPrimary || basePreset.palette.primary,
    accent: data.customAccent || basePreset.palette.accent,
  };

  const contrastReport = validateContrast({
    canvas: resolvedPalette.canvas,
    surface: resolvedPalette.surface,
    text: resolvedPalette.text,
    textMuted: resolvedPalette.textMuted,
    primary: resolvedPalette.primary,
    onPrimary: resolvedPalette.onPrimary,
    accent: resolvedPalette.accent,
    onAccent: resolvedPalette.onAccent,
  });

  if (!contrastReport.ok) {
    throw new ContrastValidationError(contrastReport.errors.map((e) => e.message));
  }

  // 3. Resolve plan config & dates via central entitlement engine
  const now = new Date();
  const planDefaults = getPlanDefaults(data.plan, now);
  const planConfig = PRICING_PLANS[data.plan];
  const weddingDateObj = new Date(data.weddingDate);

  const hostingUntil = planDefaults.hostingUntil;
  const originalsExpireAt = planDefaults.originalsExpireAt;

  const phoneValidation = data.couplePhone ? normalizePhoneNumber(data.couplePhone) : null;
  const normalizedPhone = phoneValidation?.e164 || null;
  const coupleFullName = `${data.brideName} & ${data.groomName}`;

  const themeConfig = {
    version: 1,
    presetId: data.themeId,
    palette: resolvedPalette,
    typography: basePreset.typography,
    monogram: {
      text: data.monogramText || `${data.brideName[0]} & ${data.groomName[0]}`,
      style: basePreset.monogram.style,
    },
    ornaments: basePreset.ornaments,
    sections: basePreset.sections,
  };

  let initialGuestPin: string | undefined = undefined;
  let privatePinHash: string | null = null;
  if (data.enableGuestPin || (data.guestPin && data.guestPin.trim() !== "")) {
    initialGuestPin = data.guestPin?.trim() || String(crypto.randomInt(100000, 999999));
    privatePinHash = await hashPassword(initialGuestPin);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Concurrency guard: Serialize transactions using the same idempotency key
      if (effectiveIdempotencyKey) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${effectiveIdempotencyKey}))`;

        const lockedPriorLog = await tx.auditLog.findFirst({
          where: {
            action: "wedding.provision",
            detail: {
              path: ["idempotencyKey"],
              equals: effectiveIdempotencyKey,
            },
          },
          include: {
            wedding: true,
          },
        });

        if (lockedPriorLog?.wedding) {
          return {
            success: true as const,
            weddingId: lockedPriorLog.wedding.id,
            slug: lockedPriorLog.wedding.slug,
            url: `/${lockedPriorLog.wedding.slug}`,
            status: "draft" as const,
            plan: lockedPriorLog.wedding.plan,
            couple: `${lockedPriorLog.wedding.brideName} & ${lockedPriorLog.wedding.groomName}`,
            idempotentReplay: true,
          };
        }
      }

      // Step A: Upsert Couple user if phone provided
      let coupleUser = null;
      if (normalizedPhone) {
        coupleUser = await tx.user.findFirst({
          where: { phone: normalizedPhone },
        });
      }

      if (!coupleUser) {
        coupleUser = await tx.user.create({
          data: {
            fullName: coupleFullName,
            phone: normalizedPhone,
            email: data.coupleEmail || null,
            role: "couple",
          },
        });
      }

      // Step B: Create Wedding in 'draft' status (strictly unpublished until reviewed)
      const wedding = await tx.wedding.create({
        data: {
          slug,
          brideName: data.brideName,
          groomName: data.groomName,
          weddingDate: weddingDateObj,
          plan: data.plan,
          status: "draft",
          themeId: data.themeId,
          themeConfig,
          themeVersion: 1,
          primaryColor: resolvedPalette.primary,
          accentColor: resolvedPalette.accent,
          monogramText: data.monogramText || `${data.brideName[0]} & ${data.groomName[0]}`,
          showBranding: !planConfig.canHideBranding,
          privatePinHash,
          contentExpiresAt: hostingUntil,
          originalsExpireAt,
        },
      });

      // Step C: Link Owner Membership
      await tx.weddingMember.create({
        data: {
          weddingId: wedding.id,
          userId: coupleUser.id,
          memberRole: "owner",
        },
      });

      // Step D: Initialize Entitlements matching plan limits exactly
      await tx.entitlement.create({
        data: {
          weddingId: wedding.id,
          hostingUntil,
          customDomain: planConfig.canCustomDomain,
          videoBite: planConfig.maxVideoBites > 0,
          faceSearch: false,
          maxPhotos: planConfig.maxPhotos,
        },
      });

      // Step E: Seed Draft Itinerary with clearly incomplete draft ceremony markers
      // (Never invent ceremony times; anchor to midnight of weddingDateObj)
      const draftEvents = [
        {
          weddingId: wedding.id,
          eventType: "ceremony",
          title: "Muhurtham & Vivah (Draft)",
          description:
            "Sacred pheras and ceremony rituals. Times and venue details to be confirmed.",
          startsAt: weddingDateObj,
          venueName: `${data.venueCity} Mandap (TBD)`,
          venueAddress: data.venueCity,
          sortOrder: 1,
        },
        {
          weddingId: wedding.id,
          eventType: "sangeet",
          title: "Sangeet & Celebration (Draft)",
          description:
            "Music, dance, and cocktail soiree. Times and venue details to be confirmed.",
          startsAt: weddingDateObj,
          venueName: `${data.venueCity} Celebration Hall (TBD)`,
          venueAddress: data.venueCity,
          sortOrder: 2,
        },
        {
          weddingId: wedding.id,
          eventType: "reception",
          title: "Wedding Reception (Draft)",
          description:
            "Grand dinner and family blessings. Times and venue details to be confirmed.",
          startsAt: weddingDateObj,
          venueName: `${data.venueCity} Banquet (TBD)`,
          venueAddress: data.venueCity,
          sortOrder: 3,
        },
      ];

      // Insert up to plan's maxEvents
      const allowedEventsToSeed = draftEvents.slice(
        0,
        Math.min(draftEvents.length, planConfig.maxEvents),
      );
      for (const ev of allowedEventsToSeed) {
        await tx.event.create({ data: ev });
      }

      // Step F: Record Audit Log with idempotency key
      await tx.auditLog.create({
        data: {
          weddingId: wedding.id,
          actorId: actorUserId,
          action: "wedding.provision",
          detail: {
            slug,
            plan: data.plan,
            themeId: data.themeId,
            city: data.venueCity,
            idempotencyKey: effectiveIdempotencyKey || null,
            seededEventsCount: allowedEventsToSeed.length,
          },
        },
      });

      return {
        success: true as const,
        weddingId: wedding.id,
        slug: wedding.slug,
        url: `/${wedding.slug}`,
        status: "draft" as const,
        plan: wedding.plan,
        couple: coupleFullName,
        initialGuestPin,
      };
    });

    return result;
  } catch (err: unknown) {
    const errorObj = err as Record<string, unknown> | undefined;

    // PostgreSQL Trigger / Check Constraint (block_reserved_slug)
    if (
      errorObj?.code === "23514" ||
      (typeof errorObj?.message === "string" && errorObj.message.includes("is reserved"))
    ) {
      throw new ReservedSlugError(slug);
    }

    // Prisma Unique Constraint violation
    if (errorObj?.code === "P2002") {
      const target = (errorObj.meta as { target?: string[] } | undefined)?.target;
      if (Array.isArray(target)) {
        if (target.includes("slug")) {
          throw new DuplicateSlugError(slug);
        }
        if (target.includes("phone")) {
          throw new DuplicatePhoneError(data.couplePhone || "provided phone");
        }
        if (target.includes("email")) {
          throw new DuplicateEmailError(data.coupleEmail || "provided email");
        }
        if (target.includes("custom_domain")) {
          throw new DuplicateDomainError("provided domain");
        }
      }
      throw new DuplicateSlugError(slug);
    }

    throw err;
  }
}
