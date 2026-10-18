import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe("Health Check API (/api/health)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and healthy status when database responds", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("healthy");
    expect(json.database.status).toBe("connected");
    expect(typeof json.database.latencyMs).toBe("number");
  });

  it("returns 503 and unhealthy status when database query rejects", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("Connection timeout"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.status).toBe("unhealthy");
    expect(json.database.status).toBe("disconnected");
  });
});
