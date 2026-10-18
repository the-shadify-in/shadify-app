"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  MapPin,
  Calendar,
  Clock,
  Gift,
  Share2,
  CheckCircle,
  Sparkles,
  X,
  ChevronDown,
} from "lucide-react";
import type { ThemeConfig, ContrastReport } from "@/lib/themes/tokens";

import type {
  WeddingDataDto as WeddingData,
  WeddingEventDto as WeddingEvent,
  VipEntryDto as VipEntry,
} from "@/features/weddings";

export type { WeddingData, WeddingEvent, VipEntry };

interface WeddingGuestClientProps {
  wedding: WeddingData;
  theme: ThemeConfig;
  contrastReport: ContrastReport;
}

export default function WeddingGuestClient({
  wedding,
  theme,
  contrastReport,
}: WeddingGuestClientProps) {
  // Envelope state (true = sealed, false = opened)
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);
  const [activeRsvpEvent, setActiveRsvpEvent] = useState<WeddingEvent | null>(null);
  const [isShagunModalOpen, setIsShagunModalOpen] = useState(false);
  const [shagunAmount, setShagunAmount] = useState<number>(2101);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Check localStorage for seen state on mount
  useEffect(() => {
    try {
      const seen = localStorage.getItem(`shadify_envelope_opened_${wedding.slug}`);
      if (seen === "true") {
        setIsEnvelopeOpened(true);
      }
    } catch {
      // Safe fallback if localStorage is disabled
    }
  }, [wedding.slug]);

  const handleOpenEnvelope = () => {
    try {
      localStorage.setItem(`shadify_envelope_opened_${wedding.slug}`, "true");
    } catch {}
    setIsEnvelopeOpened(true);
  };

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [mealPref, setMealPref] = useState("pure_veg");
  const [needsStay, setNeedsStay] = useState(false);
  const [blessing, setBlessing] = useState("");

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRsvpEvent) return;

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingSlug: wedding.slug,
          eventId: activeRsvpEvent.id,
          guestName,
          guestPhone,
          partySize: Number(partySize),
          attending: true,
          mealPreference: mealPref,
          needsAccommodation: needsStay,
          notes: blessing,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        alert("Unable to register RSVP. Please check your contact number.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const getWhatsAppShareUrl = () => {
    const text = encodeURIComponent(
      `🌸 *Wedding Invitation: ${wedding.bride} & ${wedding.groom}* 🌸\n\n` +
        `We would be honored by your presence as we celebrate our wedding in ${wedding.venueCity} on ${wedding.date}.\n\n` +
        `Tap here to view the royal invitation, event itinerary, and RSVP:\n` +
        `${typeof window !== "undefined" ? window.location.href : `https://shadify.in/${wedding.slug}`}`,
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  const c = theme.palette;

  return (
    <main
      id="wedding-guest-root"
      style={
        {
          "--theme-primary": c.primary,
          "--theme-on-primary": c.onPrimary,
          "--theme-accent": c.accent,
          "--theme-on-accent": c.onAccent,
          "--theme-bg": c.canvas,
          "--theme-surface": c.surface,
          "--theme-text-primary": c.text,
          "--theme-text-muted": c.textMuted,
          "--theme-envelope-bg": c.envelopeBg,
          "--theme-wax-seal": c.waxSeal,
        } as React.CSSProperties
      }
      className="selection:text-theme-on-accent min-h-screen bg-theme-bg pb-24 font-sans text-theme-text-primary transition-colors duration-500 selection:bg-theme-accent md:pb-0"
    >
      {/* ----------------------------------------------------------- */}
      {/* 1. ROYAL ENVELOPE OVERLAY (CSS REVEAL) */}
      {/* ----------------------------------------------------------- */}
      {!isEnvelopeOpened && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl">
          <div className="border-theme-accent/40 relative w-full max-w-md rounded-2xl border bg-theme-envelope p-8 text-center shadow-2xl">
            {/* Corner Accents */}
            <div className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-theme-accent" />
            <div className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-theme-accent" />
            <div className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-theme-accent" />
            <div className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-theme-accent" />

            <div className="border-theme-accent/40 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border bg-theme-surface font-serif text-xl text-theme-accent">
              {wedding.monogram}
            </div>

            <p className="text-xs font-medium uppercase tracking-[0.3em] text-theme-accent">
              You Are Cordially Invited
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light text-theme-text-primary">
              {wedding.bride} <span className="text-theme-accent">&amp;</span> {wedding.groom}
            </h1>
            <p className="mt-1 text-sm text-theme-text-muted">
              {wedding.date} • {wedding.venueCity}
            </p>

            {/* Wax Seal Action Button */}
            <div className="mt-8">
              <button
                onClick={handleOpenEnvelope}
                className={`text-theme-on-primary group relative inline-flex items-center gap-2 rounded-full bg-theme-primary px-8 py-3 font-serif text-sm tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95 ${
                  contrastReport.primaryNeedsBorder ? "border-2 border-theme-accent" : ""
                }`}
              >
                <Sparkles className="text-theme-on-primary h-4 w-4 transition-transform group-hover:rotate-45" />
                TAP TO OPEN INVITATION
              </button>
              <button
                type="button"
                onClick={handleOpenEnvelope}
                className="mx-auto mt-4 block text-xs tracking-wider text-theme-text-muted underline opacity-80 transition hover:text-theme-accent"
              >
                Skip Reveal (View Details)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 2. HERO SECTION */}
      {/* ----------------------------------------------------------- */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.12)_0,transparent_70%)]" />

        <div className="relative z-10 max-w-2xl">
          <div className="border-theme-accent/40 mb-4 inline-flex items-center gap-2 rounded-full border bg-theme-surface px-4 py-1 text-xs uppercase tracking-widest text-theme-accent">
            <span>Namaste &amp; Welcome</span>
          </div>

          <h1 className="font-serif text-5xl font-light tracking-tight text-theme-text-primary md:text-7xl">
            {wedding.bride} <br />
            <span className="font-serif text-3xl text-theme-accent md:text-5xl">&amp;</span> <br />
            {wedding.groom}
          </h1>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-theme-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-theme-accent" />
              {wedding.date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-theme-accent" />
              {wedding.venueCity}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setActiveRsvpEvent(wedding.events[0])}
              className={`text-theme-on-primary rounded-full bg-theme-primary px-8 py-3 text-sm font-semibold tracking-wide shadow-lg transition-transform hover:scale-105 ${
                contrastReport.primaryNeedsBorder ? "border-2 border-theme-accent" : ""
              }`}
            >
              RSVP Now
            </button>

            <button
              onClick={() => setIsShagunModalOpen(true)}
              className="border-theme-accent/50 inline-flex items-center gap-2 rounded-full border bg-theme-surface px-6 py-3 text-sm font-medium text-theme-text-primary transition-colors hover:border-theme-accent"
            >
              <Gift className="h-4 w-4 text-theme-accent" />
              Digital Shagun
            </button>

            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-green-600/40 bg-green-950/20 px-6 py-3 text-sm font-medium text-green-400 transition-colors hover:bg-green-900/30"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
            </a>
          </div>
        </div>

        <div className="text-theme-accent/70 absolute bottom-6 animate-bounce">
          <ChevronDown className="h-6 w-6" />
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 3. EVENT SCHEDULE (ITINERARY) */}
      {/* ----------------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-theme-accent">
            Ceremonies &amp; Timings
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light text-theme-text-primary md:text-4xl">
            The Wedding Itinerary
          </h2>
        </div>

        <div className="space-y-6">
          {wedding.events.map((evt) => (
            <div
              key={evt.id}
              className="border-theme-accent/25 hover:border-theme-accent/60 relative rounded-2xl border bg-theme-surface p-6 transition-all"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="text-theme-on-primary inline-block rounded-md bg-theme-primary px-3 py-1 text-xs font-medium">
                    {evt.tag} • {evt.date}
                  </div>
                  <h3 className="mt-2 font-serif text-2xl font-light text-theme-text-primary">
                    {evt.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-theme-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-theme-accent" />
                      {evt.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-theme-accent" />
                      {evt.venue}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-theme-accent">Dress Code: {evt.dressCode}</p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={evt.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-theme-accent/40 inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium text-theme-text-muted hover:border-theme-accent hover:text-theme-text-primary"
                  >
                    <MapPin className="h-3.5 w-3.5 text-theme-accent" />
                    Directions
                  </a>
                  <button
                    onClick={() => setActiveRsvpEvent(evt)}
                    className="text-theme-on-accent rounded-lg bg-theme-accent px-4 py-2 text-xs font-semibold transition-transform hover:scale-105"
                  >
                    RSVP
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 4. MEET THE VIPS */}
      {/* ----------------------------------------------------------- */}
      <section className="border-theme-accent/10 bg-theme-surface/50 border-t px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-theme-accent">
              Family &amp; Entourage
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light text-theme-text-primary md:text-4xl">
              Meet the VIPs
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {wedding.vips.map((vip, i) => (
              <div
                key={i}
                className="border-theme-accent/20 rounded-xl border bg-theme-surface p-6 text-center"
              >
                <div className="border-theme-accent/30 mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-theme-surface text-theme-accent">
                  <Heart className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-theme-accent">
                  {vip.group}
                </p>
                <h4 className="mt-1 font-serif text-lg font-medium text-theme-text-primary">
                  {vip.name}
                </h4>
                <p className="mt-2 text-xs text-theme-text-muted">{vip.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 5. RSVP MODAL */}
      {/* ----------------------------------------------------------- */}
      {activeRsvpEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="border-theme-accent/40 relative w-full max-w-lg rounded-2xl border bg-theme-surface p-6 text-left shadow-2xl">
            <button
              onClick={() => {
                setActiveRsvpEvent(null);
                setIsSubmitted(false);
              }}
              className="absolute right-4 top-4 text-theme-text-muted hover:text-theme-text-primary"
            >
              <X className="h-5 w-5" />
            </button>

            {isSubmitted ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 font-serif text-2xl text-theme-text-primary">RSVP Received!</h3>
                <p className="mt-2 text-sm text-theme-text-muted">
                  Thank you, {guestName}. We cannot wait to celebrate with you!
                </p>
                <button
                  onClick={() => {
                    setActiveRsvpEvent(null);
                    setIsSubmitted(false);
                  }}
                  className="text-theme-on-accent mt-6 rounded-full bg-theme-accent px-6 py-2 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit}>
                <h3 className="font-serif text-2xl font-light text-theme-text-primary">
                  RSVP for {activeRsvpEvent.title}
                </h3>
                <p className="mt-1 text-xs text-theme-accent">Please submit by November 25, 2026</p>

                <div className="mt-6 space-y-4 text-xs">
                  <div>
                    <label className="block text-theme-text-muted">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Aditi Sharma"
                      className="border-theme-accent/30 mt-1 w-full rounded-lg border bg-theme-bg px-3 py-2 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-theme-text-muted">WhatsApp Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="border-theme-accent/30 mt-1 w-full rounded-lg border bg-theme-bg px-3 py-2 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-theme-text-muted">Total Attending</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        className="border-theme-accent/30 mt-1 w-full rounded-lg border bg-theme-bg px-3 py-2 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-theme-text-muted">Dietary Preference</label>
                      <select
                        value={mealPref}
                        onChange={(e) => setMealPref(e.target.value)}
                        className="border-theme-accent/30 mt-1 w-full rounded-lg border bg-theme-bg px-3 py-2 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                      >
                        <option value="pure_veg">Pure Vegetarian</option>
                        <option value="jain">Jain (No Root Veg)</option>
                        <option value="non_veg">Non-Vegetarian</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="needsStayCheck"
                      checked={needsStay}
                      onChange={(e) => setNeedsStay(e.target.checked)}
                      className="border-theme-accent/30 h-4 w-4 rounded bg-theme-bg text-theme-accent focus:ring-0"
                    />
                    <label htmlFor="needsStayCheck" className="text-theme-text-muted">
                      Request hotel room allocation (for outstation guests)
                    </label>
                  </div>

                  <div>
                    <label className="block text-theme-text-muted">Personal Warm Wishes</label>
                    <textarea
                      rows={3}
                      value={blessing}
                      onChange={(e) => setBlessing(e.target.value)}
                      placeholder="Share a loving note with the couple..."
                      className="border-theme-accent/30 mt-1 w-full rounded-lg border bg-theme-bg px-3 py-2 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveRsvpEvent(null)}
                    className="px-4 py-2 text-xs text-theme-text-muted hover:text-theme-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-theme-on-accent rounded-lg bg-theme-accent px-6 py-2 text-xs font-semibold"
                  >
                    Confirm RSVP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 6. DIGITAL SHAGUN MODAL */}
      {/* ----------------------------------------------------------- */}
      {isShagunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="border-theme-accent/40 relative w-full max-w-sm rounded-2xl border bg-theme-surface p-6 text-center shadow-2xl">
            <button
              onClick={() => setIsShagunModalOpen(false)}
              className="absolute right-4 top-4 text-theme-text-muted hover:text-theme-text-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-theme-accent/30 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border bg-theme-surface text-theme-accent">
              <Gift className="h-6 w-6" />
            </div>

            <h3 className="font-serif text-2xl font-light text-theme-text-primary">
              Digital Shagun
            </h3>
            <p className="mt-1 text-xs text-theme-text-muted">
              Bless {wedding.bride} &amp; {wedding.groom} directly into their bank account via UPI
              (₹0 commission).
            </p>

            {/* Presets with the traditional ₹1 shagun coin */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[501, 1101, 2101, 5101, 11001, 21001].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setShagunAmount(amt)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                    shagunAmount === amt
                      ? "text-theme-on-accent border-theme-accent bg-theme-accent font-semibold"
                      : "border-theme-accent/25 bg-theme-surface text-theme-text-muted hover:border-theme-accent"
                  }`}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            {/* Direct UPI Deep Link */}
            <div className="mt-6">
              <a
                href={`upi://pay?pa=${wedding.upiVpa}&pn=${encodeURIComponent(
                  `${wedding.bride} and ${wedding.groom} Wedding`,
                )}&am=${shagunAmount}&cu=INR&tn=${encodeURIComponent("Wedding Shagun Blessing")}`}
                className="text-theme-on-primary block w-full rounded-full bg-theme-primary py-3 text-sm font-semibold tracking-wide shadow-lg transition-transform hover:scale-105"
              >
                Send ₹{shagunAmount.toLocaleString("en-IN")} via UPI App
              </a>
              <p className="mt-2 text-[11px] text-theme-text-muted opacity-70">
                Opens GPay, PhonePe, Paytm, or BHIM instantly
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 7. NEUTRAL MONOCHROME BRAND FOOTER (ZERO BRAND CLASH) */}
      {/* ----------------------------------------------------------- */}
      {wedding.showBranding && (
        <footer className="border-theme-accent/15 border-t py-10 text-center text-xs text-theme-text-muted">
          <p className="text-theme-text-primary/70 font-serif uppercase tracking-widest">
            {wedding.bride} &amp; {wedding.groom} • {wedding.venueCity}
          </p>
          <p className="mt-2 text-[11px] tracking-wider opacity-75">
            Created with love on{" "}
            <span className="font-serif font-semibold tracking-normal opacity-90">Shadify</span>
          </p>
        </footer>
      )}
      {/* ----------------------------------------------------------- */}
      {/* 8. MOBILE-FIRST STICKY ACTION BAR */}
      {/* ----------------------------------------------------------- */}
      <nav
        aria-label="Mobile Quick Actions"
        className="bg-theme-surface/95 border-theme-accent/20 pb-safe fixed inset-x-0 bottom-0 z-40 border-t px-4 py-2 shadow-2xl backdrop-blur-md md:hidden"
      >
        <div className="flex items-center justify-around gap-2 text-center">
          <a
            href={wedding.events[0]?.mapUrl || "#itinerary"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center justify-center py-1.5 text-xs font-medium text-theme-text-primary transition hover:text-theme-accent"
          >
            <MapPin className="mb-0.5 h-4 w-4 text-theme-accent" />
            <span>Map</span>
          </a>
          <button
            type="button"
            onClick={() => setActiveRsvpEvent(wedding.events[0] || null)}
            className="text-theme-on-primary flex-1 rounded-full bg-theme-primary py-2 text-xs font-semibold shadow-md transition active:scale-95"
          >
            RSVP
          </button>
          <button
            type="button"
            onClick={() => setIsShagunModalOpen(true)}
            className="flex flex-1 flex-col items-center justify-center py-1.5 text-xs font-medium text-theme-text-primary transition hover:text-theme-accent"
          >
            <Gift className="mb-0.5 h-4 w-4 text-theme-accent" />
            <span>Shagun</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share({
                    title: `${wedding.bride} & ${wedding.groom}'s Wedding`,
                    text: `Join us in celebrating the wedding of ${wedding.bride} & ${wedding.groom}!`,
                    url: window.location.href,
                  });
                } catch {
                  // User cancelled share
                }
              } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                alert("Wedding celebration link copied to clipboard!");
              }
            }}
            className="flex flex-1 flex-col items-center justify-center py-1.5 text-xs font-medium text-theme-text-primary transition hover:text-theme-accent"
          >
            <Share2 className="mb-0.5 h-4 w-4 text-theme-accent" />
            <span>Share</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
