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
