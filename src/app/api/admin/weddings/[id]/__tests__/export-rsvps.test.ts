import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../export-rsvps/route";
import * as auth from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  getAdminSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    wedding: {
      findUnique: vi.fn(),
    },
    weddingMember: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("GET /api/admin/weddings/[id]/export-rsvps", () => {
  const weddingId = "wed-security-test-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no staff session is present", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue(null);

    const req = new NextRequest(
      `http://localhost:3000/api/admin/weddings/${weddingId}/export-rsvps`,
    );
    const res = await GET(req, { params: { id: weddingId } });

    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain("Unauthorized");
  });

  it("returns 404 when wedding is not found", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "staff-1",
      role: "staff",
      exp: Date.now() + 100000,
    });
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue(null);

    const req = new NextRequest(
      `http://localhost:3000/api/admin/weddings/${weddingId}/export-rsvps`,
    );
    const res = await GET(req, { params: { id: weddingId } });

    expect(res.status).toBe(404);
  });

  it("sanitizes CSV formula injection attempts in respondent names and notes", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "staff-1",
      role: "staff",
      exp: Date.now() + 100000,
    });

    const mockWedding = {
      id: weddingId,
      slug: "ananya-rohit",
      plan: "premium",
      rsvps: [
        {
          id: "rsvp-1",
          respondentName: "=cmd|' /C calc'!A0",
          respondentPhone: "+919876543210",
          attending: true,
          partySize: 2,
          mealPreference: "@SUM(1,2)",
          needsStay: false,
          arrivalNotes: "-1+1=0",
          blessingMessage: "+MaliciousFormula()",
          createdAt: new Date("2026-10-24T10:00:00Z"),
          event: { title: "Sangeet Night" },
        },
      ],
    };

    vi.mocked(prisma.wedding.findUnique).mockResolvedValue(
      mockWedding as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>,
    );

    const req = new NextRequest(
      `http://localhost:3000/api/admin/weddings/${weddingId}/export-rsvps`,
    );
    const res = await GET(req, { params: { id: weddingId } });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("caterer-rsvps-ananya-rohit");

    const text = await res.text();

    // Check that dangerous formula trigger characters are prefixed with single quote
    expect(text).toContain("\"'=cmd|' /C calc'!A0\"");
    expect(text).toContain('"\'@SUM(1,2)"');
    expect(text).toContain('"\'-1+1=0"');
    expect(text).toContain('"\'+MaliciousFormula()"');

    // Phone numbers starting with + are also prefixed to prevent Excel number coercion / formulas
    expect(text).toContain('"\'+919876543210"');

    // Verify audit log record created without leaking PII
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weddingId,
        actorId: "staff-1",
        action: "wedding.export_rsvps",
        detail: expect.objectContaining({
          format: "csv",
          rowCount: 1,
        }),
      }),
    });
  });

  it("rejects catering CSV export on Lite plan without active entitlement override", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "staff-1",
      role: "staff",
      exp: Date.now() + 100000,
    });

    const liteWedding = {
      id: weddingId,
      slug: "ananya-rohit-lite",
      plan: "lite",
      rsvps: [],
    };

    vi.mocked(prisma.wedding.findUnique).mockResolvedValue(
      liteWedding as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>,
    );

    const req = new NextRequest(
      `http://localhost:3000/api/admin/weddings/${weddingId}/export-rsvps`,
    );
    const res = await GET(req, { params: { id: weddingId } });

    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain("RSVP catering export requires the Premium or Platinum plan");
  });

  it("strictly rejects couple user attempting to export RSVPs of another wedding (cross-tenant denial)", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "couple-user-A",
      role: "couple",
      exp: Date.now() + 100000,
    });

    // Mock membership lookup returning null: couple-user-A is NOT a member of wedding B
    vi.mocked(prisma.weddingMember.findUnique).mockResolvedValue(null);

    const req = new NextRequest(
      `http://localhost:3000/api/admin/weddings/${weddingId}/export-rsvps`,
    );
    const res = await GET(req, { params: { id: weddingId } });

    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain(
      "Forbidden. You do not have permission to export RSVPs for this wedding.",
    );

    // Verify wedding data is never fetched and no CSV is produced
    expect(prisma.wedding.findUnique).not.toHaveBeenCalled();
  });

  it("allows couple user to export RSVPs for their own wedding celebration (positive control)", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "couple-user-A",
      role: "couple",
      exp: Date.now() + 100000,
    });

    // User A is a verified member of their own wedding
    vi.mocked(prisma.weddingMember.findUnique).mockResolvedValue({
      weddingId,
      userId: "couple-user-A",
      memberRole: "owner",
      createdAt: new Date(),
    });

    const mockWedding = {
      id: weddingId,
      slug: "ananya-rohit",
      plan: "premium",
      rsvps: [
        {
          id: "rsvp-10",
          respondentName: "Devendra Sharma",
          respondentPhone: "+919876543210",
          attending: true,
          partySize: 2,
          mealPreference: "pure_veg",
          needsStay: false,
          arrivalNotes: "Arriving by train",
          blessingMessage: "Hearty congratulations!",
          createdAt: new Date("2026-10-24T10:00:00Z"),
          event: { title: "Main Wedding Ceremony" },
        },
      ],
    };

    vi.mocked(prisma.wedding.findUnique).mockResolvedValue(
      mockWedding as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>,
    );

    const req = new NextRequest(
      `http://localhost:3000/api/admin/weddings/${weddingId}/export-rsvps`,
    );
    const res = await GET(req, { params: { id: weddingId } });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("Devendra Sharma");
    expect(text).toContain("Main Wedding Ceremony");
  });

  it("rejects unauthorized roles (e.g. photographer) attempting to export catering RSVPs", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "photographer-1",
      role: "photographer",
      exp: Date.now() + 100000,
    });

    const req = new NextRequest(
      `http://localhost:3000/api/admin/weddings/${weddingId}/export-rsvps`,
    );
    const res = await GET(req, { params: { id: weddingId } });

    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain("Forbidden. Insufficient permissions.");
  });
});
