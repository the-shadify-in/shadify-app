import { describe, it, expect } from "vitest";
import {
  formatIcsDate,
  escapeIcsText,
  foldIcsLine,
  generateEventIcs,
  getGoogleCalendarUrl,
} from "../ics";
import type { WeddingEventDto } from "@/features/weddings";

describe("RFC 5545 iCalendar (.ics) Generator", () => {
  const sampleEvent: WeddingEventDto = {
    id: "evt-sangeet-1",
    title: "Grand Sangeet & Musical Evening",
    tag: "Sangeet",
    date: "2026-12-14",
    time: "7:00 PM onwards",
    startTimeIso: "2026-12-14T13:30:00.000Z",
    endTimeIso: "2026-12-14T18:00:00.000Z",
    venue: "Manek Chowk, The City Palace",
    address: "Old City, Udaipur, Rajasthan 313001",
    mapUrl: "https://maps.google.com/?q=City+Palace+Udaipur",
    dressCode: "Indo-Western Glitz & Glamour",
  };

  it("formats dates to UTC representation ending with Z", () => {
    const formatted = formatIcsDate("2026-12-14T13:30:00.000Z");
    expect(formatted).toBe("20261214T133000Z");
  });

  it("escapes backslashes, semicolons, commas, and newlines per RFC 5545", () => {
    const input = "Cocktails, Dance; Music\\Fun\nEvening";
    const escaped = escapeIcsText(input);
    expect(escaped).toBe("Cocktails\\, Dance\\; Music\\\\Fun\\nEvening");
  });

  it("folds lines exceeding 75 octets with CRLF and single space", () => {
    const longLine =
      "DESCRIPTION:This is an exceptionally detailed description of the grand royal wedding sangeet celebration taking place in Udaipur Rajasthan India with music and dances.";
    const folded = foldIcsLine(longLine);
    expect(folded).toContain("\r\n ");

    const lines = folded.split("\r\n");
    const encoder = new TextEncoder();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined) {
        expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
      }
    }
  });

  it("generates valid RFC 5545 iCalendar string with CRLF line endings", () => {
    const ics = generateEventIcs(sampleEvent, "Priya & Rahul's Royal Wedding");

    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("VERSION:2.0\r\n");
    expect(ics).toContain("PRODID:-//Shadify//Wedding Invitation//EN\r\n");
    expect(ics).toContain("BEGIN:VEVENT\r\n");
    expect(ics).toContain("UID:event-evt-sangeet-1-");
    expect(ics).toContain("DTSTART:20261214T133000Z\r\n");
    expect(ics).toContain("DTEND:20261214T180000Z\r\n");
    expect(ics).toContain(
      "SUMMARY:Grand Sangeet & Musical Evening — Priya & Rahul's Royal Wedding\r\n",
    );
    expect(ics).toContain("STATUS:CONFIRMED\r\n");
    expect(ics).toContain("END:VEVENT\r\n");
    expect(ics).toContain("END:VCALENDAR\r\n");
  });

  it("generates valid Google Calendar URL for mobile web fallback", () => {
    const url = getGoogleCalendarUrl(sampleEvent, "Priya & Rahul");
    expect(url).toContain("https://calendar.google.com/calendar/render?");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20261214T133000Z%2F20261214T180000Z");
    expect(url).toContain(
      "location=Manek+Chowk%2C+The+City+Palace%2C+Old+City%2C+Udaipur%2C+Rajasthan+313001",
    );
  });
});
