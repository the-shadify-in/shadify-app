import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { THEME_PRESETS, validateContrast } from "@/lib/themes/tokens";
import { PRICING_PLANS } from "@/lib/config/pricing";
import { logRequest } from "@/lib/log";

const CreateWeddingSchema = z.object({
  brideName: z.string().trim().min(1, "Bride's name is required").max(60),
  groomName: z.string().trim().min(1, "Groom's name is required").max(60),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  venueCity: z.string().trim().min(2, "Venue city is required").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/,
      "Slug must be 3-40 lowercase alphanumeric characters with hyphens"
    ),
  plan: z.enum(["lite", "premium", "platinum"]).default("lite"),
  themeId: z
    .enum(["royal-crimson", "emerald-gold", "ivory-minimal", "sunset-day", "sunset-dusk"])
    .default("royal-crimson"),
  customPrimary: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  customAccent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  monogramText: z.string().trim().max(8).optional(),
  upiVpa: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/,
      "Must be a valid UPI ID (e.g. name@okhdfcbank)"
    )
    .optional(),
  couplePhone: z
    .string()
    .trim()
    .regex(/^(?:\+91)?[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
  coupleEmail: z.string().trim().email("Invalid email").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // 1. Auth Guard (Concierge Staff Only)
  const session = await getAdminSession();
  if (!session) {
    logRequest({
      requestId,
      route: "/api/admin/weddings",
      method: "POST",
      status: 401,
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = CreateWeddingSchema.parse(body);

    const slug = data.slug.toLowerCase();
    const basePreset = THEME_PRESETS[data.themeId] || THEME_PRESETS["royal-crimson"];

    // 2. Build and Validate Theme Config Overrides on the Server
    const resolvedPalette = {
      ...basePreset.palette,
      primary: data.customPrimary || basePreset.palette.primary,
      accent: data.customAccent || basePreset.palette.accent,
    };

    // Run comprehensive contrast audit
    const contrastReport = validateContrast({
      canvas: resolvedPalette.canvas,
      surface: resolvedPalette.surface,
      text: resolvedPalette.text,
      textMuted: resolvedPalette.textMuted,
      primary: resolvedPalette.primary,
      onPrimary: resolvedPalette.onPrimary,
      accent: resolvedPalette.accent,
      onAccent: resolvedPalette.onAccent,
    });

    if (!contrastReport.ok) {
      return NextResponse.json(
        {
          error: "Selected colors fail accessibility contrast requirements.",
          details: contrastReport.errors,
        },
        { status: 400 }
      );
    }

    const themeConfig = {
      version: 1,
      presetId: data.themeId,
      palette: resolvedPalette,
      typography: basePreset.typography,
      monogram: {
        text: data.monogramText || `${data.brideName[0]} & ${data.groomName[0]}`,
        style: basePreset.monogram.style,
      },
      ornaments: basePreset.ornaments,
      sections: basePreset.sections,
    };

    // Calculate Entitlement Lifecycles
    const weddingDateObj = new Date(data.weddingDate);
    const planConfig = PRICING_PLANS[data.plan];

    const hostingUntil = new Date(weddingDateObj);
    hostingUntil.setFullYear(hostingUntil.getFullYear() + planConfig.hostingDurationYears);

    const originalsExpireAt = new Date(weddingDateObj);
    originalsExpireAt.setDate(originalsExpireAt.getDate() + planConfig.rawOriginalsRetentionDays);

    // Normalize phone number
    const normalizedPhone = data.couplePhone.startsWith("+91")
      ? data.couplePhone
      : `+91${data.couplePhone}`;

    // 3. Atomic Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create the couple owner user
      let coupleUser = await tx.user.findFirst({
        where: { phone: normalizedPhone },
      });

      if (!coupleUser) {
        coupleUser = await tx.user.create({
          data: {
            fullName: `${data.brideName} & ${data.groomName}`,
            phone: normalizedPhone,
            email: data.coupleEmail || null,
            role: "couple",
          },
        });
      }

      // Create the wedding
      const wedding = await tx.wedding.create({
        data: {
          slug,
          brideName: data.brideName,
          groomName: data.groomName,
          weddingDate: weddingDateObj,
          plan: data.plan,
          status: "draft",
          themeId: data.themeId,
          themeConfig: themeConfig,
          themeVersion: 1,
          primaryColor: resolvedPalette.primary,
          accentColor: resolvedPalette.accent,
          monogramText: data.monogramText || `${data.brideName[0]} & ${data.groomName[0]}`,
          upiVpa: data.upiVpa || null,
          showBranding: !planConfig.canHideBranding,
          contentExpiresAt: hostingUntil,
          originalsExpireAt: originalsExpireAt,
        },
      });

      // Link owner membership
      await tx.weddingMember.create({
        data: {
          weddingId: wedding.id,
          userId: coupleUser.id,
          memberRole: "owner",
        },
      });

      // Create Entitlements record
      await tx.entitlement.create({
        data: {
          weddingId: wedding.id,
          hostingUntil: hostingUntil,
          customDomain: planConfig.canCustomDomain,
          videoBite: false,
          faceSearch: false,
          maxPhotos: 500,
        },
      });

      // Audit Log Entry
      await tx.auditLog.create({
        data: {
          weddingId: wedding.id,
          actorId: session.userId,
          action: "wedding.create",
          detail: {
            slug,
            plan: data.plan,
            themeId: data.themeId,
            couplePhone: normalizedPhone,
          },
        },
      });

      return wedding;
    });

    logRequest({
      requestId,
      route: "/api/admin/weddings",
      method: "POST",
      status: 200,
      durationMs: Date.now() - startTime,
      weddingId: result.id,
    });

    return NextResponse.json({
      success: true,
      weddingId: result.id,
      slug: result.slug,
      url: `/w/${result.slug}`,
    });
  } catch (err: unknown) {
    const errorObj = err as Record<string, unknown> | undefined;

    // PostgreSQL Trigger / Check Constraint (block_reserved_slug or slug format)
    if (
      errorObj?.code === "23514" ||
      (typeof errorObj?.message === "string" && errorObj.message.includes("is reserved"))
    ) {
      logRequest({
        requestId,
        route: "/api/admin/weddings",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: "Reserved slug constraint triggered",
      });
      return NextResponse.json(
        {
          error:
            "That wedding URL slug is reserved or contains invalid characters. Please choose another.",
        },
        { status: 409 }
      );
    }

    // Prisma Unique Constraint violation (slug already exists)
    if (errorObj?.code === "P2002") {
      logRequest({
        requestId,
        route: "/api/admin/weddings",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: "Duplicate slug constraint triggered",
      });
      return NextResponse.json(
        { error: "A wedding with this URL slug already exists. Please choose a unique slug." },
        { status: 409 }
      );
    }

    if (err instanceof z.ZodError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings",
        method: "POST",
        status: 400,
        durationMs: Date.now() - startTime,
        error: err.issues[0]?.message,
      });
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input data", details: err.issues },
        { status: 400 }
      );
    }

    logRequest({
      requestId,
      route: "/api/admin/weddings",
      method: "POST",
      status: 500,
      durationMs: Date.now() - startTime,
      error: err,
    });

    return NextResponse.json(
      { error: "An unexpected database error occurred. Please try again." },
      { status: 500 }
    );
  }
}
