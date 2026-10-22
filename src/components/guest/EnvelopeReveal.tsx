"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";

interface EnvelopeRevealProps {
  bride: string;
  groom: string;
  date: string;
  venueCity: string;
  monogram: string;
  slug: string;
  waxSealColor?: string;
  envelopeBg?: string;
  invocation?: string;
  onOpened: () => void;
}

export function EnvelopeReveal({
  bride,
  groom,
  date,
  venueCity,
  monogram,
  slug,
  waxSealColor,
  envelopeBg,
  invocation,
  onOpened,
}: EnvelopeRevealProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    setIsOpening(true);
    try {
      localStorage.setItem(`shadify_envelope_opened_${slug}`, "true");
    } catch {
      // Storage unavailable fallback
    }
    setTimeout(() => {
      onOpened();
    }, 850);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wedding Invitation Envelope"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl transition-all duration-700 ${
        isOpening ? "pointer-events-none scale-105 opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#D4AF37]/40 p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.8)] transition-all duration-500 sm:p-10"
        style={{
          backgroundColor: envelopeBg || "var(--theme-envelope-bg, #1A0D14)",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 75%)",
        }}
      >
        {/* Ornate Gold Corners */}
        <div className="absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-[#D4AF37]/80" />
        <div className="absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-[#D4AF37]/80" />
        <div className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-[#D4AF37]/80" />
        <div className="absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-[#D4AF37]/80" />

        {/* Traditional Auspicious Invocation */}
        <p className="font-serif text-xs font-medium uppercase tracking-[0.35em] text-[#D4AF37]">
          {invocation || "॥ श्री गणेशाय नमः ॥"}
        </p>

        {/* Ornate Monogram Medallion */}
        <div className="relative mx-auto my-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-black/40 shadow-[0_0_25px_rgba(212,175,55,0.25)]">
          <div className="absolute inset-1 rounded-full border border-dashed border-[#D4AF37]/40" />
          <span className="font-serif text-2xl font-bold tracking-wider text-[#E8B96B]">
            {monogram}
          </span>
        </div>

        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#D4AF37]/90">
          You Are Cordially Invited
        </p>

        <h1 className="mt-3 font-serif text-3xl font-light tracking-wide text-white sm:text-4xl">
          {bride} <span className="font-serif italic text-[#D4AF37]">&amp;</span> {groom}
        </h1>

        <div className="mx-auto my-3 flex items-center justify-center gap-2 font-serif text-xs tracking-widest text-[#E8B96B]/80">
          <span>✦</span>
          <span>{date}</span>
          <span>•</span>
          <span>{venueCity}</span>
          <span>✦</span>
        </div>

        {/* 3D Wax Seal Button */}
        <div className="mt-8 flex flex-col items-center">
          <button
            type="button"
            onClick={handleOpen}
            aria-label="Open Invitation"
            style={{
              backgroundColor: waxSealColor || "var(--theme-wax-seal, #8B0000)",
            }}
            className="group relative flex items-center gap-3 rounded-full border-2 border-[#D4AF37] px-8 py-3.5 font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#FDF8F0] shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-[#D4AF37] transition-transform duration-500 group-hover:rotate-45" />
            <span>OPEN INVITATION</span>
          </button>

          <button
            type="button"
            onClick={handleOpen}
            className="mt-4 text-xs uppercase tracking-widest text-[#E8B96B]/60 underline transition-colors hover:text-[#D4AF37]"
          >
            Skip to Details
          </button>
        </div>
      </div>
    </div>
  );
}
