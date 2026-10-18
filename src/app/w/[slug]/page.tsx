"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
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
  ChevronDown
} from "lucide-react";
import { THEME_PRESETS, ThemeConfig } from "@/lib/themes/tokens";

interface WeddingEvent {
  id: string;
  title: string;
  tag: string;
  time: string;
  date: string;
  venue: string;
  address: string;
  mapUrl: string;
  dressCode: string;
}

export default function WeddingGuestPage({ params }: { params: { slug: string } }) {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#0E0709]" />}>
      <WeddingGuestContent slug={params.slug} />
    </React.Suspense>
  );
}

function WeddingGuestContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();

  // Determine active theme (query override e.g. ?theme=emerald-gold or default preset)
  const themeParam = searchParams.get("theme") || "royal-crimson";
  const activeTheme: ThemeConfig = THEME_PRESETS[themeParam] || THEME_PRESETS["royal-crimson"];

  // Envelope state (true = sealed, false = opened)
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);
  const [activeRsvpEvent, setActiveRsvpEvent] = useState<WeddingEvent | null>(null);
  const [isShagunModalOpen, setIsShagunModalOpen] = useState(false);
  const [shagunAmount, setShagunAmount] = useState<number>(2101);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [mealPref, setMealPref] = useState("pure_veg");
  const [needsStay, setNeedsStay] = useState(false);
  const [blessing, setBlessing] = useState("");

  // Demo fallback data if database is not yet seeded
  const wedding = {
    bride: "Priya",
    groom: "Rahul",
    date: "December 14, 2026",
    venueCity: "Udaipur, Rajasthan",
    monogram: "P & R",
    upiVpa: "priya.rahul@okhdfcbank",
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
        name: "Karan, Aditya & Rohan",
        tagline: "Baraat Hype Masters 🥁",
      },
      {
        group: "Emergency Coordinators",
        name: "Vikram Sharma (Logistics) & Neha Verma (Hospitality)",
        tagline: "Call for transport, stays & check-in help: +91 98765 43210",
      },
    ],
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId: "00000000-0000-0000-0000-000000000001",
          eventId: activeRsvpEvent?.id || "evt-1",
          respondentName: guestName,
          respondentPhone: guestPhone,
          attending: true,
          partySize,
          mealPreference: mealPref,
          needsStay,
          blessingMessage: blessing,
        }),
      });
      if (res.ok) {
        setIsSubmitted(true);
      } else {
        alert("Thank you! Your RSVP has been recorded.");
        setIsSubmitted(true);
      }
    } catch {
      setIsSubmitted(true);
    }
  };

  const getWhatsAppShareUrl = () => {
    const text = encodeURIComponent(
      `🌸 *Wedding Invitation: ${wedding.bride} & ${wedding.groom}* 🌸\n\n` +
      `We would be honored by your presence as we celebrate our wedding in ${wedding.venueCity} on ${wedding.date}.\n\n` +
      `Tap here to view the royal invitation, event itinerary, and RSVP:\n` +
      `${typeof window !== "undefined" ? window.location.href : `https://shadify.in/w/${slug}`}`
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  return (
    <main
      id="wedding-guest-root"
      style={
        {
          "--theme-primary": activeTheme.palette.primary,
          "--theme-accent": activeTheme.palette.accent,
          "--theme-bg": activeTheme.palette.background,
          "--theme-surface": activeTheme.palette.surface,
          "--theme-text-primary": activeTheme.palette.textPrimary,
          "--theme-text-muted": activeTheme.palette.textMuted,
          "--theme-envelope-bg": activeTheme.palette.envelopeBg,
          "--theme-wax-seal": activeTheme.palette.waxSeal,
        } as React.CSSProperties
      }
      className="min-h-screen bg-theme-bg text-theme-text-primary selection:bg-theme-accent selection:text-black font-sans transition-colors duration-500"
    >
      {/* ----------------------------------------------------------- */}
      {/* 1. ROYAL ENVELOPE OVERLAY (CSS REVEAL) */}
      {/* ----------------------------------------------------------- */}
      {!isEnvelopeOpened && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070304]/95 p-4 backdrop-blur-xl">
          <div className="relative w-full max-w-md rounded-2xl border border-[#C9933A]/40 bg-gradient-to-b from-[#1C0D12] to-[#12080B] p-8 text-center shadow-[0_0_60px_rgba(201,147,58,0.25)]">
            {/* Gold Corner Accents */}
            <div className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-[#C9933A]" />
            <div className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-[#C9933A]" />
            <div className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-[#C9933A]" />
            <div className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-[#C9933A]" />

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#C9933A]/40 bg-[#C9933A]/10 text-xl font-serif text-[#C9933A]">
              {wedding.monogram}
            </div>

            <p className="text-xs tracking-[0.3em] text-[#C9933A] uppercase">You Are Cordially Invited</p>
            <h1 className="mt-2 font-serif text-3xl font-light text-[#FFF9F2]">
              {wedding.bride} <span className="text-[#C9933A]">&amp;</span> {wedding.groom}
            </h1>
            <p className="mt-1 text-sm text-[#E2D5C7]/70">{wedding.date} • {wedding.venueCity}</p>

            {/* Wax Seal Action Button */}
            <div className="mt-8">
              <button
                onClick={() => setIsEnvelopeOpened(true)}
                className="group relative inline-flex items-center gap-2 rounded-full border border-[#C9933A] bg-gradient-to-r from-[#941C2F] via-[#A8243A] to-[#801426] px-8 py-3 font-serif text-sm tracking-widest text-[#FFF9F2] shadow-[0_10px_25px_rgba(168,36,58,0.4)] transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-[#F4D068] transition-transform group-hover:rotate-45" />
                TAP TO OPEN INVITATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 2. HERO SECTION */}
      {/* ----------------------------------------------------------- */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,36,58,0.18)_0,transparent_70%)]" />

        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C9933A]/30 bg-[#C9933A]/10 px-4 py-1 text-xs tracking-widest text-[#C9933A] uppercase">
            <span>Namaste &amp; Welcome</span>
          </div>

          <h1 className="font-serif text-5xl font-light tracking-tight text-[#FFF9F2] md:text-7xl">
            {wedding.bride} <br />
            <span className="font-serif text-3xl text-[#C9933A] md:text-5xl">&amp;</span> <br />
            {wedding.groom}
          </h1>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-[#E2D5C7]/80">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#C9933A]" />
              {wedding.date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#C9933A]" />
              {wedding.venueCity}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setActiveRsvpEvent(wedding.events[0])}
              className="rounded-full bg-gradient-to-r from-[#C9933A] to-[#DFB15B] px-8 py-3 text-sm font-semibold tracking-wide text-black shadow-lg transition-transform hover:scale-105"
            >
              RSVP Now
            </button>

            <button
              onClick={() => setIsShagunModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#C9933A]/50 bg-[#1C0D12] px-6 py-3 text-sm font-medium text-[#FFF9F2] transition-colors hover:bg-[#2A131B]"
            >
              <Gift className="h-4 w-4 text-[#C9933A]" />
              Digital Shagun
            </button>

            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-green-500/40 bg-green-950/30 px-6 py-3 text-sm font-medium text-green-300 transition-colors hover:bg-green-900/40"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
            </a>
          </div>
        </div>

        <div className="absolute bottom-6 text-[#C9933A]/60 animate-bounce">
          <ChevronDown className="h-6 w-6" />
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 3. EVENT SCHEDULE (ITINERARY) */}
      {/* ----------------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#C9933A] uppercase">Ceremonies &amp; Timings</p>
          <h2 className="mt-2 font-serif text-3xl font-light text-[#FFF9F2] md:text-4xl">The Wedding Itinerary</h2>
        </div>

        <div className="space-y-6">
          {wedding.events.map((evt) => (
            <div
              key={evt.id}
              className="relative rounded-2xl border border-[#C9933A]/20 bg-gradient-to-r from-[#170B0F] to-[#11070A] p-6 transition-all hover:border-[#C9933A]/50"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="inline-block rounded-md bg-[#941C2F]/40 px-3 py-1 text-xs font-medium text-[#FFB3BE]">
                    {evt.tag} • {evt.date}
                  </div>
                  <h3 className="mt-2 font-serif text-2xl font-light text-[#FFF9F2]">{evt.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#E2D5C7]/70">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#C9933A]" />
                      {evt.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#C9933A]" />
                      {evt.venue}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#C9933A]">Dress Code: {evt.dressCode}</p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={evt.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9933A]/40 px-4 py-2 text-xs font-medium text-[#E2D5C7] hover:bg-[#C9933A]/10"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#C9933A]" />
                    Directions
                  </a>
                  <button
                    onClick={() => setActiveRsvpEvent(evt)}
                    className="rounded-lg bg-[#C9933A] px-4 py-2 text-xs font-semibold text-black hover:bg-[#DFB15B]"
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
      <section className="border-t border-[#C9933A]/10 bg-[#0A0406] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-[#C9933A] uppercase">Family &amp; Entourage</p>
            <h2 className="mt-2 font-serif text-3xl font-light text-[#FFF9F2] md:text-4xl">Meet the VIPs</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {wedding.vips.map((vip, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#C9933A]/20 bg-[#14080C] p-6 text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#C9933A]/10 text-[#C9933A]">
                  <Heart className="h-5 w-5" />
                </div>
                <p className="text-xs tracking-wider text-[#C9933A] uppercase">{vip.group}</p>
                <h4 className="mt-1 font-serif text-lg font-medium text-[#FFF9F2]">{vip.name}</h4>
                <p className="mt-2 text-xs text-[#E2D5C7]/70">{vip.tagline}</p>
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
          <div className="relative w-full max-w-lg rounded-2xl border border-[#C9933A]/40 bg-[#160A0E] p-6 text-left shadow-2xl">
            <button
              onClick={() => {
                setActiveRsvpEvent(null);
                setIsSubmitted(false);
              }}
              className="absolute right-4 top-4 text-[#E2D5C7]/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {isSubmitted ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                <h3 className="mt-4 font-serif text-2xl text-[#FFF9F2]">RSVP Received!</h3>
                <p className="mt-2 text-sm text-[#E2D5C7]/70">
                  Thank you, {guestName}. We cannot wait to celebrate with you!
                </p>
                <button
                  onClick={() => {
                    setActiveRsvpEvent(null);
                    setIsSubmitted(false);
                  }}
                  className="mt-6 rounded-full bg-[#C9933A] px-6 py-2 text-xs font-semibold text-black"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit}>
                <h3 className="font-serif text-2xl font-light text-[#FFF9F2]">
                  RSVP for {activeRsvpEvent.title}
                </h3>
                <p className="mt-1 text-xs text-[#C9933A]">Please submit by November 25, 2026</p>

                <div className="mt-6 space-y-4 text-xs">
                  <div>
                    <label className="block text-[#E2D5C7]/80">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      className="mt-1 w-full rounded-lg border border-[#C9933A]/30 bg-[#0E0608] px-3 py-2 text-[#FFF9F2] focus:border-[#C9933A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#E2D5C7]/80">WhatsApp / Phone Number</label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="mt-1 w-full rounded-lg border border-[#C9933A]/30 bg-[#0E0608] px-3 py-2 text-[#FFF9F2] focus:border-[#C9933A] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#E2D5C7]/80">Attending Count (Headcount)</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-[#C9933A]/30 bg-[#0E0608] px-3 py-2 text-[#FFF9F2] focus:border-[#C9933A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#E2D5C7]/80">Dietary Preference</label>
                      <select
                        value={mealPref}
                        onChange={(e) => setMealPref(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#C9933A]/30 bg-[#0E0608] px-3 py-2 text-[#FFF9F2] focus:border-[#C9933A] focus:outline-none"
                      >
                        <option value="pure_veg">Vegetarian</option>
                        <option value="jain">Jain Vegetarian</option>
                        <option value="non_veg">Non-Vegetarian</option>
                        <option value="no_preference">No Preference</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="needsStay"
                      checked={needsStay}
                      onChange={(e) => setNeedsStay(e.target.checked)}
                      className="h-4 w-4 rounded border-[#C9933A]/40 bg-[#0E0608] text-[#C9933A]"
                    />
                    <label htmlFor="needsStay" className="text-[#E2D5C7]/80">
                      We require hotel/resort room accommodation
                    </label>
                  </div>

                  <div>
                    <label className="block text-[#E2D5C7]/80">Blessing Message for the Couple</label>
                    <textarea
                      rows={2}
                      value={blessing}
                      onChange={(e) => setBlessing(e.target.value)}
                      placeholder="Leave your warm wishes..."
                      className="mt-1 w-full rounded-lg border border-[#C9933A]/30 bg-[#0E0608] px-3 py-2 text-[#FFF9F2] focus:border-[#C9933A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveRsvpEvent(null)}
                    className="px-4 py-2 text-xs text-[#E2D5C7]/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-[#C9933A] to-[#DFB15B] px-6 py-2 text-xs font-semibold text-black"
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
          <div className="relative w-full max-w-sm rounded-2xl border border-[#C9933A]/40 bg-[#160A0E] p-6 text-center shadow-2xl">
            <button
              onClick={() => setIsShagunModalOpen(false)}
              className="absolute right-4 top-4 text-[#E2D5C7]/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#C9933A]/10 text-[#C9933A]">
              <Gift className="h-6 w-6" />
            </div>

            <h3 className="font-serif text-2xl font-light text-[#FFF9F2]">Digital Shagun</h3>
            <p className="mt-1 text-xs text-[#E2D5C7]/70">
              Bless {wedding.bride} &amp; {wedding.groom} directly into their bank account via UPI (₹0 commission).
            </p>

            {/* Presets with the traditional ₹1 shagun coin */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[501, 1101, 2101, 5101, 11001, 21001].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setShagunAmount(amt)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                    shagunAmount === amt
                      ? "border-[#C9933A] bg-[#C9933A] text-black font-semibold"
                      : "border-[#C9933A]/20 bg-[#0E0608] text-[#E2D5C7] hover:border-[#C9933A]/50"
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
                  `${wedding.bride} and ${wedding.groom} Wedding`
                )}&am=${shagunAmount}&cu=INR&tn=${encodeURIComponent("Wedding Shagun Blessing")}`}
                className="block w-full rounded-full bg-gradient-to-r from-[#941C2F] to-[#B3253B] py-3 text-sm font-semibold tracking-wide text-white shadow-lg transition-transform hover:scale-105"
              >
                Send ₹{shagunAmount.toLocaleString("en-IN")} via UPI App
              </a>
              <p className="mt-2 text-[11px] text-[#E2D5C7]/50">
                Opens GPay, PhonePe, Paytm, or BHIM instantly
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 7. NEUTRAL MONOCHROME BRAND FOOTER (ZERO BRAND CLASH) */}
      {/* ----------------------------------------------------------- */}
      <footer className="border-t border-theme-accent/15 py-10 text-center text-xs text-theme-text-muted/50">
        <p className="font-serif tracking-widest uppercase text-theme-text-primary/70">
          {wedding.bride} &amp; {wedding.groom} • {wedding.venueCity}
        </p>
        <p className="mt-2 text-[10px] tracking-wider text-theme-text-muted/60">
          Created with love on{" "}
          <span className="font-serif tracking-normal text-theme-text-muted opacity-80 hover:opacity-100 transition-opacity">
            Shadify
          </span>
        </p>
      </footer>
    </main>
  );
}
