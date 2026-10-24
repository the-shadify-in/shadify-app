import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/phone";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { logRequest } from "@/lib/log";

const ReportSchema = z.object({
  reportType: z.enum([
    "unwanted_photo",
    "unwanted_message",
    "inappropriate_content",
    "privacy_violation",
    "other",
  ]),
  reporterName: z.string().min(2, "Name must be at least 2 characters").max(100),
  reporterPhone: z.string().min(10, "Phone number is required").max(16),
  reporterEmail: z.string().email().optional().or(z.literal("")),
  weddingSlug: z.string().min(2).max(100),
  targetUrlOrId: z.string().min(3, "Please describe or provide the image/message link").max(500),
  reason: z.string().min(10, "Please provide the reason for takedown").max(2000),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const ip = getClientIp(req);

  // Rate limiting: 5 takedown reports per hour per IP
  const rateLimitResult = checkRateLimit(`report-takedown:${ip}`, 5, 3600000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait before submitting another report." },
      { status: 429 },
    );
  }

  try {
    const body: unknown = await req.json();
    const parsed = ReportSchema.parse(body);

    if (parsed.turnstileToken) {
      const turnstile = await verifyTurnstileToken(parsed.turnstileToken, ip);
      if (!turnstile.success) {
        return NextResponse.json({ error: "CAPTCHA validation failed" }, { status: 400 });
      }
    }

    const phoneResult = normalizePhoneNumber(parsed.reporterPhone);
    if (!phoneResult.valid || !phoneResult.e164) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please provide a valid 10-digit mobile number." },
        { status: 400 },
      );
    }
    const normalizedPhone = phoneResult.e164;

    const wedding = await prisma.wedding.findUnique({
      where: { slug: parsed.weddingSlug.toLowerCase().trim() },
      select: { id: true, slug: true, brideName: true, groomName: true },
    });

    if (!wedding) {
      return NextResponse.json(
        { error: "Wedding celebration could not be found with provided slug." },
        { status: 404 },
      );
    }

    const ticketSuffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    const ticketId = `REPORT-${ticketSuffix}`;

    // Record forensic audit log entry for staff concierge
    await prisma.auditLog.create({
      data: {
        weddingId: wedding.id,
        action: `takedown_requested_${parsed.reportType}`,
        detail: {
          ticketId,
          reportType: parsed.reportType,
          reporterName: parsed.reporterName,
          reporterPhone: normalizedPhone,
          reporterEmail: parsed.reporterEmail || null,
          targetUrlOrId: parsed.targetUrlOrId,
          reason: parsed.reason,
          reportedAt: new Date().toISOString(),
          ip,
        },
      },
    });

    logRequest({
      requestId,
      method: "POST",
      route: "/api/report",
      status: 200,
      durationMs: Date.now() - startTime,
      weddingId: wedding.id,
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Takedown report registered. Our concierge team reviews safety reports promptly.",
    });
  } catch (err: unknown) {
    console.error("[POST /api/report] Error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
