import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getPlanDefaults,
  getEffectiveEntitlements,
  applyEntitlementOverride,
  revokeEntitlementOverride,
} from "@/features/entitlements";

interface RouteParams {
  params: { id: string };
}

const EntitlementOverrideSchema = z.object({
  action: z.enum(["override", "revoke"]),
  reason: z.string().trim().min(5, "A clear audit justification (min 5 characters) is required"),
  expiresAt: z.string().datetime().optional(),
  overrides: z
    .object({
      maxPhotos: z.number().int().min(0).max(50000).optional(),
      maxEvents: z.number().int().min(1).max(50).optional(),
      maxVideoBites: z.number().int().min(0).max(100).optional(),
      videoBite: z.boolean().optional(),
      customDomain: z.boolean().optional(),
      canHideBranding: z.boolean().optional(),
      maxGuests: z.number().int().min(0).max(10000).nullable().optional(),
      hostingUntil: z.string().datetime().optional(),
    })
    .optional(),
});

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id },
      select: { id: true, plan: true, createdAt: true, originalsExpireAt: true },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Wedding celebration not found." }, { status: 404 });
    }

    const planDefaults = getPlanDefaults(wedding.plan, wedding.createdAt);
    const effective = await getEffectiveEntitlements(id);

    const history = await prisma.auditLog.findMany({
      where: {
        weddingId: id,
        action: { in: ["entitlement.override", "entitlement.override_revoked"] },
      },
      include: {
        actor: { select: { fullName: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      plan: wedding.plan,
      planDefaults,
      effective,
      history,
    });
  } catch (err: unknown) {
    console.error(`[GET /api/admin/weddings/${id}/entitlements] Error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  try {
    const body: unknown = await req.json();
    const parsed = EntitlementOverrideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { action, reason, expiresAt, overrides } = parsed.data;

    const wedding = await prisma.wedding.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Wedding celebration not found." }, { status: 404 });
    }

    if (action === "revoke") {
      const updated = await revokeEntitlementOverride({
        weddingId: id,
        actorId: session.userId,
        reason,
      });

      return NextResponse.json({
        success: true,
        message: "Entitlement overrides revoked. Celebration restored to canonical plan limits.",
        effective: updated,
      });
    }

    if (!overrides || Object.keys(overrides).length === 0) {
      return NextResponse.json(
        { error: "At least one entitlement override must be specified." },
        { status: 400 },
      );
    }

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : undefined;
    if (parsedExpiresAt && parsedExpiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "Override expiration date must be in the future." },
        { status: 400 },
      );
    }

    const updated = await applyEntitlementOverride({
      weddingId: id,
      actorId: session.userId,
      reason,
      overrides,
      expiresAt: parsedExpiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Entitlement override applied and audited successfully.",
      effective: updated,
    });
  } catch (err: unknown) {
    console.error(`[POST /api/admin/weddings/${id}/entitlements] Error:`, err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
