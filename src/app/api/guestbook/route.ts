import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";

const GuestbookPostSchema = z.object({
  weddingId: z.string().uuid().optional(),
  weddingSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  authorName: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  message: z.string().trim().min(1, "Blessing message is required").max(1000, "Message too long"),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. IP Rate Limiting (5 guestbook posts per minute per IP)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = checkRateLimit(`guestbook:${ip}`, 5, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a moment before sending another blessing." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) } },
      );
    }

    const body = await request.json();
    const parseResult = GuestbookPostSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { weddingId, weddingSlug, authorName, message, turnstileToken } = parseResult.data;

    if (!weddingId && !weddingSlug) {
      return NextResponse.json(
        { error: "Either weddingId or weddingSlug must be provided." },
        { status: 400 },
      );
    }

    // 2. Cloudflare Turnstile Bot Protection Verification
    const turnstileCheck = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { error: turnstileCheck.error || "Bot protection check failed." },
        { status: 403 },
      );
    }

    // 3. Resolve Wedding Celebration
    const searchConditions = [];
    if (weddingId) searchConditions.push({ id: weddingId });
    if (weddingSlug) searchConditions.push({ slug: weddingSlug });

    const wedding = await prisma.wedding.findFirst({
      where: {
        OR: searchConditions,
        deletedAt: null,
      },
      select: { id: true, status: true },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Wedding celebration not found." }, { status: 404 });
    }

    if (wedding.status === "archived" || wedding.status === "expired") {
      return NextResponse.json(
        { error: "This celebration is archived. Guestbook entries are closed." },
        { status: 403 },
      );
    }

    // 4. Create Guestbook Entry (default status: pending review)
    const entry = await prisma.guestbookEntry.create({
      data: {
        weddingId: wedding.id,
        authorName,
        message,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your blessing has been sent to the couple for review.",
        id: entry.id,
        status: entry.status,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Guestbook post error:", error);
    return NextResponse.json(
      { error: "Failed to submit guestbook blessing. Please try again." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weddingSlug = searchParams.get("weddingSlug")?.toLowerCase().trim();
    const weddingId = searchParams.get("weddingId")?.trim();

    if (!weddingSlug && !weddingId) {
      return NextResponse.json(
        { error: "weddingSlug or weddingId query parameter is required." },
        { status: 400 },
      );
    }

    const getConditions = [];
    if (weddingId) getConditions.push({ id: weddingId });
    if (weddingSlug) getConditions.push({ slug: weddingSlug });

    const wedding = await prisma.wedding.findFirst({
      where: {
        OR: getConditions,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Wedding celebration not found." }, { status: 404 });
    }

    const entries = await prisma.guestbookEntry.findMany({
      where: {
        weddingId: wedding.id,
        status: "approved",
      },
      select: {
        id: true,
        authorName: true,
        message: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      entries,
    });
  } catch (error) {
    console.error("Guestbook get error:", error);
    return NextResponse.json({ error: "Failed to fetch guestbook entries." }, { status: 500 });
  }
}
