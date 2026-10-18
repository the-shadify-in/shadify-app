import React from "react";
import Link from "next/link";
import { getAdminSession, verifyPreviewToken } from "@/lib/auth";
import { resolveTheme } from "@/lib/themes/tokens";
import WeddingGuestClient, { WeddingData } from "../WeddingGuestClient";

export const dynamic = "force-dynamic";

export default async function WeddingPreviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { theme?: string; token?: string };
}) {
  const { slug } = params;

  // Verify staff session or valid HMAC preview token
  const isStaff = await getAdminSession();
  const isPreview = verifyPreviewToken(searchParams.token, slug);

  if (!isStaff && !isPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5] text-[#1F1A2E] p-6 font-sans text-center">
        <div className="max-w-md border border-[#EADDCF] rounded-2xl p-8 bg-white shadow-sm space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-[#FFF1F6] border border-[#D6246E]/20 flex items-center justify-center text-[#D6246E] font-serif text-lg">
            🔒
          </div>
          <h2 className="text-xl font-serif font-medium">Restricted Preview</h2>
          <p className="text-xs text-[#1F1A2E]/70 leading-relaxed">
            This preview route is protected. You must be logged into the concierge admin portal or possess a valid signed preview link to inspect unreleased wedding themes.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/login"
              className="inline-block rounded-full bg-[#D6246E] px-6 py-2.5 text-xs font-semibold text-white shadow hover:opacity-95"
            >
              Sign into Concierge Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Demo fallback data
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
    ],
  };

  const themeKey = searchParams.theme || "royal-crimson";
  const { theme, report } = resolveTheme(themeKey, null);

  return (
    <>
      {/* Visual Indicator for Concierge Staff */}
      <aside className="fixed top-3 left-1/2 -translate-x-1/2 z-50 rounded-full border border-amber-300 bg-amber-50/95 px-4 py-1 text-[11px] font-medium text-amber-900 shadow-md backdrop-blur">
        Preview Mode Active: <strong className="font-semibold">{theme.presetId}</strong> ({report.ok ? "Contrast Valid" : "Contrast Warning"})
      </aside>

      <WeddingGuestClient
        wedding={wedding}
        theme={theme}
        contrastReport={report}
      />
    </>
  );
}
