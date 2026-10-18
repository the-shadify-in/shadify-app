import React from "react";
import { getAdminSession, verifyPreviewToken } from "@/lib/auth";
import { resolveTheme } from "@/lib/themes/tokens";
import WeddingGuestClient, { WeddingData } from "./WeddingGuestClient";

export default async function WeddingGuestPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { theme?: string; preview?: string };
}) {
  const { slug } = params;

  // 1. Gated ?theme= override: honored ONLY for staff or signed preview tokens
  const isStaff = await getAdminSession();
  const isPreview = verifyPreviewToken(searchParams.preview, slug);
  const themeOverride = (isStaff || isPreview) ? searchParams.theme : undefined;

  // 2. Demo fallback data (or fetched from Prisma when seeded)
  const wedding: WeddingData = {
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
      {
        group: "Sacred Chants",
        name: "Pandit Vidhyadhar Shastri",
        tagline: "Head Priest, Vedic Rituals",
      },
    ],
  };

  // 3. Resolve active theme (public requests ignore ?theme= so edge caching remains clean)
  const activePresetKey = themeOverride || "royal-crimson";
  const { theme, report } = resolveTheme(activePresetKey, null);

  return (
    <WeddingGuestClient
      wedding={wedding}
      theme={theme}
      contrastReport={report}
    />
  );
}
