import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../presign/route";
import * as auth from "@/lib/auth";
import * as r2 from "@/lib/r2";
import { prisma } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  getAdminSession: vi.fn(),
}));

vi.mock("@/lib/r2", () => ({
  createPresignedUploadUrl: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    crewPass: {
      findUnique: vi.fn(),
    },
    wedding: {
      findUnique: vi.fn(),
    },
    photo: {
      count: vi.fn(),
    },
  },
}));

function createJsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/media/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("Media Presign Route Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests with 401", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue(null);

    const req = createJsonRequest({
      weddingSlug: "priya-rahul",
      filename: "test.jpg",
      contentType: "image/jpeg",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized access");
  });

  it("rejects unsupported MIME content types with 400", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "user-1",
      role: "staff",
      exp: Date.now() + 10000,
    });

    const req = createJsonRequest({
      weddingSlug: "priya-rahul",
      filename: "malware.exe",
      contentType: "application/x-msdownload",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("rejects image uploads exceeding 25 MB with 400", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "user-1",
      role: "staff",
      exp: Date.now() + 10000,
    });

    const req = createJsonRequest({
      weddingSlug: "priya-rahul",
      filename: "huge-photo.jpg",
      contentType: "image/jpeg",
      fileSizeBytes: 26 * 1024 * 1024, // 26 MB
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("25 MB");
  });

  it("returns 404 if wedding does not exist", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "user-1",
      role: "staff",
      exp: Date.now() + 10000,
    });
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue(null);

    const req = createJsonRequest({
      weddingSlug: "nonexistent-wedding",
      filename: "photo.jpg",
      contentType: "image/jpeg",
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("rejects photo upload if Lite plan quota (100 photos) is reached", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "user-1",
      role: "staff",
      exp: Date.now() + 10000,
    });
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
      id: "w-1",
      plan: "lite",
      status: "published",
      deletedAt: null,
    } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);
    vi.mocked(prisma.photo.count).mockResolvedValue(100);

    const req = createJsonRequest({
      weddingSlug: "priya-rahul",
      filename: "photo-101.jpg",
      contentType: "image/jpeg",
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("100 photos reached for Lite plan");
    expect(json.currentCount).toBe(100);
  });

  it("rejects video bites on Lite plan with 403", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "user-1",
      role: "staff",
      exp: Date.now() + 10000,
    });
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
      id: "w-1",
      plan: "lite",
      status: "published",
      deletedAt: null,
    } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);

    const req = createJsonRequest({
      weddingSlug: "priya-rahul",
      filename: "bite.mp4",
      contentType: "video/mp4",
      tier: "video_bite",
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Video bites are not included in the Lite plan");
  });

  it("generates presigned upload URL when within entitlements", async () => {
    vi.mocked(auth.getAdminSession).mockResolvedValue({
      userId: "user-1",
      role: "staff",
      exp: Date.now() + 10000,
    });
    vi.mocked(prisma.wedding.findUnique).mockResolvedValue({
      id: "w-1234",
      plan: "premium",
      status: "published",
      deletedAt: null,
    } as unknown as Awaited<ReturnType<typeof prisma.wedding.findUnique>>);
    vi.mocked(prisma.photo.count).mockResolvedValue(42);
    vi.mocked(r2.createPresignedUploadUrl).mockResolvedValue(
      "https://shadify-media.r2.cloudflarestorage.com/presigned-url",
    );

    const req = createJsonRequest({
      weddingSlug: "priya-rahul",
      filename: "sangeet-dance.jpg",
      contentType: "image/jpeg",
      fileSizeBytes: 5 * 1024 * 1024,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.uploadUrl).toBe("https://shadify-media.r2.cloudflarestorage.com/presigned-url");
    expect(json.key).toContain("weddings/w-1234/preview/");
    expect(json.plan).toBe("premium");
  });
});
