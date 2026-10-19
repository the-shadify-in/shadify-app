import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // Rate limit: 5 attempts per 15 minutes per IP
  const rateLimitResult = checkRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait 15 minutes before trying again." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    // Verify staff credentials against configured password
    const expectedPassword = process.env.ADMIN_CONCIERGE_PASSWORD || "shadify2026";
    const isValid = password === expectedPassword;

    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Issue signed HMAC token
    const token = signSessionToken("staff-concierge-id", "staff");

    const response = NextResponse.json({ success: true, user: { email, role: "staff" } });

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
