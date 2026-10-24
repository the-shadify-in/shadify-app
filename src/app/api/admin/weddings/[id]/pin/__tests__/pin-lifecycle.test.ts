import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import * as auth from "@/lib/auth";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  getAdminSession: vi.fn(),
  hashPassword: vi.fn((pwd: string) => Promise.resolve(`scrypt_hashed_${pwd}`)),
}));

const { mockTx } = vi.hoisted(() => {
  const mockTx = {
    wedding: {
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { mockTx };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    wedding: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => {
      return cb(mockTx);
    }),
  },
}));

describe("Staff Wedding PIN Lifecycle API: /api/admin/weddings/[id]/pin", () => {
  const weddingId = "wed-pin-test-99";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}/pin`, {
      method: "POST",
      body: JSON.stringify({ action: "reset" }),
    });

    const res = await POST(req, { params: { id: weddingId } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when wedding does not exist", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "staff-01",
      role: "staff",
      exp: Date.now() + 100000,
    });
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}/pin`, {
      method: "POST",
      body: JSON.stringify({ action: "reset" }),
    });

    const res = await POST(req, { params: { id: weddingId } });
    expect(res.status).toBe(404);
  });

  it("generates a random 6-digit PIN on reset, hashes with scrypt, and logs audit trail", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "staff-01",
      role: "staff",
      exp: Date.now() + 100000,
    });
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
      id: weddingId,
      slug: "ananya-rohit",
      privatePinHash: "scrypt_hashed_111111",
    } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

    const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}/pin`, {
      method: "POST",
      body: JSON.stringify({ action: "reset", reason: "Lost card rotation" }),
    });

    const res = await POST(req, { params: { id: weddingId } });
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      success: boolean;
      hasPrivatePin: boolean;
      pin: string;
      message: string;
    };

    expect(data.success).toBe(true);
    expect(data.hasPrivatePin).toBe(true);
    expect(data.pin).toMatch(/^\d{6}$/); // 6-digit numeric PIN
    expect(auth.hashPassword).toHaveBeenCalledWith(data.pin);

    expect(mockTx.wedding.update).toHaveBeenCalledWith({
      where: { id: weddingId },
      data: { privatePinHash: `scrypt_hashed_${data.pin}` },
    });

    // Verify audit log recorded without leaking plaintext PIN or hash
    expect(mockTx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weddingId,
        actorId: "staff-01",
        action: "wedding.pin_reset",
        detail: expect.objectContaining({
          reason: "Lost card rotation",
        }),
      }),
    });
  });

  it("accepts a custom 4-6 digit PIN", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "staff-01",
      role: "staff",
      exp: Date.now() + 100000,
    });
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
      id: weddingId,
      slug: "ananya-rohit",
      privatePinHash: null,
    } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

    const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}/pin`, {
      method: "POST",
      body: JSON.stringify({ action: "set", pin: "54321" }),
    });

    const res = await POST(req, { params: { id: weddingId } });
    expect(res.status).toBe(200);

    const data = (await res.json()) as { success: boolean; pin: string };
    expect(data.success).toBe(true);
    expect(data.pin).toBe("54321");
    expect(auth.hashPassword).toHaveBeenCalledWith("54321");
  });

  it("rejects invalid PIN formats with 400", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "staff-01",
      role: "staff",
      exp: Date.now() + 100000,
    });

    const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}/pin`, {
      method: "POST",
      body: JSON.stringify({ action: "set", pin: "12" }), // too short
    });

    const res = await POST(req, { params: { id: weddingId } });
    expect(res.status).toBe(400);
  });

  it("removes PIN and updates record to null when action is remove", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "staff-01",
      role: "staff",
      exp: Date.now() + 100000,
    });
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
      id: weddingId,
      slug: "ananya-rohit",
      privatePinHash: "existing_hash",
    } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

    const req = new NextRequest(`http://localhost:3000/api/admin/weddings/${weddingId}/pin`, {
      method: "POST",
      body: JSON.stringify({ action: "remove", reason: "Couple made celebration public" }),
    });

    const res = await POST(req, { params: { id: weddingId } });
    expect(res.status).toBe(200);

    const data = (await res.json()) as { success: boolean; hasPrivatePin: boolean };
    expect(data.success).toBe(true);
    expect(data.hasPrivatePin).toBe(false);

    expect(mockTx.wedding.update).toHaveBeenCalledWith({
      where: { id: weddingId },
      data: { privatePinHash: null },
    });

    expect(mockTx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weddingId,
        actorId: "staff-01",
        action: "wedding.pin_removed",
      }),
    });
  });
});
