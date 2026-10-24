import React from "react";
import { prisma } from "@/lib/db";
import type { WeddingDataDto } from "./types";

const reactCache =
  typeof React.cache === "function"
    ? React.cache
    : <T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T): T => fn;

/**
 * Fetches a wedding by its URL slug and transforms it into a clean DTO.
 * Wrapped with React.cache so generateMetadata and page rendering share the same query in Next.js RSC.
 */
export const getWeddingBySlug = reactCache(async (slug: string) => {
  try {
    const wedding = await prisma.wedding.findUnique({
      where: { slug },
      include: {
        events: { orderBy: { sortOrder: "asc" } },
        vips: { orderBy: { sortOrder: "asc" } },
        entitlement: true,
      },
    });
    if (wedding) return wedding;

    // Check permanent alias table if slug was renamed, vanity, or partner print run
    const aliasRecord = await prisma.weddingAlias.findUnique({
      where: { alias: slug },
      include: {
        wedding: {
          include: {
            events: { orderBy: { sortOrder: "asc" } },
            vips: { orderBy: { sortOrder: "asc" } },
            entitlement: true,
          },
        },
      },
    });

    if (aliasRecord?.wedding && !aliasRecord.retiredAt) {
      return aliasRecord.wedding;
    }

    return null;
  } catch (err) {
    console.error(`[queries.getWeddingBySlug] Error fetching slug '${slug}':`, err);
    return null;
  }
});

/**
 * Transforms a Prisma Wedding record into a clean WeddingDataDto.
 */
export function mapWeddingToDto(
  wedding: NonNullable<Awaited<ReturnType<typeof getWeddingBySlug>>>,
): WeddingDataDto {
  const rawConfig = wedding.themeConfig as Record<string, unknown> | null;
  const invocation = typeof rawConfig?.invocation === "string" ? rawConfig.invocation : undefined;

  const venueCity = (() => {
    const addr = wedding.events[0]?.venueAddress;
    if (!addr) return "Celebration Destination";
    const parts = addr.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const cityMatch = parts.find((p) =>
        /Bodinayakanur|Theni|Madurai|Chennai|Coimbatore|Udaipur|Jaipur|Delhi|Bengaluru|Bangalore|Mumbai|Hyderabad|Goa|Kochi/i.test(
          p,
        ),
      );
      const stateMatch = parts
        .find((p) => /Tamil Nadu|Rajasthan|Maharashtra|Karnataka|Kerala|Delhi|Goa/i.test(p))
        ?.replace(/\s*\d{5,6}.*$/, "")
        .trim();
      if (cityMatch && stateMatch) return `${cityMatch}, ${stateMatch}`;
      if (cityMatch) return cityMatch;
      const cleaned = parts.map((p) => p.replace(/\s*\d{5,6}.*$/, "").trim()).filter(Boolean);
      if (cleaned.length >= 2) {
        return `${cleaned[cleaned.length - 2]}, ${cleaned[cleaned.length - 1]}`;
      }
    }
    return addr;
  })();

  return {
    slug: wedding.slug,
    bride: wedding.brideName,
    groom: wedding.groomName,
    date: wedding.weddingDate
      ? new Intl.DateTimeFormat("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        }).format(new Date(wedding.weddingDate))
      : "Wedding Day",
    weddingDateIso: wedding.weddingDate ? new Date(wedding.weddingDate).toISOString() : undefined,
    hostingUntil: wedding.entitlement?.hostingUntil
      ? new Date(wedding.entitlement.hostingUntil).toISOString()
      : wedding.contentExpiresAt
        ? new Date(wedding.contentExpiresAt).toISOString()
        : null,
    venueCity,
    monogram: wedding.monogramText || `${wedding.brideName[0]} & ${wedding.groomName[0]}`,
    upiVpa: wedding.upiVpa || "",
    showBranding: wedding.showBranding,
    invocation,
    events:
      wedding.events.length > 0
        ? wedding.events.map((e) => ({
            id: e.id,
            title: e.title,
            tag: e.eventType,
            time: new Intl.DateTimeFormat("en-IN", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
              timeZone: "Asia/Kolkata",
            }).format(new Date(e.startsAt)),
            date: new Intl.DateTimeFormat("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            }).format(new Date(e.startsAt)),
            venue: e.venueName,
            address: e.venueAddress || "",
            mapUrl:
              e.venueMapUrl ||
              `https://maps.google.com/?q=${encodeURIComponent([e.venueName, e.venueAddress].filter(Boolean).join(", "))}`,
            dressCode: e.dressCode || "Festive Traditional",
            coverImage: (() => {
              const t = (e.eventType + " " + e.title).toLowerCase();
              if (t.includes("mehendi") || t.includes("haldi")) return "/demo/mehendi.jpg";
              if (
                t.includes("sangeet") ||
                t.includes("dance") ||
                t.includes("music") ||
                t.includes("sundowner")
              )
                return "/demo/sangeet.jpg";
              if (
                t.includes("wedding") ||
                t.includes("vivah") ||
                t.includes("phera") ||
                t.includes("nikah") ||
                t.includes("muhurtham")
              )
                return "/demo/mandap.jpg";
              if (t.includes("reception") || t.includes("feast") || t.includes("dinner"))
                return "/demo/hero.jpg";
              return "/demo/mandap.jpg";
            })(),
            startTimeIso: new Date(e.startsAt).toISOString(),
            endTimeIso: e.endsAt ? new Date(e.endsAt).toISOString() : undefined,
          }))
        : [],
    vips:
      wedding.vips.length > 0
        ? wedding.vips.map((v) => ({
            group: v.groupLabel.replace("_", " ").toUpperCase(),
            name: v.name,
            tagline: v.tagline || "",
          }))
        : [],
  };
}
