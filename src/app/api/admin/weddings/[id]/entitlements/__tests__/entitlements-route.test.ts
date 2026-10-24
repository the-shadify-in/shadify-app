import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import * as auth from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as entitlementsFeature from "@/features/entitlements";
import type { EffectiveEntitlements } from "@/features/entitlements/types";

vi.mock("@/lib/auth", () => ({
  getAdminSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    wedding: {
      findUnique: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/features/entitlements", () => ({
  getPlanDefaults: vi.fn(),
  getEffectiveEntitlements: vi.fn(),
  applyEntitlementOverride: vi.fn(),
  revokeEntitlementOverride: vi.fn(),
}));

describe("Staff Wedding Entitlements Route: /api/admin/weddings/[id]/entitlements", () => {
  const weddingId = "wed-ent-101";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/weddings/[id]/entitlements", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/admin/weddings/${weddingId}/entitlements`,
      );
      const res = await GET(req, { params: { id: weddingId } });

      expect(res.status).toBe(401);
    });

    it("returns 404 when wedding celebration does not exist", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/admin/weddings/${weddingId}/entitlements`,
      );
      const res = await GET(req, { params: { id: weddingId } });

      expect(res.status).toBe(404);
    });

    it("returns canonical plan defaults, effective entitlements, and override audit history", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });

      const createdAt = new Date("2026-10-24T10:00:00Z");
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
        id: weddingId,
        plan: "lite",
        createdAt,
        originalsExpireAt: new Date("2027-01-22T10:00:00Z"),
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

      const mockPlanDefaults = {
        plan: "lite" as const,
        name: "Lite",
        maxPhotos: 100,
        maxEvents: 3,
        maxVideoBites: 0,
        videoBite: false,
        customDomain: false,
        canHideBranding: false,
        hostingDurationYears: 5,
        rawOriginalsRetentionDays: 90,
        faceSearch: false,
        maxGuests: null,
        maxOriginalsGb: null,
        allowedPresets: ["royal-crimson"],
        features: ["100 Photos"],
        hostingUntil: new Date("2031-10-24T10:00:00Z"),
        originalsExpireAt: new Date("2027-01-22T10:00:00Z"),
      };

      const mockEffective: EffectiveEntitlements = {
        ...mockPlanDefaults,
        weddingId,
        maxPhotos: 250, // overridden
        hasActiveOverride: true,
        activeOverrideDetail: {
          actorId: "staff-admin-01",
          reason: "VIP Couple courtesy upgrade for extra sangeet photos",
          oldValues: { maxPhotos: 100 },
          newValues: { maxPhotos: 250 },
          createdAt: "2026-10-24T12:00:00Z",
          expiresAt: null,
        },
      };

      vi.mocked(entitlementsFeature.getPlanDefaults).mockReturnValue(mockPlanDefaults);
      vi.mocked(entitlementsFeature.getEffectiveEntitlements).mockResolvedValue(mockEffective);
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
        {
          id: "audit-1",
          action: "entitlement.override",
          actorId: "staff-admin-01",
          weddingId,
          createdAt: new Date("2026-10-24T12:00:00Z"),
          detail: mockEffective.activeOverrideDetail,
          actor: { fullName: "Super Admin", role: "super_admin" },
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.auditLog.findMany>>);

      const req = new NextRequest(
        `http://localhost:3000/api/admin/weddings/${weddingId}/entitlements`,
      );
      const res = await GET(req, { params: { id: weddingId } });

      expect(res.status).toBe(200);
      const json = (await res.json()) as {
        success: boolean;
        plan: string;
        planDefaults: typeof mockPlanDefaults;
        effective: EffectiveEntitlements;
        history: unknown[];
      };

      expect(json.success).toBe(true);
      expect(json.plan).toBe("lite");
      expect(json.effective.maxPhotos).toBe(250);
      expect(json.effective.hasActiveOverride).toBe(true);
      expect(json.history.length).toBe(1);
    });
  });

  describe("POST /api/admin/weddings/[id]/entitlements", () => {
    it("returns 400 when reason is less than 5 characters", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });

      const req = new NextRequest(
        `http://localhost:3000/api/admin/weddings/${weddingId}/entitlements`,
        {
          method: "POST",
          body: JSON.stringify({
            action: "override",
            reason: "no",
            overrides: { maxPhotos: 300 },
          }),
        },
      );

      const res = await POST(req, { params: { id: weddingId } });
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe("Validation failed");
    });

    it("returns 400 when override expiry date is in the past", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
        id: weddingId,
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

      const pastDate = new Date(Date.now() - 100000).toISOString();
      const req = new NextRequest(
        `http://localhost:3000/api/admin/weddings/${weddingId}/entitlements`,
        {
          method: "POST",
          body: JSON.stringify({
            action: "override",
            reason: "Promotional temporary override",
            expiresAt: pastDate,
            overrides: { maxPhotos: 500 },
          }),
        },
      );

      const res = await POST(req, { params: { id: weddingId } });
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("future");
    });

    it("applies entitlement override and audits actor and reason", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-senior-02",
        role: "admin",
        exp: Date.now() + 100000,
      });
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
        id: weddingId,
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

      const futureDate = new Date(Date.now() + 30 * 86400000).toISOString();
      const mockResult: EffectiveEntitlements = {
        weddingId,
        plan: "lite",
        name: "Lite",
        maxPhotos: 500,
        maxEvents: 5,
        maxVideoBites: 0,
        videoBite: false,
        customDomain: false,
        canHideBranding: true,
        hostingDurationYears: 5,
        rawOriginalsRetentionDays: 90,
        faceSearch: false,
        maxGuests: null,
        maxOriginalsGb: null,
        allowedPresets: ["royal-crimson"],
        features: [],
        hostingUntil: new Date(),
        originalsExpireAt: new Date(),
        hasActiveOverride: true,
      };

      vi.mocked(entitlementsFeature.applyEntitlementOverride).mockResolvedValue(mockResult);

      const req = new NextRequest(
        `http://localhost:3000/api/admin/weddings/${weddingId}/entitlements`,
        {
          method: "POST",
          body: JSON.stringify({
            action: "override",
            reason: "Promotional partnership tier expansion for celebrity wedding",
            expiresAt: futureDate,
            overrides: { maxPhotos: 500, canHideBranding: true },
          }),
        },
      );

      const res = await POST(req, { params: { id: weddingId } });
      expect(res.status).toBe(200);

      expect(entitlementsFeature.applyEntitlementOverride).toHaveBeenCalledWith(
        expect.objectContaining({
          weddingId,
          actorId: "staff-senior-02",
          reason: "Promotional partnership tier expansion for celebrity wedding",
          overrides: { maxPhotos: 500, canHideBranding: true },
        }),
      );
    });

    it("revokes active override and restores plan defaults when action is revoke", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-senior-02",
        role: "admin",
        exp: Date.now() + 100000,
      });
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
        id: weddingId,
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

      const mockRestored: EffectiveEntitlements = {
        weddingId,
        plan: "lite",
        name: "Lite",
        maxPhotos: 100,
        maxEvents: 3,
        maxVideoBites: 0,
        videoBite: false,
        customDomain: false,
        canHideBranding: false,
        hostingDurationYears: 5,
        rawOriginalsRetentionDays: 90,
        faceSearch: false,
        maxGuests: null,
        maxOriginalsGb: null,
        allowedPresets: ["royal-crimson"],
        features: [],
        hostingUntil: new Date(),
        originalsExpireAt: new Date(),
        hasActiveOverride: false,
      };

      vi.mocked(entitlementsFeature.revokeEntitlementOverride).mockResolvedValue(mockRestored);

      const req = new NextRequest(
        `http://localhost:3000/api/admin/weddings/${weddingId}/entitlements`,
        {
          method: "POST",
          body: JSON.stringify({
            action: "revoke",
            reason: "Client trial concluded without contract extension",
          }),
        },
      );

      const res = await POST(req, { params: { id: weddingId } });
      expect(res.status).toBe(200);

      expect(entitlementsFeature.revokeEntitlementOverride).toHaveBeenCalledWith({
        weddingId,
        actorId: "staff-senior-02",
        reason: "Client trial concluded without contract extension",
      });
    });
  });
});
