"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { VipEntryDto } from "@/features/weddings";

interface VipSectionProps {
  vips: VipEntryDto[];
}

export function VipSection({ vips }: VipSectionProps) {
  if (!vips || vips.length === 0) return null;

  return (
    <section id="vips" className="bg-theme-surface/40 relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center sm:mb-20">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-theme-accent">
            Pillars of Love &amp; Blessing
          </span>
          <h2 className="mt-2 font-serif text-3xl font-normal text-theme-text-primary sm:text-4xl md:text-5xl">
            Meet the <em>Family &amp; Entourage</em>
          </h2>
          <p className="mx-auto mt-3 max-w-md font-serif text-base text-theme-text-muted sm:text-lg">
            The guiding pillars, closest confidants, and lifelong hype squad.
          </p>
        </div>

        {/* VIP Tribute Cards using Shadcn Card */}
        <div
          className={`mx-auto grid justify-center gap-8 ${
            vips.length === 1
              ? "max-w-md grid-cols-1"
              : vips.length === 2
                ? "max-w-3xl grid-cols-1 sm:grid-cols-2"
                : vips.length === 4
                  ? "max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
                  : "max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {vips.map((vip, idx) => (
            <Card
              key={idx}
              className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-theme-surface p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#D4AF37] hover:shadow-2xl"
            >
              {/* Corner Ornaments */}
              <div className="absolute left-3 top-3 h-3 w-3 border-l border-t border-[#D4AF37]/60" />
              <div className="absolute right-3 top-3 h-3 w-3 border-r border-t border-[#D4AF37]/60" />
              <div className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[#D4AF37]/60" />
              <div className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-[#D4AF37]/60" />

              {/* Medallion Icon */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-theme-bg shadow-sm">
                <Sparkles className="h-6 w-6 text-[#D4AF37]" />
              </div>

              <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-theme-accent">
                {vip.group}
              </span>

              <h3 className="mt-2 font-serif text-xl font-normal leading-snug text-theme-text-primary sm:text-2xl">
                {vip.name}
              </h3>

              <p className="mt-3 font-serif text-sm italic text-theme-text-muted sm:text-base">
                &ldquo;{vip.tagline}&rdquo;
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
