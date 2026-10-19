import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createPresignedUploadUrl } from "@/lib/r2";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRICING_PLANS } from "@/lib/config/pricing";
import { ALLOWED_MEDIA_MIMES, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES } from "@/lib/media/image-processor";

const PresignRequestSchema = z.object({
  weddingSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Invalid wedding slug format"),
  filename: z.string().trim().min(1).max(255),
  contentType: z.enum(ALLOWED_MEDIA_MIMES),
  fileSizeBytes: z.number().int().positive().optional(),
  tier: z.enum(["preview", "original", "thumb", "video_bite"]).default("preview"),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate: either staff/couple session or valid photographer crew token
    const session = await getAdminSession();
    const crewToken = request.headers.get("x-crew-token");

    let isAuthorized = Boolean(session);
    let crewPassWeddingId: string | null = null;

    if (!isAuthorized && crewToken) {
      const tokenHash = crypto.createHash("sha256").update(crewToken).digest("hex");
      const crewPass = await prisma.crewPass.findUnique({
        where: { tokenHash },
        select: { weddingId: true, expiresAt: true, revokedAt: true },
      });

      if (crewPass && !crewPass.revokedAt && new Date(crewPass.expiresAt).getTime() > Date.now()) {
        isAuthorized = true;
        crewPassWeddingId = crewPass.weddingId;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Validate input schema
    const body: unknown = await request.json();
    const parseResult = PresignRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { weddingSlug, filename, contentType, fileSizeBytes, tier } = parseResult.data;

    // 3. Size limit enforcement
    const isVideo = contentType === "video/mp4" || tier === "video_bite";
    if (fileSizeBytes) {
      const maxAllowedBytes = isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
      if (fileSizeBytes > maxAllowedBytes) {
        const limitMb = isVideo ? "100 MB" : "25 MB";
        return NextResponse.json(
          { error: `File size exceeds maximum allowed limit of ${limitMb}.` },
          { status: 400 },
        );
      }
    }

    // 4. Retrieve wedding and verify lifecycle & plan limits
    const wedding = await prisma.wedding.findUnique({
      where: { slug: weddingSlug },
      select: { id: true, plan: true, status: true, deletedAt: true },
    });

    if (!wedding || wedding.deletedAt) {
      return NextResponse.json({ error: "Wedding celebration not found." }, { status: 404 });
    }

    // If crew pass was used, verify it matches this wedding
    if (crewPassWeddingId && crewPassWeddingId !== wedding.id) {
      return NextResponse.json(
        { error: "Crew pass is not valid for this celebration." },
        { status: 403 },
      );
    }

    if (wedding.status === "archived" || wedding.status === "expired") {
      return NextResponse.json(
        { error: `Wedding is ${wedding.status}. Media uploads are closed.` },
        { status: 403 },
      );
    }

    const planConfig = PRICING_PLANS[wedding.plan];

    // 5. Video bite gate
    if (isVideo) {
      if (planConfig.maxVideoBites <= 0) {
        return NextResponse.json(
          {
            error: `Video bites are not included in the ${planConfig.name} plan. Upgrade to Premium or Platinum.`,
          },
          { status: 403 },
        );
      }
    } else {
      // 6. Photo quota gate
      const currentPhotoCount = await prisma.photo.count({
        where: {
          weddingId: wedding.id,
          status: { not: "rejected" },
        },
      });

      if (currentPhotoCount >= planConfig.maxPhotos) {
        return NextResponse.json(
          {
            error: `Photo storage limit of ${planConfig.maxPhotos} photos reached for ${planConfig.name} plan. Upgrade to upload more moments.`,
            plan: wedding.plan,
            currentCount: currentPhotoCount,
            maxAllowed: planConfig.maxPhotos,
          },
          { status: 403 },
        );
      }
    }

    // 7. Generate safe R2 storage key and presigned URL
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `weddings/${wedding.id}/${tier}/${Date.now()}-${cleanFilename}`;

    const uploadUrl = await createPresignedUploadUrl(key, contentType, 300);

    return NextResponse.json({
      uploadUrl,
      key,
      plan: wedding.plan,
      tier,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
  }
}
