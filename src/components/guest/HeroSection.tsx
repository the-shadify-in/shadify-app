"use client";

import React from "react";
import { ChevronDown, Heart, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  bride: string;
  groom: string;
  date: string;
  venueCity: string;
  monogram: string;
  heroImage?: string;
  isAfterWedding?: boolean;
  timeLeft: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

export function HeroSection({
  bride,
  groom,
  date,
  venueCity,
  monogram,
  heroImage,
  isAfterWedding = false,
  timeLeft,
}: HeroSectionProps) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section
      id="hero"
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-4 py-24 text-center"
    >
      {/* Background with luxury gradient overlay */}
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center transition-transform duration-1000"
        style={{
          backgroundImage: `url(${heroImage || "/demo/hero.jpg"})`,
        }}
      />
      {/* Editorial Gradient Veil */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/85" />

      {/* Royal Content Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-white">
        {/* Ornate Gold Filigree Monogram Crest */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-black/40 shadow-[0_0_35px_rgba(212,175,55,0.35)] backdrop-blur-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-[#E8B96B]/60">
            <span className="font-serif text-2xl font-bold tracking-widest text-[#E8B96B]">
              {monogram}
            </span>
          </div>
        </div>

        {/* Auspicious Overline Ribbon */}
        <p className="font-serif text-xs font-medium uppercase tracking-[0.35em] text-[#E8B96B] md:text-sm">
          {isAfterWedding ? "✦ JUST MARRIED • नवदंपति ✦" : "॥ शुभ विवाह • TOGETHER FOREVER ॥"}
        </p>

        {/* Editorial Couple Names */}
        <h1 className="mt-3 font-serif text-5xl font-normal leading-tight tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
          {bride}
          <span className="my-1 block font-serif text-3xl font-light italic text-[#E8B96B] sm:text-4xl md:text-5xl">
            &amp;
          </span>
          {groom}
        </h1>

        {/* Ceremony Date & City Pill */}
        <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-full border border-[#D4AF37]/40 bg-black/40 px-6 py-2 font-serif text-xs tracking-widest text-[#FDF8F0] backdrop-blur-md sm:text-sm">
          <span className="text-[#D4AF37]">✦</span>
          <span>{date}</span>
          <span className="text-[#D4AF37]">•</span>
          <span>{venueCity}</span>
          <span className="text-[#D4AF37]">✦</span>
        </div>

        {/* After Marriage View vs Pre-Wedding Countdown */}
        {isAfterWedding ? (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#D4AF37]/50 bg-black/55 p-6 text-center shadow-2xl backdrop-blur-md">
            <span className="block font-serif text-sm font-semibold uppercase tracking-wider text-[#E8B96B]">
              💐 Heartfelt Gratitude from the Newlyweds
            </span>
            <p className="mt-3 font-serif text-sm italic leading-relaxed text-white/90 sm:text-base">
              &ldquo;With folded hands and full hearts, we thank each of you for gracing our wedding
              with your presence, dancing in our Baraat, and blessing our sacred union. Relive our
              wedding memories below.&rdquo;
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[#D4AF37] px-7 font-serif text-xs font-bold uppercase tracking-widest text-[#1A0A00] shadow-lg hover:bg-[#E8B96B]"
              >
                <a href="#gallery">
                  <Camera className="mr-1.5 h-4 w-4" />
                  <span>RELIVE MEMORIES</span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-[#D4AF37]/60 bg-black/40 px-7 font-serif text-xs uppercase tracking-widest text-white"
              >
                <a href="#rsvp">
                  <Heart className="mr-1.5 h-4 w-4 text-[#D4AF37]" />
                  <span>LEAVE A BLESSING</span>
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Ornate Countdown Medallions */}
            {timeLeft && (
              <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-5">
                {[
                  { label: "DAYS", value: pad(timeLeft.days) },
                  { label: "HOURS", value: pad(timeLeft.hours) },
                  { label: "MINS", value: pad(timeLeft.minutes) },
                  { label: "SECS", value: pad(timeLeft.seconds) },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-[#D4AF37]/50 bg-black/45 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md sm:h-24 sm:w-24"
                  >
                    <span className="font-serif text-2xl font-bold tracking-wider text-white sm:text-3xl">
                      {item.value}
                    </span>
                    <span className="mt-1 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-[#E8B96B] sm:text-[10px]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Primary CTAs using Shadcn Button */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[#D4AF37] px-8 font-serif text-xs font-semibold uppercase tracking-widest text-[#1A0A00] shadow-[0_10px_25px_rgba(212,175,55,0.4)] transition-all hover:scale-105 hover:bg-[#E8B96B]"
              >
                <a href="#rsvp">CONFIRM ATTENDANCE 💌</a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-[#D4AF37]/50 bg-black/30 px-7 font-serif text-xs uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-black/50"
              >
                <a href="#events">VIEW ITINERARY</a>
              </Button>
            </div>
          </>
        )}

        {/* Scroll Indicator */}
        <div className="mt-12 flex animate-bounce flex-col items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#E8B96B]/70">
          <span>Scroll to Explore</span>
          <ChevronDown className="h-4 w-4 text-[#D4AF37]" />
        </div>
      </div>
    </section>
  );
}
