import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import * as auth from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Wedding, AuditLog } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  getAdminSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/log", () => ({
  logRequest: vi.fn(),
}));

const { mockTx } = vi.hoisted(() => {
  const mockTx = {
    $executeRaw: vi.fn(),
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    wedding: {
      create: vi.fn(),
    },
    weddingMember: {
      create: vi.fn(),
    },
    weddingAlias: {
      create: vi.fn(),
    },
    entitlement: {
      create: vi.fn(),
    },
    event: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  };
  return { mockTx };
});

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      wedding: {
        findUnique: vi.fn(),
      },
      weddingAlias: {
        findUnique: vi.fn(),
      },
      auditLog: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => {
        return cb(mockTx);
      }),
      _mockTx: mockTx,
    },
  };
});

describe("Transactional Provisioning API: /api/admin/weddings/provision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/weddings/provision (Slug Availability Check)", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/weddings/provision?slug=priya-rahul",
      );
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it("returns 403 when session is not staff or super_admin", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "user-couple",
        role: "couple",
        exp: Date.now() + 100000,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/admin/weddings/provision?slug=priya-rahul",
      );
      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it("returns 400 when slug query param is missing", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });

      const req = new NextRequest("http://localhost:3000/api/admin/weddings/provision");
      const res = await GET(req);

      expect(res.status).toBe(400);
    });

    it("identifies reserved slugs and provides alternatives", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });

      const req = new NextRequest("http://localhost:3000/api/admin/weddings/provision?slug=admin");
      const res = await GET(req);
      const data = (await res.json()) as {
        available: boolean;
        reason: string;
        suggestions: string[];
      };

      expect(res.status).toBe(200);
      expect(data.available).toBe(false);
      expect(data.suggestions.length).toBeGreaterThan(0);
    });

    it("detects existing wedding slug collision and provides suggestions", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
        id: "existing-1",
      } as unknown as Wedding);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/weddings/provision?slug=priya-rahul",
      );
      const res = await GET(req);
      const data = (await res.json()) as {
        available: boolean;
        reason: string;
        suggestions: string[];
      };

      expect(res.status).toBe(200);
      expect(data.available).toBe(false);
      expect(data.suggestions).toContain("priya-rahul-vivah");
    });

    it("confirms available slug", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.weddingAlias.findUnique).mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/admin/weddings/provision?slug=meera-rohit",
      );
      const res = await GET(req);
      const data = (await res.json()) as { available: boolean; slug: string };

      expect(res.status).toBe(200);
      expect(data.available).toBe(true);
      expect(data.slug).toBe("meera-rohit");
    });
  });

  describe("POST /api/admin/weddings/provision (Transactional Client Provisioning)", () => {
    const validPayload = {
      brideName: "Priya",
      groomName: "Rahul",
      weddingDate: "2027-02-14",
      venueCity: "Udaipur, Rajasthan",
      slug: "priya-rahul-test",
      plan: "premium",
      themeId: "royal-crimson",
      couplePhone: "+919876543210",
      coupleEmail: "priya.rahul@example.com",
    };

    it("returns 401 when staff session is missing", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/admin/weddings/provision", {
        method: "POST",
        body: JSON.stringify(validPayload),
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("returns 403 when session has insufficient role", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "couple-user",
        role: "couple",
        exp: Date.now() + 100000,
      });

      const req = new NextRequest("http://localhost:3000/api/admin/weddings/provision", {
        method: "POST",
        body: JSON.stringify(validPayload),
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
    });

    it("returns 400 with validation issues for malformed input", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });

      const req = new NextRequest("http://localhost:3000/api/admin/weddings/provision", {
        method: "POST",
        body: JSON.stringify({
          brideName: "",
          groomName: "Rahul",
          weddingDate: "invalid-date",
          venueCity: "U",
          slug: "INVALID SLUG!",
        }),
      });
      const res = await POST(req);
      const data = (await res.json()) as {
        error: string;
        issues: Array<{ field: string; message: string }>;
      };

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid provisioning payload");
      expect(data.issues.length).toBeGreaterThan(0);
    });

    it("replays existing wedding when idempotency key is repeated", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });

      vi.mocked(prisma.auditLog.findFirst).mockResolvedValue({
        id: BigInt(101),
        wedding: {
          id: "wed-replayed-101",
          slug: "priya-rahul-test",
          status: "draft",
          plan: "premium",
          brideName: "Priya",
          groomName: "Rahul",
        },
      } as unknown as AuditLog);

      const req = new NextRequest("http://localhost:3000/api/admin/weddings/provision", {
        method: "POST",
        headers: {
          "Idempotency-Key": "idemp-key-unique-12345",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validPayload),
      });

      const res = await POST(req);
      const data = (await res.json()) as {
        success: boolean;
        weddingId: string;
        idempotentReplay: boolean;
      };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.weddingId).toBe("wed-replayed-101");
      expect(data.idempotentReplay).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("atomically provisions wedding, entitlements, and draft itinerary", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-lead-01",
        role: "super_admin",
        exp: Date.now() + 100000,
      });

      vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null);

      mockTx.user.findFirst.mockResolvedValue(null);
      mockTx.user.create.mockResolvedValue({ id: "user-couple-new", fullName: "Priya & Rahul" });
      mockTx.wedding.create.mockResolvedValue({
        id: "wed-created-202",
        slug: "priya-rahul-test",
        status: "draft",
        plan: "premium",
        brideName: "Priya",
        groomName: "Rahul",
      });
      mockTx.weddingMember.create.mockResolvedValue({ id: "mem-1" });
      mockTx.entitlement.create.mockResolvedValue({ weddingId: "wed-created-202" });
      mockTx.event.create.mockResolvedValue({ id: "ev-draft-1" });
      mockTx.auditLog.create.mockResolvedValue({ id: BigInt(1) });

      const req = new NextRequest("http://localhost:3000/api/admin/weddings/provision", {
        method: "POST",
        headers: {
          "Idempotency-Key": "idemp-key-fresh-99999",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validPayload),
      });

      const res = await POST(req);
      const data = (await res.json()) as {
        success: boolean;
        weddingId: string;
        status: string;
        slug: string;
      };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.weddingId).toBe("wed-created-202");
      expect(data.status).toBe("draft");
      expect(data.slug).toBe("priya-rahul-test");

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.wedding.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: "priya-rahul-test",
            status: "draft",
            plan: "premium",
          }),
        }),
      );
      expect(mockTx.entitlement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            weddingId: "wed-created-202",
            maxPhotos: 300,
          }),
        }),
      );
      expect(mockTx.event.create).toHaveBeenCalledTimes(3);
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: "staff-lead-01",
            action: "wedding.provision",
          }),
        }),
      );
    });

    it("returns 409 Conflict with suggestions when slug already exists", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });
      vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null);

      const p2002Error = new Error("Unique constraint failed");
      Object.assign(p2002Error, { code: "P2002", meta: { target: ["slug"] } });

      vi.mocked(prisma.$transaction).mockRejectedValue(p2002Error);

      const req = new NextRequest("http://localhost:3000/api/admin/weddings/provision", {
        method: "POST",
        body: JSON.stringify(validPayload),
      });

      const res = await POST(req);
      const data = (await res.json()) as { error: string; slugSuggestions: string[] };

      expect(res.status).toBe(409);
      expect(data.error).toContain("A wedding with this URL slug already exists");
      expect(data.slugSuggestions.length).toBeGreaterThan(0);
    });
  });
});
