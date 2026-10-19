import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  signSessionToken,
  verifyPassword,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { prisma } from "@/lib/db";

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Strict IP rate limit: 10 attempts per 15 minutes per IP
  const isTest = process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT_TEST === "true";
  const ipLimit = isTest ? 100 : 10;
  const ipRateLimit = checkRateLimit(`admin-login-ip:${ip}`, ipLimit, 15 * 60 * 1000);
  if (!ipRateLimit.success) {
    return NextResponse.json(
      {
        error:
          "Too many login attempts from this network. Please wait 15 minutes before trying again.",
      },
      { status: 429 },
    );
  }

  try {
    const body: unknown = await req.json();
    const { email, password } = LoginSchema.parse(body);

    // 2. Strict Account rate limit: 5 attempts per 15 minutes per account + IP
    const accountLimit = isTest ? 100 : 5;
    const accountRateLimit = checkRateLimit(
      `admin-login-acc:${ip}:${email}`,
      accountLimit,
      15 * 60 * 1000,
    );
    if (!accountRateLimit.success) {
      return NextResponse.json(
        { error: "Too many attempts for this account. Please wait 15 minutes." },
        { status: 429 },
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
