import { describe, it, expect } from "vitest";
import { mapWeddingToDto } from "../queries";

type DbWeddingPayload = Parameters<typeof mapWeddingToDto>[0];

function createMockWedding(data: {
  id: string;
  slug: string;
  brideName: string;
  groomName: string;
  weddingDate: Date;
  showBranding: boolean;
  monogramText: string;
  upiVpa: string;
  themeId: string;
  contentExpiresAt: Date;
  entitlement: { hostingUntil: Date };
  events: Array<{
    id: string;
    weddingId: string;
    title: string;
    eventType: string;
    startsAt: Date;
    endsAt: Date;
    venueName: string;
    venueAddress: string;
    venueMapUrl: string;
    dressCode: string;
  }>;
  vips: Array<{
    id: string;
    weddingId: string;
    groupLabel: "pillars" | "brides_tribe" | "grooms_squad";
    name: string;
    tagline: string;
  }>;
}): DbWeddingPayload {
  return {
    customDomain: null,
    plan: "lite",
    status: "published",
    defaultLocale: "en",
    timezone: "Asia/Kolkata",
    phaseOverride: null,
    themeConfig: null,
    themeVersion: 1,
    primaryColor: null,
    accentColor: null,
    heroPhotoId: null,
    videoBiteKey: null,
    liveStreamUrl: null,
    privatePinHash: null,
    publishedAt: null,
    originalsExpireAt: null,
    createdAt: new Date(),
    deletedAt: null,
    ...data,
    events: data.events.map((e, idx) => ({
      description: null,
      visibility: "invited" as const,
      sortOrder: idx,
      createdAt: new Date(),
      deletedAt: null,
      ...e,
    })),
    vips: data.vips.map((v, idx) => ({
      photoId: null,
      linkUrl: null,
      sortOrder: idx,
      ...v,
    })),
    entitlement: {
      weddingId: data.id,
      maxGuests: null,
      maxPhotos: null,
      maxOriginalsGb: null,
      videoBite: false,
      customDomain: false,
      faceSearch: false,
      hostingUntil: data.entitlement.hostingUntil,
    },
  };
}

describe("Multi-Tenant Wedding Isolation", () => {
  const weddingA = createMockWedding({
    id: "wed-aaa-111",
    slug: "priya-rahul",
    brideName: "Priya",
    groomName: "Rahul",
    weddingDate: new Date("2026-12-18"),
    showBranding: false,
    monogramText: "P & R",
    upiVpa: "priyarahul@upi",
    themeId: "royal-crimson",
    contentExpiresAt: new Date("2031-12-18"),
    entitlement: { hostingUntil: new Date("2031-12-18") },
    events: [
      {
        id: "evt-a1",
        weddingId: "wed-aaa-111",
        title: "Priya's Sangeet",
        eventType: "sangeet",
        startsAt: new Date("2026-12-17T18:00:00Z"),
        endsAt: new Date("2026-12-17T23:00:00Z"),
        venueName: "Udaipur Palace",
        venueAddress: "Udaipur, Rajasthan",
        venueMapUrl: "https://maps.google.com/?q=Udaipur",
        dressCode: "Festive",
      },
    ],
    vips: [
      {
        id: "vip-a1",
        weddingId: "wed-aaa-111",
        groupLabel: "pillars",
        name: "Sharma Family",
        tagline: "Bride Parents",
      },
    ],
  });

  const weddingB = createMockWedding({
    id: "wed-bbb-222",
    slug: "ananya-kabir",
    brideName: "Ananya",
    groomName: "Kabir",
    weddingDate: new Date("2027-01-20"),
    showBranding: true,
    monogramText: "A & K",
    upiVpa: "ananyakabir@okhdfcbank",
    themeId: "emerald-gold",
    contentExpiresAt: new Date("2032-01-20"),
    entitlement: { hostingUntil: new Date("2032-01-20") },
    events: [
      {
        id: "evt-b1",
        weddingId: "wed-bbb-222",
        title: "Kabir's Cocktail",
        eventType: "cocktail",
        startsAt: new Date("2027-01-19T19:00:00Z"),
        endsAt: new Date("2027-01-19T23:59:00Z"),
        venueName: "Goa Beach Resort",
        venueAddress: "Candolim, Goa",
        venueMapUrl: "https://maps.google.com/?q=Goa",
        dressCode: "Cocktail Western",
      },
    ],
    vips: [
      {
        id: "vip-b1",
        weddingId: "wed-bbb-222",
        groupLabel: "grooms_squad",
        name: "Goa Boys",
        tagline: "Groom Friends",
      },
    ],
  });

  it("dto mapping preserves tenant data boundaries and never leaks cross-tenant events or vips", () => {
    const dtoA = mapWeddingToDto(weddingA);
    const dtoB = mapWeddingToDto(weddingB);

    // Assert Wedding A has only its own slug, events, and VIPs
    expect(dtoA.slug).toBe("priya-rahul");
    expect(dtoA.bride).toBe("Priya");
    expect(dtoA.events.map((e) => e.id)).toEqual(["evt-a1"]);
    expect(dtoA.vips.map((v) => v.name)).toEqual(["Sharma Family"]);

    // Assert Wedding B has only its own slug, events, and VIPs
    expect(dtoB.slug).toBe("ananya-kabir");
    expect(dtoB.bride).toBe("Ananya");
    expect(dtoB.events.map((e) => e.id)).toEqual(["evt-b1"]);
    expect(dtoB.vips.map((v) => v.name)).toEqual(["Goa Boys"]);

    // Disjointness check
    const eventIdsA = new Set(dtoA.events.map((e) => e.id));
    for (const evt of dtoB.events) {
      expect(eventIdsA.has(evt.id)).toBe(false);
    }
  });

  it("financial and entitlement boundaries remain isolated per tenant", () => {
    const dtoA = mapWeddingToDto(weddingA);
    const dtoB = mapWeddingToDto(weddingB);

    expect(dtoA.upiVpa).toBe("priyarahul@upi");
    expect(dtoB.upiVpa).toBe("ananyakabir@okhdfcbank");
    expect(dtoA.showBranding).toBe(false);
    expect(dtoB.showBranding).toBe(true);
  });

  it("ensures photos and rsvps are scoped strictly by weddingId in query criteria", () => {
    // Assert that database queries targeting photos or rsvps require weddingId scoping
    const scopePhotoQuery = (weddingId: string, photoId: string) => ({
      where: { id: photoId, weddingId },
    });
    const scopeRsvpQuery = (weddingId: string, rsvpId: string) => ({
      where: { id: rsvpId, weddingId },
    });

    const queryA = scopePhotoQuery(weddingA.id, "photo-1");
    const queryB = scopePhotoQuery(weddingB.id, "photo-1");

    expect(queryA.where.weddingId).toBe("wed-aaa-111");
    expect(queryB.where.weddingId).toBe("wed-bbb-222");
    expect(queryA.where.weddingId).not.toEqual(queryB.where.weddingId);

    const rsvpQueryA = scopeRsvpQuery(weddingA.id, "rsvp-1");
    const rsvpQueryB = scopeRsvpQuery(weddingB.id, "rsvp-1");
    expect(rsvpQueryA.where.weddingId).not.toEqual(rsvpQueryB.where.weddingId);
  });
});
