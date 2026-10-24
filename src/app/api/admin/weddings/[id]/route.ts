import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession, hashPassword } from "@/lib/auth";
import { logRequest } from "@/lib/log";
import { THEME_PRESETS, validateContrast, type PresetId } from "@/lib/themes/tokens";
import { getEffectiveEntitlements } from "@/features/entitlements";

interface RouteParams {
  params: { id: string };
}

const UpdateWeddingSchema = z.object({
  brideName: z.string().min(1).max(100).optional(),
  groomName: z.string().min(1).max(100).optional(),
  weddingDate: z.string().optional(),
  status: z.enum(["draft", "preview", "published", "archived", "expired"]).optional(),
  plan: z.enum(["lite", "premium", "platinum"]).optional(),
  defaultLocale: z.string().min(2).max(10).optional(),
  themeId: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  monogramText: z.string().max(10).optional().nullable(),
  upiVpa: z.string().max(100).optional().nullable(),
  showBranding: z.boolean().optional(),
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Must be a valid domain format")
    .optional()
    .nullable()
    .or(z.literal("")),
  liveStreamUrl: z.string().url().optional().nullable().or(z.literal("")),
  themeConfig: z.record(z.string(), z.unknown()).optional().nullable(),
  privatePin: z
    .string()
    .regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits")
    .optional()
    .nullable()
    .or(z.literal("")),
  actionReason: z.string().max(255).optional(),
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
      include: {
        events: { orderBy: { sortOrder: "asc" } },
        vips: { orderBy: { sortOrder: "asc" } },
        aliases: { orderBy: { createdAt: "desc" } },
        qrAssets: { orderBy: { createdAt: "desc" }, include: { scanTests: true } },
        consents: { orderBy: { grantedAt: "desc" } },
        entitlement: true,
        rsvps: { orderBy: { createdAt: "desc" } },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
    }

    return NextResponse.json({ wedding });
  } catch (err: unknown) {
    console.error(`[GET /api/admin/weddings/${id}] Error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  try {
    const body: unknown = await req.json();
    const parsed = UpdateWeddingSchema.parse(body);

    const existing = await prisma.wedding.findUnique({
      where: { id },
      include: { aliases: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
    }

    // Contrast validation if colors are changed
    if (parsed.primaryColor || parsed.accentColor || parsed.themeId) {
      const targetPresetId = (parsed.themeId || existing.themeId) as PresetId;
      const basePreset = THEME_PRESETS[targetPresetId] || THEME_PRESETS["royal-crimson"];
      const resolvedPrimary =
        parsed.primaryColor || existing.primaryColor || basePreset.palette.primary;
      const resolvedAccent =
        parsed.accentColor || existing.accentColor || basePreset.palette.accent;

      const report = validateContrast({
        ...basePreset.palette,
        primary: resolvedPrimary,
        accent: resolvedAccent,
      });

      if (!report.ok) {
        return NextResponse.json(
          {
            error: "Color contrast failed accessibility standards",
            details: report.errors.map((e) => e.message),
          },
          { status: 400 },
        );
      }
    }

    // Entitlement Gates for commercial upgrades
    const effective = await getEffectiveEntitlements(id);

    if (parsed.showBranding === false && !effective.canHideBranding) {
      return NextResponse.json(
        {
          error:
            "The Lite plan includes Shadify branding. Upgrade to Premium or Platinum to remove branding.",
        },
        { status: 403 },
      );
    }

    if (parsed.customDomain && !effective.customDomain) {
      return NextResponse.json(
        {
          error: "Custom wedding domains require the Platinum plan.",
        },
        { status: 403 },
      );
    }

    // Build update payload
    const updateData: Record<string, unknown> = {};
    if (parsed.brideName !== undefined) updateData.brideName = parsed.brideName;
    if (parsed.groomName !== undefined) updateData.groomName = parsed.groomName;
    if (parsed.weddingDate !== undefined) updateData.weddingDate = new Date(parsed.weddingDate);
    if (parsed.status !== undefined) {
      updateData.status = parsed.status;
      if (parsed.status === "published" && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (parsed.plan !== undefined) updateData.plan = parsed.plan;
    if (parsed.defaultLocale !== undefined) updateData.defaultLocale = parsed.defaultLocale;
    if (parsed.themeId !== undefined) updateData.themeId = parsed.themeId;
    if (parsed.primaryColor !== undefined) updateData.primaryColor = parsed.primaryColor;
    if (parsed.accentColor !== undefined) updateData.accentColor = parsed.accentColor;
    if (parsed.monogramText !== undefined) updateData.monogramText = parsed.monogramText;
    if (parsed.upiVpa !== undefined) updateData.upiVpa = parsed.upiVpa;
    if (parsed.showBranding !== undefined) updateData.showBranding = parsed.showBranding;
    if (parsed.customDomain !== undefined) {
      updateData.customDomain = parsed.customDomain
        ? parsed.customDomain.trim().toLowerCase()
        : null;
    }
    if (parsed.liveStreamUrl !== undefined) updateData.liveStreamUrl = parsed.liveStreamUrl || null;
    if (parsed.themeConfig !== undefined) updateData.themeConfig = parsed.themeConfig;
    if (parsed.privatePin !== undefined) {
      if (parsed.privatePin && parsed.privatePin.trim() !== "") {
        updateData.privatePinHash = await hashPassword(parsed.privatePin.trim());
      } else {
        updateData.privatePinHash = null;
      }
    }

    const [updated] = await prisma.$transaction([
      prisma.wedding.update({
        where: { id },
        data: updateData,
      }),
      prisma.auditLog.create({
        data: {
          weddingId: id,
          actorId: session.userId,
          action:
            parsed.status && parsed.status !== existing.status
              ? `status_change_to_${parsed.status}`
              : parsed.privatePin !== undefined
                ? parsed.privatePin
                  ? "wedding_pin_set"
                  : "wedding_pin_cleared"
                : "staff_update_wedding",
          detail: {
            changes: Object.keys(updateData),
            reason: parsed.actionReason || "Staff concierge edit",
            actorRole: session.role,
          },
        },
      }),
    ]);

    // On-demand revalidation of main slug and all associated aliases
    revalidatePath(`/${existing.slug}`);
    revalidatePath(`/${existing.slug}`, "page");
    for (const alias of existing.aliases) {
      revalidatePath(`/${alias.alias}`);
      revalidatePath(`/${alias.alias}`, "page");
    }

    logRequest({
      requestId,
      route: `/api/admin/weddings/${id}`,
      method: "PATCH",
      status: 200,
      durationMs: Date.now() - startTime,
      weddingId: id,
    });

    const serializedWedding = {
      ...updated,
      hasPrivatePin: Boolean(updated.privatePinHash),
      privatePinHash: undefined,
    };

    return NextResponse.json({ success: true, wedding: serializedWedding });
  } catch (err: unknown) {
    console.error(`[PATCH /api/admin/weddings/${id}] Error:`, err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
