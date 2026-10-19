import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import * as turnstile from "@/lib/turnstile";
import * as ratelimit from "@/lib/ratelimit";
import { prisma } from "@/lib/db";

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "203.0.113.80"),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    eventRsvp: {
      create: vi.fn(),
    },
  },
}));

function createRsvpRequest(body: unknown, ip: string = "203.0.113.80") {
  return new NextRequest("http://localhost:3000/api/rsvp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("RSVP API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
      success: true,
      limit: 5,
      remaining: 4,
      resetMs: 60000,
    });
    vi.mocked(turnstile.verifyTurnstileToken).mockResolvedValue({
      success: true,
    });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
      success: false,
      limit: 5,
      remaining: 0,
      resetMs: 30000,
    });

    const req = createRsvpRequest({
      weddingId: "w-1",
      eventId: "e-1",
      respondentName: "Guest",
      attending: true,
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("returns 403 when Turnstile verification fails", async () => {
    vi.mocked(turnstile.verifyTurnstileToken).mockResolvedValue({
      success: false,
      error: "Bot protection check failed.",
    });

    const req = createRsvpRequest({
      weddingId: "w-1",
      eventId: "e-1",
      respondentName: "Spammer",
      attending: true,
      turnstileToken: "bad-token",
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Bot protection check failed.");
  });

  it("returns 400 when mandatory RSVP fields are missing", async () => {
    const req = createRsvpRequest({
      weddingId: "w-1",
      // missing eventId and respondentName
      attending: true,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when duplicate RSVP is detected", async () => {
    vi.mocked(prisma.eventRsvp.create).mockRejectedValue({
      code: "P2002",
      message: "Unique constraint failed on uq_rsvp",
    });

    const req = createRsvpRequest({
      weddingId: "w-1",
      eventId: "e-1",
      respondentName: "Rajesh Kumar",
      respondentPhone: "9811122233",
      attending: true,
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already been submitted");
  });

  it("creates RSVP successfully and returns 200", async () => {
    vi.mocked(prisma.eventRsvp.create).mockResolvedValue({
      id: "rsvp-123",
      weddingId: "w-1",
      eventId: "e-1",
      respondentName: "Rajesh Kumar",
      respondentPhone: "9811122233",
      attending: true,
      partySize: 2,
      mealPreference: "pure_veg",
      needsStay: false,
    } as unknown as Awaited<ReturnType<typeof prisma.eventRsvp.create>>);

    const req = createRsvpRequest({
      weddingId: "w-1",
      eventId: "e-1",
      respondentName: "Rajesh Kumar",
      respondentPhone: "9811122233",
      attending: true,
      partySize: 2,
      mealPreference: "pure_veg",
      turnstileToken: "test-turnstile-token",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.rsvpId).toBe("rsvp-123");
    expect(prisma.eventRsvp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          respondentPhone: "+919811122233",
        }),
      }),
    );
  });

  it("normalizes international phone numbers (+1) to canonical E.164 on RSVP", async () => {
    vi.mocked(prisma.eventRsvp.create).mockResolvedValue({
      id: "rsvp-456",
      weddingId: "w-1",
      eventId: "e-1",
      respondentName: "Uncle Sam",
      respondentPhone: "+15552345678",
      attending: true,
      partySize: 1,
    } as unknown as Awaited<ReturnType<typeof prisma.eventRsvp.create>>);

    const req = createRsvpRequest({
      weddingId: "w-1",
      eventId: "e-1",
      respondentName: "Uncle Sam",
      respondentPhone: "+1 (650) 253-0000",
      attending: true,
      turnstileToken: "test-turnstile-token",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(prisma.eventRsvp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          respondentPhone: "+16502530000",
        }),
      }),
    );
  });
});
