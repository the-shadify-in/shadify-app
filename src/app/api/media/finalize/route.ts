import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import {
  headMediaObject,
  getMediaBuffer,
  putMediaBuffer,
  deleteMediaObject,
  getPublicMediaUrl,
} from "@/lib/r2";
import {
  validateImageMagicBytes,
  stripExifAndOptimize,
  stripExifFromOriginal,
  MAX_PHOTO_BYTES,
} from "@/lib/media/image-processor";
import { PRICING_PLANS } from "@/lib/config/pricing";

const FinalizeSchema = z.object({
  weddingSlug: z.string().trim().toLowerCase(),
  key: z.string().trim().min(5),
  eventId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate: staff session or crew pass token
    const session = await getAdminSession();
    const crewToken = req.headers.get("x-crew-token");

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

    // 2. Validate input payload
    const body = await req.json();
    const parse = FinalizeSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parse.error.format() },
        { status: 400 },
      );
    }

    const { weddingSlug, key, eventId } = parse.data;

    // 3. Look up wedding and verify lifecycle & entitlements
    const wedding = await prisma.wedding.findUnique({
      where: { slug: weddingSlug },
      include: { entitlement: true },
    });

    if (!wedding || wedding.deletedAt) {
      return NextResponse.json({ error: "Wedding not found." }, { status: 404 });
    }

    if (crewPassWeddingId && crewPassWeddingId !== wedding.id) {
      return NextResponse.json({ error: "Crew pass invalid for this wedding." }, { status: 403 });
    }

    // 4. Inspect real uploaded object in R2
    const head = await headMediaObject(key);
    if (!head || head.contentLength <= 0) {
      return NextResponse.json({ error: "Uploaded file not found in storage." }, { status: 404 });
    }

    // Enforce real byte size limit
    if (head.contentLength > MAX_PHOTO_BYTES) {
      await deleteMediaObject(key);
      return NextResponse.json(
        { error: `File exceeds maximum allowed limit of 25 MB.` },
        { status: 400 },
      );
    }

    // 5. Read raw bytes back from R2 to execute Sharp processing
    const rawBuffer = await getMediaBuffer(key);
    if (!rawBuffer) {
      return NextResponse.json({ error: "Failed to read storage object." }, { status: 500 });
    }

    // Validate true binary file header (magic numbers)
    const magicCheck = validateImageMagicBytes(rawBuffer);
    if (!magicCheck.valid) {
      await deleteMediaObject(key);
      return NextResponse.json(
        { error: magicCheck.error || "Corrupted or disallowed media format." },
        { status: 400 },
      );
    }

    // 6. Execute Sharp pipeline: strip EXIF GPS from original & generate responsive WebP preview and thumb
    const sanitizedOriginal = await stripExifFromOriginal(rawBuffer, magicCheck.detectedMime);
    await putMediaBuffer(key, sanitizedOriginal.buffer, magicCheck.detectedMime || "image/jpeg");

    const previewResult = await stripExifAndOptimize(rawBuffer, {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 85,
      format: "webp",
    });

    const thumbResult = await stripExifAndOptimize(rawBuffer, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 75,
      format: "webp",
    });

    // Write back optimized, EXIF-scrubbed preview and thumb to R2
    const baseKey = key.replace(/\.[^/.]+$/, "");
    const previewKey = `${baseKey}_preview.webp`;
    const thumbKey = `${baseKey}_thumb.webp`;

    await putMediaBuffer(previewKey, previewResult.buffer, "image/webp");
    await putMediaBuffer(thumbKey, thumbResult.buffer, "image/webp");

    // Compute SHA-256 hash of original file for deduplication audit
    const sha256 = crypto.createHash("sha256").update(sanitizedOriginal.buffer).digest("hex");

    // 7. Atomic Quota Enforcement in PostgreSQL Transaction
    const planConfig = PRICING_PLANS[wedding.plan];
    const maxAllowedPhotos = wedding.entitlement?.maxPhotos || planConfig.maxPhotos;

    const result = await prisma.$transaction(async (tx) => {
      const currentCount = await tx.photo.count({
        where: { weddingId: wedding.id },
      });

      if (currentCount >= maxAllowedPhotos) {
        throw new Error("PHOTO_QUOTA_EXCEEDED");
      }

      const photo = await tx.photo.create({
        data: {
          weddingId: wedding.id,
          eventId: eventId || null,
          uploadedBy: session?.userId || null,
          keyOriginal: key,
          keyPreview: previewKey,
          keyThumb: thumbKey,
          width: previewResult.width,
          height: previewResult.height,
          bytesOriginal: BigInt(head.contentLength),
          sha256,
          status: "approved",
          visibility: "visibility_public",
        },
      });

      return photo;
    });

    return NextResponse.json({
      success: true,
      photoId: result.id,
      previewUrl: getPublicMediaUrl(previewKey),
      thumbUrl: getPublicMediaUrl(thumbKey),
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PHOTO_QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Wedding photo upload limit reached for this plan." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred during media finalization." },
      { status: 500 },
    );
  }
}
