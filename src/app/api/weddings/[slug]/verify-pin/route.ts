import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, signGuestPinToken, GUEST_PIN_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { logRequest } from "@/lib/log";

interface RouteParams {
  params: { slug: string };
}

const VerifyPinSchema = z.object({
  pin: z
    .string()
    .trim()
    .min(4, "Access PIN must be at least 4 characters")
    .max(12, "Access PIN cannot exceed 12 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Access PIN must contain alphanumeric characters only"),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { slug } = params;
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const ip = getClientIp(req);

  // 1. Dual-Boundary Rate Limiting:
  // Layer A: Global IP rate limit (max 15 attempts across any weddings per 15 minutes)
  const ipRateResult = checkRateLimit(`pin-ip:${ip}`, 15, 900000);
  if (!ipRateResult.success) {
    return NextResponse.json(
      { error: "Too many access attempts. Please wait 15 minutes before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(ipRateResult.resetMs / 1000).toString(),
          "Cache-Control": "private, no-store, must-revalidate",
        },
      },
    );
  }

  try {
    const body: unknown = await req.json();
    const parsed = VerifyPinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Access PIN must be 4 to 12 alphanumeric characters." },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store, must-revalidate" },
        },
      );
    }

    const { pin } = parsed.data;

    // 2. Resolve Canonical Wedding or Active Permanent Alias
    const cleanSlug = slug.toLowerCase().trim();
    let wedding = await prisma.wedding.findUnique({
      where: { slug: cleanSlug },
      select: { id: true, slug: true, privatePinHash: true, status: true },
    });

    if (!wedding) {
      const alias = await prisma.weddingAlias.findUnique({
        where: { alias: cleanSlug },
        select: {
          retiredAt: true,
          wedding: {
            select: { id: true, slug: true, privatePinHash: true, status: true },
          },
        },
      });

      if (alias && !alias.retiredAt && alias.wedding) {
        wedding = alias.wedding;
      }
    }

    // Layer B: Canonical Wedding + IP rate limit (max 5 attempts per wedding per 15 minutes)
    // Keying by canonical wedding ID (or cleanSlug if unknown) ensures aliases share the exact same bucket
    const targetKey = wedding ? wedding.id : cleanSlug;
    const targetRateResult = checkRateLimit(`pin-target:${targetKey}:${ip}`, 5, 900000);
    if (!targetRateResult.success) {
      return NextResponse.json(
        { error: "Too many access attempts for this celebration. Please wait 15 minutes." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(targetRateResult.resetMs / 1000).toString(),
            "Cache-Control": "private, no-store, must-revalidate",
          },
        },
      );
    }

    // Generic unrevealing failure: If wedding does not exist or has no private PIN configured
    if (!wedding || !wedding.privatePinHash) {
      return NextResponse.json(
        { error: "Incorrect access PIN. Please check your invitation card." },
        {
          status: 401,
          headers: { "Cache-Control": "private, no-store, must-revalidate" },
        },
      );
    }

    // 3. Constant-Time scrypt Verification
    const isValid = await verifyPassword(pin, wedding.privatePinHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect access PIN. Please check your invitation card." },
        {
          status: 401,
          headers: { "Cache-Control": "private, no-store, must-revalidate" },
        },
      );
    }

    // 4. Issue Cryptographically Signed Guest Session Cookie bound to current PIN fingerprint
    const existingCookie =
      req.cookies.get(GUEST_PIN_COOKIE_NAME)?.value ||
      req.cookies.get("__Host-shadify_guest_access")?.value ||
      req.cookies.get("shadify_guest_access")?.value;

    const token = signGuestPinToken(wedding.id, wedding.privatePinHash, existingCookie);

    const response = NextResponse.json(
      {
        success: true,
        message: "Access granted to celebration.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, must-revalidate",
        },
      },
    );

    response.cookies.set({
      name: GUEST_PIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    logRequest({
      requestId,
      method: "POST",
      route: `/api/weddings/${slug}/verify-pin`,
      status: 200,
      durationMs: Date.now() - startTime,
      weddingId: wedding.id,
    });

    return response;
  } catch (err: unknown) {
    console.error(`[POST /api/weddings/${slug}/verify-pin] Error:`, err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store, must-revalidate" },
      },
    );
  }
}
