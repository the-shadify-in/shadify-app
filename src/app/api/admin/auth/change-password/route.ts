import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession, hashPassword, verifyPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  // Rate limit: 5 password changes per 15 min per user
  const rateLimit = checkRateLimit(`change-password:${session.userId}`, 5, 15 * 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many password change attempts. Please wait 15 minutes." },
      { status: 429 },
    );
  }

  try {
    const body: unknown = await req.json();
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "password_changed",
          detail: {
            role: user.role,
            ip,
            changedAt: new Date().toISOString(),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Use your new password on next login.",
    });
  } catch (err: unknown) {
    console.error("[POST /api/admin/auth/change-password] Error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
