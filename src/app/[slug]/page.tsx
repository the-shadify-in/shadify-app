import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveTheme, PresetId } from "@/lib/themes/tokens";
import WeddingGuestClient, { WeddingData } from "./WeddingGuestClient";

// Revalidate every hour, or via on-demand tag revalidation when wedding content changes
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: `Wedding Celebration (${params.slug}) | Shadify`,
    description: `Private wedding invitation and ceremony itinerary.`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function WeddingGuestPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // IMPORTANT: No searchParams are accessed in this route!
  // This preserves Next.js static / ISR and Cloudflare edge caching for guests.
  // Previews live on /w/[slug]/preview guarded by staff session or HMAC token.

  let dbWedding = null;
  try {
    dbWedding = await prisma.wedding.findUnique({
      where: { slug },
      include: {
        events: { orderBy: { sortOrder: "asc" } },
        vips: { orderBy: { sortOrder: "asc" } },
        entitlement: true,
      },
    });
  } catch (err) {
    console.error("Database query fallback for slug:", slug, err);
  }

  // 1. Deliberate Expired Site State
  if (
    dbWedding?.entitlement?.hostingUntil &&
    new Date(dbWedding.entitlement.hostingUntil).getTime() < Date.now()
  ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] px-4 text-center text-[#1F1A2E]">
        <div className="w-14 h-14 mb-4 rounded-full bg-[#1F1A2E]/5 flex items-center justify-center text-xl">
          ⌛
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1A2E]">
          Celebration Website Concluded
        </h1>
        <p className="mt-3 max-w-md text-xs sm:text-sm text-[#1F1A2E]/70 leading-relaxed">
          The active digital invitation and gallery hosting for {dbWedding.brideName} &{" "}
          {dbWedding.groomName}&apos;s wedding has concluded.
        </p>
      </div>
    );
  }

  // Fallback demo samples
  const isDemoSlug = slug === "priya-rahul" || slug === "sample" || slug === "demo";

  // 2. Deliberate 404 for unknown slug
  if (!dbWedding && !isDemoSlug) {
    notFound();
  }

  // Format wedding data
  const wedding: WeddingData = dbWedding
    ? {
        slug: dbWedding.slug,
        bride: dbWedding.brideName,
        groom: dbWedding.groomName,
        date: dbWedding.weddingDate
          ? new Intl.DateTimeFormat("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            }).format(new Date(dbWedding.weddingDate))
          : "Wedding Day",
        venueCity: dbWedding.events[0]?.venueAddress || "Celebration Destination",
        monogram: dbWedding.monogramText || `${dbWedding.brideName[0]} & ${dbWedding.groomName[0]}`,
        upiVpa: dbWedding.upiVpa || "",
        showBranding: dbWedding.showBranding,
        events:
          dbWedding.events.length > 0
            ? dbWedding.events.map((e) => ({
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
                  `https://maps.google.com/?q=${encodeURIComponent(
                    `${e.venueName} ${e.venueAddress || ""}`
                  )}`,
                dressCode: e.dressCode || "Festive Traditional",
              }))
            : [
                {
                  id: "evt-main",
                  title: "Wedding Ceremony & Pheras",
                  tag: "Wedding",
                  time: "4:00 PM onwards",
                  date: "Wedding Day",
                  venue: "The Royal Palace",
                  address: "Main Lawn",
                  mapUrl: "https://maps.google.com",
                  dressCode: "Traditional Royal",
                },
              ],
        vips:
          dbWedding.vips.length > 0
            ? dbWedding.vips.map((v) => ({
                group: v.groupLabel.replace("_", " ").toUpperCase(),
                name: v.name,
                tagline: v.tagline || "",
              }))
            : [
                {
                  group: "The Family",
                  name: "Immediate Family & Wedding Party",
                  tagline: "With blessings and love",
                },
              ],
      }
    : {
        slug,
        bride: "Priya",
        groom: "Rahul",
        date: "December 14, 2026",
        venueCity: "Udaipur, Rajasthan",
        monogram: "P & R",
        upiVpa: "priya.rahul@okhdfcbank",
        showBranding: true,
        events: [
          {
            id: "evt-1",
            title: "Mehendi & Chooda Ceremony",
            tag: "Mehendi",
            time: "11:00 AM onwards",
            date: "Dec 13, 2026",
            venue: "The Courtyard Lawn, Taj Lake Palace",
            address: "Pichola, Udaipur, Rajasthan",
            mapUrl: "https://maps.google.com/?q=Taj+Lake+Palace+Udaipur",
            dressCode: "Sunshine Yellow & Festive Boho",
          },
          {
            id: "evt-2",
            title: "Sangeet & Cocktail Soiree",
            tag: "Sangeet",
            time: "7:30 PM till late",
            date: "Dec 13, 2026",
            venue: "Mewar Grand Ballroom",
            address: "Pichola, Udaipur, Rajasthan",
            mapUrl: "https://maps.google.com/?q=Taj+Lake+Palace+Udaipur",
            dressCode: "Indo-Western Glitz & Glamour",
          },
          {
            id: "evt-3",
            title: "The Sacred Vows & Pheras",
            tag: "Mandap",
            time: "4:00 PM (Baraat) | 6:00 PM (Pheras)",
            date: "Dec 14, 2026",
            venue: "The Royal Lakeside Mandap",
            address: "Pichola, Udaipur, Rajasthan",
            mapUrl: "https://maps.google.com/?q=Taj+Lake+Palace+Udaipur",
            dressCode: "Royal Pastels & Traditional Silk",
          },
        ],
        vips: [
          {
            group: "The Pillars",
            name: "Mr. & Mrs. Sharma & Mr. & Mrs. Verma",
            tagline: "Proud Parents of the Bride & Groom",
          },
          {
            group: "Bride's Tribe",
            name: "Ananya, Pooja & Riya",
            tagline: "Chief Shoe Negotiators 👠",
          },
          {
            group: "Groom's Squad",
            name: "Vikram, Siddharth & Kabir",
            tagline: "Baraat Hype & Dance Choreography 🔥",
          },
        ],
      };

  // Resolve the official published wedding theme (preset + verified overrides)
  const presetId = (dbWedding?.themeId as PresetId) || "royal-crimson";
  const overrides = (dbWedding?.themeConfig as Record<string, unknown> | null) ?? null;
  const { theme, report } = resolveTheme(presetId, overrides);

  return <WeddingGuestClient wedding={wedding} theme={theme} contrastReport={report} />;
}
