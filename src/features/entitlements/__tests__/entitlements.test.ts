import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPlanDefaults,
  getEffectiveEntitlements,
  applyEntitlementOverride,
  revokeEntitlementOverride,
} from "../service";
import type { EntitlementOverrideAuditDetail } from "../types";

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      wedding: {
        findUnique: vi.fn(),
      },
      entitlement: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      auditLog: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(mockPrisma)),
    },
  };
});

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

describe("Central Entitlement Engine - Plan Defaults", () => {
  const refDate = new Date("2026-10-24T12:00:00Z");

  it("resolves Lite plan defaults correctly", () => {
    const defaults = getPlanDefaults("lite", refDate);

    expect(defaults.plan).toBe("lite");
    expect(defaults.name).toBe("Lite");
    expect(defaults.maxPhotos).toBe(100);
    expect(defaults.maxEvents).toBe(3);
    expect(defaults.maxVideoBites).toBe(0);
    expect(defaults.videoBite).toBe(false);
    expect(defaults.customDomain).toBe(false);
    expect(defaults.canHideBranding).toBe(false);
    expect(defaults.faceSearch).toBe(false);
    expect(defaults.maxGuests).toBeNull();
    expect(defaults.maxOriginalsGb).toBeNull();
  });

  it("resolves Premium plan defaults correctly", () => {
    const defaults = getPlanDefaults("premium", refDate);

    expect(defaults.plan).toBe("premium");
    expect(defaults.name).toBe("Premium");
    expect(defaults.maxPhotos).toBe(300);
    expect(defaults.maxEvents).toBe(8);
    expect(defaults.maxVideoBites).toBe(1);
    expect(defaults.videoBite).toBe(true);
    expect(defaults.customDomain).toBe(false);
    expect(defaults.canHideBranding).toBe(true);
  });

  it("resolves Platinum plan defaults correctly", () => {
    const defaults = getPlanDefaults("platinum", refDate);

    expect(defaults.plan).toBe("platinum");
    expect(defaults.name).toBe("Platinum");
    expect(defaults.maxPhotos).toBe(1000);
    expect(defaults.maxEvents).toBe(15);
    expect(defaults.maxVideoBites).toBe(5);
    expect(defaults.videoBite).toBe(true);
    expect(defaults.customDomain).toBe(true);
    expect(defaults.canHideBranding).toBe(true);
  });

  it("strictly separates 5-year hosting from 90-day master RAW retention", () => {
    const defaults = getPlanDefaults("premium", refDate);

    const expectedHostingYear = refDate.getFullYear() + 5;
    expect(defaults.hostingUntil.getFullYear()).toBe(expectedHostingYear);

    const diffDays = Math.round(
      (defaults.originalsExpireAt.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBe(90);
  });
});

describe("Central Entitlement Engine - Effective Resolution & Overrides", () => {
  const weddingId = "wed-ent-101";
  const refDate = new Date("2026-10-24T12:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns base plan defaults when no overrides exist", async () => {
    mockPrisma.wedding.findUnique.mockResolvedValue({
      id: weddingId,
      plan: "lite",
      createdAt: refDate,
      originalsExpireAt: new Date("2027-01-22T12:00:00Z"),
      entitlement: {
        maxPhotos: 100,
        videoBite: false,
        customDomain: false,
        faceSearch: false,
        maxGuests: null,
        maxOriginalsGb: null,
        hostingUntil: new Date("2031-10-24T12:00:00Z"),
      },
    });

    mockPrisma.auditLog.findFirst.mockResolvedValue(null);

    const effective = await getEffectiveEntitlements(weddingId, { now: refDate });

    expect(effective.weddingId).toBe(weddingId);
    expect(effective.maxPhotos).toBe(100);
    expect(effective.videoBite).toBe(false);
    expect(effective.customDomain).toBe(false);
    expect(effective.hasActiveOverride).toBe(false);
  });

  it("applies active, unexpired overrides over plan defaults", async () => {
    mockPrisma.wedding.findUnique.mockResolvedValue({
      id: weddingId,
      plan: "lite",
      createdAt: refDate,
      originalsExpireAt: new Date("2027-01-22T12:00:00Z"),
      entitlement: {
        maxPhotos: 100,
        videoBite: false,
        customDomain: false,
        faceSearch: false,
        maxGuests: null,
        maxOriginalsGb: null,
        hostingUntil: new Date("2031-10-24T12:00:00Z"),
      },
    });

    const activeOverrideDetail: EntitlementOverrideAuditDetail = {
      actorId: "staff-usr-1",
      reason: "VIP couple courtesy grant for destination wedding",
      oldValues: { maxPhotos: 100, videoBite: false },
      newValues: { maxPhotos: 500, videoBite: true, maxGuests: 350 },
      createdAt: "2026-10-24T12:00:00Z",
      expiresAt: "2026-12-31T23:59:59Z", // Future expiry
    };

    mockPrisma.auditLog.findFirst.mockResolvedValue({
      action: "entitlement.override",
      detail: activeOverrideDetail,
    });

    const effective = await getEffectiveEntitlements(weddingId, { now: refDate });

    expect(effective.hasActiveOverride).toBe(true);
    expect(effective.maxPhotos).toBe(500); // Overridden from 100 to 500
    expect(effective.videoBite).toBe(true); // Overridden from false to true
    expect(effective.maxGuests).toBe(350); // Overridden
    expect(effective.customDomain).toBe(false); // Retained default
  });

  it("disregards expired overrides and reverts cleanly to plan defaults", async () => {
    mockPrisma.wedding.findUnique.mockResolvedValue({
      id: weddingId,
      plan: "lite",
      createdAt: refDate,
      originalsExpireAt: new Date("2027-01-22T12:00:00Z"),
      entitlement: {
        maxPhotos: 100,
        videoBite: false,
        customDomain: false,
        faceSearch: false,
        maxGuests: null,
        maxOriginalsGb: null,
        hostingUntil: new Date("2031-10-24T12:00:00Z"),
      },
    });

    const expiredOverrideDetail: EntitlementOverrideAuditDetail = {
      actorId: "staff-usr-1",
      reason: "Temporary trial pass",
      oldValues: { maxPhotos: 100 },
      newValues: { maxPhotos: 500 },
      createdAt: "2026-09-01T12:00:00Z",
      expiresAt: "2026-10-01T12:00:00Z", // Expired relative to refDate
    };

    mockPrisma.auditLog.findFirst.mockResolvedValue({
      action: "entitlement.override",
      detail: expiredOverrideDetail,
    });

    const effective = await getEffectiveEntitlements(weddingId, { now: refDate });

    expect(effective.hasActiveOverride).toBe(false);
    expect(effective.maxPhotos).toBe(100); // Reverted back to 100
  });

  it("disregards revoked overrides and reverts cleanly to plan defaults", async () => {
    mockPrisma.wedding.findUnique.mockResolvedValue({
      id: weddingId,
      plan: "lite",
      createdAt: refDate,
      originalsExpireAt: new Date("2027-01-22T12:00:00Z"),
      entitlement: {
        maxPhotos: 100,
        videoBite: false,
        customDomain: false,
        faceSearch: false,
        maxGuests: null,
        maxOriginalsGb: null,
        hostingUntil: new Date("2031-10-24T12:00:00Z"),
      },
    });

    const revokedOverrideDetail: EntitlementOverrideAuditDetail = {
      actorId: "staff-usr-1",
      reason: "Promotional override revoked due to cancellation",
      oldValues: { maxPhotos: 100 },
      newValues: { maxPhotos: 500 },
      createdAt: "2026-10-20T12:00:00Z",
      expiresAt: "2026-12-31T12:00:00Z",
      revokedAt: "2026-10-22T12:00:00Z", // Revoked before now
      revokedBy: "admin-super-1",
    };

    mockPrisma.auditLog.findFirst.mockResolvedValue({
      action: "entitlement.override",
      detail: revokedOverrideDetail,
    });

    const effective = await getEffectiveEntitlements(weddingId, { now: refDate });

    expect(effective.hasActiveOverride).toBe(false);
    expect(effective.maxPhotos).toBe(100);
  });

  it("disregards overrides when latest audit log is an entitlement.override_revoked event", async () => {
    mockPrisma.wedding.findUnique.mockResolvedValue({
      id: weddingId,
      plan: "lite",
      createdAt: refDate,
      originalsExpireAt: new Date("2027-01-22T12:00:00Z"),
      entitlement: {
        maxPhotos: 100,
        videoBite: false,
        customDomain: false,
        faceSearch: false,
        maxGuests: null,
        maxOriginalsGb: null,
        hostingUntil: new Date("2031-10-24T12:00:00Z"),
      },
    });

    mockPrisma.auditLog.findFirst.mockResolvedValue({
      action: "entitlement.override_revoked",
      detail: {
        actorId: "staff-usr-1",
        reason: "Override revoked by admin",
        revokedAt: "2026-10-22T12:00:00Z",
      },
    });

    const effective = await getEffectiveEntitlements(weddingId, { now: refDate });

    expect(effective.hasActiveOverride).toBe(false);
    expect(effective.maxPhotos).toBe(100);
  });
});

describe("Central Entitlement Engine - Apply & Revoke Mutations", () => {
  const weddingId = "wed-ent-202";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects override application when staff actorId is missing", async () => {
    await expect(
      applyEntitlementOverride({
        weddingId,
        actorId: "",
        reason: "Valid reason here",
        overrides: { maxPhotos: 250 },
      }),
    ).rejects.toThrow("Staff actorId is required");
  });

  it("rejects override application when reason is too brief", async () => {
    await expect(
      applyEntitlementOverride({
        weddingId,
        actorId: "staff-1",
        reason: "n/a",
        overrides: { maxPhotos: 250 },
      }),
    ).rejects.toThrow("clear audit justification reason");
  });

  it("records immutable audit log and updates entitlement record upon application", async () => {
    mockPrisma.entitlement.findUnique.mockResolvedValue({
      maxPhotos: 100,
      videoBite: false,
    });

    mockPrisma.entitlement.upsert.mockResolvedValue({});
    mockPrisma.auditLog.create.mockResolvedValue({});

    mockPrisma.wedding.findUnique.mockResolvedValue({
      id: weddingId,
      plan: "lite",
      createdAt: new Date(),
      entitlement: { maxPhotos: 400, videoBite: true },
    });
    mockPrisma.auditLog.findFirst.mockResolvedValue({
      action: "entitlement.override",
      detail: {
        actorId: "staff-1",
        reason: "Commercial promotion approved by lead concierge",
        newValues: { maxPhotos: 400, videoBite: true },
        createdAt: new Date().toISOString(),
      },
    });

    const result = await applyEntitlementOverride({
      weddingId,
      actorId: "staff-1",
      reason: "Commercial promotion approved by lead concierge",
      overrides: { maxPhotos: 400, videoBite: true },
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          weddingId,
          actorId: "staff-1",
          action: "entitlement.override",
        }),
      }),
    );

    expect(mockPrisma.entitlement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { weddingId },
        update: expect.objectContaining({ maxPhotos: 400, videoBite: true }),
      }),
    );

    expect(result.maxPhotos).toBe(400);
    expect(result.videoBite).toBe(true);
  });

  it("revokes overrides, records revocation in audit log, and restores plan defaults", async () => {
    mockPrisma.wedding.findUnique.mockResolvedValue({
      id: weddingId,
      plan: "lite",
      createdAt: new Date(),
      entitlement: { maxPhotos: 100, videoBite: false },
    });

    mockPrisma.entitlement.upsert.mockResolvedValue({});
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockPrisma.auditLog.findFirst.mockResolvedValue(null);

    const result = await revokeEntitlementOverride({
      weddingId,
      actorId: "staff-1",
      reason: "Client downgraded subscription tier to baseline",
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          weddingId,
          actorId: "staff-1",
          action: "entitlement.override_revoked",
        }),
      }),
    );

    expect(mockPrisma.entitlement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { weddingId },
        update: expect.objectContaining({
          maxPhotos: 100,
          videoBite: false,
          customDomain: false,
        }),
      }),
    );

    expect(result.maxPhotos).toBe(100);
    expect(result.videoBite).toBe(false);
  });
});
