import { prisma } from "@/lib/db";
import type { WeddingDataDto } from "./types";

/**
 * Fetches a wedding by its URL slug and transforms it into a clean DTO.
 */
export async function getWeddingBySlug(slug: string) {
  try {
    const wedding = await prisma.wedding.findUnique({
      where: { slug },
      include: {
        events: { orderBy: { sortOrder: "asc" } },
        vips: { orderBy: { sortOrder: "asc" } },
        entitlement: true,
      },
    });
    return wedding;
  } catch (err) {
    console.error(`[queries.getWeddingBySlug] Error fetching slug '${slug}':`, err);
    return null;
  }
}

/**
 * Transforms a Prisma Wedding record into a clean WeddingDataDto.
 */
export function mapWeddingToDto(
  wedding: NonNullable<Awaited<ReturnType<typeof getWeddingBySlug>>>,
): WeddingDataDto {
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
    venueCity: wedding.events[0]?.venueAddress || "Celebration Destination",
    monogram: wedding.monogramText || `${wedding.brideName[0]} & ${wedding.groomName[0]}`,
    upiVpa: wedding.upiVpa || "",
    showBranding: wedding.showBranding,
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
              `https://maps.google.com/?q=${encodeURIComponent(`${e.venueName} ${e.venueAddress || ""}`)}`,
            dressCode: e.dressCode || "Festive Traditional",
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
