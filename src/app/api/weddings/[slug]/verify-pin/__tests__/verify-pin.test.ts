import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as verifyPinHandler } from "../route";
import { POST as rsvpHandler } from "@/app/api/rsvp/route";
import {
  GET as guestbookGetHandler,
  POST as guestbookPostHandler,
} from "@/app/api/guestbook/route";
import * as auth from "@/lib/auth";
import * as ratelimit from "@/lib/ratelimit";
import * as turnstile from "@/lib/turnstile";
import { prisma } from "@/lib/db";

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "203.0.113.195"),
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof auth>();
  return {
    ...actual,
    verifyPassword: vi.fn(),
  };
});

vi.mock("@/lib/log", () => ({
  logRequest: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    wedding: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    weddingAlias: {
      findUnique: vi.fn(),
    },
    eventRsvp: {
      create: vi.fn(),
    },
    guestbookEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("Private Wedding Server-Enforced Privacy Gate & Security Checklist", () => {
  const weddingId = "wed-priv-456";
  const slug = "ananya-rohit";
  const initialPinHash = "scrypt_salt_abc:hash_initial";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
      success: true,
      limit: 5,
      remaining: 4,
      resetMs: 900000,
    });
  });

  describe("Authentication & Token Mechanics", () => {
    it("rejects malformed PIN formats (too short, too long, or invalid symbols)", async () => {
      const req = new NextRequest(`http://localhost:3000/api/weddings/${slug}/verify-pin`, {
        method: "POST",
        body: JSON.stringify({ pin: "12" }),
      });
      const res = await verifyPinHandler(req, { params: { slug } });

      expect(res.status).toBe(400);
      const data = (await res.json()) as { error: string };
      expect(data.error).toContain("4 to 12 alphanumeric characters");
    });

    it("enforces dual rate-limiting on repeated attempts (IP and Target)", async () => {
      vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
        success: false,
        limit: 5,
        remaining: 0,
        resetMs: 600000,
      });

      const req = new NextRequest(`http://localhost:3000/api/weddings/${slug}/verify-pin`, {
        method: "POST",
        body: JSON.stringify({ pin: "1234" }),
      });
      const res = await verifyPinHandler(req, { params: { slug } });

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("600");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("returns generic 401 when wedding does not exist or has no private PIN", async () => {
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.weddingAlias.findUnique).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost:3000/api/weddings/${slug}/verify-pin`, {
        method: "POST",
        body: JSON.stringify({ pin: "1234" }),
      });
      const res = await verifyPinHandler(req, { params: { slug } });

      expect(res.status).toBe(401);
      const data = (await res.json()) as { error: string };
      expect(data.error).toContain("Incorrect access PIN");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("returns generic 401 when submitted PIN is incorrect", async () => {
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
        id: weddingId,
        slug,
        privatePinHash: initialPinHash,
        status: "published",
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

      vi.mocked(auth.verifyPassword).mockResolvedValue(false);

      const req = new NextRequest(`http://localhost:3000/api/weddings/${slug}/verify-pin`, {
        method: "POST",
        body: JSON.stringify({ pin: "9999" }),
      });
      const res = await verifyPinHandler(req, { params: { slug } });

      expect(res.status).toBe(401);
      const data = (await res.json()) as { error: string };
      expect(data.error).toContain("Incorrect access PIN");
    });

    it("accepts correct PIN, resolves vanity alias to same boundary, and sets single unified cookie", async () => {
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.weddingAlias.findUnique).mockResolvedValue({
        retiredAt: null,
        wedding: {
          id: weddingId,
          slug,
          privatePinHash: initialPinHash,
          status: "published",
        },
      } as unknown as Awaited<ReturnType<typeof prisma.weddingAlias.findUnique>>);

      vi.mocked(auth.verifyPassword).mockResolvedValue(true);

      const req = new NextRequest(`http://localhost:3000/api/weddings/vanity-alias/verify-pin`, {
        method: "POST",
        body: JSON.stringify({ pin: "2027" }),
      });
      const res = await verifyPinHandler(req, { params: { slug: "vanity-alias" } });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { success: boolean };
      expect(data.success).toBe(true);

      const cookieHeader = res.headers.get("set-cookie");
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain(auth.GUEST_PIN_COOKIE_NAME);
      expect(cookieHeader).toContain("HttpOnly");
      expect(cookieHeader?.toLowerCase()).toContain("samesite=lax");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("strictly invalidates previously issued tokens when PIN configuration changes or is removed", () => {
      const token = auth.signGuestPinToken(weddingId, initialPinHash);

      // 1. Valid with current matching PIN hash
      expect(auth.verifyGuestPinToken(token, weddingId, initialPinHash)).toBe(true);

      // 2. Invalidated when PIN hash changes (owner rotated PIN)
      const rotatedPinHash = "scrypt_salt_xyz:hash_new_password";
      expect(auth.verifyGuestPinToken(token, weddingId, rotatedPinHash)).toBe(false);

      // 3. Invalidated when PIN is removed (wedding is now public or unset)
      expect(auth.verifyGuestPinToken(token, weddingId, null)).toBe(false);
    });

    it("enforces tenant boundary: access to Wedding A never grants access to Wedding B", () => {
      const tokenA = auth.signGuestPinToken("wedding-A", "hash_A");

      expect(auth.verifyGuestPinToken(tokenA, "wedding-A", "hash_A")).toBe(true);
      expect(auth.verifyGuestPinToken(tokenA, "wedding-B", "hash_B")).toBe(false);
    });

    it("strictly rejects expired, tampered, or wrong-purpose tokens", () => {
      // Expired token (ttl = -1s)
      const expiredToken = auth.signGuestPinToken(weddingId, initialPinHash, null, -1000);
      expect(auth.verifyGuestPinToken(expiredToken, weddingId, initialPinHash)).toBe(false);

      // Tampered token
      const validToken = auth.signGuestPinToken(weddingId, initialPinHash);
      const [payloadB64, sig] = validToken.split(".");
      const tamperedToken = `${payloadB64}.${sig}broken`;
      expect(auth.verifyGuestPinToken(tamperedToken, weddingId, initialPinHash)).toBe(false);

      // Tampered payload
      const tamperedPayload = Buffer.from(JSON.stringify({ purpose: "admin", weddingId })).toString(
        "base64url",
      );
      expect(auth.verifyGuestPinToken(`${tamperedPayload}.${sig}`, weddingId, initialPinHash)).toBe(
        false,
      );
    });
  });

  describe("Direct API Protection Across RSVP & Guestbook", () => {
    it("blocks direct RSVP requests to private weddings when valid PIN cookie is missing", async () => {
      vi.mocked(turnstile.verifyTurnstileToken).mockResolvedValue({ success: true });
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
        id: weddingId,
        privatePinHash: initialPinHash,
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

      const req = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        body: JSON.stringify({
          weddingSlug: slug,
          respondentName: "Kavya Sharma",
          respondentPhone: "9876543210",
        }),
      });

      const res = await rsvpHandler(req);
      expect(res.status).toBe(403);
      const data = (await res.json()) as { error: string };
      expect(data.error).toContain("PIN verification required");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("permits RSVP when valid unified guest PIN session cookie is present", async () => {
      vi.mocked(turnstile.verifyTurnstileToken).mockResolvedValue({ success: true });
      vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
        id: weddingId,
        privatePinHash: initialPinHash,
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);
      vi.mocked(prisma.eventRsvp.create).mockResolvedValue({ id: "rsvp-123" } as unknown as Awaited<
        ReturnType<typeof prisma.eventRsvp.create>
      >);

      const validToken = auth.signGuestPinToken(weddingId, initialPinHash);
      const req = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: {
          cookie: `${auth.GUEST_PIN_COOKIE_NAME}=${validToken}`,
        },
        body: JSON.stringify({
          weddingSlug: slug,
          eventId: "evt-main",
          respondentName: "Aditya Verma",
          respondentPhone: "+919876543210",
          attending: true,
        }),
      });

      const res = await rsvpHandler(req);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { success: boolean };
      expect(data.success).toBe(true);
    });

    it("blocks guestbook GET and POST for private weddings without PIN cookie", async () => {
      vi.mocked(turnstile.verifyTurnstileToken).mockResolvedValue({ success: true });
      vi.mocked(prisma.wedding.findFirst).mockResolvedValue({
        id: weddingId,
        status: "published",
        privatePinHash: initialPinHash,
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findFirst>>);

      // GET blocked
      const getReq = new NextRequest(`http://localhost:3000/api/guestbook?weddingSlug=${slug}`, {
        method: "GET",
      });
      const getRes = await guestbookGetHandler(getReq);
      expect(getRes.status).toBe(403);

      // POST blocked
      const postReq = new NextRequest("http://localhost:3000/api/guestbook", {
        method: "POST",
        body: JSON.stringify({
          weddingSlug: slug,
          authorName: "Ananya",
          message: "Wishing you both endless happiness!",
        }),
      });
      const postRes = await guestbookPostHandler(postReq);
      expect(postRes.status).toBe(403);
    });
  });
});
