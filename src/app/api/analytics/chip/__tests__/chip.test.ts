import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import * as chipService from "@/features/analytics/chip-counts";
import * as ratelimit from "@/lib/ratelimit";

vi.mock("@/features/analytics/chip-counts", () => ({
  recordChipTap: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "203.0.113.55"),
}));

function createChipRequest(body: unknown, contentLength?: number) {
  const jsonStr = typeof body === "string" ? body : JSON.stringify(body);
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  if (contentLength !== undefined) {
    headers.set("content-length", String(contentLength));
  }

  return new NextRequest("http://localhost:3000/api/analytics/chip", {
    method: "POST",
    headers,
    body: jsonStr,
  });
}

describe("POST /api/analytics/chip (Anonymous Telemetry)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
      success: true,
      limit: 120,
      remaining: 119,
      resetMs: 60000,
    });
    vi.mocked(chipService.recordChipTap).mockResolvedValue({ recorded: true });
  });

  it("successfully processes valid telemetry payload and records anonymous count", async () => {
    const req = createChipRequest({ slug: "priya-rahul", topic: "venue" });
    const res = await POST(req);

    expect(res.status).toBe(204);
    expect(chipService.recordChipTap).toHaveBeenCalledWith({
      slug: "priya-rahul",
      topic: "venue",
    });
  });

  it("rejects invalid topics with 400", async () => {
    const req = createChipRequest({ slug: "priya-rahul", topic: "unsupported_topic" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(chipService.recordChipTap).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON formatting with 400", async () => {
    const req = createChipRequest("invalid-json{}}");
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(chipService.recordChipTap).not.toHaveBeenCalled();
  });

  it("rejects oversized payloads (>1024 bytes) with 413", async () => {
    const largeString = "a".repeat(2000);
    const req = createChipRequest({ slug: "priya-rahul", topic: "venue", extra: largeString });
    const res = await POST(req);

    expect(res.status).toBe(413);
    expect(chipService.recordChipTap).not.toHaveBeenCalled();
  });

  it("enforces rate limiting (429) per wedding and IP bucket", async () => {
    vi.mocked(ratelimit.checkRateLimit).mockReturnValue({
      success: false,
      limit: 120,
      remaining: 0,
      resetMs: 60000,
    });

    const req = createChipRequest({ slug: "priya-rahul", topic: "timings" });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(chipService.recordChipTap).not.toHaveBeenCalled();
  });
});
