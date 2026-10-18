import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveTheme, type PresetId } from "@/lib/themes/tokens";
import { getWeddingBySlug, mapWeddingToDto, type WeddingDataDto } from "@/features/weddings";
import WeddingGuestClient from "./WeddingGuestClient";

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

const SAMPLE_DEMO_WEDDING: WeddingDataDto = {
  slug: "priya-rahul",
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

export default async function WeddingGuestPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // IMPORTANT: No searchParams are accessed in this route!
  // This preserves Next.js static / ISR and Cloudflare edge caching for guests.
  // Previews live on /[slug]/preview guarded by staff session or HMAC token.

  const dbWedding = await getWeddingBySlug(slug);

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

  // Format wedding data using the queries DTO mapper or fallback demo
  const wedding: WeddingDataDto = dbWedding
    ? {
        ...mapWeddingToDto(dbWedding),
        events:
          dbWedding.events.length > 0
            ? mapWeddingToDto(dbWedding).events
            : SAMPLE_DEMO_WEDDING.events,
        vips:
          dbWedding.vips.length > 0 ? mapWeddingToDto(dbWedding).vips : SAMPLE_DEMO_WEDDING.vips,
      }
    : SAMPLE_DEMO_WEDDING;

  // Resolve the official published wedding theme (preset + verified overrides)
  const presetId = (dbWedding?.themeId as PresetId) || "royal-crimson";
  const overrides = (dbWedding?.themeConfig as Record<string, unknown> | null) ?? null;
  const { theme, report } = resolveTheme(presetId, overrides);

  return <WeddingGuestClient wedding={wedding} theme={theme} contrastReport={report} />;
}
