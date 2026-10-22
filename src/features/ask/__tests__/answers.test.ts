import { describe, it, expect } from "vitest";
import { buildAskAnswers, getSafeMapUrl, formatCeremonyTime } from "../answers";
import type { WeddingDataDto, WeddingEventDto } from "@/features/weddings";

function createMockEvent(overrides: Partial<WeddingEventDto> = {}): WeddingEventDto {
  return {
    id: "evt-1",
    title: "Sangeet Night",
    tag: "Music & Dance",
    date: "14 Dec 2026",
    time: "7:00 PM",
    startTimeIso: "2026-12-14T13:30:00.000Z", // 7:00 PM IST
    endTimeIso: "2026-12-14T17:30:00.000Z", // 11:00 PM IST
    venue: "Grand Ballroom, Taj Lake Palace",
    address: "Pichola, Udaipur, Rajasthan 313001",
    dressCode: "Indo-Western Glitz & Metallics",
    mapUrl: "https://maps.google.com/?cid=12345",
    ...overrides,
  };
}

function createMockWedding(overrides: Partial<WeddingDataDto> = {}): WeddingDataDto {
  return {
    slug: "priya-rahul",
    bride: "Priya",
    groom: "Rahul",
    date: "14 December 2026",
    weddingDateIso: "2026-12-14T00:00:00.000Z",
    venueCity: "Udaipur, Rajasthan",
    monogram: "P & R",
    upiVpa: "priyarahul@upi",
    showBranding: false,
    events: [createMockEvent()],
    vips: [],
    ...overrides,
  };
}

describe("Guest Ask Drawer Pure Answers Resolver", () => {
  it("formats answers for a single ceremony", () => {
    const wedding = createMockWedding();
    const answers = buildAskAnswers(wedding);

    expect(answers.weddingTitle).toBe("Priya & Rahul's Wedding");
    expect(answers.hasGiftsUpi).toBe(true);
    expect(answers.upiVpa).toBe("priyarahul@upi");
    expect(answers.scheduleByDay).toHaveLength(1);
    expect(answers.scheduleByDay[0]!.items).toHaveLength(1);

    const item = answers.scheduleByDay[0]!.items[0]!;
    expect(item.title).toBe("Sangeet Night");
    expect(item.hasDressCode).toBe(true);
    expect(item.dressCode).toBe("Indo-Western Glitz & Metallics");
    expect(item.safeMapUrl).toBe("https://maps.google.com/?cid=12345");
  });

  it("sorts multiple ceremonies chronologically and groups by day", () => {
    const event1 = createMockEvent({
      id: "e-mehendi",
      title: "Mehendi Ceremony",
      startTimeIso: "2026-12-13T10:00:00.000Z",
      date: "13 Dec 2026",
    });
    const event2 = createMockEvent({
      id: "e-sangeet",
      title: "Sangeet Night",
      startTimeIso: "2026-12-13T18:00:00.000Z",
      date: "13 Dec 2026",
    });
    const event3 = createMockEvent({
      id: "e-pheras",
      title: "Vedic Pheras",
      startTimeIso: "2026-12-14T09:00:00.000Z",
      date: "14 Dec 2026",
    });

    // Provide in mixed order
    const wedding = createMockWedding({
      events: [event3, event1, event2],
    });

    const answers = buildAskAnswers(wedding);
    expect(answers.scheduleByDay).toHaveLength(2);

    // Day 1
    expect(answers.scheduleByDay[0]!.dateHeader).toBe("13 Dec 2026");
    expect(answers.scheduleByDay[0]!.items).toHaveLength(2);
    expect(answers.scheduleByDay[0]!.items[0]!.title).toBe("Mehendi Ceremony");
    expect(answers.scheduleByDay[0]!.items[1]!.title).toBe("Sangeet Night");

    // Day 2
    expect(answers.scheduleByDay[1]!.dateHeader).toBe("14 Dec 2026");
    expect(answers.scheduleByDay[1]!.items).toHaveLength(1);
    expect(answers.scheduleByDay[1]!.items[0]!.title).toBe("Vedic Pheras");
  });

  it("handles missing dress code plainly with standard statement", () => {
    const event = createMockEvent({ dressCode: undefined });
    const wedding = createMockWedding({ events: [event] });
    const answers = buildAskAnswers(wedding);

    const item = answers.scheduleByDay[0]!.items[0]!;
    expect(item.hasDressCode).toBe(false);
    expect(item.dressCode).toBe("The hosts haven't added a dress code for this event yet.");
  });

  it("handles missing UPI ID plainly", () => {
    const wedding = createMockWedding({ upiVpa: "" });
    const answers = buildAskAnswers(wedding);

    expect(answers.hasGiftsUpi).toBe(false);
    expect(answers.upiVpa).toBeNull();
  });

  it("validates map link safety: preserves allowlisted Google Maps hosts", () => {
    const allowed = [
      "https://maps.google.com/maps?daddr=24.5854,73.7125",
      "https://www.google.com/maps/place/Taj+Palace",
      "https://maps.app.goo.gl/xyz123",
      "https://goo.gl/maps/abc789",
    ];

    for (const url of allowed) {
      const evt = createMockEvent({ mapUrl: url });
      expect(getSafeMapUrl(evt)).toBe(url);
    }
  });

  it("validates map link safety: redirects malicious, third-party, or invalid URLs to safe Google Maps search", () => {
    const untrusted = [
      "http://insecure-http.com/map",
      "https://malicious-phishing.com/maps.google.com",
      "javascript:alert(1)",
      "https://unverified-tracker.org/redirect",
      "",
    ];

    for (const url of untrusted) {
      const evt = createMockEvent({
        mapUrl: url,
        venue: "Taj Lake Palace",
        address: "Pichola, Udaipur",
      });
      const safe = getSafeMapUrl(evt);
      expect(safe.startsWith("https://maps.google.com/?q=")).toBe(true);
      expect(safe).toBe("https://maps.google.com/?q=Taj%20Lake%20Palace%2C%20Pichola%2C%20Udaipur");
      expect(safe).not.toContain("   ");
    }
  });

  it("strictly yields no events other than those in the wedding DTO fixture", () => {
    const allowedEvents = [createMockEvent({ id: "evt-pub-1", title: "Public Sangeet" })];
    const wedding = createMockWedding({ events: allowedEvents });

    const answers = buildAskAnswers(wedding);
    const answerEventIds = answers.scheduleByDay.flatMap((g) => g.items.map((i) => i.id));

    expect(answerEventIds).toEqual(["evt-pub-1"]);
    expect(answerEventIds).not.toContain("evt-secret-family-dinner");
  });

  it("formats ceremony times deterministically across server and client in Asia/Kolkata timezone", () => {
    const iso = "2026-12-14T13:30:00.000Z"; // 7:00 PM IST
    const istTime = formatCeremonyTime(iso, "Asia/Kolkata");

    expect(istTime.formattedTime).toMatch(/7:00\s*(pm|PM)/);
    expect(istTime.formattedDate).toBe("14 Dec 2026");

    // Non-IST zone formatting also deterministic
    const utcTime = formatCeremonyTime(iso, "UTC");
    expect(utcTime.formattedTime).toMatch(/1:30\s*(pm|PM)/);
    expect(utcTime.formattedDate).toBe("14 Dec 2026");
  });
});
