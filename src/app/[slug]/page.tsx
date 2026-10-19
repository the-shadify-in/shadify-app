import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveTheme, type PresetId } from "@/lib/themes/tokens";
import { getWeddingBySlug, mapWeddingToDto, type WeddingDataDto } from "@/features/weddings";
import WeddingGuestClient from "./WeddingGuestClient";

// Revalidate every hour, or via on-demand tag revalidation when wedding content changes
export const revalidate = 3600;

interface DemoPresetSpec {
  bride: string;
  groom: string;
  monogram: string;
  themeId: PresetId;
  venueCity: string;
  date: string;
  tagline: string;
}

const DEMO_PRESETS: Record<string, DemoPresetSpec> = {
  "priya-rahul": {
    bride: "Priya",
    groom: "Rahul",
    monogram: "P & R",
    themeId: "royal-crimson",
    venueCity: "Udaipur, Rajasthan",
    date: "February 15, 2027",
    tagline: "Royal Palatial Heritage",
  },
  "ananya-kabir": {
    bride: "Ananya",
    groom: "Kabir",
    monogram: "A & K",
    themeId: "emerald-gold",
    venueCity: "Jaipur, Rajasthan",
    date: "November 28, 2026",
    tagline: "Sacred Temple Heritage",
  },
  "diya-arjun": {
    bride: "Diya",
    groom: "Arjun",
    monogram: "D & A",
    themeId: "ivory-minimal",
    venueCity: "Alibaug, Maharashtra",
    date: "January 18, 2027",
    tagline: "Understated Minimalist Grace",
  },
  "zoya-farhan": {
    bride: "Zoya",
    groom: "Farhan",
    monogram: "Z & F",
    themeId: "sunset-dusk",
    venueCity: "Goa, India",
    date: "March 06, 2027",
    tagline: "Sundowner Sangeet & Beachside Vivah",
  },
};

export function generateStaticParams() {
  return [
    { slug: "priya-rahul" },
    { slug: "ananya-kabir" },
    { slug: "diya-arjun" },
    { slug: "zoya-farhan" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dbWedding = await getWeddingBySlug(params.slug);
  const demoSpec =
    DEMO_PRESETS[params.slug] ||
    (params.slug === "sample" || params.slug === "demo" ? DEMO_PRESETS["priya-rahul"] : null);
  const isDemoSlug = Boolean(demoSpec);

  if (!dbWedding && !isDemoSlug) {
    return {
      title: "Wedding Celebration | Shadify",
      description: "Private wedding invitation and celebration.",
      robots: { index: false, follow: false, nocache: true },
    };
  }

  const coupleNames = dbWedding
    ? `${dbWedding.brideName} & ${dbWedding.groomName}`
    : demoSpec
      ? `${demoSpec.bride} & ${demoSpec.groom}`
      : "Priya & Rahul";

  const title = `${coupleNames}'s Wedding Celebration | Shadify`;
  const description = `Private wedding invitation and ceremony itinerary for ${coupleNames}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Shadify",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
  date: "February 15, 2027",
  weddingDateIso: "2027-02-15T10:30:00.000Z",
  hostingUntil: "2032-02-15T00:00:00.000Z",
  venueCity: "Udaipur, Rajasthan",
  monogram: "P & R",
  upiVpa: "priya.rahul@okhdfcbank",
  showBranding: true,
  heroImage: "/demo/hero.jpg",
  loveStory: {
    headline: "A Love Story Written in Stars",
    tagline: "Our Journey to Forever",
    togetherSinceYear: "2021",
    coupleImage: "/demo/couple.jpg",
    storyP1:
      "It started with one chai, a few stolen glances across a college canteen, and a friendship that blossomed into something neither of us expected. Priya's laughter filled every room; Rahul's steadiness became her anchor.",
    storyP2:
      "Four years, countless memories, and one beautiful proposal at the shores of Lake Pichola later — we're ready to begin forever. We couldn't imagine celebrating this day without every single person who has loved us along the way.",
    milestones: [
      {
        year: "2021",
        title: "College Canteen ☕",
        description:
          "We met over bad coffee and better conversations that lasted until closing time.",
      },
      {
        year: "2022",
        title: "First Trip Together ❄️",
        description:
          "Manali in December — freezing hands, snowfall, and the quiet realization this was forever.",
      },
      {
        year: "2024",
        title: "The Pichola Proposal 💍",
        description: "A sunset wooden boat ride on Lake Pichola beneath City Palace. She said yes!",
      },
      {
        year: "2027",
        title: "Forever Begins 🌹",
        description:
          "Stepping around the sacred fire at our Udaipur lakeside mandap in the presence of everyone we love.",
      },
    ],
  },
  gallery: [
    { url: "/demo/couple.jpg", caption: "Together Forever ✦", aspect: "tall" },
    { url: "/demo/mandap.jpg", caption: "Sacred Vows by the Water ✦", aspect: "square" },
    { url: "/demo/sangeet.jpg", caption: "Sangeet Night Beats ✦", aspect: "square" },
    { url: "/demo/hero.jpg", caption: "The Royal Lakeside Mandap ✦", aspect: "wide" },
    { url: "/demo/mehendi.jpg", caption: "Mehendi Fragrance & Folk Songs ✦", aspect: "square" },
    { url: "/demo/couple.jpg", caption: "Unspoken Promises ✦", aspect: "square" },
  ],
  events: [
    {
      id: "evt-1",
      title: "Mehendi Ceremony",
      tag: "Mehendi",
      time: "4:00 PM onwards",
      date: "Feb 12, 2027",
      startTimeIso: "2027-02-12T10:30:00.000Z",
      venue: "Laxmi Niwas Palace Courtyard",
      address: "Pichola, Udaipur, Rajasthan",
      mapUrl: "https://maps.google.com/?q=Laxmi+Niwas+Palace+Udaipur",
      dressCode: "Sunshine Yellow & Festive Boho",
      coverImage: "/demo/mehendi.jpg",
    },
    {
      id: "evt-2",
      title: "Sangeet Night",
      tag: "Sangeet",
      time: "7:00 PM onwards",
      date: "Feb 13, 2027",
      startTimeIso: "2027-02-13T13:30:00.000Z",
      venue: "Fateh Prakash Palace Ballroom",
      address: "Pichola, Udaipur, Rajasthan",
      mapUrl: "https://maps.google.com/?q=Fateh+Prakash+Palace+Udaipur",
      dressCode: "Indo-Western Glitz & Glamour",
      coverImage: "/demo/sangeet.jpg",
    },
    {
      id: "evt-3",
      title: "Wedding & Sacred Pheras",
      tag: "Wedding",
      time: "10:30 AM onwards",
      date: "Feb 15, 2027",
      startTimeIso: "2027-02-15T05:00:00.000Z",
      venue: "City Palace Lakeside Gardens",
      address: "Pichola, Udaipur, Rajasthan",
      mapUrl: "https://maps.google.com/?q=City+Palace+Udaipur",
      dressCode: "Royal Pastels & Traditional Silk",
      coverImage: "/demo/mandap.jpg",
    },
    {
      id: "evt-4",
      title: "The Grand Reception",
      tag: "Reception",
      time: "7:00 PM onwards",
      date: "Feb 15, 2027",
      startTimeIso: "2027-02-15T13:30:00.000Z",
      venue: "The Leela Palace Under The Stars",
      address: "Pichola, Udaipur, Rajasthan",
      mapUrl: "https://maps.google.com/?q=The+Leela+Palace+Udaipur",
      dressCode: "Black Tie & Regal Banarasi",
      coverImage: "/demo/hero.jpg",
    },
  ],
  vips: [
    {
      group: "The Pillars",
      name: "Mr. & Mrs. Sharma & Mr. & Mrs. Kapoor",
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

  // 1. Deliberate Expired Site State (Zero PII or ceremony data leaked in HTML payload)
  const isExpired = Boolean(
    (dbWedding?.entitlement?.hostingUntil &&
      new Date(dbWedding.entitlement.hostingUntil).getTime() < Date.now()) ||
    (dbWedding?.contentExpiresAt && new Date(dbWedding.contentExpiresAt).getTime() < Date.now()),
  );

  if (isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] px-4 text-center text-[#1F1A2E]">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1F1A2E]/5 text-xl">
          ⌛
        </div>
        <h1 className="font-serif text-2xl text-[#1F1A2E] sm:text-3xl">
          Celebration Website Concluded
        </h1>
        <p className="mt-3 max-w-md text-xs leading-relaxed text-[#1F1A2E]/70 sm:text-sm">
          This private wedding celebration website has concluded its active hosting period.
        </p>
      </div>
    );
  }

  // Fallback demo samples
  const demoSpec =
    DEMO_PRESETS[slug] ||
    (slug === "sample" || slug === "demo" ? DEMO_PRESETS["priya-rahul"] : null);
  const isDemoSlug = Boolean(demoSpec);

  // 2. Deliberate 404 for unknown or draft slug (previews are served under /[slug]/preview)
  if (!dbWedding && !isDemoSlug) {
    notFound();
  }

  if (dbWedding && dbWedding.status !== "published" && !isDemoSlug) {
    notFound();
  }

  // Tailored demo wedding DTO
  const baseDemoWedding: WeddingDataDto = {
    ...SAMPLE_DEMO_WEDDING,
    slug,
    bride: demoSpec?.bride || SAMPLE_DEMO_WEDDING.bride,
    groom: demoSpec?.groom || SAMPLE_DEMO_WEDDING.groom,
    monogram: demoSpec?.monogram || SAMPLE_DEMO_WEDDING.monogram,
    venueCity: demoSpec?.venueCity || SAMPLE_DEMO_WEDDING.venueCity,
    date: demoSpec?.date || SAMPLE_DEMO_WEDDING.date,
  };

  // Format wedding data using the queries DTO mapper or fallback demo
  const wedding: WeddingDataDto = dbWedding
    ? {
        ...mapWeddingToDto(dbWedding),
        heroImage: isDemoSlug ? baseDemoWedding.heroImage : undefined,
        loveStory: isDemoSlug ? baseDemoWedding.loveStory : undefined,
        gallery: isDemoSlug ? baseDemoWedding.gallery : undefined,
        showBranding: isDemoSlug ? true : dbWedding.showBranding,
        events:
          dbWedding.events.length > 0
            ? mapWeddingToDto(dbWedding).events.map((e, idx) => ({
                ...e,
                coverImage:
                  e.coverImage ||
                  (isDemoSlug ? baseDemoWedding.events[idx]?.coverImage : undefined),
              }))
            : baseDemoWedding.events,
        vips: dbWedding.vips.length > 0 ? mapWeddingToDto(dbWedding).vips : baseDemoWedding.vips,
      }
    : baseDemoWedding;

  // Resolve the official published wedding theme (preset + verified overrides)
  const presetId = (dbWedding?.themeId as PresetId) || demoSpec?.themeId || "royal-crimson";
  const overrides = (dbWedding?.themeConfig as Record<string, unknown> | null) ?? null;
  const { theme, report } = resolveTheme(presetId, overrides);

  return <WeddingGuestClient wedding={wedding} theme={theme} contrastReport={report} />;
}
