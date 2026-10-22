import React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Clock, MessageCircle } from "lucide-react";
import { getWeddingBySlug, mapWeddingToDto } from "@/features/weddings";
import { resolveTheme, type PresetId } from "@/lib/themes/tokens";
import { getConciergeWhatsAppUrl } from "@/lib/config/contact";

interface QrRouteProps {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: QrRouteProps): Promise<Metadata> {
  const wedding = await getWeddingBySlug(params.slug);
  const title = wedding
    ? `${wedding.brideName} & ${wedding.groomName}'s Celebration | Shadify`
    : "Wedding Invitation | Shadify";

  return {
    title,
    description: "Scan to open private digital wedding itinerary and directions.",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function QrRedirectPage({ params }: QrRouteProps) {
  const { slug } = params;
  const dbWedding = await getWeddingBySlug(slug);

  // 1. If slug is unknown, return genuine 404 (not a fake coming soon)
  if (!dbWedding) {
    notFound();
  }

  // 2. If already published, seamlessly redirect to canonical guest page
  if (dbWedding.status === "published") {
    redirect(`/${slug}`);
  }

  // 3. If in draft or preview status (card already printed, but site awaiting couple's final approval)
  const dto = mapWeddingToDto(dbWedding);
  const presetId = (dbWedding.themeId as PresetId) || "emerald-gold";
  const overrides = (dbWedding.themeConfig as Record<string, unknown> | null) ?? null;
  const { theme } = resolveTheme(presetId, overrides);
  const c = theme.palette;

  return (
    <main
      style={{
        backgroundColor: c.canvas,
        color: c.text,
      }}
      className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-[#D4AF37] p-8 shadow-2xl backdrop-blur-xl sm:p-12"
        style={{
          backgroundColor: c.surface,
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 75%)",
        }}
      >
        {/* Ornate Gold Corners */}
        <div className="absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-[#D4AF37]/80" />
        <div className="absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-[#D4AF37]/80" />
        <div className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-[#D4AF37]/80" />
        <div className="absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-[#D4AF37]/80" />

        {/* Invocation */}
        {dto.invocation && (
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
            {dto.invocation}
          </p>
        )}

        {/* Monogram Medallion */}
        <div className="relative mx-auto my-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-black/40 shadow-[0_0_25px_rgba(212,175,55,0.25)]">
          <div className="absolute inset-1 rounded-full border border-dashed border-[#D4AF37]/40" />
          <span className="font-serif text-2xl font-bold tracking-wider text-[#E8B96B]">
            {dto.monogram}
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3.5 py-1 font-serif text-[11px] font-semibold uppercase tracking-widest text-[#E8B96B]">
          <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span>Celebration Details Coming Soon</span>
        </span>

        <h1 className="mt-4 font-serif text-3xl font-light tracking-wide text-white sm:text-4xl">
          {dto.bride} <span className="font-serif italic text-[#D4AF37]">&amp;</span> {dto.groom}
        </h1>

        <div className="mx-auto my-3 flex items-center justify-center gap-2 font-serif text-xs tracking-widest text-[#E8B96B]/80">
          <span>✦</span>
          <span>{dto.date}</span>
          <span>•</span>
          <span>{dto.venueCity}</span>
          <span>✦</span>
        </div>

        <p className="mx-auto mt-5 max-w-sm font-serif text-xs leading-relaxed text-[#B4C2B9] sm:text-sm">
          The physical invitation cards have been printed! The couple is currently giving final
          touches to their digital schedule, ceremonies, and directions.
        </p>

        <p className="mt-2 font-serif text-[11px] italic text-[#E8B96B]/70">
          Please scan this QR code again closer to the celebration date.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={getConciergeWhatsAppUrl(
              `Hi Shadify Concierge, I scanned the printed wedding card for ${dto.bride} & ${dto.groom}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-[#D4AF37] bg-black/60 px-6 py-2.5 font-serif text-xs font-semibold uppercase tracking-wider text-[#FDF8F0] shadow-md transition-all hover:bg-black/80"
          >
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            <span>Concierge Assistance</span>
          </a>
        </div>
      </div>
    </main>
  );
}
