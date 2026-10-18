import { describe, it, expect } from "vitest";
import { mapWeddingToDto } from "../queries";

describe("Multi-Tenant Wedding Isolation", () => {
  const weddingA = {
    id: "wed-aaa-111",
    slug: "priya-rahul",
    brideName: "Priya",
    groomName: "Rahul",
    weddingDate: new Date("2026-12-18"),
    showBranding: false,
    monogramText: "P & R",
    upiVpa: "priyarahul@upi",
    themeId: "royal-crimson",
    themeConfig: null,
    themeVersion: 1,
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
        groupLabel: "the_pillars",
        name: "Sharma Family",
        tagline: "Bride Parents",
      },
    ],
  };

  const weddingB = {
    id: "wed-bbb-222",
    slug: "ananya-kabir",
    brideName: "Ananya",
    groomName: "Kabir",
    weddingDate: new Date("2027-01-20"),
    showBranding: true,
    monogramText: "A & K",
    upiVpa: "ananyakabir@okhdfcbank",
    themeId: "emerald-gold",
    themeConfig: null,
    themeVersion: 1,
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
  };

  it("dto mapping preserves tenant data boundaries and never leaks cross-tenant events or vips", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dtoA = mapWeddingToDto(weddingA as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dtoB = mapWeddingToDto(weddingB as any);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dtoA = mapWeddingToDto(weddingA as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dtoB = mapWeddingToDto(weddingB as any);

    expect(dtoA.upiVpa).toBe("priyarahul@upi");
    expect(dtoB.upiVpa).toBe("ananyakabir@okhdfcbank");
    expect(dtoA.showBranding).toBe(false);
    expect(dtoB.showBranding).toBe(true);
  });
});
