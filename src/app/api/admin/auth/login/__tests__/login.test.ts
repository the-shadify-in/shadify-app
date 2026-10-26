import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import * as ratelimit from "@/lib/ratelimit";
import { prisma } from "@/lib/db";
import * as auth from "@/lib/auth";

vi.mock("@/lib/ratelimit", async () => {
  const actual = await vi.importActual<typeof ratelimit>("@/lib/ratelimit");
  return {
    ...actual,
    checkRateLimitDistributed: vi.fn(),
    getClientIp: vi.fn().mockReturnValue("203.0.113.195"),
    hashIpForStorage: vi.fn().mockReturnValue("mock_ip_hash_1234"),
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof auth>("@/lib/auth");
  return {
    ...actual,
    verifyPassword: vi.fn(),
    signSessionToken: vi.fn().mockReturnValue("mock_session_token_1234567890"),
  };
});

describe("POST /api/admin/auth/login Rate Limiting & Authentication Gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ratelimit.checkRateLimitDistributed).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      resetMs: 900000,
    });
  });

  it("returns HTTP 429 when IP-level distributed rate limiter fails closed", async () => {
    vi.mocked(ratelimit.checkRateLimitDistributed).mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      resetMs: 900000,
    });

    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@shadify.in", password: "Password123!" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("900");
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Too many login attempts from this network");
  });

  it("returns HTTP 429 when Account-level distributed rate limiter fails closed", async () => {
    // IP passes, Account fails
    vi.mocked(ratelimit.checkRateLimitDistributed)
      .mockResolvedValueOnce({ success: true, limit: 10, remaining: 9, resetMs: 900000 })
      .mockResolvedValueOnce({ success: false, limit: 5, remaining: 0, resetMs: 900000 });

    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@shadify.in", password: "Password123!" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("900");
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Too many attempts for this account");
  });

  it("passes failClosed: true and isLogin: true to enforce fail-closed rejection on Redis outage", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@shadify.in", password: "Password123!" }),
    });

    await POST(req);

    expect(ratelimit.checkRateLimitDistributed).toHaveBeenCalledWith(
      expect.stringContaining("admin-login-ip:"),
      expect.any(Number),
      15 * 60,
      expect.objectContaining({ isLogin: true, failClosed: true }),
    );
  });

  it("returns HTTP 400 when request body is malformed or missing fields", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns HTTP 401 when user credentials are invalid", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@shadify.in", password: "wrongpassword123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Invalid email or password");
  });
});
