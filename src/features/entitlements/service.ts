// src/features/entitlements/service.ts
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PRICING_PLANS } from "@/lib/config/pricing";
import type {
  WeddingPlanId,
  PlanEntitlements,
  EntitlementOverrides,
  EntitlementOverrideAuditDetail,
  EffectiveEntitlements,
  PrismaTx,
} from "./types";

/**
 * Resolves static canonical plan defaults directly from authoritative PRICING_PLANS.
 * Strictly separates:
 * - 5-Year website hosting (public interactive invitation, guestbook, envelope, RSVPs)
 * - 90-Day RAW originals retention (heavy uncompressed master camera files)
 */
export function getPlanDefaults(
  plan: WeddingPlanId,
  referenceDate?: Date,
): PlanEntitlements & { hostingUntil: Date; originalsExpireAt: Date } {
  const config = PRICING_PLANS[plan];
  if (!config) {
    throw new Error(`Unknown wedding plan '${plan}'`);
  }

  const validRef =
    referenceDate instanceof Date && !isNaN(referenceDate.getTime()) ? referenceDate : new Date();

  const hostingUntil = new Date(
    validRef.getTime() + config.hostingDurationYears * 365.25 * 24 * 60 * 60 * 1000,
  );
  const originalsExpireAt = new Date(
    validRef.getTime() + config.rawOriginalsRetentionDays * 24 * 60 * 60 * 1000,
  );

  return {
    plan,
    name: config.name,
    maxPhotos: config.maxPhotos,
    maxEvents: config.maxEvents,
    maxVideoBites: config.maxVideoBites,
    videoBite: config.maxVideoBites > 0,
    customDomain: config.canCustomDomain,
    canHideBranding: config.canHideBranding,
    hostingDurationYears: config.hostingDurationYears,
    rawOriginalsRetentionDays: config.rawOriginalsRetentionDays,
    faceSearch: false,
    maxGuests: null,
    maxOriginalsGb: null,
    allowedPresets: config.allowedPresets,
    features: config.features,
    hostingUntil,
    originalsExpireAt,
  };
}

/**
 * Resolves effective entitlements for a wedding by:
 * 1. Resolving the canonical plan defaults
 * 2. Merging the stored database entitlement row
 * 3. Inspecting the latest audit_log override
 * 4. Disregarding any override that is revoked or expired
 */
export async function getEffectiveEntitlements(
  weddingId: string,
  options?: { tx?: PrismaTx; now?: Date },
): Promise<EffectiveEntitlements> {
  const db = options?.tx || prisma;
  const now = options?.now || new Date();

  // 1. Fetch wedding with its entitlement record
  const wedding = await db.wedding.findUnique({
    where: { id: weddingId },
    include: { entitlement: true },
  });

  if (!wedding) {
    throw new Error(`Wedding '${weddingId}' not found`);
  }

  const plan = wedding.plan || "lite";
  const defaults = getPlanDefaults(plan, wedding.createdAt);

  // 2. Fetch the latest entitlement override or revocation from audit_log
  let latestOverrideLog = null;
  if (db.auditLog?.findFirst) {
    latestOverrideLog = await db.auditLog.findFirst({
      where: {
        weddingId,
        action: { in: ["entitlement.override", "entitlement.override_revoked"] },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }

  let activeOverride: EntitlementOverrideAuditDetail | null = null;

  if (
    latestOverrideLog &&
    latestOverrideLog.action === "entitlement.override" &&
    latestOverrideLog.detail
  ) {
    const detail = latestOverrideLog.detail as unknown as EntitlementOverrideAuditDetail;

    // Check if revoked
    const isRevoked = Boolean(detail.revokedAt);

    // Check if expired
    const isExpired = detail.expiresAt ? new Date(detail.expiresAt) <= now : false;

    if (!isRevoked && !isExpired) {
      activeOverride = detail;
    }
  }

  // 3. Resolve stored base from DB entitlement row (fallback to plan defaults)
  const stored = wedding.entitlement;
  const baseMaxPhotos = stored?.maxPhotos ?? defaults.maxPhotos;
  const baseVideoBite = stored?.videoBite ?? defaults.videoBite;
  const baseCustomDomain = stored?.customDomain ?? defaults.customDomain;
  const baseFaceSearch = stored?.faceSearch ?? defaults.faceSearch;
  const baseMaxGuests = stored?.maxGuests ?? defaults.maxGuests;
  const baseMaxOriginalsGb = stored?.maxOriginalsGb
    ? Number(stored.maxOriginalsGb)
    : defaults.maxOriginalsGb;
  const baseHostingUntil = stored?.hostingUntil ?? defaults.hostingUntil;

  // 4. If an active, non-expired override is present, overlay it
  const overrides = activeOverride?.newValues || {};

  const effectiveMaxPhotos =
    overrides.maxPhotos !== undefined && overrides.maxPhotos !== null
      ? overrides.maxPhotos
      : baseMaxPhotos;

  const effectiveMaxEvents =
    overrides.maxEvents !== undefined && overrides.maxEvents !== null
      ? overrides.maxEvents
      : defaults.maxEvents;

  const effectiveMaxVideoBites =
    overrides.maxVideoBites !== undefined && overrides.maxVideoBites !== null
      ? overrides.maxVideoBites
      : defaults.maxVideoBites;

  const effectiveVideoBite =
    overrides.videoBite !== undefined ? overrides.videoBite : baseVideoBite;

  const effectiveCustomDomain =
    overrides.customDomain !== undefined ? overrides.customDomain : baseCustomDomain;

  const effectiveFaceSearch =
    overrides.faceSearch !== undefined ? overrides.faceSearch : baseFaceSearch;

  const effectiveMaxGuests =
    overrides.maxGuests !== undefined ? overrides.maxGuests : baseMaxGuests;

  const effectiveMaxOriginalsGb =
    overrides.maxOriginalsGb !== undefined ? overrides.maxOriginalsGb : baseMaxOriginalsGb;

  const effectiveCanHideBranding =
    overrides.canHideBranding !== undefined ? overrides.canHideBranding : defaults.canHideBranding;

  const effectiveHostingUntil = overrides.hostingUntil
    ? new Date(overrides.hostingUntil)
    : baseHostingUntil;

  return {
    ...defaults,
    weddingId,
    maxPhotos: effectiveMaxPhotos,
    maxEvents: effectiveMaxEvents,
    maxVideoBites: effectiveMaxVideoBites,
    videoBite: effectiveVideoBite,
    customDomain: effectiveCustomDomain,
    canHideBranding: effectiveCanHideBranding,
    faceSearch: effectiveFaceSearch,
    maxGuests: effectiveMaxGuests,
    maxOriginalsGb: effectiveMaxOriginalsGb,
    hostingUntil: effectiveHostingUntil,
    originalsExpireAt: wedding.originalsExpireAt || defaults.originalsExpireAt,
    hasActiveOverride: Boolean(activeOverride),
    activeOverrideDetail: activeOverride,
  };
}

/**
 * Applies a staff-authorized entitlement override.
 * Transactional and auditable:
 * 1. Checks that an authorized actorId and clear reason are provided
 * 2. Writes an immutable audit_log record
 * 3. Updates the physical entitlement table for synchronized queries
 */
export async function applyEntitlementOverride(params: {
  weddingId: string;
  actorId: string;
  reason: string;
  overrides: Partial<EntitlementOverrides>;
  expiresAt?: Date;
  tx?: PrismaTx;
}): Promise<EffectiveEntitlements> {
  const { weddingId, actorId, reason, overrides, expiresAt } = params;

  if (!actorId) {
    throw new Error("Staff actorId is required to apply entitlement overrides");
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error("A clear audit justification reason (min 5 characters) is required");
  }

  const runWithTx = async (tx: PrismaTx) => {
    // Current state for audit diff
    const current = await tx.entitlement.findUnique({
      where: { weddingId },
    });

    const oldValues: Partial<EntitlementOverrides> = {
      maxPhotos: current?.maxPhotos,
      maxGuests: current?.maxGuests,
      maxOriginalsGb: current?.maxOriginalsGb ? Number(current.maxOriginalsGb) : null,
      videoBite: current?.videoBite,
      customDomain: current?.customDomain,
      faceSearch: current?.faceSearch,
      hostingUntil: current?.hostingUntil ? current.hostingUntil.toISOString() : null,
    };

    // Update physical row for mapped columns
    const updateData: {
      maxPhotos?: number | null;
      maxGuests?: number | null;
      maxOriginalsGb?: number | null;
      videoBite?: boolean;
      customDomain?: boolean;
      faceSearch?: boolean;
      hostingUntil?: Date;
    } = {};

    if (overrides.maxPhotos !== undefined) updateData.maxPhotos = overrides.maxPhotos;
    if (overrides.maxGuests !== undefined) updateData.maxGuests = overrides.maxGuests;
    if (overrides.maxOriginalsGb !== undefined)
      updateData.maxOriginalsGb = overrides.maxOriginalsGb;
    if (overrides.videoBite !== undefined) updateData.videoBite = overrides.videoBite;
    if (overrides.customDomain !== undefined) updateData.customDomain = overrides.customDomain;
    if (overrides.faceSearch !== undefined) updateData.faceSearch = overrides.faceSearch;
    if (overrides.hostingUntil !== undefined && overrides.hostingUntil !== null) {
      updateData.hostingUntil = new Date(overrides.hostingUntil);
    }

    if (Object.keys(updateData).length > 0) {
      await tx.entitlement.upsert({
        where: { weddingId },
        update: updateData,
        create: {
          weddingId,
          hostingUntil: updateData.hostingUntil || new Date(),
          ...updateData,
        },
      });
    }

    const auditDetail: EntitlementOverrideAuditDetail = {
      actorId,
      reason: reason.trim(),
      oldValues,
      newValues: overrides,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };

    // Write audit trail
    await tx.auditLog.create({
      data: {
        weddingId,
        actorId,
        action: "entitlement.override",
        detail: auditDetail as unknown as Prisma.InputJsonValue,
      },
    });

    return getEffectiveEntitlements(weddingId, { tx });
  };

  if (params.tx) {
    return runWithTx(params.tx);
  } else {
    return prisma.$transaction((tx) => runWithTx(tx));
  }
}

/**
 * Revokes all active overrides and restores the wedding entitlements to its canonical plan defaults.
 */
export async function revokeEntitlementOverride(params: {
  weddingId: string;
  actorId: string;
  reason: string;
  tx?: PrismaTx;
}): Promise<EffectiveEntitlements> {
  const { weddingId, actorId, reason } = params;

  if (!actorId) {
    throw new Error("Staff actorId is required to revoke entitlement overrides");
  }

  const runWithTx = async (tx: PrismaTx) => {
    const wedding = await tx.wedding.findUnique({
      where: { id: weddingId },
    });
    if (!wedding) {
      throw new Error(`Wedding '${weddingId}' not found`);
    }

    const plan = wedding.plan;
    const defaults = getPlanDefaults(plan, wedding.createdAt);

    // Reset entitlement row to plan defaults
    await tx.entitlement.upsert({
      where: { weddingId },
      update: {
        maxPhotos: defaults.maxPhotos,
        videoBite: defaults.videoBite,
        customDomain: defaults.customDomain,
        faceSearch: defaults.faceSearch,
        maxGuests: defaults.maxGuests,
        maxOriginalsGb: defaults.maxOriginalsGb,
        hostingUntil: defaults.hostingUntil,
      },
      create: {
        weddingId,
        maxPhotos: defaults.maxPhotos,
        videoBite: defaults.videoBite,
        customDomain: defaults.customDomain,
        faceSearch: defaults.faceSearch,
        maxGuests: defaults.maxGuests,
        maxOriginalsGb: defaults.maxOriginalsGb,
        hostingUntil: defaults.hostingUntil,
      },
    });

    // Write revocation audit record
    await tx.auditLog.create({
      data: {
        weddingId,
        actorId,
        action: "entitlement.override_revoked",
        detail: {
          actorId,
          reason: reason.trim(),
          revokedAt: new Date().toISOString(),
        },
      },
    });

    return getEffectiveEntitlements(weddingId, { tx });
  };

  if (params.tx) {
    return runWithTx(params.tx);
  } else {
    return prisma.$transaction((tx) => runWithTx(tx));
  }
}
