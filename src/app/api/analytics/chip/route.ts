import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TELEMETRY_TOPICS } from "@/features/ask/topics";
import { recordChipTap } from "@/features/analytics/chip-counts";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

const MAX_BODY_BYTES = 1024; // Disallow oversized payloads

const ChipBeaconSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  topic: z.enum(TELEMETRY_TOPICS),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Guard against oversized payloads
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // 2. Safely parse body (support JSON text sent via sendBeacon or standard fetch)
    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const parseResult = ChipBeaconSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { slug, topic } = parseResult.data;

    // 3. Generous rate limiting per wedding + client IP bucket (120 req/min for venue Wi-Fi)
    const ip = getClientIp(request);
    const rateLimitKey = `chip:${slug}:${ip}`;
    const rateCheck = checkRateLimit(rateLimitKey, 120, 60000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    // 4. Record the anonymous count
    await recordChipTap({ slug, topic });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Resilient failure: sendBeacon drops failures anyway, but avoid crashing
    console.error("Chip beacon error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
