import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { executeWeddingErasure } from "@/features/privacy/erasure";
import crypto from "crypto";

// Check if PostgreSQL is available and responsive
let isDbAvailable = false;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbAvailable = true;
  } catch {
    isDbAvailable = false;
    console.warn(
      "⚠️ PostgreSQL not reachable on DATABASE_URL. Real-Postgres tests will skip when run locally without Postgres.",
    );
  }
});

describe("Real PostgreSQL Database Protections, Isolation & Erasure Suite", () => {
  // Clean up any test records created during testing
  const createdWeddingIds: string[] = [];
  const createdUserIds: string[] = [];

  afterAll(async () => {
    if (!isDbAvailable) return;
    try {
      if (createdWeddingIds.length > 0) {
        await prisma.wedding.deleteMany({
          where: { id: { in: createdWeddingIds } },
        });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
    } catch {
      // Best-effort cleanup
    }
  });

  // -------------------------------------------------------------------------
  // 1. Checklist Item A10: Database Constraints & Triggers
  // -------------------------------------------------------------------------
  describe("A10: Database Protections & Constraints", () => {
    it("rejects reserved wedding slugs (admin, api, etc.) via trigger trg_block_reserved_slug", async () => {
      if (!isDbAvailable) return;

      const randomSuffix = crypto.randomUUID().slice(0, 8);
      const testEmail = `trigger-test-${randomSuffix}@example.com`;

      const user = await prisma.user.create({
        data: {
          email: testEmail,
          fullName: "Reserved Slug Test User",
          role: "couple",
        },
      });
      createdUserIds.push(user.id);

      // Attempt inserting wedding with reserved slug 'admin'
      await expect(
        prisma.wedding.create({
          data: {
            slug: "admin",
            brideName: "Test Bride",
            groomName: "Test Groom",
            weddingDate: new Date("2026-12-01"),
          },
        }),
      ).rejects.toThrow(/reserved/i);

      // Attempt inserting wedding with reserved slug 'api'
      await expect(
        prisma.wedding.create({
          data: {
            slug: "api",
            brideName: "Test Bride",
            groomName: "Test Groom",
            weddingDate: new Date("2026-12-01"),
          },
        }),
      ).rejects.toThrow(/reserved/i);
    });

    it("enforces chk_wedding_slug regex: rejects >40 chars, trailing hyphens, uppercase", async () => {
      if (!isDbAvailable) return;

      // 1. Slug exceeding 40 characters (e.g. 43 characters: 'erased-' + 36-char UUID)
      const long43CharSlug = `erased-${crypto.randomUUID()}`; // 7 + 36 = 43 chars
      expect(long43CharSlug.length).toBe(43);

      await expect(
        prisma.wedding.create({
          data: {
            slug: long43CharSlug,
            brideName: "Test Bride",
            groomName: "Test Groom",
            weddingDate: new Date("2026-12-01"),
          },
        }),
      ).rejects.toThrow();

      // 2. Trailing hyphen (fails regex requirement for ending in [a-z0-9])
      await expect(
        prisma.wedding.create({
          data: {
            slug: "invalid-slug-",
            brideName: "Test Bride",
            groomName: "Test Groom",
            weddingDate: new Date("2026-12-01"),
          },
        }),
      ).rejects.toThrow();

      // 3. Uppercase characters
      await expect(
        prisma.wedding.create({
          data: {
            slug: "Invalid-Upper-Slug",
            brideName: "Test Bride",
            groomName: "Test Groom",
            weddingDate: new Date("2026-12-01"),
          },
        }),
      ).rejects.toThrow();

      // 4. Valid 39-character tombstone slug ('erased-' + 32 hex chars) SUCCEEDS
      const valid39CharSlug = `erased-${crypto.randomUUID().replace(/-/g, "").toLowerCase()}`;
      expect(valid39CharSlug.length).toBe(39);

      const validWedding = await prisma.wedding.create({
        data: {
          slug: valid39CharSlug,
          brideName: "Valid Bride",
          groomName: "Valid Groom",
          weddingDate: new Date("2026-12-01"),
        },
      });
      createdWeddingIds.push(validWedding.id);
      expect(validWedding.slug).toBe(valid39CharSlug);
    });

    it("enforces chk_user_contact: rejects user when both email and phone are null", async () => {
      if (!isDbAvailable) return;

      await expect(
        prisma.user.create({
          data: {
            email: null,
            phone: null,
            fullName: "No Contact User",
            role: "couple",
          },
        }),
      ).rejects.toThrow();
    });

    it("allows shared phone for multiple family RSVPs (uq_rsvp_event_phone_name), but rejects exact duplicate name + phone", async () => {
      if (!isDbAvailable) return;

      const randomSuffix = crypto.randomUUID().slice(0, 8);
      const testSlug = `rsvp-test-${randomSuffix}`;

      const wedding = await prisma.wedding.create({
        data: {
          slug: testSlug,
          brideName: "RSVP Bride",
          groomName: "RSVP Groom",
          weddingDate: new Date("2026-12-01"),
          events: {
            create: {
              eventType: "sangeet",
              title: "Family Sangeet Night",
              startsAt: new Date("2026-12-01T18:00:00Z"),
              venueName: "Grand Ballroom",
            },
          },
        },
        include: { events: true },
      });
      createdWeddingIds.push(wedding.id);

      const event = wedding.events[0];
      expect(event).toBeDefined();
      if (!event) return;

      const sharedPhone = "9876543210";

      // RSVP 1: Aunt Geeta with sharedPhone -> SUCCEEDS
      const rsvp1 = await prisma.eventRsvp.create({
        data: {
          weddingId: wedding.id,
          eventId: event.id,
          respondentName: "Aunt Geeta",
          respondentPhone: sharedPhone,
          attending: true,
          partySize: 1,
        },
      });
      expect(rsvp1.id).toBeDefined();

      // RSVP 2: Uncle Ramesh with SAME sharedPhone -> SUCCEEDS (different name, same family phone)
      const rsvp2 = await prisma.eventRsvp.create({
        data: {
          weddingId: wedding.id,
          eventId: event.id,
          respondentName: "Uncle Ramesh",
          respondentPhone: sharedPhone,
          attending: true,
          partySize: 2,
        },
      });
      expect(rsvp2.id).toBeDefined();

      // RSVP 3: Duplicate Aunt Geeta with SAME sharedPhone on SAME event -> REJECTED by uq_rsvp_event_phone_name
      await expect(
        prisma.eventRsvp.create({
          data: {
            weddingId: wedding.id,
            eventId: event.id,
            respondentName: "Aunt Geeta",
            respondentPhone: sharedPhone,
            attending: true,
            partySize: 1,
          },
        }),
      ).rejects.toThrow();
    });

    it("T2 & T3: blocks newly reserved slug 'pricing' and prevents mutation of reserved_slugs table", async () => {
      if (!isDbAvailable) return;

      // T2: 'pricing' must FAIL
      await expect(
        prisma.wedding.create({
          data: {
            slug: "pricing",
            brideName: "Test Bride",
            groomName: "Test Groom",
            weddingDate: new Date("2026-12-01"),
          },
        }),
      ).rejects.toThrow(/reserved/i);

      // T3: mutations on reserved_slugs table must FAIL via trigger
      await expect(
        prisma.$executeRaw`INSERT INTO reserved_slugs VALUES ('hello')`,
      ).rejects.toThrow();

      await expect(
        prisma.$executeRaw`UPDATE reserved_slugs SET slug='x' WHERE slug='admin'`,
      ).rejects.toThrow();

      await expect(
        prisma.$executeRaw`DELETE FROM reserved_slugs WHERE slug='admin'`,
      ).rejects.toThrow();

      await expect(prisma.$executeRaw`TRUNCATE reserved_slugs`).rejects.toThrow();
    });

    it("T6: tombstone users succeed with unique emails, but static '[Redacted]' collides and null/null fails", async () => {
      if (!isDbAvailable) return;

      const suffix = crypto.randomUUID().slice(0, 8);

      // 1. Two tombstone users with unique tombstones SUCCEED
      const u1 = await prisma.user.create({
        data: {
          email: `erased-${suffix}-1@invalid.example`,
          phone: `erased:${suffix}:1`,
          fullName: "[Redacted]",
          role: "couple",
        },
      });
      createdUserIds.push(u1.id);

      const u2 = await prisma.user.create({
        data: {
          email: `erased-${suffix}-2@invalid.example`,
          phone: `erased:${suffix}:2`,
          fullName: "[Redacted]",
          role: "couple",
        },
      });
      createdUserIds.push(u2.id);

      // 2. Inserting first user with '[Redacted]' email succeeds
      const r1 = await prisma.user.create({
        data: {
          email: `[Redacted]-email-${suffix}`,
          phone: `[Redacted]-phone-${suffix}`,
          fullName: "Static Redacted 1",
          role: "couple",
        },
      });
      createdUserIds.push(r1.id);

      // 3. Second user with identical '[Redacted]' email FAILS on unique constraint
      await expect(
        prisma.user.create({
          data: {
            email: `[Redacted]-email-${suffix}`,
            phone: `other-phone-${suffix}`,
            fullName: "Static Redacted 2",
            role: "couple",
          },
        }),
      ).rejects.toThrow();

      // 4. Updating user to email = null, phone = null FAILS chk_user_contact
      await expect(
        prisma.user.update({
          where: { id: u1.id },
          data: { email: null, phone: null },
        }),
      ).rejects.toThrow();
    });

    it("T7: enforces case and whitespace normalization on RSVP unique constraint ('Ravi' vs '  ravi  ')", async () => {
      if (!isDbAvailable) return;

      const randomSuffix = crypto.randomUUID().slice(0, 8);
      const wedding = await prisma.wedding.create({
        data: {
          slug: `rsvp-case-${randomSuffix}`,
          brideName: "Bride",
          groomName: "Groom",
          weddingDate: new Date("2026-12-01"),
          events: {
            create: {
              eventType: "reception",
              title: "Reception",
              startsAt: new Date("2026-12-01T19:00:00Z"),
              venueName: "Hall",
            },
          },
        },
        include: { events: true },
      });
      createdWeddingIds.push(wedding.id);

      const event = wedding.events[0];
      expect(event).toBeDefined();
      if (!event) return;

      const phone = "+919876543210";

      // 1. Initial RSVP with 'Ravi'
      await prisma.eventRsvp.create({
        data: {
          weddingId: wedding.id,
          eventId: event.id,
          respondentName: "Ravi",
          respondentPhone: phone,
          attending: true,
          partySize: 1,
        },
      });

      // 2. Sibling with same phone but different name 'Sita' SUCCEEDS
      const sitaRsvp = await prisma.eventRsvp.create({
        data: {
          weddingId: wedding.id,
          eventId: event.id,
          respondentName: "Sita",
          respondentPhone: phone,
          attending: true,
          partySize: 1,
        },
      });
      expect(sitaRsvp.id).toBeDefined();

      // 3. Duplicate with leading/trailing whitespace and different case '  ravi  ' FAILS
      await expect(
        prisma.eventRsvp.create({
          data: {
            weddingId: wedding.id,
            eventId: event.id,
            respondentName: "  ravi  ",
            respondentPhone: phone,
            attending: true,
            partySize: 1,
          },
        }),
      ).rejects.toThrow();
    });

    it("T8: enforces database check constraints (party_size <= 20, theme_version >= 1, theme_config type)", async () => {
      if (!isDbAvailable) return;

      const randomSuffix = crypto.randomUUID().slice(0, 8);
      const wedding = await prisma.wedding.create({
        data: {
          slug: `checks-test-${randomSuffix}`,
          brideName: "Bride",
          groomName: "Groom",
          weddingDate: new Date("2026-12-01"),
          events: {
            create: {
              eventType: "sangeet",
              title: "Sangeet",
              startsAt: new Date("2026-12-01T19:00:00Z"),
              venueName: "Hall",
            },
          },
        },
        include: { events: true },
      });
      createdWeddingIds.push(wedding.id);

      const event = wedding.events[0];
      expect(event).toBeDefined();
      if (!event) return;

      // 1. Party size 99 (> 20) FAILS chk_rsvp_party_size
      await expect(
        prisma.eventRsvp.create({
          data: {
            weddingId: wedding.id,
            eventId: event.id,
            respondentName: "Party Giant",
            respondentPhone: "9876500000",
            attending: true,
            partySize: 99,
          },
        }),
      ).rejects.toThrow();

      // 2. theme_config as JSON array ('[]') FAILS chk_wedding_theme_config
      await expect(
        prisma.$executeRaw`UPDATE weddings SET theme_config='[]'::jsonb WHERE id = ${wedding.id}::uuid`,
      ).rejects.toThrow();

      // 3. theme_version = 0 (< 1) FAILS chk_wedding_theme_version
      await expect(
        prisma.$executeRaw`UPDATE weddings SET theme_version=0 WHERE id = ${wedding.id}::uuid`,
      ).rejects.toThrow();
    });

    it("T9: enforces chk_order_amounts: gst_paise must not exceed amount_paise", async () => {
      if (!isDbAvailable) return;

      // gst_paise 500000 > amount_paise 299900 FAILS
      await expect(
        prisma.order.create({
          data: {
            weddingSlugCopy: "sample-slug",
            billingName: "Customer",
            billingPhone: "9876543210",
            item: "plan_lite",
            amountPaise: 299900,
            gstPaise: 500000,
          },
        }),
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Checklist Item A9: Multi-Tenant Wedding Isolation against Real Postgres
  // -------------------------------------------------------------------------
  describe("A9: Tenant Isolation against Real Postgres", () => {
    it("strictly isolates wedding data: wedding A never reads wedding B events, RSVPs or guests", async () => {
      if (!isDbAvailable) return;

      const suffixA = crypto.randomUUID().slice(0, 8);
      const suffixB = crypto.randomUUID().slice(0, 8);

      // Seed Wedding A
      const weddingA = await prisma.wedding.create({
        data: {
          slug: `tenant-a-${suffixA}`,
          brideName: "Bride A",
          groomName: "Groom A",
          weddingDate: new Date("2026-11-10"),
          events: {
            create: [
              {
                eventType: "mehendi",
                title: "Wedding A Mehendi",
                startsAt: new Date("2026-11-10T14:00:00Z"),
                venueName: "Villa A",
              },
            ],
          },
          guests: {
            create: [
              {
                displayName: "Guest Alpha",
                phone: "9111111111",
              },
            ],
          },
        },
        include: { events: true, guests: true },
      });
      createdWeddingIds.push(weddingA.id);

      // Seed Wedding B
      const weddingB = await prisma.wedding.create({
        data: {
          slug: `tenant-b-${suffixB}`,
          brideName: "Bride B",
          groomName: "Groom B",
          weddingDate: new Date("2026-11-20"),
          events: {
            create: [
              {
                eventType: "reception",
                title: "Wedding B Reception",
                startsAt: new Date("2026-11-20T19:00:00Z"),
                venueName: "Palace B",
              },
            ],
          },
          guests: {
            create: [
              {
                displayName: "Guest Beta",
                phone: "9222222222",
              },
            ],
          },
        },
        include: { events: true, guests: true },
      });
      createdWeddingIds.push(weddingB.id);

      // Query scoped by Wedding A
      const eventsForA = await prisma.event.findMany({
        where: { weddingId: weddingA.id },
      });
      const guestsForA = await prisma.guest.findMany({
        where: { weddingId: weddingA.id },
      });

      // Verification: Wedding A only sees its own data
      expect(eventsForA).toHaveLength(1);
      expect(eventsForA[0]?.title).toBe("Wedding A Mehendi");
      expect(guestsForA).toHaveLength(1);
      expect(guestsForA[0]?.displayName).toBe("Guest Alpha");

      // Verify that querying Wedding B's event ID using Wedding A's weddingId returns null
      const eventBId = weddingB.events[0]?.id;
      expect(eventBId).toBeDefined();

      const crossTenantQuery = await prisma.event.findFirst({
        where: {
          id: eventBId,
          weddingId: weddingA.id, // Scoped to A
        },
      });
      expect(crossTenantQuery).toBeNull();
    });

    it("strictly isolates photos and RSVPs across tenants: negative read, update, delete, and cross-reference checks", async () => {
      if (!isDbAvailable) return;

      const suffixA = crypto.randomUUID().slice(0, 8);
      const suffixB = crypto.randomUUID().slice(0, 8);

      // Seed Wedding A with an Event
      const weddingA = await prisma.wedding.create({
        data: {
          slug: `photo-tenant-a-${suffixA}`,
          brideName: "Bride A",
          groomName: "Groom A",
          weddingDate: new Date("2026-11-15"),
          events: {
            create: [
              {
                eventType: "sangeet",
                title: "Wedding A Sangeet",
                startsAt: new Date("2026-11-15T18:00:00Z"),
                venueName: "Venue A",
              },
            ],
          },
        },
        include: { events: true },
      });
      createdWeddingIds.push(weddingA.id);

      // Seed Wedding B with an Event
      const weddingB = await prisma.wedding.create({
        data: {
          slug: `photo-tenant-b-${suffixB}`,
          brideName: "Bride B",
          groomName: "Groom B",
          weddingDate: new Date("2026-11-25"),
          events: {
            create: [
              {
                eventType: "reception",
                title: "Wedding B Reception",
                startsAt: new Date("2026-11-25T19:00:00Z"),
                venueName: "Venue B",
              },
            ],
          },
        },
        include: { events: true },
      });
      createdWeddingIds.push(weddingB.id);

      const eventAId = weddingA.events[0]?.id;
      expect(eventAId).toBeDefined();

      // Seed a photo belonging to Wedding A
      const photoA = await prisma.photo.create({
        data: {
          weddingId: weddingA.id,
          eventId: eventAId,
          keyPreview: `weddings/${weddingA.id}/photos/photoA_preview.webp`,
          keyThumb: `weddings/${weddingA.id}/photos/photoA_thumb.webp`,
          width: 1920,
          height: 1080,
          sha256: crypto.createHash("sha256").update(`photo-a-${suffixA}`).digest("hex"),
          status: "approved",
          visibility: "visibility_public",
        },
      });

      // Seed an RSVP belonging to Wedding A
      const rsvpA = await prisma.eventRsvp.create({
        data: {
          weddingId: weddingA.id,
          eventId: eventAId!,
          respondentName: "Family of Alpha",
          respondentPhone: "9888888888",
          attending: true,
          partySize: 3,
        },
      });

      // 1. Negative Photo Read Check:
      // Wedding B queries photos: must return 0 records
      const photosForB = await prisma.photo.findMany({
        where: { weddingId: weddingB.id },
      });
      expect(photosForB).toHaveLength(0);

      // Direct read of Photo A with Wedding B scope: must return null
      const crossPhotoRead = await prisma.photo.findFirst({
        where: {
          id: photoA.id,
          weddingId: weddingB.id,
        },
      });
      expect(crossPhotoRead).toBeNull();

      // 2. Negative Photo Mutation & Deletion Check:
      // Attempting to update Photo A with Wedding B scope must touch 0 records
      const crossPhotoUpdate = await prisma.photo.updateMany({
        where: {
          id: photoA.id,
          weddingId: weddingB.id,
        },
        data: { status: "rejected" },
      });
      expect(crossPhotoUpdate.count).toBe(0);

      // Verify Photo A was NOT modified
      const verifiedPhotoA = await prisma.photo.findUnique({ where: { id: photoA.id } });
      expect(verifiedPhotoA?.status).toBe("approved");

      // Attempting to delete Photo A with Wedding B scope must delete 0 records
      const crossPhotoDelete = await prisma.photo.deleteMany({
        where: {
          id: photoA.id,
          weddingId: weddingB.id,
        },
      });
      expect(crossPhotoDelete.count).toBe(0);

      // Verify Photo A still exists
      const intactPhotoA = await prisma.photo.findUnique({ where: { id: photoA.id } });
      expect(intactPhotoA).not.toBeNull();

      // 3. Negative RSVP Read & Mutation Check:
      // Wedding B queries RSVPs: must return 0 records
      const rsvpsForB = await prisma.eventRsvp.findMany({
        where: { weddingId: weddingB.id },
      });
      expect(rsvpsForB).toHaveLength(0);

      // Direct read of RSVP A with Wedding B scope: must return null
      const crossRsvpRead = await prisma.eventRsvp.findFirst({
        where: {
          id: rsvpA.id,
          weddingId: weddingB.id,
        },
      });
      expect(crossRsvpRead).toBeNull();

      // Attempting to update RSVP A with Wedding B scope must touch 0 records
      const crossRsvpUpdate = await prisma.eventRsvp.updateMany({
        where: {
          id: rsvpA.id,
          weddingId: weddingB.id,
        },
        data: { partySize: 100 },
      });
      expect(crossRsvpUpdate.count).toBe(0);

      // Verify RSVP A was NOT modified
      const verifiedRsvpA = await prisma.eventRsvp.findUnique({ where: { id: rsvpA.id } });
      expect(verifiedRsvpA?.partySize).toBe(3);

      // Clean up Photo & RSVP
      await prisma.photo.delete({ where: { id: photoA.id } });
      await prisma.eventRsvp.delete({ where: { id: rsvpA.id } });
    });
  });

  // -------------------------------------------------------------------------
  // 3. Checklist Item A10 & Review Item 1: Consecutive Real Erasures
  // -------------------------------------------------------------------------
  describe("DPDP Act 2023 Real Erasure Engine against Real Postgres", () => {
    it("erases two weddings in a row with multiple users without constraint or unique collision", async () => {
      if (!isDbAvailable) return;

      const suffix1 = crypto.randomUUID().slice(0, 8);
      const suffix2 = crypto.randomUUID().slice(0, 8);

      // Seed Wedding 1 with 2 couple users
      const user1A = await prisma.user.create({
        data: {
          email: `bride1-${suffix1}@example.com`,
          phone: `90001${suffix1.slice(0, 5)}`,
          fullName: "Priya Sharma",
          role: "couple",
        },
      });
      const user1B = await prisma.user.create({
        data: {
          email: `groom1-${suffix1}@example.com`,
          phone: `90002${suffix1.slice(0, 5)}`,
          fullName: "Rahul Verma",
          role: "couple",
        },
      });
      createdUserIds.push(user1A.id, user1B.id);

      const wedding1Slug = `erasure-one-${suffix1}`;
      const wedding1 = await prisma.wedding.create({
        data: {
          slug: wedding1Slug,
          brideName: "Priya",
          groomName: "Rahul",
          weddingDate: new Date("2026-12-15"),
          customDomain: `priyarahul-${suffix1}.com`,
          members: {
            create: [
              { userId: user1A.id, memberRole: "owner" },
              { userId: user1B.id, memberRole: "owner" },
            ],
          },
          events: {
            create: [
              {
                eventType: "sangeet",
                title: "Priya & Rahul Sangeet Gala",
                venueName: "Grand Udaipur Resort",
                startsAt: new Date("2026-12-14T18:00:00Z"),
              },
            ],
          },
          orders: {
            create: [
              {
                weddingSlugCopy: wedding1Slug,
                item: "plan_lite",
                amountPaise: BigInt(29900),
                billingName: "Priya Sharma",
                billingEmail: `billing-${suffix1}@example.com`,
                billingPhone: "9000100000",
                billingAddress: "123 Udaipur Palace Road",
                status: "paid",
              },
            ],
          },
          consents: {
            create: [
              {
                subject: `bride1-${suffix1}@example.com`,
                purpose: "rsvp_contact",
                noticeVersion: "1.0",
              },
            ],
          },
          erasureRequests: {
            create: [
              {
                subject: `bride1-${suffix1}@example.com`,
              },
            ],
          },
        },
      });
      createdWeddingIds.push(wedding1.id);

      // Seed Wedding 2 with 2 couple users
      const user2A = await prisma.user.create({
        data: {
          email: `bride2-${suffix2}@example.com`,
          phone: `90003${suffix2.slice(0, 5)}`,
          fullName: "Ananya Iyer",
          role: "couple",
        },
      });
      const user2B = await prisma.user.create({
        data: {
          email: `groom2-${suffix2}@example.com`,
          phone: `90004${suffix2.slice(0, 5)}`,
          fullName: "Kabir Mehta",
          role: "couple",
        },
      });
      createdUserIds.push(user2A.id, user2B.id);

      const wedding2Slug = `erasure-two-${suffix2}`;
      const wedding2 = await prisma.wedding.create({
        data: {
          slug: wedding2Slug,
          brideName: "Ananya",
          groomName: "Kabir",
          weddingDate: new Date("2026-12-25"),
          customDomain: `ananyakabir-${suffix2}.com`,
          members: {
            create: [
              { userId: user2A.id, memberRole: "owner" },
              { userId: user2B.id, memberRole: "owner" },
            ],
          },
          events: {
            create: [
              {
                eventType: "reception",
                title: "Ananya & Kabir Royal Reception",
                venueName: "Jaipur Palace Lawn",
                startsAt: new Date("2026-12-25T19:00:00Z"),
              },
            ],
          },
          orders: {
            create: [
              {
                weddingSlugCopy: wedding2Slug,
                item: "plan_lite",
                amountPaise: BigInt(49900),
                billingName: "Kabir Mehta",
                billingEmail: `billing-${suffix2}@example.com`,
                billingPhone: "9000400000",
                billingAddress: "456 Jaipur Royal Enclave",
                status: "paid",
              },
            ],
          },
        },
      });
      createdWeddingIds.push(wedding2.id);

      // -----------------------------------------------------------------------
      // Step A: Erase Wedding 1
      // -----------------------------------------------------------------------
      const result1 = await executeWeddingErasure(wedding1Slug, "admin-actor-1");
      expect(result1.success).toBe(true);
      expect(result1.tombstoneSlug).toMatch(/^erased-[a-f0-9]{32}$/);
      expect(result1.tombstoneSlug.length).toBe(39); // 7 + 32 = 39 <= 40

      // Verify Wedding 1 in real Postgres
      const erasedWedding1 = await prisma.wedding.findUnique({
        where: { id: wedding1.id },
        include: { events: true, members: { include: { user: true } }, orders: true },
      });
      expect(erasedWedding1).not.toBeNull();
      expect(erasedWedding1?.status).toBe("archived");
      expect(erasedWedding1?.brideName).toBe("Erased");
      expect(erasedWedding1?.customDomain).toBeNull();
      expect(erasedWedding1?.events[0]?.title).toBe("Private Event");
      expect(erasedWedding1?.events[0]?.venueName).toBe("Private Venue");

      // Verify Users for Wedding 1
      for (const m of erasedWedding1?.members ?? []) {
        expect(m.user.fullName).toBe("Erased User");
        expect(m.user.email).toMatch(/^erased-[a-f0-9]{32}@invalid\.example$/);
        expect(m.user.phone).toMatch(/^erased:[a-f0-9]{32}$/);
      }

      // -----------------------------------------------------------------------
      // Step B: Erase Wedding 2 (CONSECUTIVE ERASURE)
      // Must NOT fail on UNIQUE constraints on users.email, users.phone, or weddings.slug!
      // -----------------------------------------------------------------------
      const result2 = await executeWeddingErasure(wedding2Slug, "admin-actor-1");
      expect(result2.success).toBe(true);
      expect(result2.tombstoneSlug).toMatch(/^erased-[a-f0-9]{32}$/);
      expect(result2.tombstoneSlug.length).toBe(39);
      expect(result2.tombstoneSlug).not.toBe(result1.tombstoneSlug);

      // Verify Wedding 2 in real Postgres
      const erasedWedding2 = await prisma.wedding.findUnique({
        where: { id: wedding2.id },
        include: { events: true, members: { include: { user: true } } },
      });
      expect(erasedWedding2).not.toBeNull();
      expect(erasedWedding2?.status).toBe("archived");
      expect(erasedWedding2?.brideName).toBe("Erased");

      // Verify Users for Wedding 2 have unique tombstones distinct from Wedding 1
      const allErasedUserEmails = [
        ...(erasedWedding1?.members.map((m) => m.user.email) ?? []),
        ...(erasedWedding2?.members.map((m) => m.user.email) ?? []),
      ];
      const uniqueEmails = new Set(allErasedUserEmails);
      expect(uniqueEmails.size).toBe(4); // 4 distinct unique tombstone emails!
    }, 30000);
  });
});
