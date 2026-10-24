import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getAdminSession, hashPassword } from "@/lib/auth";

interface RouteParams {
  params: { id: string };
}

const PinManagementSchema = z.object({
  action: z.enum(["reset", "set", "remove"]),
  pin: z
    .string()
    .trim()
    .min(4, "PIN must be at least 4 digits")
    .max(12, "PIN cannot exceed 12 characters")
    .regex(/^[0-9a-zA-Z_-]+$/, "PIN must contain alphanumeric characters only")
    .optional(),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = params;

  // 1. Strict Staff Authentication Guard
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  try {
    const body: unknown = await req.json().catch(() => ({ action: "reset" }));
    const parseResult = PinManagementSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parseResult.error.issues },
        { status: 400 },
      );
    }

    const { action, pin, reason } = parseResult.data;

    const wedding = await prisma.wedding.findUnique({
      where: { id },
      select: { id: true, slug: true, privatePinHash: true },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Wedding celebration not found." }, { status: 404 });
    }

    if (action === "remove") {
      await prisma.$transaction(async (tx) => {
        await tx.wedding.update({
          where: { id },
          data: { privatePinHash: null },
        });

        await tx.auditLog.create({
          data: {
            weddingId: id,
            actorId: session.userId,
            action: "wedding.pin_removed",
            detail: {
              reason: reason || "Staff removed guest PIN protection",
              removedAt: new Date().toISOString(),
            },
          },
        });
      });

      return NextResponse.json({
        success: true,
        hasPrivatePin: false,
        message: "Guest PIN removed. Celebration is now public.",
      });
    }

    // Generate random 6-digit PIN if none provided
    const plaintextPin = pin || String(crypto.randomInt(100000, 999999));
    const privatePinHash = await hashPassword(plaintextPin);

    await prisma.$transaction(async (tx) => {
      await tx.wedding.update({
        where: { id },
        data: { privatePinHash },
      });

      await tx.auditLog.create({
        data: {
          weddingId: id,
          actorId: session.userId,
          action: action === "reset" ? "wedding.pin_reset" : "wedding.pin_set",
          detail: {
            reason:
              reason || (action === "reset" ? "Staff requested PIN reset" : "Initial PIN set"),
            rotatedAt: new Date().toISOString(),
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      hasPrivatePin: true,
      pin: plaintextPin,
      message:
        "Guest access PIN updated successfully. For security, this PIN is shown only once and will never be logged or displayed again.",
    });
  } catch (err: unknown) {
    console.error(`[POST /api/admin/weddings/${id}/pin] Error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
