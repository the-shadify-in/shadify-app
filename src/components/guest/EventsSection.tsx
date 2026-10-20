"use client";

import React from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WeddingEventDto } from "@/features/weddings";

interface EventsSectionProps {
  events: WeddingEventDto[];
  onSelectEventRsvp: (event: WeddingEventDto) => void;
}

export function EventsSection({ events, onSelectEventRsvp }: EventsSectionProps) {
  // Check if an event is currently "Happening Now"
  const isHappeningNow = (event: WeddingEventDto) => {
    if (!event.startTimeIso) return false;
    const now = Date.now();
    const start = new Date(event.startTimeIso).getTime();
    const end = event.endTimeIso
      ? new Date(event.endTimeIso).getTime()
      : start + 4 * 60 * 60 * 1000; // default 4hr window
    return now >= start && now <= end;
  };

  return (
    <section id="events" className="bg-theme-surface/30 relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center sm:mb-20">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-theme-accent">
            Celebration Itinerary
          </span>
          <h2 className="mt-2 font-serif text-3xl font-normal text-theme-text-primary sm:text-4xl md:text-5xl">
            Join Us for <em>Every Ceremony</em>
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-serif text-base text-theme-text-muted sm:text-lg">
            Traditional blessings, musical sangeet rhythms, and sacred mandap vows.
          </p>
        </div>

        {/* Ceremony Itinerary Cards using Shadcn Card */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, idx) => {
            const active = isHappeningNow(event);

            return (
              <Card
                key={event.id || idx}
                className="group overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-theme-surface text-theme-text-primary shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#D4AF37] hover:shadow-2xl"
              >
                {/* Event Cover Imagery */}
                <div className="relative h-56 w-full overflow-hidden bg-black/40 sm:h-60">
                  <Image
                    src={event.coverImage || "/demo/mandap.jpg"}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 360px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Active / Event Tag Badge using Shadcn Badge */}
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    {active ? (
                      <Badge className="animate-pulse border-none bg-emerald-600 px-3 py-1 font-sans text-xs uppercase tracking-wider text-white shadow-md">
                        ● HAPPENING NOW
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="border border-[#D4AF37]/40 bg-black/60 px-3 py-0.5 font-serif text-[11px] uppercase tracking-wider text-[#E8B96B] backdrop-blur-md"
                      >
                        Ceremony {idx + 1}
                      </Badge>
                    )}
                  </div>

                  {/* Date overlay badge */}
                  <div className="absolute bottom-4 left-4 text-white">
                    <span className="block font-serif text-xs font-light uppercase tracking-widest text-[#E8B96B]">
                      {event.date}
                    </span>
                    <span className="block font-serif text-lg font-semibold leading-tight">
                      {event.time}
                    </span>
                  </div>
                </div>

                {/* Card Header & Content using Shadcn Card */}
                <CardHeader className="p-6 pb-3">
                  <CardTitle className="font-serif text-xl font-normal leading-snug text-theme-text-primary transition-colors group-hover:text-theme-accent sm:text-2xl">
                    {event.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 px-6 py-2">
                  {/* Venue Address */}
                  <div className="flex items-start gap-2.5 text-xs text-theme-text-muted">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-theme-accent" />
                    <div>
                      <span className="block font-semibold text-theme-text-primary">
                        {event.venue}
                      </span>
                      {event.address && <span className="mt-0.5 block">{event.address}</span>}
                    </div>
                  </div>

                  {/* Dress Code if present */}
                  {event.dressCode && (
                    <div className="bg-theme-bg/60 rounded-lg border border-[#D4AF37]/15 p-2.5 text-xs text-theme-text-muted">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-theme-accent">
                        Attire &amp; Dress Code
                      </span>
                      <span className="mt-0.5 block">{event.dressCode}</span>
                    </div>
                  )}
                </CardContent>

                {/* Card Footer Actions using Shadcn Button */}
                <CardFooter className="flex items-center justify-between gap-3 border-t border-[#D4AF37]/15 p-6 pt-3">
                  {event.mapUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-[#D4AF37]/40 font-serif text-xs tracking-wider text-theme-text-primary hover:border-[#D4AF37] hover:bg-theme-bg"
                    >
                      <a href={event.mapUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="mr-1.5 h-3.5 w-3.5 text-theme-accent" />
                        <span>Directions</span>
                      </a>
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onSelectEventRsvp(event)}
                    className="text-theme-on-primary ml-auto rounded-lg bg-theme-primary font-serif text-xs uppercase tracking-widest shadow-sm hover:opacity-90"
                  >
                    <span>RSVP</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
