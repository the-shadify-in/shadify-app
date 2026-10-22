"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  MapPin,
  Sparkles,
  Gift,
  CalendarCheck,
  HelpCircle,
  ExternalLink,
  Calendar,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { WeddingDataDto } from "@/features/weddings";
import {
  type AskTopic,
  type TelemetryTopic,
  parseAskHash,
  getHashForTopic,
} from "@/features/ask/topics";
import { buildAskAnswers } from "@/features/ask/answers";
import { downloadEventIcs, getGoogleCalendarUrl } from "@/features/ask/ics";

interface AskDrawerProps {
  wedding: WeddingDataDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenShagun: () => void;
  onOpenRsvp: () => void;
}

export function AskDrawer({
  wedding,
  open,
  onOpenChange,
  onOpenShagun,
  onOpenRsvp,
}: AskDrawerProps) {
  const [activeTopic, setActiveTopic] = useState<AskTopic | null>(null);

  // Derived answer view-models (100% computed from wedding DTO, zero fetch)
  const answers = buildAskAnswers(wedding);

  // Telemetry: anonymous beacon counter (zero PII, zero cookies)
  const sendTapTelemetry = useCallback(
    (topic: TelemetryTopic) => {
      if (typeof window === "undefined" || !navigator.sendBeacon) return;
      const payload = JSON.stringify({ slug: wedding.slug, topic });
      try {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/chip", blob);
      } catch {
        // Beacon failures are non-blocking
      }
    },
    [wedding.slug],
  );

  // Handle URL hash changes & deep links
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromHash = () => {
      const parsed = parseAskHash(window.location.hash);
      if (parsed.isOpen) {
        onOpenChange(true);
        setActiveTopic(parsed.topic);
      }
    };

    // Check initial hash on mount
    syncFromHash();

    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [onOpenChange]);

  // Sync hash when topic changes inside dialog
  const handleSelectTopic = (topic: AskTopic) => {
    setActiveTopic(topic);
    sendTapTelemetry(topic);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", getHashForTopic(topic));
    }
  };

  const handleBackToTopics = () => {
    setActiveTopic(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#ask");
    }
  };

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setActiveTopic(null);
      if (typeof window !== "undefined" && window.location.hash.startsWith("#ask")) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } else {
      if (typeof window !== "undefined" && !window.location.hash.startsWith("#ask")) {
        window.history.replaceState(null, "", "#ask");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        style={{
          backgroundColor: "var(--theme-surface)",
          color: "var(--theme-text-primary)",
        }}
        className="max-h-[85vh] w-[95vw] max-w-xl overflow-y-auto border-2 border-[#D4AF37] bg-theme-surface p-5 text-theme-text-primary shadow-2xl backdrop-blur-2xl sm:p-7"
      >
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-2">
            <div className="flex items-center gap-2">
              {activeTopic && (
                <button
                  type="button"
                  onClick={handleBackToTopics}
                  aria-label="Back to all questions"
                  className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
                >
                  <ChevronLeft className="h-5 w-5 text-theme-accent" />
                </button>
              )}
              <div>
                <DialogTitle className="font-serif text-xl font-bold tracking-wide text-theme-primary sm:text-2xl">
                  {activeTopic ? answers.topics[activeTopic].title : "Quick Answers for Guests"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-theme-text-muted sm:text-sm">
                  {activeTopic
                    ? answers.topics[activeTopic].description
                    : "Tap a topic below for instant ceremony details, venues, and answers."}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* --- VIEW 1: TOPIC CHIP SELECTOR --- */}
        {!activeTopic ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" role="list">
            {/* 1. Timings Chip */}
            <button
              type="button"
              onClick={() => handleSelectTopic("timings")}
              className="bg-theme-bg/60 hover:bg-theme-bg/90 flex min-h-[52px] items-center gap-3.5 rounded-xl border border-[#D4AF37]/40 p-3.5 text-left transition hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
            >
              <div className="bg-theme-accent/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-theme-accent">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base font-semibold text-theme-text-primary">
                  Timings & Schedule
                </span>
                <span className="text-xs text-theme-text-muted">Rituals & ceremony hours</span>
              </div>
            </button>

            {/* 2. Venue and Map Chip */}
            <button
              type="button"
              onClick={() => handleSelectTopic("venue")}
              className="bg-theme-bg/60 hover:bg-theme-bg/90 flex min-h-[52px] items-center gap-3.5 rounded-xl border border-[#D4AF37]/40 p-3.5 text-left transition hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
            >
              <div className="bg-theme-accent/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-theme-accent">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base font-semibold text-theme-text-primary">
                  Venue & Map
                </span>
                <span className="text-xs text-theme-text-muted">Locations & 1-tap navigation</span>
              </div>
            </button>

            {/* 3. Dress Code Chip */}
            <button
              type="button"
              onClick={() => handleSelectTopic("dress_code")}
              className="bg-theme-bg/60 hover:bg-theme-bg/90 flex min-h-[52px] items-center gap-3.5 rounded-xl border border-[#D4AF37]/40 p-3.5 text-left transition hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
            >
              <div className="bg-theme-accent/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-theme-accent">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base font-semibold text-theme-text-primary">
                  Dress Code
                </span>
                <span className="text-xs text-theme-text-muted">Recommended attire</span>
              </div>
            </button>

            {/* 4. Gifts Chip */}
            <button
              type="button"
              onClick={() => handleSelectTopic("gifts")}
              className="bg-theme-bg/60 hover:bg-theme-bg/90 flex min-h-[52px] items-center gap-3.5 rounded-xl border border-[#D4AF37]/40 p-3.5 text-left transition hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
            >
              <div className="bg-theme-accent/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-theme-accent">
                <Gift className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base font-semibold text-theme-text-primary">
                  Gifts & Shagun
                </span>
                <span className="text-xs text-theme-text-muted">Direct digital blessings</span>
              </div>
            </button>

            {/* 5. RSVP Chip */}
            <button
              type="button"
              onClick={() => handleSelectTopic("rsvp")}
              className="bg-theme-bg/60 hover:bg-theme-bg/90 flex min-h-[52px] items-center gap-3.5 rounded-xl border border-[#D4AF37]/40 p-3.5 text-left transition hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
            >
              <div className="bg-theme-accent/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-theme-accent">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base font-semibold text-theme-text-primary">
                  RSVP & Attendance
                </span>
                <span className="text-xs text-theme-text-muted">Submit your confirmation</span>
              </div>
            </button>

            {/* 6. Something Else Chip */}
            <button
              type="button"
              onClick={() => handleSelectTopic("other")}
              className="bg-theme-bg/60 hover:bg-theme-bg/90 flex min-h-[52px] items-center gap-3.5 rounded-xl border border-[#D4AF37]/40 p-3.5 text-left transition hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
            >
              <div className="bg-theme-accent/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-theme-accent">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base font-semibold text-theme-text-primary">
                  Something else
                </span>
                <span className="text-xs text-theme-text-muted">Other inquiries</span>
              </div>
            </button>
          </div>
        ) : (
          /* --- VIEW 2: ACTIVE TOPIC CONTENT --- */
          <div className="mt-4 space-y-4">
            {/* TOPIC: TIMINGS */}
            {activeTopic === "timings" && (
              <div className="space-y-4">
                {answers.scheduleByDay.length === 0 ? (
                  <p className="py-4 text-center text-sm text-theme-text-muted">
                    The hosts haven&apos;t published ceremony timings yet.
                  </p>
                ) : (
                  answers.scheduleByDay.map((group) => (
                    <div key={group.dateHeader} className="space-y-2.5">
                      <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-theme-accent">
                        {group.dateHeader}
                      </h4>
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-theme-bg/50 flex flex-col justify-between gap-2 rounded-xl border border-[#D4AF37]/30 p-3.5 sm:flex-row sm:items-center"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif text-base font-semibold text-theme-text-primary">
                                  {item.title}
                                </span>
                                <span className="bg-theme-accent/20 rounded-full px-2 py-0.5 text-[10px] font-medium text-theme-accent">
                                  {item.tag}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-theme-text-muted">
                                🕒 {item.timeStr} • 📍 {item.venueName}
                              </p>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  downloadEventIcs(item.eventDto, answers.weddingTitle)
                                }
                                className="min-h-[44px] shrink-0 border-[#D4AF37]/50 font-serif text-xs text-theme-text-primary hover:border-[#D4AF37]"
                              >
                                <Calendar className="mr-1.5 h-3.5 w-3.5 text-theme-accent" />
                                Add .ics
                              </Button>
                              <a
                                href={getGoogleCalendarUrl(item.eventDto, answers.weddingTitle)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#D4AF37]/50 px-3 py-2 font-serif text-xs text-theme-text-primary hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
                              >
                                Google Cal ↗
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TOPIC: VENUE AND MAP */}
            {activeTopic === "venue" && (
              <div className="space-y-3">
                {answers.scheduleByDay.flatMap((g) => g.items).length === 0 ? (
                  <p className="py-4 text-center text-sm text-theme-text-muted">
                    The hosts haven&apos;t added venue details yet.
                  </p>
                ) : (
                  answers.scheduleByDay
                    .flatMap((g) => g.items)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-theme-bg/50 space-y-2 rounded-xl border border-[#D4AF37]/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-serif text-base font-semibold text-theme-text-primary">
                              {item.venueName}
                            </h4>
                            <span className="text-[11px] font-medium text-theme-accent">
                              {item.title} ({item.dateStr})
                            </span>
                          </div>
                          <a
                            href={item.safeMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#D4AF37]/60 bg-theme-bg px-3 py-2 font-serif text-xs font-medium text-theme-text-primary hover:bg-[#D4AF37]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
                          >
                            <MapPin className="h-3.5 w-3.5 text-theme-accent" />
                            Open in Maps
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </div>
                        <p className="text-xs text-theme-text-muted">{item.venueAddress}</p>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* TOPIC: DRESS CODE */}
            {activeTopic === "dress_code" && (
              <div className="space-y-3">
                {answers.scheduleByDay.flatMap((g) => g.items).length === 0 ? (
                  <p className="py-4 text-center text-sm text-theme-text-muted">
                    The hosts haven&apos;t added events yet.
                  </p>
                ) : (
                  answers.scheduleByDay
                    .flatMap((g) => g.items)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-theme-bg/50 space-y-1 rounded-xl border border-[#D4AF37]/30 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-base font-semibold text-theme-text-primary">
                            {item.title}
                          </span>
                          <span className="text-xs text-theme-text-muted">{item.dateStr}</span>
                        </div>
                        <p
                          className={`text-xs ${
                            item.hasDressCode
                              ? "font-medium text-theme-text-primary"
                              : "italic text-theme-text-muted"
                          }`}
                        >
                          {item.dressCode}
                        </p>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* TOPIC: GIFTS & SHAGUN */}
            {activeTopic === "gifts" && (
              <div className="bg-theme-bg/50 space-y-4 rounded-xl border border-[#D4AF37]/30 p-5 text-center">
                <div className="bg-theme-accent/20 mx-auto flex h-12 w-12 items-center justify-center rounded-full text-theme-accent">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-theme-primary">
                    Digital Shagun & Blessings
                  </h4>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-theme-text-muted">
                    Direct 0%-fee UPI transfer directly to the couple&apos;s verified account.
                  </p>
                </div>
                {answers.hasGiftsUpi ? (
                  <div className="space-y-3 pt-2">
                    <p className="bg-theme-surface/70 inline-block rounded-md border border-[#D4AF37]/40 px-3 py-1.5 font-mono text-xs tracking-wider text-theme-text-primary">
                      UPI ID: {answers.upiVpa}
                    </p>
                    <div>
                      <Button
                        type="button"
                        onClick={() => {
                          handleDialogChange(false);
                          onOpenShagun();
                        }}
                        className="text-theme-on-primary min-h-[44px] w-full max-w-xs rounded-lg bg-theme-primary font-serif text-xs uppercase tracking-widest shadow-md hover:opacity-90"
                      >
                        <Gift className="mr-2 h-4 w-4" />
                        Send Digital Shagun
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-theme-text-muted">
                    The hosts haven&apos;t added a digital Shagun UPI account for this wedding.
                  </p>
                )}
              </div>
            )}

            {/* TOPIC: RSVP */}
            {activeTopic === "rsvp" && (
              <div className="bg-theme-bg/50 space-y-4 rounded-xl border border-[#D4AF37]/30 p-5 text-center">
                <div className="bg-theme-accent/20 mx-auto flex h-12 w-12 items-center justify-center rounded-full text-theme-accent">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-theme-primary">
                    Confirm Attendance
                  </h4>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-theme-text-muted">
                    Please submit your RSVP to help the hosts arrange meals and seating for your
                    family.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      handleDialogChange(false);
                      onOpenRsvp();
                    }}
                    className="text-theme-on-primary min-h-[44px] w-full max-w-xs rounded-lg bg-theme-primary font-serif text-xs uppercase tracking-widest shadow-md hover:opacity-90"
                  >
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Open RSVP Form
                  </Button>
                </div>
              </div>
            )}

            {/* TOPIC: SOMETHING ELSE */}
            {activeTopic === "other" && (
              <div className="bg-theme-bg/50 space-y-4 rounded-xl border border-[#D4AF37]/30 p-5 text-center">
                <div className="bg-theme-accent/20 mx-auto flex h-12 w-12 items-center justify-center rounded-full text-theme-accent">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-theme-primary">
                    Have Another Question?
                  </h4>
                  <p className="mt-2 text-sm font-medium text-theme-text-primary">
                    {answers.helpText}
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-theme-text-muted">
                    They will be delighted to guide you with any personalized logistics or
                    assistance.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
