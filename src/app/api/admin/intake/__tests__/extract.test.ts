import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../extract/route";
import * as auth from "@/lib/auth";
import * as ratelimit from "@/lib/ratelimit";
import * as provider from "@/features/intake/provider";

vi.mock("@/lib/auth", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "203.0.113.1"),
}));

function createExtractRequest(body: unknown, headersInit: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/admin/intake/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      host: "localhost:3000",
      ...headersInit,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/admin/intake/extract (Staff AI Intake Assistant)", () => {
  const originalEnv = process.env.INTAKE_AI_ENABLED;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTAKE_AI_ENABLED = "true";

    vi.mocked(auth.requireAdminSession).mockResolvedValue({
      userId: "staff_123",
      role: "staff",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
      success: true,
      limit: 30,
      remaining: 29,
      resetMs: 3600000,
    });
  });

  afterEach(() => {
    process.env.INTAKE_AI_ENABLED = originalEnv;
  });

  it("returns 401 when staff session is missing or invalid", async () => {
    vi.mocked(auth.requireAdminSession).mockRejectedValue(new Error("UNAUTHORIZED_ADMIN"));

    const req = createExtractRequest({ text: "Priya weds Rahul" });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 403 when origin header does not match host (CSRF protection)", async () => {
    const req = createExtractRequest(
      { text: "Priya weds Rahul" },
      { origin: "http://evil-attacker.com", host: "localhost:3000" },
    );
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it("returns 503 when kill switch INTAKE_AI_ENABLED is false", async () => {
    process.env.INTAKE_AI_ENABLED = "false";

    const req = createExtractRequest({ text: "Priya weds Rahul" });
    const res = await POST(req);

    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("disabled by administrator kill switch");
  });

  it("returns 400 when input text exceeds 20,000 characters", async () => {
    const oversized = "A".repeat(25000);
    const req = createExtractRequest({ text: oversized });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 429 when staff hourly extraction limit is reached", async () => {
    vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
      success: false,
      limit: 30,
      remaining: 0,
      resetMs: 1800000,
    });

    const req = createExtractRequest({ text: "Priya weds Rahul on 14 Dec" });
    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it("returns 422 with manual entry instruction when provider throws or fails to parse", async () => {
    vi.spyOn(provider, "runIntakeExtraction").mockRejectedValueOnce(
      new Error("Model timeout after 30s"),
    );

    const req = createExtractRequest({ text: "Priya weds Rahul" });
    const res = await POST(req);

    expect(res.status).toBe(422);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain("Please enter information manually");
  });

  it("ensures logs NEVER leak input text, couple names, phones or UPI IDs", async () => {
    const sensitiveInput = "Priya weds Rahul on 14 Dec. Phone 9876543210. UPI priyarahul@upi";
    const logSpy = vi.spyOn(console, "info");

    const req = createExtractRequest({ text: sensitiveInput });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(logSpy).toHaveBeenCalled();

    // Assert every log entry is devoid of raw input, names, phones, or UPI IDs
    for (const call of logSpy.mock.calls) {
      const logString = call.map((c) => String(c)).join(" ");
      expect(logString).not.toContain("Priya weds Rahul");
      expect(logString).not.toContain("9876543210");
      expect(logString).not.toContain("priyarahul@upi");
      expect(logString).toContain("staff_123");
      expect(logString).toContain("outcome");
    }
  });
});
