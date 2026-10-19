import { prisma } from "@/lib/db";
import { deleteMediaObject } from "@/lib/r2";
import crypto from "crypto";

export interface ExecuteErasureResult {
  success: boolean;
  weddingSlug: string;
  tombstoneSlug: string;
  erasedAt: string;
  photosPurged: number;
}

/**
 * Generates an RFC-compliant, unique tombstone email to satisfy UNIQUE and NOT NULL constraints.
 */
export function generateTombstoneEmail(id: string): string {
  return `erased-${id}@invalid.example`;
}

/**
 * Generates a unique tombstone phone identifier to satisfy UNIQUE constraints without colliding.
 */
export function generateTombstonePhone(id: string): string {
  return `erased:${id}`;
}

/**
 * Executes a permanent DPDP Act 2023 compliant data erasure.
 * Strictly redacts and anonymizes all couple, guest, and financial personal identifiers
 * using unique tombstones to ensure UNIQUE constraints and NOT NULL checks are never violated,
 * and purges all media objects from Cloudflare R2 storage.
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

  // Tombstone slug: 'erased-' (7 chars) + 32 hex chars = 39 chars, strictly satisfying:
  // CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$') [max 40 chars, no trailing hyphens]
  const tombstoneSuffix = crypto.randomUUID().replace(/-/g, "").toLowerCase();
  const tombstoneSlug = `erased-${tombstoneSuffix}`;

  // 2. Anonymize and redact database records in an atomic transaction
  await prisma.$transaction(
    async (tx) => {
      // Delete photo metadata records
      await tx.photo.deleteMany({
        where: { weddingId: wedding.id },
      });

      // Redact couple user records with unique tombstones
      // Crucial: Avoids UNIQUE collisions on multiple erasures while satisfying CHECK (email IS NOT NULL OR phone IS NOT NULL)
      for (const member of wedding.members) {
        const userTombstone = crypto.randomUUID().replace(/-/g, "").toLowerCase();
        await tx.user.update({
          where: { id: member.userId },
          data: {
            fullName: "Erased User",
            email: generateTombstoneEmail(userTombstone),
            phone: generateTombstonePhone(userTombstone),
            passwordHash: null,
            deletedAt: new Date(),
          },
        });
      }

      // Redact events (titles, descriptions, venue details contain names)
      await tx.event.updateMany({
        where: { weddingId: wedding.id },
        data: {
          title: "Private Event",
          description: null,
          venueName: "Private Venue",
          venueAddress: null,
          venueMapUrl: null,
          dressCode: null,
          deletedAt: new Date(),
        },
      });

      // Redact guest directory
      await tx.guest.updateMany({
        where: { weddingId: wedding.id },
        data: {
          displayName: "Erased Guest",
          phone: null,
          accessToken: null,
          deletedAt: new Date(),
        },
      });

      // Redact RSVP responses
      await tx.eventRsvp.updateMany({
        where: { weddingId: wedding.id },
        data: {
          respondentName: "Erased Guest",
          respondentPhone: null,
          arrivalNotes: null,
          blessingMessage: null,
        },
      });

      // Redact Shagun records (monetary tallies preserved for tax/audit integrity, sender PII scrubbed)
      await tx.shagunEntry.updateMany({
        where: { weddingId: wedding.id },
        data: {
          senderName: "Erased Contributor",
          upiRefId: null,
          blessingNote: null,
        },
      });

      // Redact Guestbook entries
      await tx.guestbookEntry.updateMany({
        where: { weddingId: wedding.id },
        data: {
          authorName: "Erased Guest",
          message: "[Message removed under privacy erasure request]",
          status: "hidden",
        },
      });

      // Redact VIP cards
      await tx.vip.updateMany({
        where: { weddingId: wedding.id },
        data: {
          name: "Erased VIP",
          tagline: null,
          linkUrl: null,
        },
      });

      // Redact consents & erasure requests
      await tx.consent.updateMany({
        where: { weddingId: wedding.id },
        data: {
          subject: "erased-subject",
          withdrawnAt: new Date(),
        },
      });

      await tx.erasureRequest.updateMany({
        where: { weddingId: wedding.id },
        data: {
          subject: "erased-subject",
          completedAt: new Date(),
        },
      });

      // Redact orders: scrub billing PII and couple names from slug copy while preserving statutory tax invoice amounts
      await tx.order.updateMany({
        where: { weddingId: wedding.id },
        data: {
          weddingSlugCopy: tombstoneSlug,
          billingName: "Erased Customer",
          billingEmail: generateTombstoneEmail(tombstoneSuffix),
          billingPhone: "0000000000",
          billingAddress: "[Redacted under DPDP Act]",
        },
      });

      // Redact wedding core record (tombstone the slug to scrub couple names like priya-rahul)
      await tx.wedding.update({
        where: { id: wedding.id },
        data: {
          slug: tombstoneSlug,
          brideName: "Erased",
          groomName: "Erased",
          monogramText: null,
          upiVpa: null,
          videoBiteKey: null,
          liveStreamUrl: null,
          privatePinHash: null,
          customDomain: null,
          status: "archived",
          deletedAt: new Date(),
        },
      });

      // Record audit log entry using HMAC with secret key outside database to prevent rainbow-table slug recovery
      const secretKey =
        process.env.ERASURE_HMAC_SECRET ||
        process.env.ADMIN_SESSION_SECRET ||
        "shadify-audit-log-hmac-salt-secret";
      const slugHmac = crypto.createHmac("sha256", secretKey).update(weddingSlug).digest("hex");
      const isUuid =
        Boolean(actorId) &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actorId);

      await tx.auditLog.create({
        data: {
          weddingId: wedding.id,
          actorId: isUuid ? actorId : null,
          action: "privacy.erasure",
          detail: {
            actorRef: isUuid ? undefined : actorId,
            slugHmac,
            photosPurged: purgedCount,
            timestamp: new Date().toISOString(),
          },
        },
      });
    },
    { maxWait: 10000, timeout: 30000 },
  );

  // 3. Invalidate Next.js cache so the old page immediately vanishes
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
    tombstoneSlug,
    erasedAt: new Date().toISOString(),
    photosPurged: purgedCount,
  };
}
