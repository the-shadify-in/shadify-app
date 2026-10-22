import { describe, it, expect } from "vitest";
import { sanitizeString, snippetExistsInInput, postProcessDraftExtraction } from "../validate";
import type { DraftExtraction } from "../schema";

function createValidBaseDraft(): DraftExtraction {
  return {
    couple: {
      partnerAName: "Priya",
      partnerBName: "Rahul",
      scriptHint: "latin",
    },
    weddingDate: {
      value: "2026-12-14",
      confidence: "high",
      source: "14th Dec 2026",
    },
    city: {
      value: "Udaipur",
      confidence: "high",
      source: "Udaipur",
    },
    events: [
      {
        typeTag: "Celebration",
        title: "Sangeet Night",
        date: "2026-12-13",
        startTime: "7:00 PM",
        endTime: "11:00 PM",
        timeZoneFlagged: true,
        venueName: "Taj Lake Palace",
        venueAddress: "Pichola, Udaipur",
        mapQuery: "https://maps.google.com/?cid=123",
        dressCode: "Indo-Western",
        notes: null,
        confidence: "high",
        source: "sangeet night",
      },
    ],
    contacts: [
      {
        role: "Wedding Coordinator",
        name: "Family RSVP",
        phoneRaw: "+91 98765 43210",
        phoneE164: null,
        confidence: "high",
        source: "9876543210",
      },
    ],
    upiVpaCandidates: [
      {
        value: "priyarahul@okhdfcbank",
        confidence: "high",
        source: "priyarahul@okhdfcbank",
      },
    ],
    themeFeeling: {
      value: "Regal Heritage",
      suggestedPreset: "royal-crimson",
      confidence: "high",
    },
    languages: ["en"],
    conflicts: [],
    missingRequired: [],
  };
}

describe("Intake Validation & Security Post-Processing", () => {
  it("sanitizes strings: strips HTML tags, control chars, and caps max length", () => {
    const malicious = "<script>alert(1)</script>Taj Palace\x00\x08\x1F";
    expect(sanitizeString(malicious)).toBe("Taj Palace");

    const longString = "A".repeat(800);
    expect(sanitizeString(longString, 100)?.length).toBe(100);
    expect(sanitizeString(null)).toBeNull();
    expect(sanitizeString("   ")).toBeNull();
  });

  it("checks snippet existence with whitespace resilience", () => {
    const raw = "Priya  weds   Rahul on 14th Dec 2026";
    expect(snippetExistsInInput("Priya weds Rahul", raw)).toBe(true);
    expect(snippetExistsInInput("14th dec 2026", raw)).toBe(true);
    expect(snippetExistsInInput("Secret Invented Venue", raw)).toBe(false);
  });

  it("rejects hallucinated values whose source snippet is not present in raw text", () => {
    const rawText = "Priya and Rahul are getting married. No date set yet.";
    const draft = createValidBaseDraft();
    draft.city = { value: null, confidence: "low", source: null };
    draft.events = [];
    draft.contacts = [];
    draft.upiVpaCandidates = [];
    draft.weddingDate = {
      value: "2026-12-14",
      confidence: "high",
      source: "Invented Date Snippet Not In Text",
    };

    const processed = postProcessDraftExtraction(draft, rawText);
    expect(processed.weddingDate.value).toBeNull();
    expect(processed.weddingDate.confidence).toBe("low");
    expect(processed.conflicts).toHaveLength(1);
    expect(processed.conflicts[0]?.note).toContain("Hallucination guard");
  });

  it("normalizes valid phone numbers to canonical E.164 format", () => {
    const rawText = "Call 9876543210 for details";
    const draft = createValidBaseDraft();
    const contact = draft.contacts[0];
    if (contact) {
      contact.phoneRaw = "098765 43210";
      contact.source = "9876543210";
    }

    const processed = postProcessDraftExtraction(draft, rawText);
    expect(processed.contacts[0]?.phoneE164).toBe("+919876543210");
  });

  it("flags malformed phone numbers into conflicts with low confidence", () => {
    const rawText = "Call 0000000000 for details";
    const draft = createValidBaseDraft();
    const contact = draft.contacts[0];
    if (contact) {
      contact.phoneRaw = "0000000000";
      contact.source = "0000000000";
    }

    const processed = postProcessDraftExtraction(draft, rawText);
    expect(processed.contacts[0]?.phoneE164).toBeNull();
    expect(processed.contacts[0]?.confidence).toBe("low");
    expect(processed.conflicts.some((c) => c.field === "contacts[0].phone")).toBe(true);
  });

  it("validates UPI VPA format strictly", () => {
    const rawText = "Send gifts to bad-upi-format";
    const draft = createValidBaseDraft();
    const upi = draft.upiVpaCandidates[0];
    if (upi) {
      upi.value = "bad-upi-format";
      upi.source = "bad-upi-format";
    }

    const processed = postProcessDraftExtraction(draft, rawText);
    expect(processed.upiVpaCandidates[0]?.confidence).toBe("low");
    expect(processed.conflicts.some((c) => c.field === "upiVpa")).toBe(true);
  });

  it("discards unverified external map links not on the allowlist", () => {
    const rawText = "Map: https://phishing-maps.com/location";
    const draft = createValidBaseDraft();
    const event = draft.events[0];
    if (event) {
      event.mapQuery = "https://phishing-maps.com/location";
    }

    const processed = postProcessDraftExtraction(draft, rawText);
    expect(processed.events[0]?.mapQuery).toBeNull();
    expect(processed.conflicts.some((c) => c.field === "events[0].mapQuery")).toBe(true);
  });

  it("identifies missing required fields", () => {
    const rawText = "Some random chatter with no names or dates";
    const draft = createValidBaseDraft();
    draft.couple = null;
    draft.weddingDate = { value: null, confidence: "low", source: null };

    const processed = postProcessDraftExtraction(draft, rawText);
    expect(processed.missingRequired).toContain("couple.names");
    expect(processed.missingRequired).toContain("weddingDate");
  });
});
