/**
 * RFC 5545 iCalendar (.ics) generator for wedding ceremonies.
 * Runs completely in client memory with zero server dependencies or network requests.
 */

import type { WeddingEventDto } from "@/features/weddings";

/**
 * Converts an ISO date string to UTC format required by RFC 5545: YYYYMMDDTHHMMSSZ
 */
export function formatIcsDate(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    // Fallback to current UTC time if date cannot be parsed
    return new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  }
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Escapes characters per RFC 5545 section 3.3.11: backslash, semicolon, comma, and newline.
 */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Folds lines longer than 75 octets using CRLF followed by a single space per RFC 5545 section 3.1.
 */
export function foldIcsLine(line: string): string {
  // UTF-8 bytes limit is 75 octets per line
  const maxBytes = 75;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);

  if (bytes.length <= maxBytes) {
    return line;
  }

  const chunks: string[] = [];
  let remaining = line;
  let isFirst = true;

  while (remaining.length > 0) {
    const limit = isFirst ? maxBytes : maxBytes - 1; // space prefix takes 1 byte on continuation lines
    let sliceLen = remaining.length;

    while (sliceLen > 0 && encoder.encode(remaining.slice(0, sliceLen)).length > limit) {
      sliceLen--;
    }

    if (sliceLen === 0) {
      // Force at least 1 character to avoid infinite loop
      sliceLen = 1;
    }

    const chunk = remaining.slice(0, sliceLen);
    chunks.push(isFirst ? chunk : ` ${chunk}`);
    remaining = remaining.slice(sliceLen);
    isFirst = false;
  }

  return chunks.join("\r\n");
}

/**
 * Generates an RFC 5545 .ics string for a ceremony.
 */
export function generateEventIcs(event: WeddingEventDto, weddingTitle: string): string {
  const startIso = event.startTimeIso || new Date().toISOString();
  const endIso =
    event.endTimeIso || new Date(new Date(startIso).getTime() + 3 * 60 * 60 * 1000).toISOString();

  const randomSuffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const uid = `event-${event.id || "ceremony"}-${randomSuffix}@shadify.in`;
  const dtStamp = formatIcsDate(new Date().toISOString());
  const dtStart = formatIcsDate(startIso);
  const dtEnd = formatIcsDate(endIso);

  const summary = escapeIcsText(`${event.title} — ${weddingTitle}`);
  const location = escapeIcsText([event.venue, event.address].filter(Boolean).join(", "));
  const description = escapeIcsText(
    [
      `Ceremony: ${event.title}`,
      event.dressCode ? `Dress Code: ${event.dressCode}` : null,
      event.mapUrl ? `Directions: ${event.mapUrl}` : null,
      `Celebration Suite: ${weddingTitle}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shadify//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

/**
 * Generates a direct Google Calendar template URL as a mobile web fallback for guests.
 */
export function getGoogleCalendarUrl(event: WeddingEventDto, weddingTitle: string): string {
  const startIso = event.startTimeIso || new Date().toISOString();
  const endIso =
    event.endTimeIso || new Date(new Date(startIso).getTime() + 3 * 60 * 60 * 1000).toISOString();

  const dtStart = formatIcsDate(startIso);
  const dtEnd = formatIcsDate(endIso);

  const text = `${event.title} — ${weddingTitle}`;
  const details = [
    `Ceremony: ${event.title}`,
    event.dressCode ? `Dress Code: ${event.dressCode}` : null,
    event.mapUrl ? `Directions: ${event.mapUrl}` : null,
    `Celebration Suite: ${weddingTitle}`,
  ]
    .filter(Boolean)
    .join("\n");
  const location = [event.venue, event.address].filter(Boolean).join(", ");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text,
    dates: `${dtStart}/${dtEnd}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Prompts download of the generated .ics file in the guest's browser.
 */
export function downloadEventIcs(event: WeddingEventDto, weddingTitle: string): void {
  if (typeof window === "undefined") return;

  const icsContent = generateEventIcs(event, weddingTitle);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
