// src/features/entitlements/types.ts
import type { Prisma } from "@prisma/client";

export type WeddingPlanId = "lite" | "premium" | "platinum";

/**
 * Resolved static plan defaults derived directly from PRICING_PLANS.
 */
export interface PlanEntitlements {
  plan: WeddingPlanId;
  name: string;
  maxPhotos: number;
  maxEvents: number;
  maxVideoBites: number;
  videoBite: boolean;
  customDomain: boolean;
  canHideBranding: boolean;
  hostingDurationYears: number;
  rawOriginalsRetentionDays: number;
  faceSearch: boolean;
  maxGuests: number | null;
  maxOriginalsGb: number | null;
  allowedPresets: string[];
  features: string[];
}

/**
 * Stored overrides structure.
 * Stored in PostgreSQL audit_log detail to keep schema strict, auditable, and reversible.
 */
export interface EntitlementOverrides {
  maxPhotos?: number | null;
  maxEvents?: number | null;
  maxVideoBites?: number | null;
  videoBite?: boolean;
  customDomain?: boolean;
  faceSearch?: boolean;
  maxGuests?: number | null;
  maxOriginalsGb?: number | null;
  hostingUntil?: string | null; // ISO string
  canHideBranding?: boolean;
}

/**
 * Metadata recorded with each override entry in audit_log.
 */
export interface EntitlementOverrideAuditDetail {
  actorId: string;
  reason: string;
  oldValues: Partial<EntitlementOverrides>;
  newValues: Partial<EntitlementOverrides>;
  createdAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  revokedBy?: string | null;
  revocationReason?: string | null;
}

/**
 * Effective runtime entitlements after checking active, non-expired overrides.
 */
export interface EffectiveEntitlements extends PlanEntitlements {
  weddingId: string;
  hostingUntil: Date;
  originalsExpireAt: Date;
  hasActiveOverride: boolean;
  activeOverrideDetail?: EntitlementOverrideAuditDetail | null;
}

export interface SerializedEffectiveEntitlements extends Omit<
  EffectiveEntitlements,
  "hostingUntil" | "originalsExpireAt"
> {
  hostingUntil: string;
  originalsExpireAt: string;
}

export type PrismaTx = Prisma.TransactionClient;
