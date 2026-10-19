import { prisma } from "@/lib/db";
import { deleteMediaObject } from "@/lib/r2";
import crypto from "crypto";

export interface ExecuteErasureResult {
  success: boolean;
  weddingSlug: string;
  erasedAt: string;
  photosPurged: number;
}

/**
 * Executes a permanent DPDP Act 2023 compliant data erasure.
 * Strictly redacts and anonymizes all couple, guest, and financial personal identifiers
 * and purges all media objects from Cloudflare R2.
 */
export async function executeWeddingErasure(
  weddingSlug: string,
  actorId: string,
): Promise<ExecuteErasureResult> {
  const wedding = await prisma.wedding.findUnique({
    where: { slug: weddingSlug },
    include: {
      photos: true,
      members: true,
    },
  });

  if (!wedding) {
    throw new Error(`Wedding '${weddingSlug}' not found.`);
  }

  // 1. Purge all media objects from Cloudflare R2
  let purgedCount = 0;
  for (const photo of wedding.photos) {
    if (photo.keyOriginal) await deleteMediaObject(photo.keyOriginal);
    if (photo.keyPreview) await deleteMediaObject(photo.keyPreview);
    if (photo.keyThumb) await deleteMediaObject(photo.keyThumb);
    purgedCount++;
  }

  // 2. Anonymize and redact database records in an atomic transaction
  await prisma.$transaction(async (tx) => {
    // Delete photos records
    await tx.photo.deleteMany({
      where: { weddingId: wedding.id },
    });

    // Redact couple user records
    for (const member of wedding.members) {
      await tx.user.update({
        where: { id: member.userId },
        data: {
          fullName: "[Redacted]",
          phone: null,
          email: null,
          deletedAt: new Date(),
        },
      });
    }

    // Redact guest directory
    await tx.guest.updateMany({
      where: { weddingId: wedding.id },
      data: {
        displayName: "[Redacted]",
        phone: null,
        accessToken: null,
        deletedAt: new Date(),
      },
    });

    // Redact RSVP responses
    await tx.eventRsvp.updateMany({
      where: { weddingId: wedding.id },
      data: {
        respondentName: "[Redacted]",
        respondentPhone: null,
        arrivalNotes: null,
        blessingMessage: null,
      },
    });

    // Redact Shagun records (monetary counts preserved for tax balance, PII scrubbed)
    await tx.shagunEntry.updateMany({
      where: { weddingId: wedding.id },
      data: {
        senderName: "[Redacted]",
        upiRefId: null,
        blessingNote: null,
      },
    });

    // Redact wedding core record
    await tx.wedding.update({
      where: { id: wedding.id },
      data: {
        brideName: "[Redacted]",
        groomName: "[Redacted]",
        monogramText: null,
        upiVpa: null,
        videoBiteKey: null,
        liveStreamUrl: null,
        privatePinHash: null,
        status: "archived",
        deletedAt: new Date(),
      },
    });

    // Record audit log entry without plain-text PII (store SHA-256 hash for audit verification)
    const slugHash = crypto.createHash("sha256").update(weddingSlug).digest("hex").slice(0, 16);
    await tx.auditLog.create({
      data: {
        weddingId: wedding.id,
        actorId,
        action: "privacy.erasure",
        detail: {
          slugHash,
          photosPurged: purgedCount,
          timestamp: new Date().toISOString(),
        },
      },
    });
  });

  // 3. Invalidate Next.js cache so the page immediately vanishes
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/${weddingSlug}`);
    revalidatePath(`/${weddingSlug}`, "page");
  } catch {
    // runtime check
  }

  return {
    success: true,
    weddingSlug,
    erasedAt: new Date().toISOString(),
    photosPurged: purgedCount,
  };
}
