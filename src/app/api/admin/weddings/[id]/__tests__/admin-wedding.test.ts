import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "../route";
import * as auth from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  getAdminSession: vi.fn(),
  hashPassword: vi.fn((pwd: string) => Promise.resolve(`hashed_${pwd}`)),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/log", () => ({
  logRequest: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    wedding: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((promises: unknown[]) => Promise.all(promises)),
  },
}));

describe("Staff Wedding Detail API: /api/admin/weddings/[id]", () => {
  const weddingId = "wed-detail-999";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/weddings/[id]", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}`);
      const res = await GET(req, { params: { id: weddingId } });

      expect(res.status).toBe(401);
    });

    it("returns 404 when wedding does not exist", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}`);
      const res = await GET(req, { params: { id: weddingId } });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/admin/weddings/[id]", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}`, {
        method: "PATCH",
        body: JSON.stringify({ brideName: "Ananya" }),
      });
      const res = await PATCH(req, { params: { id: weddingId } });

      expect(res.status).toBe(401);
    });

    it("rejects invalid PIN formats (e.g. less than 4 digits or non-digits)", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });

      const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}`, {
        method: "PATCH",
        body: JSON.stringify({ privatePin: "12" }),
      });
      const res = await PATCH(req, { params: { id: weddingId } });

      expect(res.status).toBe(400);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBe("Validation error");
    });

    it("hashes PIN securely, updates record, and never leaks privatePinHash", async () => {
      vi.mocked(auth.getAdminSession).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        exp: Date.now() + 100000,
      });

      const existingWedding = {
        id: weddingId,
        slug: "ananya-rohit",
        themeId: "royal-crimson",
        status: "draft",
        aliases: [],
      };
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue(
        existingWedding as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>,
      );

      const updatedWedding = {
        ...existingWedding,
        privatePinHash: "hashed_5678",
      };
      vi.mocked(prisma.wedding.update).mockResolvedValue(
        updatedWedding as unknown as Awaited<ReturnType<typeof prisma.wedding.update>>,
      );
      vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "audit-1" } as unknown as Awaited<
        ReturnType<typeof prisma.auditLog.create>
      >);

      const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}`, {
        method: "PATCH",
        body: JSON.stringify({ privatePin: "5678" }),
      });
      const res = await PATCH(req, { params: { id: weddingId } });

      expect(res.status).toBe(200);
      const json = (await res.json()) as {
        success: boolean;
        wedding: { hasPrivatePin: boolean; privatePinHash?: string };
      };
      expect(json.success).toBe(true);
      expect(json.wedding.hasPrivatePin).toBe(true);
      expect(json.wedding.privatePinHash).toBeUndefined();
      expect(auth.hashPassword).toHaveBeenCalledWith("5678");
    });
  });
});
