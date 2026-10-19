"use client";

import React from "react";
import Image from "next/image";
import type { LoveStoryDto } from "@/features/weddings";

interface LoveStorySectionProps {
  loveStory: LoveStoryDto;
}

export function LoveStorySection({ loveStory }: LoveStorySectionProps) {
  return (
    <section id="story" className="relative px-6 py-24 sm:py-32">
      {/* Decorative Traditional Divider */}
      <div className="mx-auto mb-16 flex items-center justify-center gap-4 text-center">
        <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#D4AF37] sm:w-36" />
        <span className="font-serif text-xl text-[#D4AF37]">🌸</span>
        <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#D4AF37] sm:w-36" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Couple Portrait with Gold Filigree Frame */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              {/* Outer Gold Hairline Border Frame */}
              <div className="absolute -inset-3 -z-10 rounded-xl border border-[#D4AF37]/50 sm:-inset-4" />
              <div className="absolute -inset-1 -z-10 rounded-xl border border-[#D4AF37]/20 sm:-inset-2" />

              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-theme-surface shadow-2xl">
                <Image
                  src={loveStory.coupleImage || "/demo/couple.jpg"}
                  alt="Couple Portrait"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 450px"
                />
              </div>

              {/* Gold "Together Since" Seal */}
              {loveStory.togetherSinceYear && (
                <div className="text-theme-on-primary absolute -bottom-4 -right-2 rounded-xl border border-[#D4AF37] bg-theme-primary px-5 py-3 text-center shadow-xl sm:-right-4">
                  <span className="block font-sans text-[10px] font-semibold uppercase tracking-widest opacity-85">
                    Together Since
                  </span>
                  <span className="block font-serif text-xl font-bold tracking-wider sm:text-2xl">
                    {loveStory.togetherSinceYear}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Narrative & Milestone Timeline */}
          <div className="lg:col-span-7">
            <div className="mb-8">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-theme-accent">
                {loveStory.tagline || "Our Journey to Forever"}
              </span>
              <h2 className="mt-2 font-serif text-3xl font-normal leading-tight text-theme-text-primary sm:text-4xl md:text-5xl">
                {loveStory.headline || "A Love Story Written in Stars"}
              </h2>
            </div>

            <div className="space-y-4 font-serif text-base leading-relaxed text-theme-text-muted sm:text-lg">
              {loveStory.storyP1 && <p>{loveStory.storyP1}</p>}
              {loveStory.storyP2 && <p>{loveStory.storyP2}</p>}
            </div>

            {/* Vertical Milestones Timeline */}
            {loveStory.milestones && loveStory.milestones.length > 0 && (
              <div className="relative mt-10 space-y-8 border-l border-[#D4AF37]/40 pl-6 sm:pl-8">
                {loveStory.milestones.map((m, idx) => (
                  <div key={idx} className="group relative">
                    {/* Timeline Node Seal */}
                    <div className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-theme-surface text-[10px] shadow-sm sm:-left-[39px] sm:h-7 sm:w-7">
                      <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                    </div>

                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
                        {m.year}
                      </span>
                      <h4 className="font-serif text-base font-medium text-theme-text-primary sm:text-lg">
                        {m.title}
                      </h4>
                      <p className="mt-1 font-serif text-sm leading-relaxed text-theme-text-muted sm:text-base">
                        {m.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
