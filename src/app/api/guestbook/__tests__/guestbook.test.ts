import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "../route";
import * as turnstile from "@/lib/turnstile";
import * as ratelimit from "@/lib/ratelimit";
import { prisma } from "@/lib/db";

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(),
  checkRateLimitDistributed: vi.fn(),
  getClientIp: vi.fn(() => "203.0.113.80"),
  hashIpForStorage: vi.fn((ip) => `hash_${ip}`),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    wedding: {
      findFirst: vi.fn(),
    },
    guestbookEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

function createPostRequest(body: unknown, ip: string = "203.0.113.50") {
  return new NextRequest("http://localhost:3000/api/guestbook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function createGetRequest(queryString: string) {
  return new NextRequest(`http://localhost:3000/api/guestbook?${queryString}`, {
    method: "GET",
  });
}

describe("Guestbook API Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ratelimit.checkRateLimitDistributed).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      resetMs: 60000,
    });
    vi.mocked(turnstile.verifyTurnstileToken).mockResolvedValue({
      success: true,
    });
  });

  describe("POST /api/guestbook", () => {
    it("returns 429 when rate limited", async () => {
      vi.mocked(ratelimit.checkRateLimitDistributed).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        resetMs: 45000,
      });

      const req = createPostRequest({
        weddingSlug: "priya-rahul",
        authorName: "Amit Sharma",
        message: "Wishing you a lifetime of joy!",
      });

      const res = await POST(req);
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("45");
    });

    it("scopes distributed rate limit to wedding slug and hashed IP with graceful degradation (failClosed: false, fallback: 5)", async () => {
      const req = createPostRequest({
        weddingSlug: "Priya-Rahul",
        authorName: "Amit Sharma",
        message: "Wishing you a lifetime of joy!",
      });

      await POST(req);
      expect(ratelimit.checkRateLimitDistributed).toHaveBeenCalledWith(
        "guestbook:priya-rahul:hash_203.0.113.80",
        5,
        60,
        {
          failClosed: false,
          fallbackLocalLimit: 5,
        },
      );
    });

    it("returns 403 when Turnstile verification fails", async () => {
      vi.mocked(turnstile.verifyTurnstileToken).mockResolvedValue({
        success: false,
        error: "Bot protection verification failed.",
      });

      const req = createPostRequest({
        weddingSlug: "priya-rahul",
        authorName: "Bot Spammer",
        message: "Visit this suspicious link",
        turnstileToken: "bad-token",
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Bot protection verification failed.");
    });

    it("returns 400 when mandatory fields are missing", async () => {
      const req = createPostRequest({
        weddingSlug: "priya-rahul",
        authorName: "", // missing name
        message: "",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 404 when wedding celebration is not found", async () => {
      vi.mocked(prisma.wedding.findFirst).mockResolvedValue(null);

      const req = createPostRequest({
        weddingSlug: "nonexistent-wedding",
        authorName: "Guest",
        message: "Congratulations!",
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
    });

    it("returns 403 when wedding celebration is archived", async () => {
      vi.mocked(prisma.wedding.findFirst).mockResolvedValue({
        id: "w-archived",
        status: "archived",
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findFirst>>);

      const req = createPostRequest({
        weddingSlug: "priya-rahul",
        authorName: "Guest",
        message: "Congratulations!",
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("archived");
    });

    it("creates guestbook entry with pending status upon valid submission", async () => {
      vi.mocked(prisma.wedding.findFirst).mockResolvedValue({
        id: "w-100",
        status: "published",
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findFirst>>);

      vi.mocked(prisma.guestbookEntry.create).mockResolvedValue({
        id: "entry-1",
        weddingId: "w-100",
        authorName: "Ananya Patel",
        message: "May your love grow stronger with every passing year!",
        status: "pending",
        createdAt: new Date(),
      } as unknown as Awaited<ReturnType<typeof prisma.guestbookEntry.create>>);

      const req = createPostRequest({
        weddingSlug: "priya-rahul",
        authorName: "Ananya Patel",
        message: "May your love grow stronger with every passing year!",
        turnstileToken: "valid-cf-token",
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.id).toBe("entry-1");
      expect(json.status).toBe("pending");
      expect(prisma.guestbookEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          weddingId: "w-100",
          authorName: "Ananya Patel",
          status: "pending",
        }),
      });
    });
  });

  describe("GET /api/guestbook", () => {
    it("returns 400 if weddingSlug or weddingId is missing", async () => {
      const req = createGetRequest("");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("returns approved entries for the celebration", async () => {
      vi.mocked(prisma.wedding.findFirst).mockResolvedValue({
        id: "w-100",
      } as unknown as Awaited<ReturnType<typeof prisma.wedding.findFirst>>);

      const mockEntries = [
        {
          id: "entry-1",
          authorName: "Sunita Chawla",
          message: "Blessings to both families!",
          createdAt: new Date("2026-10-18T10:00:00Z"),
        },
      ];
      vi.mocked(prisma.guestbookEntry.findMany).mockResolvedValue(
        mockEntries as unknown as Awaited<ReturnType<typeof prisma.guestbookEntry.findMany>>,
      );

      const req = createGetRequest("weddingSlug=priya-rahul");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.entries).toHaveLength(1);
      expect(json.entries[0].authorName).toBe("Sunita Chawla");
      expect(prisma.guestbookEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            weddingId: "w-100",
            status: "approved",
          },
        }),
      );
    });
  });
});
