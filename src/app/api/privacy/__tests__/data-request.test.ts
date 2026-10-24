import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../data-request/route";
import * as ratelimit from "@/lib/ratelimit";
import * as turnstile from "@/lib/turnstile";
import { prisma } from "@/lib/db";

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "203.0.113.50"),
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/lib/log", () => ({
  logRequest: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    wedding: {
      findUnique: vi.fn(),
    },
    erasureRequest: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("POST /api/privacy/data-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
      success: true,
      limit: 5,
      remaining: 4,
      resetMs: 3600000,
    });
    vi.mocked(turnstile.verifyTurnstileToken).mockResolvedValue({ success: true });
  });

  it("returns 429 when IP rate limit is exceeded", async () => {
    vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
      success: false,
      limit: 5,
      remaining: 0,
      resetMs: 1800000,
    });

    const req = new NextRequest("http://localhost:3000/api/privacy/data-request", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Too many requests");
  });

  it("returns 400 when phone number fails Indian mobile format", async () => {
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
      id: "wed-123",
      slug: "ananya-rohit",
    } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

    const req = new NextRequest("http://localhost:3000/api/privacy/data-request", {
      method: "POST",
      body: JSON.stringify({
        requestType: "erasure",
        requesterName: "Aarav Gupta",
        requesterPhone: "0000000000", // invalid phone number
        weddingSlug: "ananya-rohit",
        details: "Please delete my phone number and blessing from the site.",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Invalid phone number");
  });

  it("records DPDP erasure request and returns tracking ticketId", async () => {
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
      id: "wed-123",
      slug: "ananya-rohit",
    } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

    vi.mocked(prisma.erasureRequest.create).mockResolvedValue({
      id: "erasure-999",
      weddingId: "wed-123",
      targetPhone: "+919876543210",
      reason: "Please remove my photo from gallery",
      status: "pending",
      createdAt: new Date(),
    } as unknown as Awaited<ReturnType<typeof prisma.erasureRequest.create>>);

    const req = new NextRequest("http://localhost:3000/api/privacy/data-request", {
      method: "POST",
      body: JSON.stringify({
        requestType: "erasure",
        requesterName: "Aarav Gupta",
        requesterPhone: "9876543210",
        requesterEmail: "aarav@example.com",
        weddingSlug: "ananya-rohit",
        details: "Please remove my photo from gallery taken during sangeet",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; ticketId: string };
    expect(data.success).toBe(true);
    expect(data.ticketId).toMatch(/^DPDP-[A-F0-9]{6,8}$/);
    expect(prisma.erasureRequest.create).toHaveBeenCalled();
  });
});
