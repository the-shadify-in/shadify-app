import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeWeddingErasure, generateTombstoneEmail, generateTombstonePhone } from "../erasure";
import { prisma } from "@/lib/db";
import { deleteMediaObject } from "@/lib/r2";

vi.mock("@/lib/db", () => ({
  prisma: {
    wedding: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    photo: {
      deleteMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    event: {
      updateMany: vi.fn(),
    },
    guest: {
      updateMany: vi.fn(),
    },
    eventRsvp: {
      updateMany: vi.fn(),
    },
    shagunEntry: {
      updateMany: vi.fn(),
    },
    guestbookEntry: {
      updateMany: vi.fn(),
    },
    vip: {
      updateMany: vi.fn(),
    },
    consent: {
      updateMany: vi.fn(),
    },
    erasureRequest: {
      updateMany: vi.fn(),
    },
    order: {
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: typeof prisma) => Promise<unknown>) => cb(prisma)),
  },
}));

vi.mock("@/lib/r2", () => ({
  deleteMediaObject: vi.fn().mockResolvedValue(true),
}));

describe("DPDP Act 2023 Wedding Data Erasure Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates distinct, RFC-compliant tombstones for emails and phones", () => {
    const id1 = "user-111";
    const id2 = "user-222";

    const email1 = generateTombstoneEmail(id1);
    const email2 = generateTombstoneEmail(id2);
    const phone1 = generateTombstonePhone(id1);
    const phone2 = generateTombstonePhone(id2);

    expect(email1).toBe("erased-user-111@invalid.example");
    expect(email2).toBe("erased-user-222@invalid.example");
    expect(email1).not.toBe(email2);

    expect(phone1).toBe("erased:user-111");
    expect(phone2).toBe("erased:user-222");
    expect(phone1).not.toBe(phone2);
  });

  it("scrubs all PII across users, guests, RSVPs, shagun, orders, and wedding records", async () => {
    const mockWedding = {
      id: "wedding-uuid-123",
      slug: "priya-rahul",
      photos: [
        {
          id: "photo-1",
          keyOriginal: "weddings/123/original/photo1.jpg",
          keyPreview: "weddings/123/preview/photo1.webp",
          keyThumb: "weddings/123/thumb/photo1.webp",
        },
      ],
      members: [
        { userId: "user-bride-id", memberRole: "owner" },
        { userId: "user-groom-id", memberRole: "owner" },
      ],
    };

    vi.mocked(prisma.wedding.findUnique).mockResolvedValue(mockWedding as never);

    const result = await executeWeddingErasure("priya-rahul", "admin-actor-456");

    expect(result.success).toBe(true);
    expect(result.weddingSlug).toBe("priya-rahul");
    expect(result.tombstoneSlug).toMatch(/^erased-[a-f0-9-]+$/);
    expect(result.photosPurged).toBe(1);

    // Verify R2 media files purged
    expect(deleteMediaObject).toHaveBeenCalledWith("weddings/123/original/photo1.jpg");
    expect(deleteMediaObject).toHaveBeenCalledWith("weddings/123/preview/photo1.webp");
    expect(deleteMediaObject).toHaveBeenCalledWith("weddings/123/thumb/photo1.webp");

    // Verify Photo metadata deleted
    expect(prisma.photo.deleteMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding-uuid-123" },
    });

    // Verify User tombstones are distinct and NOT null
    const userUpdateCalls = vi.mocked(prisma.user.update).mock.calls;
    expect(userUpdateCalls.length).toBe(2);

    const firstUserCall = userUpdateCalls[0];
    const secondUserCall = userUpdateCalls[1];
    expect(firstUserCall).toBeDefined();
    expect(secondUserCall).toBeDefined();
    if (!firstUserCall || !secondUserCall) throw new Error("Expected 2 user calls");

    expect(firstUserCall[0].data.email).toMatch(/^erased-[a-f0-9-]+@invalid\.example$/);
    expect(secondUserCall[0].data.email).toMatch(/^erased-[a-f0-9-]+@invalid\.example$/);
    expect(firstUserCall[0].data.email).not.toBe(secondUserCall[0].data.email);

    expect(firstUserCall[0].data.phone).toMatch(/^erased:[a-f0-9-]+$/);
    expect(secondUserCall[0].data.phone).toMatch(/^erased:[a-f0-9-]+$/);
    expect(firstUserCall[0].data.phone).not.toBe(secondUserCall[0].data.phone);

    expect(firstUserCall[0].data.fullName).toBe("Erased User");

    // Verify Guest records redacted
    expect(prisma.guest.updateMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding-uuid-123" },
      data: expect.objectContaining({
        displayName: "Erased Guest",
        phone: null,
        accessToken: null,
      }),
    });

    // Verify RSVP responses redacted
    expect(prisma.eventRsvp.updateMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding-uuid-123" },
      data: expect.objectContaining({
        respondentName: "Erased Guest",
        respondentPhone: null,
        blessingMessage: null,
      }),
    });

    // Verify Shagun entries redacted
    expect(prisma.shagunEntry.updateMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding-uuid-123" },
      data: expect.objectContaining({
        senderName: "Erased Contributor",
        upiRefId: null,
        blessingNote: null,
      }),
    });

    // Verify Guestbook entries redacted
    expect(prisma.guestbookEntry.updateMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding-uuid-123" },
      data: expect.objectContaining({
        authorName: "Erased Guest",
        status: "hidden",
      }),
    });

    // Verify Order PII redacted and slug scrubbed
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding-uuid-123" },
      data: expect.objectContaining({
        weddingSlugCopy: expect.stringMatching(/^erased-/),
        billingName: "Erased Customer",
        billingPhone: "0000000000",
      }),
    });

    // Verify Events are redacted
    expect(prisma.event.updateMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding-uuid-123" },
      data: expect.objectContaining({
        title: "Private Event",
        venueName: "Private Venue",
      }),
    });

    // Verify Consents and ErasureRequests are redacted
    expect(prisma.consent.updateMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding-uuid-123" },
      data: expect.objectContaining({
        subject: "erased-subject",
      }),
    });
    expect(prisma.erasureRequest.updateMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding-uuid-123" },
      data: expect.objectContaining({
        subject: "erased-subject",
      }),
    });

    // Verify Wedding slug is tombstoned away from priya-rahul
    expect(prisma.wedding.update).toHaveBeenCalledWith({
      where: { id: "wedding-uuid-123" },
      data: expect.objectContaining({
        slug: expect.stringMatching(/^erased-[a-f0-9]{32}$/),
        brideName: "Erased",
        groomName: "Erased",
        upiVpa: null,
        status: "archived",
      }),
    });

    // Verify Audit Log has zero plain-text PII (only HMAC-hashed slug)
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weddingId: "wedding-uuid-123",
        action: "privacy.erasure",
        detail: expect.objectContaining({
          slugHmac: expect.any(String),
          photosPurged: 1,
        }),
      }),
    });
  });
});
