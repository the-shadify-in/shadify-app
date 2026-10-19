"use client";

import React from "react";

interface GuestFooterProps {
  bride: string;
  groom: string;
  date: string;
  venueCity: string;
  showBranding?: boolean;
}

export function GuestFooter({
  bride,
  groom,
  date,
  venueCity,
  showBranding = true,
}: GuestFooterProps) {
  return (
    <footer className="relative border-t border-[#D4AF37]/25 bg-black/90 px-6 py-16 text-center text-white/70">
      <div className="mx-auto max-w-4xl">
        {/* Auspicious Mandala */}
        <div className="mb-4 text-center font-serif text-lg tracking-[0.5em] text-[#D4AF37]">
          ✦ ॐ ✦
        </div>

        <h3 className="font-serif text-2xl font-normal text-white sm:text-3xl">
          {bride} <span className="font-serif italic text-[#D4AF37]">&amp;</span> {groom}
        </h3>

        <p className="mt-2 font-serif text-xs uppercase tracking-widest text-[#E8B96B]/80 sm:text-sm">
          {date} • {venueCity}
        </p>

        {/* Quick Nav Links */}
        <ul className="mt-8 flex flex-wrap justify-center gap-6 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
          <li>
            <a href="#hero" className="transition-colors hover:text-[#D4AF37]">
              Home
            </a>
          </li>
          <li>
            <a href="#story" className="transition-colors hover:text-[#D4AF37]">
              Our Story
            </a>
          </li>
          <li>
            <a href="#events" className="transition-colors hover:text-[#D4AF37]">
              Ceremonies
            </a>
          </li>
          <li>
            <a href="#gallery" className="transition-colors hover:text-[#D4AF37]">
              Moments
            </a>
          </li>
          <li>
            <a href="#vips" className="transition-colors hover:text-[#D4AF37]">
              Family
            </a>
          </li>
          <li>
            <a href="#rsvp" className="transition-colors hover:text-[#D4AF37]">
              RSVP
            </a>
          </li>
        </ul>

        {/* Platform Attribution */}
        {showBranding && (
          <div className="mt-12 border-t border-white/10 pt-6 text-xs tracking-wider text-white/40">
            <span>Crafted with royal elegance on </span>
            <strong className="font-serif text-[#D4AF37]">Shadify</strong>
            <span> • Digital Wedding Invitations</span>
          </div>
        )}
      </div>
    </footer>
  );
}
