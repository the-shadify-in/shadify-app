import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  signSessionToken,
  verifyPassword,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { checkRateLimitDistributed, getClientIp, hashIpForStorage } from "@/lib/ratelimit";
import { prisma } from "@/lib/db";

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipHash = hashIpForStorage(ip);

  // 1. Strict IP rate limit: 10 attempts per 15 minutes per IP across cluster (fails closed on Redis outage)
  const isTest = process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT_TEST === "true";
  const ipLimit = isTest ? 100 : 10;
  const ipRateLimit = await checkRateLimitDistributed(
    `admin-login-ip:${ipHash}`,
    ipLimit,
    15 * 60,
    { failClosed: true, isLogin: true },
  );
  if (!ipRateLimit.success) {
    const retryAfterSec = Math.max(1, Math.ceil(ipRateLimit.resetMs / 1000));
    return NextResponse.json(
      {
        error:
          "Too many login attempts from this network. Please wait 15 minutes before trying again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSec.toString(),
          "Cache-Control": "private, no-store, must-revalidate",
        },
      },
    );
  }

  try {
    const body: unknown = await req.json();
    const { email, password } = LoginSchema.parse(body);

    // 2. Strict Account rate limit: 5 attempts per 15 minutes per account + IP
    const accountLimit = isTest ? 100 : 5;
    const accountRateLimit = await checkRateLimitDistributed(
      `admin-login-acc:${ipHash}:${email}`,
      accountLimit,
      15 * 60,
      { failClosed: true, isLogin: true },
    );
    if (!accountRateLimit.success) {
      const retryAfterSec = Math.max(1, Math.ceil(accountRateLimit.resetMs / 1000));
      return NextResponse.json(
        { error: "Too many attempts for this account. Please wait 15 minutes." },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSec.toString(),
            "Cache-Control": "private, no-store, must-revalidate",
          },
        },
      );
    }

    let authenticatedUser: { id: string; role: string; email: string } | null = null;

    // 3. Database authentication: lookup active staff or super_admin account
    const staffUser = await prisma.user.findFirst({
      where: {
        email,
        role: { in: ["staff", "super_admin"] },
        deletedAt: null,
      },
    });

    if (staffUser && staffUser.passwordHash) {
      const isValid = await verifyPassword(password, staffUser.passwordHash);
      if (isValid) {
        authenticatedUser = {
          id: staffUser.id,
          role: staffUser.role,
          email: staffUser.email || email,
        };
      }
    } else if (
      process.env.ADMIN_BOOTSTRAP_PASSWORD &&
      password === process.env.ADMIN_BOOTSTRAP_PASSWORD
    ) {
      // Secure bootstrap account supplied via environment variable (no committed default)
      authenticatedUser = {
        id: staffUser?.id || "admin-bootstrap-actor",
        role: "staff",
        email,
      };
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // 4. Issue signed HMAC token with actual user ID and role
    const token = signSessionToken(authenticatedUser.id, authenticatedUser.role);

    const response = NextResponse.json({
      success: true,
      user: { email: authenticatedUser.email, role: authenticatedUser.role },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
