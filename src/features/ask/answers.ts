/**
 * Pure functions to resolve answers for the Guest "Ask" Chips Drawer.
 * Strictly derives from the WeddingDataDto already rendered into the page.
 * ZERO network requests, ZERO AI calls, ZERO PII leakage.
 */

import type { WeddingDataDto, WeddingEventDto } from "@/features/weddings";
import type { AskTopic } from "./topics";

const ALLOWED_MAP_HOSTS = new Set([
  "maps.google.com",
  "www.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

/**
 * Validates external map URL against allowed domains.
 * If invalid, un-safe, or not using HTTPS, falls back to building a clean Google Maps search query.
 */
export function getSafeMapUrl(event: WeddingEventDto): string {
  if (event.mapUrl) {
    try {
      const parsed = new URL(event.mapUrl);
      if (parsed.protocol === "https:" && ALLOWED_MAP_HOSTS.has(parsed.hostname)) {
        return event.mapUrl;
      }
    } catch {
      // Invalid URL format, fall through to fallback builder
    }
  }

  // Fallback: build safe search query with proper encoding and no trailing whitespace
  const query = [event.venue, event.address].filter(Boolean).join(", ").trim();
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

/**
 * Formats ceremony time deterministically in the specified timezone.
 * Defaults to "Asia/Kolkata" (IST) to ensure hydration parity between server and client.
 */
export function formatCeremonyTime(
  isoString: string | undefined,
  timeZone = "Asia/Kolkata",
): { formattedTime: string; formattedDate: string } {
  if (!isoString) {
    return { formattedTime: "Timings to be announced", formattedDate: "Wedding Date" };
  }

  const d = new Date(isoString);

  const formattedTime = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone,
  }).format(d);

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(d);

  return { formattedTime, formattedDate };
}

export interface CeremonyScheduleItem {
  id: string;
  title: string;
  tag: string;
  dateStr: string;
  timeStr: string;
  venueName: string;
  venueAddress: string;
  safeMapUrl: string;
  dressCode: string;
  hasDressCode: boolean;
  eventDto: WeddingEventDto;
}

export interface DayScheduleGroup {
  dateHeader: string;
  items: CeremonyScheduleItem[];
}

export interface AskAnswersData {
  topics: Record<
    AskTopic,
    {
      title: string;
      description: string;
    }
  >;
  weddingTitle: string;
  timeZone: string;
  scheduleByDay: DayScheduleGroup[];
  hasGiftsUpi: boolean;
  upiVpa: string | null;
  helpText: string;
}

/**
 * Transforms WeddingDataDto into normalized, safe answer view models.
 */
export function buildAskAnswers(wedding: WeddingDataDto): AskAnswersData {
  const timeZone = (wedding as { timezone?: string }).timezone || "Asia/Kolkata";
  const weddingTitle = `${wedding.bride} & ${wedding.groom}'s Wedding`;

  // Sort events chronologically
  const sortedEvents = [...wedding.events].sort((a, b) => {
    const aTime = a.startTimeIso ? new Date(a.startTimeIso).getTime() : 0;
    const bTime = b.startTimeIso ? new Date(b.startTimeIso).getTime() : 0;
    return aTime - bTime;
  });

  // Group events by day
  const dayGroupsMap = new Map<string, CeremonyScheduleItem[]>();

  for (const evt of sortedEvents) {
    const { formattedTime, formattedDate } = formatCeremonyTime(evt.startTimeIso, timeZone);

    const hasDressCode = Boolean(evt.dressCode && evt.dressCode.trim().length > 0);
    const dressCode =
      evt.dressCode && evt.dressCode.trim().length > 0
        ? evt.dressCode.trim()
        : "The hosts haven't added a dress code for this event yet.";

    const item: CeremonyScheduleItem = {
      id: evt.id || `evt-${evt.title}`,
      title: evt.title,
      tag: evt.tag || "Ceremony",
      dateStr: evt.date || formattedDate,
      timeStr: evt.time || formattedTime,
      venueName: evt.venue,
      venueAddress: evt.address || "Address details will be shared soon.",
      safeMapUrl: getSafeMapUrl(evt),
      dressCode,
      hasDressCode,
      eventDto: evt,
    };

    const groupKey = evt.date || formattedDate;
    const existing = dayGroupsMap.get(groupKey) || [];
    existing.push(item);
    dayGroupsMap.set(groupKey, existing);
  }

  const scheduleByDay: DayScheduleGroup[] = Array.from(dayGroupsMap.entries()).map(
    ([dateHeader, items]) => ({
      dateHeader,
      items,
    }),
  );

  const hasGiftsUpi = Boolean(
    wedding.shagunEnabled !== false && wedding.upiVpa && wedding.upiVpa.trim().length > 0,
  );
  const effectiveUpiVpa = wedding.isDemo
    ? "demo.only.do.not.pay@okhdfcbank"
    : wedding.upiVpa || null;

  return {
    topics: {
      timings: {
        title: "Ceremony Timings & Muhurats",
        description: "Official schedule for each ritual and celebration.",
      },
      venue: {
        title: "Venues & Gate Navigation",
        description: "Verified banquet halls, palaces, and 1-tap Google Maps directions.",
      },
      dress_code: {
        title: "Attire & Dress Codes",
        description: "Traditional colors, fabrics, and thematic attire recommendations.",
      },
      gifts: {
        title: "Shagun & Wedding Blessings",
        description: "Direct 0%-fee UPI transfers straight to the couple's family account.",
      },
      rsvp: {
        title: "RSVP & Headcounts",
        description: "Confirm attendance and meal preferences for your family party.",
      },
      other: {
        title: "Something Else",
        description: "Questions not covered in the celebration suite.",
      },
    },
    weddingTitle,
    timeZone,
    scheduleByDay,
    hasGiftsUpi,
    upiVpa: hasGiftsUpi ? effectiveUpiVpa : null,
    helpText: "Please ask the family who invited you.",
  };
}
