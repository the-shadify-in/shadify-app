import { prisma } from "@/lib/db";
import { THEME_PRESETS, validateContrast, type PresetId } from "@/lib/themes/tokens";
import { PRICING_PLANS } from "@/lib/config/pricing";
import type { CreateWeddingInput } from "./schemas";
import { normalizePhoneNumber } from "@/lib/phone";

export class ContrastValidationError extends Error {
  constructor(public details: string[]) {
    super(`Theme colors failed accessibility contrast audit: ${details.join("; ")}`);
    this.name = "ContrastValidationError";
  }
}

export class ReservedSlugError extends Error {
  constructor(slug: string) {
    super(`The wedding slug '${slug}' is reserved or contains invalid characters.`);
    this.name = "ReservedSlugError";
  }
}

export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`A wedding with the slug '${slug}' already exists.`);
    this.name = "DuplicateSlugError";
  }
}

export class DuplicatePhoneError extends Error {
  constructor(phone: string) {
    super(`A user with the mobile number '${phone}' already exists.`);
    this.name = "DuplicatePhoneError";
  }
}

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`A user with the email address '${email}' already exists.`);
    this.name = "DuplicateEmailError";
  }
}

export class DuplicateDomainError extends Error {
  constructor(domain: string) {
    super(`The custom domain '${domain}' is already linked to another wedding.`);
    this.name = "DuplicateDomainError";
  }
}

/**
 * Creates a wedding with atomic guarantees:
 * - Server-side contrast validation
 * - Couple owner user creation
 * - Entitlements setup (5-year hosting, 90-day master RAW retention)
 * - Owner membership association
 * - Audit log trail entry
 */
export async function createWeddingService(data: CreateWeddingInput, actorUserId: string) {
  const slug = data.slug.toLowerCase();
  const basePreset = THEME_PRESETS[data.themeId] || THEME_PRESETS["royal-crimson"];

  // 1. Build and validate theme palette
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

  // 2. Prepare overrides & dates
  const themeConfig = {
    version: 1,
    presetId: data.themeId as PresetId,
    palette: resolvedPalette,
    typography: basePreset.typography,
    monogram: {
      text: data.monogramText || `${data.brideName[0]} & ${data.groomName[0]}`,
      style: basePreset.monogram.style,
    },
    ornaments: basePreset.ornaments,
    sections: basePreset.sections,
  };

  const planConfig = PRICING_PLANS[data.plan];
  const weddingDateObj = new Date(data.weddingDate);
  const now = new Date();

  // Hosting lasts 5 years from creation; master original RAWs are retained for 90 days
  const hostingUntil = new Date(
    now.getTime() + planConfig.hostingDurationYears * 365.25 * 24 * 60 * 60 * 1000,
  );
  const originalsExpireAt = new Date(
    now.getTime() + planConfig.rawOriginalsRetentionDays * 24 * 60 * 60 * 1000,
  );

  const phoneValidation = data.couplePhone ? normalizePhoneNumber(data.couplePhone) : null;
  const normalizedPhone = phoneValidation?.e164 || null;
  const coupleFullName = `${data.brideName} & ${data.groomName}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create or update couple owner user
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

      // Create the wedding
      const wedding = await tx.wedding.create({
        data: {
          slug,
          brideName: data.brideName,
          groomName: data.groomName,
          weddingDate: weddingDateObj,
          plan: data.plan,
          status: "draft",
          themeId: data.themeId,
          themeConfig: themeConfig,
          themeVersion: 1,
          primaryColor: resolvedPalette.primary,
          accentColor: resolvedPalette.accent,
          monogramText: data.monogramText || `${data.brideName[0]} & ${data.groomName[0]}`,
          upiVpa: data.upiVpa || null,
          showBranding: !planConfig.canHideBranding,
          contentExpiresAt: hostingUntil,
          originalsExpireAt: originalsExpireAt,
        },
      });

      // Link owner membership
      await tx.weddingMember.create({
        data: {
          weddingId: wedding.id,
          userId: coupleUser.id,
          memberRole: "owner",
        },
      });

      // Create Entitlements record
      await tx.entitlement.create({
        data: {
          weddingId: wedding.id,
          hostingUntil: hostingUntil,
          customDomain: planConfig.canCustomDomain,
          videoBite: false,
          faceSearch: false,
          maxPhotos: 500,
        },
      });

      // Audit Log Entry
      await tx.auditLog.create({
        data: {
          weddingId: wedding.id,
          actorId: actorUserId,
          action: "wedding.create",
          detail: {
            slug,
            plan: data.plan,
            themeId: data.themeId,
            couplePhone: normalizedPhone,
          },
        },
      });

      return wedding;
    });

    return result;
  } catch (err: unknown) {
    const errorObj = err as Record<string, unknown> | undefined;

    // PostgreSQL Trigger / Check Constraint (block_reserved_slug or slug format)
    if (
      errorObj?.code === "23514" ||
      (typeof errorObj?.message === "string" && errorObj.message.includes("is reserved"))
    ) {
      throw new ReservedSlugError(slug);
    }

    // Prisma Unique Constraint violation (slug, phone, email, or domain)
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

/**
 * Publishes a wedding and immediately triggers Next.js cache invalidation
 * so guests see the page within seconds of activation.
 */
export async function publishWeddingService(weddingId: string, actorUserId: string) {
  const wedding = await prisma.wedding.update({
    where: { id: weddingId },
    data: { status: "published" },
  });

  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/${wedding.slug}`);
    revalidatePath(`/${wedding.slug}`, "page");
  } catch {
    // In test runners or non-Next runtime environments, skip silently
  }

  await prisma.auditLog.create({
    data: {
      weddingId: wedding.id,
      actorId: actorUserId,
      action: "wedding.publish",
      detail: { slug: wedding.slug },
    },
  });

  return wedding;
}
