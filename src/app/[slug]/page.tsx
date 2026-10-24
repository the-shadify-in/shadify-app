import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveTheme, type PresetId } from "@/lib/themes/tokens";
import { getWeddingBySlug, mapWeddingToDto, type WeddingDataDto } from "@/features/weddings";
import WeddingGuestClient from "./WeddingGuestClient";

// Revalidate every hour, or via on-demand tag revalidation when wedding content changes
export const revalidate = 3600;

interface DemoWeddingRecord extends WeddingDataDto {
  themeId: PresetId;
}

const DEMO_WEDDINGS: Record<string, DemoWeddingRecord> = {
  "priya-rahul": {
    slug: "priya-rahul",
    bride: "Priya",
    groom: "Rahul",
    date: "February 15, 2027",
    weddingDateIso: "2027-02-15T10:30:00+05:30",
    hostingUntil: "2032-02-15T00:00:00+05:30",
    venueCity: "Udaipur, Rajasthan",
    monogram: "P & R",
    upiVpa: "priya.rahul@okhdfcbank",
    showBranding: true,
    heroImage: "/demo/hero.jpg",
    themeId: "royal-crimson",
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
          description:
            "A sunset wooden boat ride on Lake Pichola beneath City Palace. She said yes!",
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
      { url: "/demo/mandap.jpg", caption: "Sacred Vows by Lake Pichola ✦", aspect: "square" },
      {
        url: "/demo/sangeet.jpg",
        caption: "Sangeet Night Beats & Banarasi Glitz ✦",
        aspect: "square",
      },
      { url: "/demo/hero.jpg", caption: "The Royal Lakeside Courtyard ✦", aspect: "wide" },
      { url: "/demo/mehendi.jpg", caption: "Mehendi Fragrance & Folk Songs ✦", aspect: "square" },
      { url: "/demo/couple.jpg", caption: "Unspoken Promises ✦", aspect: "square" },
    ],
    events: [
      {
        id: "evt-pr-1",
        title: "Mehendi Ceremony",
        tag: "Mehendi",
        time: "4:00 PM onwards",
        date: "Feb 13, 2027",
        startTimeIso: "2027-02-13T16:00:00+05:30",
        venue: "Laxmi Niwas Palace Courtyard",
        address: "Lake Pichola, Udaipur, Rajasthan 313001",
        mapUrl: "https://maps.google.com/?q=Laxmi+Niwas+Palace+Udaipur",
        dressCode: "Sunshine Yellow & Festive Boho",
        coverImage: "/demo/mehendi.jpg",
      },
      {
        id: "evt-pr-2",
        title: "Sangeet Night Celebration",
        tag: "Sangeet",
        time: "7:30 PM onwards",
        date: "Feb 14, 2027",
        startTimeIso: "2027-02-14T19:30:00+05:30",
        venue: "Fateh Prakash Palace Ballroom",
        address: "City Palace Complex, Udaipur, Rajasthan 313001",
        mapUrl: "https://maps.google.com/?q=Fateh+Prakash+Palace+Udaipur",
        dressCode: "Indo-Western Glitz & Regal Banarasi",
        coverImage: "/demo/sangeet.jpg",
      },
      {
        id: "evt-pr-3",
        title: "Auspicious Vivah & Sacred Pheras",
        tag: "Wedding",
        time: "10:30 AM onwards",
        date: "Feb 15, 2027",
        startTimeIso: "2027-02-15T10:30:00+05:30",
        venue: "Jagmandir Island Palace",
        address: "Lake Pichola, Udaipur, Rajasthan 313001",
        mapUrl: "https://maps.google.com/?q=Jagmandir+Palace+Udaipur",
        dressCode: "Royal Pastels & Traditional Silk",
        coverImage: "/demo/mandap.jpg",
      },
      {
        id: "evt-pr-4",
        title: "The Grand Reception",
        tag: "Reception",
        time: "7:00 PM onwards",
        date: "Feb 15, 2027",
        startTimeIso: "2027-02-15T19:00:00+05:30",
        venue: "The Leela Palace Under The Stars",
        address: "Lake Pichola, Udaipur, Rajasthan 313001",
        mapUrl: "https://maps.google.com/?q=The+Leela+Palace+Udaipur",
        dressCode: "Black Tie & Velvet Royal",
        coverImage: "/demo/hero.jpg",
      },
    ],
    vips: [
      {
        group: "The Pillars",
        name: "Mr. & Mrs. Sharma & Mr. & Mrs. Verma",
        tagline: "Proud Parents of Priya & Rahul",
      },
      {
        group: "Bride's Tribe",
        name: "Ananya, Pooja & Riya",
        tagline: "Chief Shoe Negotiators 👠",
      },
      {
        group: "Groom's Squad",
        name: "Vikram, Siddharth & Kabir",
        tagline: "Baraat Hype & Choreography 🔥",
      },
    ],
  },
  "ananya-kabir": {
    slug: "ananya-kabir",
    bride: "Ananya",
    groom: "Kabir",
    date: "November 28, 2026",
    weddingDateIso: "2026-11-28T09:30:00+05:30",
    hostingUntil: "2031-11-28T00:00:00+05:30",
    venueCity: "Jaipur, Rajasthan",
    monogram: "A & K",
    upiVpa: "ananya.kabir@icici",
    showBranding: true,
    heroImage: "/demo/hero.jpg",
    themeId: "emerald-gold",
    loveStory: {
      headline: "Sacred Vows & Heritage Grace",
      tagline: "Guided by Sacred Vedic Traditions",
      togetherSinceYear: "2020",
      coupleImage: "/demo/couple.jpg",
      storyP1:
        "Growing up in families steeped in classical music and literature, Ananya and Kabir crossed paths during an annual heritage arts festival in Jaipur. Ananya's gentle grace and Kabir's thoughtful devotion formed an unspoken bond from the first raga.",
      storyP2:
        "Six years of quiet understanding, family blessings, and morning temple visits later — we step around the holy fire to unite our lineages with gratitude, fresh jasmine, and reverent joy.",
      milestones: [
        {
          year: "2020",
          title: "Heritage Arts Festival 🪕",
          description: "First meeting amidst classical sitar melodies in the courtyards of Jaipur.",
        },
        {
          year: "2022",
          title: "Govind Dev Ji Temple Blessings 🪔",
          description: "A shared morning prayer that deepened their mutual devotion and respect.",
        },
        {
          year: "2025",
          title: "Family Roka Ceremony 🌸",
          description:
            "Both families gathering with traditional sweets, silk shawls, and sacred shagun.",
        },
        {
          year: "2026",
          title: "The Sacred Vivah 🕉️",
          description:
            "Traditional Vedic vows surrounded by fragrance of fresh jasmine and temple bells.",
        },
      ],
    },
    gallery: [
      { url: "/demo/couple.jpg", caption: "Gentle Devotion ✦", aspect: "tall" },
      { url: "/demo/mandap.jpg", caption: "Sacred Vedic Mandap ✦", aspect: "square" },
      { url: "/demo/sangeet.jpg", caption: "Classical Sangeet & Rasleela ✦", aspect: "square" },
      { url: "/demo/hero.jpg", caption: "Heritage Courtyard Lamps ✦", aspect: "wide" },
      { url: "/demo/mehendi.jpg", caption: "Haldi & Fresh Marigolds ✦", aspect: "square" },
      { url: "/demo/couple.jpg", caption: "Eternal Harmony ✦", aspect: "square" },
    ],
    events: [
      {
        id: "evt-ak-1",
        title: "Traditional Haldi & Mehendi",
        tag: "Mehendi",
        time: "10:00 AM onwards",
        date: "Nov 27, 2026",
        startTimeIso: "2026-11-27T10:00:00+05:30",
        venue: "Nahargarh Fort Courtyard",
        address: "Krishna Nagar, Brahampuri, Jaipur, Rajasthan 302002",
        mapUrl: "https://maps.google.com/?q=Nahargarh+Fort+Jaipur",
        dressCode: "Turmeric Yellow & Traditional Gota Patti",
        coverImage: "/demo/mehendi.jpg",
      },
      {
        id: "evt-ak-2",
        title: "Classical Sangeet & Rasleela",
        tag: "Sangeet",
        time: "6:30 PM onwards",
        date: "Nov 27, 2026",
        startTimeIso: "2026-11-27T18:30:00+05:30",
        venue: "Rambagh Palace Heritage Pavilion",
        address: "Bhawani Singh Rd, Jaipur, Rajasthan 302005",
        mapUrl: "https://maps.google.com/?q=Rambagh+Palace+Jaipur",
        dressCode: "Deep Emerald & Temple Gold Zari",
        coverImage: "/demo/sangeet.jpg",
      },
      {
        id: "evt-ak-3",
        title: "Sacred Temple Vivah & Muhurtham",
        tag: "Wedding",
        time: "9:30 AM onwards",
        date: "Nov 28, 2026",
        startTimeIso: "2026-11-28T09:30:00+05:30",
        venue: "City Palace Mandap",
        address: "Tulsi Marg, Gangori Bazaar, Jaipur, Rajasthan 302002",
        mapUrl: "https://maps.google.com/?q=City+Palace+Jaipur",
        dressCode: "Kanjeevaram & Banarasi Silk",
        coverImage: "/demo/mandap.jpg",
      },
      {
        id: "evt-ak-4",
        title: "Heritage Royal Feast",
        tag: "Reception",
        time: "7:30 PM onwards",
        date: "Nov 28, 2026",
        startTimeIso: "2026-11-28T19:30:00+05:30",
        venue: "Jai Mahal Palace Lawns",
        address: "Jacob Rd, Civil Lines, Jaipur, Rajasthan 302006",
        mapUrl: "https://maps.google.com/?q=Jai+Mahal+Palace+Jaipur",
        dressCode: "Formal Heritage Attire",
        coverImage: "/demo/hero.jpg",
      },
    ],
    vips: [
      {
        group: "The Elders",
        name: "Pandit Shastri & Shri K. Sharma",
        tagline: "Sacred Mantras & Family Guidance",
      },
      {
        group: "Bride's Family",
        name: "Smt. & Shri R. Narayanan",
        tagline: "Proud Parents of Ananya",
      },
      {
        group: "Groom's Family",
        name: "Smt. & Shri M. Singhania",
        tagline: "Proud Parents of Kabir",
      },
    ],
  },
  "diya-arjun": {
    slug: "diya-arjun",
    bride: "Diya",
    groom: "Arjun",
    date: "January 18, 2027",
    weddingDateIso: "2027-01-18T11:00:00+05:30",
    hostingUntil: "2032-01-18T00:00:00+05:30",
    venueCity: "Alibaug, Maharashtra",
    monogram: "D & A",
    upiVpa: "diya.arjun@axisbank",
    showBranding: true,
    heroImage: "/demo/hero.jpg",
    themeId: "ivory-minimal",
    loveStory: {
      headline: "Quiet Light & Timeless Simplicity",
      tagline: "An Intimate Celebration of Love",
      togetherSinceYear: "2022",
      coupleImage: "/demo/couple.jpg",
      storyP1:
        "Two architects who met while restoring a centuries-old basalt stone farmhouse in coastal Maharashtra. Diya loved clean lines and natural daylight; Arjun loved handcrafted joinery and quiet reading nooks.",
      storyP2:
        "Our love found its footing on quiet morning walks along Kihim beach and sketchbooks filled with shared blueprints. An intimate celebration surrounded by sea breezes, swaying palms, and our closest family.",
      milestones: [
        {
          year: "2022",
          title: "The Restoration Studio 📐",
          description: "Meeting over site sketches and blueprint drafts in South Mumbai.",
        },
        {
          year: "2023",
          title: "First Alibaug Ferry 🌊",
          description: "A weekend escape across the Arabian Sea that felt like coming home.",
        },
        {
          year: "2025",
          title: "The Sunset Sketch 🌅",
          description: "A quiet proposal drawn into the margins of a coastal sketchbook.",
        },
        {
          year: "2027",
          title: "Understated Vows 🌿",
          description: "Gathering our families under open coastal skies with heartfelt blessings.",
        },
      ],
    },
    gallery: [
      { url: "/demo/couple.jpg", caption: "Simplicity in Bloom ✦", aspect: "tall" },
      { url: "/demo/mandap.jpg", caption: "Coastal Mandap Under Open Skies ✦", aspect: "square" },
      { url: "/demo/sangeet.jpg", caption: "Acoustic Sunset Melodies ✦", aspect: "square" },
      { url: "/demo/hero.jpg", caption: "Bodhi Villa Starlit Courtyard ✦", aspect: "wide" },
      { url: "/demo/mehendi.jpg", caption: "Minimal Jasmine Wreaths ✦", aspect: "square" },
      { url: "/demo/couple.jpg", caption: "Quiet Understanding ✦", aspect: "square" },
    ],
    events: [
      {
        id: "evt-da-1",
        title: "Welcome Sundowner & Acoustic Evening",
        tag: "Sangeet",
        time: "4:30 PM onwards",
        date: "Jan 17, 2027",
        startTimeIso: "2027-01-17T16:30:00+05:30",
        venue: "The Palm Grove Farmhouse",
        address: "Kihim Beach Road, Alibaug, Maharashtra 402201",
        mapUrl: "https://maps.google.com/?q=Kihim+Beach+Alibaug",
        dressCode: "Ivory, Champagne & Natural Linen",
        coverImage: "/demo/sangeet.jpg",
      },
      {
        id: "evt-da-2",
        title: "Intimate Coastal Vivah & Vows",
        tag: "Wedding",
        time: "11:00 AM onwards",
        date: "Jan 18, 2027",
        startTimeIso: "2027-01-18T11:00:00+05:30",
        venue: "Radisson Blu Coastal Lawn",
        address: "Gondhalpada, Veshvi, Alibaug, Maharashtra 402209",
        mapUrl: "https://maps.google.com/?q=Radisson+Blu+Alibaug",
        dressCode: "Subtle Pastels & Raw Silk",
        coverImage: "/demo/mandap.jpg",
      },
      {
        id: "evt-da-3",
        title: "Starlit Farmhouse Dinner",
        tag: "Reception",
        time: "7:00 PM onwards",
        date: "Jan 18, 2027",
        startTimeIso: "2027-01-18T19:00:00+05:30",
        venue: "Bodhi Villa Courtyard",
        address: "Awas Beach Road, Alibaug, Maharashtra 402201",
        mapUrl: "https://maps.google.com/?q=Awas+Beach+Alibaug",
        dressCode: "Casual Chic & Editorial Neutrals",
        coverImage: "/demo/hero.jpg",
      },
    ],
    vips: [
      {
        group: "The Pillars",
        name: "The Patel & Mehta Families",
        tagline: "Parents & Guiding Anchors",
      },
      {
        group: "Design Tribe",
        name: "Rohan, Tanvi & Sameer",
        tagline: "Fellow Architects & Toastmakers",
      },
    ],
  },
  "zoya-farhan": {
    slug: "zoya-farhan",
    bride: "Zoya",
    groom: "Farhan",
    date: "March 06, 2027",
    weddingDateIso: "2027-03-06T11:30:00+05:30",
    hostingUntil: "2032-03-06T00:00:00+05:30",
    venueCity: "Goa, India",
    monogram: "Z & F",
    upiVpa: "zoya.farhan@kotak",
    showBranding: true,
    heroImage: "/demo/hero.jpg",
    themeId: "sunset-dusk",
    loveStory: {
      headline: "Sunset Rhythms & Ocean Whispers",
      tagline: "A Festive Beachside Celebration",
      togetherSinceYear: "2021",
      coupleImage: "/demo/couple.jpg",
      storyP1:
        "Met at an open-air music festival in Goa when a sudden tropical rainstorm pushed everyone beneath the same bamboo gazebo. Farhan shared his umbrella; Zoya shared her playlist.",
      storyP2:
        "Five years of festival road trips, indie gigs, and coastal drives brought us back to the very shores where our story began. We cannot wait to dance under the stars with our favorite people.",
      milestones: [
        {
          year: "2021",
          title: "Goa Indie Fest 🎸",
          description:
            "A rainstorm shelter turned into an all-night conversation about vinyl records.",
        },
        {
          year: "2023",
          title: "Road Trip Across the Coast 🚗",
          description: "Mumbai to Goa soundtracked by acoustic guitars and roadside dhabas.",
        },
        {
          year: "2025",
          title: "Vagator Cliff Sunset 💍",
          description: "A golden hour proposal overlooking the Arabian Sea.",
        },
        {
          year: "2027",
          title: "Sundowner Celebration 🌴",
          description: "Dancing into our forever with all of you beneath coastal palms.",
        },
      ],
    },
    gallery: [
      { url: "/demo/couple.jpg", caption: "Sunset Beats ✦", aspect: "tall" },
      { url: "/demo/mandap.jpg", caption: "Oceanfront Bamboo Mandap ✦", aspect: "square" },
      { url: "/demo/sangeet.jpg", caption: "Sundowner Dance Floor ✦", aspect: "square" },
      { url: "/demo/hero.jpg", caption: "Vagator Palms & Fairylights ✦", aspect: "wide" },
      { url: "/demo/mehendi.jpg", caption: "Beachside Mehendi Cabana ✦", aspect: "square" },
      { url: "/demo/couple.jpg", caption: "Endless Horizons ✦", aspect: "square" },
    ],
    events: [
      {
        id: "evt-zf-1",
        title: "Sunset Beach Mehendi & Cocktails",
        tag: "Mehendi",
        time: "3:30 PM onwards",
        date: "Mar 05, 2027",
        startTimeIso: "2027-03-05T15:30:00+05:30",
        venue: "Rockpool Pavilion, W Goa",
        address: "Vagator Beach, Bardez, Goa 403509",
        mapUrl: "https://maps.google.com/?q=W+Goa+Vagator",
        dressCode: "Sunset Coral & Tropical Florals",
        coverImage: "/demo/mehendi.jpg",
      },
      {
        id: "evt-zf-2",
        title: "Sundowner Sangeet & Beats",
        tag: "Sangeet",
        time: "6:30 PM onwards",
        date: "Mar 05, 2027",
        startTimeIso: "2027-03-05T18:30:00+05:30",
        venue: "Bayview Lawns",
        address: "Ozran Beach Road, Small Vagator, Anjuna, Goa 403509",
        mapUrl: "https://maps.google.com/?q=Ozran+Beach+Goa",
        dressCode: "Festive Shimmer & Indo-Western",
        coverImage: "/demo/sangeet.jpg",
      },
      {
        id: "evt-zf-3",
        title: "Oceanfront Nikah & Celebrations",
        tag: "Wedding",
        time: "11:30 AM onwards",
        date: "Mar 06, 2027",
        startTimeIso: "2027-03-06T11:30:00+05:30",
        venue: "Grand Hyatt Bayview",
        address: "PO Goa University, Bambolim, Goa 403206",
        mapUrl: "https://maps.google.com/?q=Grand+Hyatt+Goa",
        dressCode: "Ivory, Rose Gold & Festive Pastels",
        coverImage: "/demo/mandap.jpg",
      },
    ],
    vips: [
      {
        group: "The Pillars",
        name: "The Siddiqui & Qureshi Families",
        tagline: "Beloved Parents & Grandparents",
      },
      {
        group: "The Music Crew",
        name: "Ayla, Zain & Tariq",
        tagline: "DJs, Musicians & Sunset Planners",
      },
    ],
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
  const demoData =
    DEMO_WEDDINGS[params.slug] ||
    (params.slug === "sample" || params.slug === "demo" ? DEMO_WEDDINGS["priya-rahul"] : null);
  const isDemoSlug = Boolean(demoData);

  if (!dbWedding && !isDemoSlug) {
    return {
      title: "Wedding Celebration",
      description: "Private wedding invitation and celebration.",
      robots: { index: false, follow: false, nocache: true },
    };
  }

  if (dbWedding && dbWedding.status !== "published" && !demoData) {
    return {
      title: "Celebration Coming Soon",
      description: "This private wedding celebration website is not yet live.",
      robots: { index: false, follow: false, nocache: true },
    };
  }

  const coupleNames = dbWedding
    ? `${dbWedding.brideName} & ${dbWedding.groomName}`
    : demoData
      ? `${demoData.bride} & ${demoData.groom}`
      : "Priya & Rahul";

  // Note: Layout defines "%s | Shadify" template, so we avoid adding "| Shadify" here to prevent duplication
  const title = `${coupleNames}'s Wedding Celebration`;
  const description = `Private wedding celebration and ceremony itinerary for ${coupleNames}.`;

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
  const demoData =
    DEMO_WEDDINGS[slug] ||
    (slug === "sample" || slug === "demo" ? DEMO_WEDDINGS["priya-rahul"] : null);
  const isDemoSlug = Boolean(demoData);

  // 2. Deliberate 404 for unknown slug
  if (!dbWedding && !isDemoSlug) {
    notFound();
  }

  // 3. Generic unrevealing "Coming Soon" screen for unpublished weddings (Zero PII, zero date/venue enumeration)
  if (dbWedding && dbWedding.status !== "published" && !isDemoSlug) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#090406] px-6 text-center text-[#FFF9F2]">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#C9933A]/30 bg-[#12070A]/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#C9933A]/40 bg-[#C9933A]/10 text-2xl text-[#C9933A]">
            ✦
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9933A]/30 bg-[#C9933A]/10 px-3.5 py-1 font-serif text-xs font-medium uppercase tracking-widest text-[#E8B96B]">
            Celebration Coming Soon
          </span>
          <h1 className="mt-4 font-serif text-2xl font-light tracking-wide text-white sm:text-3xl">
            This Celebration is Not Yet Live
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-[#E2D5C7]/70 sm:text-sm">
            The couple is putting the final touches on their digital itinerary. Please check back
            closer to the celebration date.
          </p>
        </div>
      </main>
    );
  }

  const fallbackDemo = (demoData || DEMO_WEDDINGS["priya-rahul"]) as DemoWeddingRecord;

  // Format wedding data using the queries DTO mapper or fallback demo
  // Check section toggles configured on the wedding
  const themeSections = (dbWedding?.themeConfig as Record<string, unknown> | null)?.sections as
    Record<string, boolean> | undefined;
  const allowLoveStory =
    isDemoSlug || (themeSections ? themeSections.showLoveStory !== false : true);
  const allowGallery = isDemoSlug || (themeSections ? themeSections.showGallery !== false : true);
  const allowVips = isDemoSlug || (themeSections ? themeSections.showVips !== false : true);
  const dbDto = dbWedding ? mapWeddingToDto(dbWedding) : null;

  const wedding: WeddingDataDto = dbDto
    ? {
        ...dbDto,
        isDemo: isDemoSlug,
        venueCity: dbDto.venueCity || fallbackDemo.venueCity,
        heroImage: fallbackDemo.heroImage,
        loveStory: allowLoveStory
          ? dbDto.loveStory || (isDemoSlug ? fallbackDemo.loveStory : undefined)
          : undefined,
        gallery: allowGallery
          ? dbDto.gallery && dbDto.gallery.length > 0
            ? dbDto.gallery
            : isDemoSlug
              ? fallbackDemo.gallery
              : []
          : [],
        showBranding: isDemoSlug ? true : dbDto.showBranding,
        events: dbDto.events.length > 0 ? dbDto.events : fallbackDemo.events,
        vips: allowVips
          ? dbDto.vips && dbDto.vips.length > 0
            ? dbDto.vips
            : fallbackDemo.vips
          : [],
      }
    : {
        ...fallbackDemo,
        isDemo: true,
      };

  // Resolve the official published wedding theme (preset + verified overrides)
  const presetId = (dbWedding?.themeId as PresetId) || fallbackDemo.themeId || "royal-crimson";
  const overrides = (dbWedding?.themeConfig as Record<string, unknown> | null) ?? null;
  const { theme, report } = resolveTheme(presetId, overrides);

  return <WeddingGuestClient wedding={wedding} theme={theme} contrastReport={report} />;
}
