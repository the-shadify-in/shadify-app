import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/phone";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { logRequest } from "@/lib/log";

const DataRequestSchema = z.object({
  requestType: z.enum(["access_summary", "correction", "erasure"]),
  requesterName: z.string().min(2, "Name must be at least 2 characters").max(100),
  requesterPhone: z.string().min(10, "Phone number is required").max(16),
  requesterEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  weddingSlug: z.string().min(2).max(100),
  details: z.string().min(10, "Please provide sufficient detail (minimum 10 characters)").max(2000),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const ip = getClientIp(req);

  // 1. Rate Limiting: max 5 privacy requests per hour per IP (3,600,000 ms)
  const rateLimitResult = checkRateLimit(`privacy-request:${ip}`, 5, 3600000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before submitting another inquiry." },
      { status: 429 },
    );
  }

  try {
    const body: unknown = await req.json();
    const parsed = DataRequestSchema.parse(body);

    // 2. Cloudflare Turnstile CAPTCHA Verification
    if (parsed.turnstileToken) {
      const turnstile = await verifyTurnstileToken(parsed.turnstileToken, ip);
      if (!turnstile.success) {
        return NextResponse.json(
          { error: "Bot verification failed. Please try again." },
          { status: 400 },
        );
      }
    }

    // 3. Normalize phone number
    const phoneResult = normalizePhoneNumber(parsed.requesterPhone);
    if (!phoneResult.valid || !phoneResult.e164) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please provide a 10-digit Indian mobile number." },
        { status: 400 },
      );
    }
    const normalizedPhone = phoneResult.e164;

    // 4. Resolve Wedding
    const wedding = await prisma.wedding.findUnique({
      where: { slug: parsed.weddingSlug.toLowerCase().trim() },
      select: { id: true, slug: true, brideName: true, groomName: true },
    });

    if (!wedding) {
      return NextResponse.json(
        { error: "Wedding celebration could not be identified with the provided slug or URL." },
        { status: 404 },
      );
    }

    // 5. Generate immutable tracking ticket ID (DPDP-XXXXXX)
    const ticketSuffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    const ticketId = `DPDP-${ticketSuffix}`;

    // 6. If erasure request, insert into erasure_requests table
    if (parsed.requestType === "erasure") {
      await prisma.erasureRequest.create({
        data: {
          weddingId: wedding.id,
          subject: `${parsed.requesterName} (${normalizedPhone})`,
        },
      });
    }

    // 7. Record immutable audit log entry
    await prisma.auditLog.create({
      data: {
        weddingId: wedding.id,
        action: `privacy_request_${parsed.requestType}`,
        detail: {
          ticketId,
          requestType: parsed.requestType,
          requesterName: parsed.requesterName,
          requesterPhone: normalizedPhone,
          requesterEmail: parsed.requesterEmail || null,
          details: parsed.details,
          submittedAt: new Date().toISOString(),
          ip,
        },
      },
    });

    logRequest({
      requestId,
      method: "POST",
      route: "/api/privacy/data-request",
      status: 200,
      durationMs: Date.now() - startTime,
      weddingId: wedding.id,
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message:
        "Your privacy request has been recorded in our compliance register. Our Data Protection Concierge will verify and process your request within statutory DPDP timelines.",
    });
  } catch (err: unknown) {
    console.error("[POST /api/privacy/data-request] Error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
