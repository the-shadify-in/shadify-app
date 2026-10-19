"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  MapPin,
  Clock,
  Gift,
  Share2,
  CheckCircle,
  Sparkles,
  X,
  ChevronDown,
  Copy,
  QrCode,
  Check,
} from "lucide-react";
import type { ThemeConfig, ContrastReport } from "@/lib/themes/tokens";
import { TurnstileWidget } from "@/components/ui/turnstile";

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
  // 1. Client-Side Real-Time Expiration Gate
  const isExpired = wedding.hostingUntil && Date.now() > new Date(wedding.hostingUntil).getTime();

  // Envelope state (true = sealed, false = opened)
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);
  const [activeRsvpEvent, setActiveRsvpEvent] = useState<WeddingEvent | null>(null);
  const [isShagunModalOpen, setIsShagunModalOpen] = useState(false);
  const [shagunAmount, setShagunAmount] = useState<number>(2101);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // In-page RSVP form state
  const [inPageGuestName, setInPageGuestName] = useState("");
  const [inPageGuestPhone, setInPageGuestPhone] = useState("");
  const [inPageAttending, setInPageAttending] = useState("yes");
  const [inPagePartySize, setInPagePartySize] = useState(1);
  const [inPageMealPref, setInPageMealPref] = useState("pure_veg");
  const [inPageNeedsStay, setInPageNeedsStay] = useState(false);
  const [inPageBlessing, setInPageBlessing] = useState("");
  const [inPageTurnstileToken, setInPageTurnstileToken] = useState<string | null>(null);
  const [inPageIsSubmitting, setInPageIsSubmitting] = useState(false);
  const [inPageSubmitted, setInPageSubmitted] = useState(false);

  // Modal RSVP form state
  const [modalGuestName, setModalGuestName] = useState("");
  const [modalGuestPhone, setModalGuestPhone] = useState("");
  const [modalPartySize, setModalPartySize] = useState(1);
  const [modalMealPref, setModalMealPref] = useState("pure_veg");
  const [modalNeedsStay, setModalNeedsStay] = useState(false);
  const [modalBlessing, setModalBlessing] = useState("");
  const [modalTurnstileToken, setModalTurnstileToken] = useState<string | null>(null);

  // Lightbox keyboard ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Falling rose petals ambient animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const colors = ["#FFB347", "#FF6B6B", "#FFD700", "#E8B96B", "#D6246E", "#FFAAA6"];
    const petals = Array.from({ length: 28 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight - window.innerHeight,
      size: Math.random() * 6 + 3,
      speed: Math.random() * 1.0 + 0.35,
      angle: Math.random() * Math.PI * 2,
      rot: (Math.random() - 0.5) * 0.035,
      opacity: Math.random() * 0.4 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)] ?? "#FFB347",
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        p.y += p.speed;
        p.x += Math.sin(p.y * 0.008) * 0.6;
        p.angle += p.rot;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      animId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleCopyUpi = () => {
    if (!wedding.upiVpa) return;
    void navigator.clipboard.writeText(wedding.upiVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Real-time countdown timer to wedding date
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const targetIso = wedding.weddingDateIso || wedding.events[0]?.startTimeIso;
    if (!targetIso) return;
    const targetMs = new Date(targetIso).getTime();

    const updateTimer = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [wedding.weddingDateIso, wedding.events]);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // In-Page RSVP Submission
  const handleInPageRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inPageGuestName.trim()) return;

    setInPageIsSubmitting(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingSlug: wedding.slug,
          eventId: wedding.events[0]?.id || "main-wedding",
          guestName: inPageGuestName.trim(),
          guestPhone: inPageGuestPhone.trim(),
          partySize: Number(inPagePartySize),
          attending: inPageAttending === "yes",
          mealPreference: inPageMealPref,
          needsAccommodation: inPageNeedsStay,
          notes: inPageBlessing.trim(),
          turnstileToken: inPageTurnstileToken || undefined,
        }),
      });

      if (res.ok) {
        setInPageSubmitted(true);
        showToast(
          `🎉 Thank you ${inPageGuestName.split(" ")[0]}! Your RSVP has been confirmed with love!`,
        );
      } else {
        alert("Unable to register RSVP. Please check your contact number.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setInPageIsSubmitting(false);
    }
  };

  // Modal RSVP Submission
  const handleModalRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRsvpEvent) return;

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingSlug: wedding.slug,
          eventId: activeRsvpEvent.id,
          guestName: modalGuestName.trim(),
          guestPhone: modalGuestPhone.trim(),
          partySize: Number(modalPartySize),
          attending: true,
          mealPreference: modalMealPref,
          needsAccommodation: modalNeedsStay,
          notes: modalBlessing.trim(),
          turnstileToken: modalTurnstileToken || undefined,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
        showToast(`🎉 Thank you ${modalGuestName.split(" ")[0]}! RSVP recorded!`);
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
        `Tap here to view the royal invitation, ceremony itinerary, photo gallery & RSVP:\n` +
        `${typeof window !== "undefined" ? window.location.href : `https://shadify.in/${wedding.slug}`}`,
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  if (isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] px-4 text-center text-[#1F1A2E]">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1F1A2E]/5 text-xl">
          ⌛
        </div>
        <h1 className="font-serif text-2xl text-[#1F1A2E] sm:text-3xl">
          Celebration Website Concluded
        </h1>
        <p className="mt-3 max-w-md text-xs leading-relaxed text-[#1F1A2E]/70 sm:text-sm">
          The active digital invitation and gallery hosting for {wedding.bride} &amp;{" "}
          {wedding.groom}
          &apos;s wedding has concluded.
        </p>
      </div>
    );
  }

  const c = theme.palette;
  const loveStory = wedding.loveStory;
  const gallery = wedding.gallery || [];

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
      className="selection:text-theme-on-accent relative min-h-screen bg-theme-bg pb-24 font-sans text-theme-text-primary transition-colors duration-500 selection:bg-theme-accent md:pb-0"
    >
      {/* ----------------------------------------------------------- */}
      {/* 0. AMBIENT FALLING ROSE PETALS CANVAS */}
      {/* ----------------------------------------------------------- */}
      <canvas
        ref={canvasRef}
        id="petals-canvas"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
        aria-hidden="true"
      />

      {/* ----------------------------------------------------------- */}
      {/* 0. TOAST NOTIFICATION */}
      {/* ----------------------------------------------------------- */}
      {toastMessage && (
        <div className="border-theme-accent/50 fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-[#1A0A00]/95 px-6 py-3 font-serif text-sm text-[#E8B96B] shadow-2xl backdrop-blur-md transition-all">
          {toastMessage}
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 1. ROYAL ENVELOPE OVERLAY (WAX SEAL REVEAL) */}
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
      {/* 2. STICKY GLASSMORPHIC NAVIGATION BAR */}
      {/* ----------------------------------------------------------- */}
      <nav className="border-theme-accent/20 bg-theme-surface/85 fixed inset-x-0 top-0 z-40 border-b px-6 py-3.5 shadow-sm backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a
            href="#hero"
            className="font-serif text-lg font-semibold tracking-wide text-theme-primary"
          >
            {wedding.bride} &amp; {wedding.groom}
          </a>

          <div className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[0.15em] text-theme-text-primary md:flex">
            {loveStory && (
              <a href="#story" className="transition hover:text-theme-accent">
                Our Story
              </a>
            )}
            <a href="#events" className="transition hover:text-theme-accent">
              Ceremonies
            </a>
            {gallery.length > 0 && (
              <a href="#gallery" className="transition hover:text-theme-accent">
                Gallery
              </a>
            )}
            {wedding.vips.length > 0 && (
              <a href="#vips" className="transition hover:text-theme-accent">
                Family
              </a>
            )}
            <a href="#rsvp" className="transition hover:text-theme-accent">
              RSVP
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsShagunModalOpen(true)}
              className="border-theme-accent/40 hidden items-center gap-1.5 rounded-full border bg-theme-surface px-4 py-1.5 text-xs font-medium text-theme-text-primary transition hover:border-theme-accent sm:inline-flex"
            >
              <Gift className="h-3.5 w-3.5 text-theme-accent" />
              <span>Digital Shagun</span>
            </button>
            <a
              href="#rsvp"
              className="text-theme-on-primary rounded-full bg-theme-primary px-5 py-1.5 text-xs font-semibold tracking-wider transition hover:opacity-95"
            >
              RSVP
            </a>
          </div>
        </div>
      </nav>

      {/* ----------------------------------------------------------- */}
      {/* 3. HERO SECTION */}
      {/* ----------------------------------------------------------- */}
      <section
        id="hero"
        className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center"
      >
        {wedding.heroImage && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
            style={{
              backgroundImage: `url(${wedding.heroImage})`,
              transform: "scale(1.05)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-theme-bg" />

        <div className="relative z-10 mx-auto max-w-3xl text-white">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-black/40 px-5 py-1 text-xs font-medium uppercase tracking-[0.25em] text-amber-200 backdrop-blur-md">
            <span>✦ Together Forever ✦</span>
          </div>

          <h1 className="font-serif text-5xl font-light tracking-tight text-white md:text-7xl lg:text-8xl">
            {wedding.bride} <br />
            <span className="font-serif text-3xl italic text-amber-300 md:text-5xl">
              &amp;
            </span>{" "}
            <br />
            {wedding.groom}
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 font-serif text-base tracking-widest text-white/90 md:text-lg">
            <span>✦</span>
            <span>{wedding.date}</span>
            <span>·</span>
            <span>{wedding.venueCity}</span>
            <span>✦</span>
          </div>

          {/* Real-Time Live Countdown */}
          {timeLeft && (
            <div className="mt-8 flex items-center justify-center gap-3 font-serif text-xs uppercase tracking-wider text-amber-200">
              <div className="min-w-[62px] rounded-xl border border-amber-300/30 bg-black/50 px-3.5 py-2.5 text-center shadow-lg backdrop-blur-md">
                <span className="block text-2xl font-light text-white">{timeLeft.days}</span>
                <span className="text-[10px] tracking-widest text-amber-200/80">Days</span>
              </div>
              <div className="min-w-[62px] rounded-xl border border-amber-300/30 bg-black/50 px-3.5 py-2.5 text-center shadow-lg backdrop-blur-md">
                <span className="block text-2xl font-light text-white">{timeLeft.hours}</span>
                <span className="text-[10px] tracking-widest text-amber-200/80">Hours</span>
              </div>
              <div className="min-w-[62px] rounded-xl border border-amber-300/30 bg-black/50 px-3.5 py-2.5 text-center shadow-lg backdrop-blur-md">
                <span className="block text-2xl font-light text-white">{timeLeft.minutes}</span>
                <span className="text-[10px] tracking-widest text-amber-200/80">Mins</span>
              </div>
              <div className="min-w-[62px] rounded-xl border border-amber-300/30 bg-black/50 px-3.5 py-2.5 text-center shadow-lg backdrop-blur-md">
                <span className="block text-2xl font-light text-white">{timeLeft.seconds}</span>
                <span className="text-[10px] tracking-widest text-amber-200/80">Secs</span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#rsvp"
              className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-semibold tracking-wide text-black shadow-lg transition-transform hover:scale-105"
            >
              RSVP Now
            </a>

            <button
              onClick={() => setIsShagunModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-amber-300"
            >
              <Gift className="h-4 w-4 text-amber-300" />
              Digital Shagun
            </button>

            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-green-500/50 bg-green-950/40 px-6 py-3 text-sm font-medium text-green-300 backdrop-blur-md transition-colors hover:bg-green-900/50"
            >
              <Share2 className="h-4 w-4" />
              Share Invitation
            </a>
          </div>
        </div>

        <a
          href="#story"
          className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-[11px] uppercase tracking-widest text-white/70 transition hover:text-white"
        >
          <span>Scroll to explore</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* Decorative Auspicious Divider */}
      <div className="relative py-8 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="border-theme-accent/20 w-full border-t" />
        </div>
        <div className="relative inline-flex items-center gap-2 bg-theme-bg px-4 text-theme-accent">
          <span>✦</span>
          <span>🌸</span>
          <span>✦</span>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 4. OUR STORY & JOURNEY MILESTONES */}
      {/* ----------------------------------------------------------- */}
      {loveStory && (
        <section id="story" className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Couple Framed Photo */}
            <div className="relative mx-auto max-w-md">
              <div className="border-theme-accent/60 relative overflow-hidden rounded-2xl border-2 p-2 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loveStory.coupleImage}
                  alt={`${wedding.bride} and ${wedding.groom}`}
                  className="aspect-[3/4] w-full rounded-xl object-cover"
                />
              </div>
              <div className="border-theme-accent/40 absolute -bottom-4 -right-4 rounded-xl border bg-theme-primary px-5 py-3 text-center text-white shadow-xl">
                <p className="text-[10px] uppercase tracking-wider opacity-85">Together Since</p>
                <p className="font-serif text-2xl font-bold">{loveStory.togetherSinceYear}</p>
              </div>
            </div>

            {/* Narrative & Timeline */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-theme-accent">
                {loveStory.tagline}
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light text-theme-text-primary md:text-4xl">
                {loveStory.headline}
              </h2>

              <p className="mt-4 font-serif text-base leading-relaxed text-theme-text-muted md:text-lg">
                {loveStory.storyP1}
              </p>
              <p className="mt-3 font-serif text-base leading-relaxed text-theme-text-muted md:text-lg">
                {loveStory.storyP2}
              </p>

              {/* Milestones Timeline */}
              {loveStory.milestones && loveStory.milestones.length > 0 && (
                <div className="border-theme-accent/30 mt-8 space-y-6 border-l-2 pl-6">
                  {loveStory.milestones.map((m, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-theme-bg bg-theme-accent" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
                        {m.year} · {m.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-theme-text-muted">
                        {m.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 5. WEDDING CEREMONIES & ITINERARY */}
      {/* ----------------------------------------------------------- */}
      <section
        id="events"
        className="border-theme-accent/10 bg-theme-surface/40 border-y px-4 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-theme-accent">
              Wedding Celebrations
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light text-theme-text-primary md:text-4xl">
              Join Us for Every Ceremony
            </h2>
            <p className="mt-2 text-sm text-theme-text-muted">
              Four days of love, laughter &amp; timeless traditions
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {wedding.events.map((evt) => {
              const isHappeningNow =
                evt.startTimeIso &&
                Date.now() >= new Date(evt.startTimeIso).getTime() &&
                (!evt.endTimeIso ||
                  Date.now() <= new Date(evt.endTimeIso).getTime() ||
                  Date.now() <= new Date(evt.startTimeIso).getTime() + 4 * 3600 * 1000);

              const eventIcon = evt.tag.toLowerCase().includes("mehendi")
                ? "🌿"
                : evt.tag.toLowerCase().includes("sangeet")
                  ? "🎶"
                  : evt.tag.toLowerCase().includes("wedding") ||
                      evt.tag.toLowerCase().includes("mandap")
                    ? "🔥"
                    : "🥂";

              return (
                <div
                  key={evt.id}
                  className="border-theme-accent/20 hover:border-theme-accent/60 group flex flex-col justify-between overflow-hidden rounded-2xl border bg-theme-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div>
                    {evt.coverImage && (
                      <div className="relative h-44 w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evt.coverImage}
                          alt={evt.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute bottom-3 left-3 text-2xl">{eventIcon}</span>
                        {isHappeningNow && (
                          <span className="absolute right-3 top-3 inline-flex animate-pulse items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Happening Now
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="text-theme-on-primary rounded-md bg-theme-primary px-2.5 py-0.5 text-[11px] font-medium">
                          {evt.tag}
                        </span>
                        <span className="text-[11px] text-theme-text-muted">{evt.date}</span>
                      </div>

                      <h3 className="mt-3 font-serif text-xl font-medium text-theme-text-primary">
                        {evt.title}
                      </h3>

                      <div className="mt-3 space-y-1.5 text-xs text-theme-text-muted">
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-theme-accent" />
                          <span>{evt.time}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-theme-accent" />
                          <span>{evt.venue}</span>
                        </p>
                      </div>

                      <p className="mt-3 text-[11px] text-theme-accent">
                        Dress Code: {evt.dressCode}
                      </p>
                    </div>
                  </div>

                  <div className="border-theme-accent/15 flex items-center justify-between gap-2 border-t p-4">
                    <a
                      href={evt.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-theme-accent/40 inline-flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium text-theme-text-muted hover:border-theme-accent hover:text-theme-text-primary"
                    >
                      <MapPin className="h-3 w-3 text-theme-accent" />
                      <span>Directions</span>
                    </a>
                    <button
                      onClick={() => setActiveRsvpEvent(evt)}
                      className="text-theme-on-accent flex-1 rounded-lg bg-theme-accent py-2 text-xs font-semibold transition-transform hover:scale-105"
                    >
                      RSVP
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 6. PHOTO GALLERY & LIGHTBOX */}
      {/* ----------------------------------------------------------- */}
      {gallery.length > 0 && (
        <section id="gallery" className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-theme-accent">
              Our Memories
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light text-theme-text-primary md:text-4xl">
              Photo Gallery
            </h2>
            <p className="mt-2 text-sm text-theme-text-muted">
              Moments captured across our journey together
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {gallery.map((photo, i) => (
              <div
                key={i}
                onClick={() => setLightboxImage(photo)}
                className={`border-theme-accent/20 group relative cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl ${
                  photo.aspect === "tall"
                    ? "row-span-2 aspect-[3/4]"
                    : photo.aspect === "wide"
                      ? "col-span-2 aspect-[16/9]"
                      : "aspect-square"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="font-serif text-sm italic text-white">{photo.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute right-6 top-6 text-white/80 hover:text-white"
          >
            <X className="h-8 w-8" />
          </button>
          <div
            className="max-h-[90vh] max-w-[90vw] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption}
              className="max-h-[80vh] w-auto rounded-lg object-contain shadow-2xl"
            />
            <p className="mt-3 font-serif text-base italic text-amber-200">
              {lightboxImage.caption}
            </p>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 7. MEET THE VIPS (FAMILY & ENTOURAGE) */}
      {/* ----------------------------------------------------------- */}
      {wedding.vips.length > 0 && (
        <section
          id="vips"
          className="border-theme-accent/10 bg-theme-surface/50 border-t px-4 py-20"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-theme-accent">
                Family &amp; Entourage
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light text-theme-text-primary md:text-4xl">
                Meet the VIPs
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {wedding.vips.map((vip, i) => (
                <div
                  key={i}
                  className="border-theme-accent/20 rounded-xl border bg-theme-surface p-6 text-center shadow-sm"
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
      )}

      {/* ----------------------------------------------------------- */}
      {/* 8. IN-PAGE RSVP SECTION */}
      {/* ----------------------------------------------------------- */}
      <section
        id="rsvp"
        className="border-theme-accent/15 border-t bg-gradient-to-b from-theme-bg via-[#5C0000]/10 to-theme-bg px-4 py-20"
      >
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-theme-accent">
              You&apos;re Invited
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light text-theme-text-primary md:text-4xl">
              Will You Join Us?
            </h2>
            <p className="mt-2 text-sm text-theme-text-muted">
              Please RSVP by January 15, 2027 to help us prepare your royal welcome
            </p>
          </div>

          <div className="border-theme-accent/30 bg-theme-surface/90 mt-10 rounded-2xl border p-8 shadow-2xl backdrop-blur-md">
            {inPageSubmitted ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-4 font-serif text-2xl text-theme-text-primary">RSVP Received!</h3>
                <p className="mt-2 text-sm text-theme-text-muted">
                  Thank you, {inPageGuestName}. We cannot wait to celebrate with you in Udaipur!
                </p>
              </div>
            ) : (
              <form onSubmit={handleInPageRsvpSubmit} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-medium text-theme-text-muted">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={inPageGuestName}
                      onChange={(e) => setInPageGuestName(e.target.value)}
                      placeholder="Amit Kumar"
                      className="border-theme-accent/30 mt-1.5 w-full rounded-lg border bg-theme-bg px-3.5 py-2.5 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-theme-text-muted">
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={inPageGuestPhone}
                      onChange={(e) => setInPageGuestPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="border-theme-accent/30 mt-1.5 w-full rounded-lg border bg-theme-bg px-3.5 py-2.5 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block font-medium text-theme-text-muted">Attending? *</label>
                    <select
                      value={inPageAttending}
                      onChange={(e) => setInPageAttending(e.target.value)}
                      className="border-theme-accent/30 mt-1.5 w-full rounded-lg border bg-theme-bg px-3.5 py-2.5 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    >
                      <option value="yes">✅ Joyfully Attending</option>
                      <option value="no">😢 Unable to Attend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-theme-text-muted">Total Guests</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={inPagePartySize}
                      onChange={(e) => setInPagePartySize(Number(e.target.value))}
                      className="border-theme-accent/30 mt-1.5 w-full rounded-lg border bg-theme-bg px-3.5 py-2.5 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-theme-text-muted">
                      Meal Preference
                    </label>
                    <select
                      value={inPageMealPref}
                      onChange={(e) => setInPageMealPref(e.target.value)}
                      className="border-theme-accent/30 mt-1.5 w-full rounded-lg border bg-theme-bg px-3.5 py-2.5 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    >
                      <option value="pure_veg">🥗 Pure Vegetarian</option>
                      <option value="jain">🌱 Jain</option>
                      <option value="non_veg">🍗 Non-Vegetarian</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="inPageNeedsStayCheck"
                    checked={inPageNeedsStay}
                    onChange={(e) => setInPageNeedsStay(e.target.checked)}
                    className="border-theme-accent/30 h-4 w-4 rounded bg-theme-bg text-theme-accent focus:ring-0"
                  />
                  <label htmlFor="inPageNeedsStayCheck" className="text-theme-text-muted">
                    Request hotel accommodation in Udaipur (outstation guests)
                  </label>
                </div>

                <div>
                  <label className="block font-medium text-theme-text-muted">
                    Personal Warm Blessing
                  </label>
                  <textarea
                    rows={3}
                    value={inPageBlessing}
                    onChange={(e) => setInPageBlessing(e.target.value)}
                    placeholder="Share a loving note or blessing for Priya & Rahul..."
                    className="border-theme-accent/30 mt-1.5 w-full rounded-lg border bg-theme-bg px-3.5 py-2.5 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                  />
                </div>

                <TurnstileWidget onSuccess={setInPageTurnstileToken} />

                <button
                  type="submit"
                  disabled={inPageIsSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 font-serif text-sm font-semibold tracking-wider text-black shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {inPageIsSubmitting ? "Submitting RSVP..." : "Send RSVP with Love 💌"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 9. MODAL RSVP (FOR EVENT CARDS) */}
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
                  Thank you, {modalGuestName}. We cannot wait to celebrate with you!
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
              <form onSubmit={handleModalRsvpSubmit}>
                <h3 className="font-serif text-2xl font-light text-theme-text-primary">
                  RSVP for {activeRsvpEvent.title}
                </h3>
                <p className="mt-1 text-xs text-theme-accent">Please submit by January 15, 2027</p>

                <div className="mt-6 space-y-4 text-xs">
                  <div>
                    <label className="block text-theme-text-muted">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={modalGuestName}
                      onChange={(e) => setModalGuestName(e.target.value)}
                      placeholder="e.g. Aditi Sharma"
                      className="border-theme-accent/30 mt-1 w-full rounded-lg border bg-theme-bg px-3 py-2 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-theme-text-muted">
                      WhatsApp / Mobile Number (with Country Code) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={modalGuestPhone}
                      onChange={(e) => setModalGuestPhone(e.target.value)}
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
                        value={modalPartySize}
                        onChange={(e) => setModalPartySize(Number(e.target.value))}
                        className="border-theme-accent/30 mt-1 w-full rounded-lg border bg-theme-bg px-3 py-2 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-theme-text-muted">Dietary Preference</label>
                      <select
                        value={modalMealPref}
                        onChange={(e) => setModalMealPref(e.target.value)}
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
                      id="modalNeedsStayCheck"
                      checked={modalNeedsStay}
                      onChange={(e) => setModalNeedsStay(e.target.checked)}
                      className="border-theme-accent/30 h-4 w-4 rounded bg-theme-bg text-theme-accent focus:ring-0"
                    />
                    <label htmlFor="modalNeedsStayCheck" className="text-theme-text-muted">
                      Request hotel room allocation (outstation guests)
                    </label>
                  </div>

                  <div>
                    <label className="block text-theme-text-muted">Personal Warm Wishes</label>
                    <textarea
                      rows={3}
                      value={modalBlessing}
                      onChange={(e) => setModalBlessing(e.target.value)}
                      placeholder="Share a loving note with the couple..."
                      className="border-theme-accent/30 mt-1 w-full rounded-lg border bg-theme-bg px-3 py-2 text-theme-text-primary focus:border-theme-accent focus:outline-none"
                    />
                  </div>
                </div>

                <TurnstileWidget onSuccess={setModalTurnstileToken} />

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
      {/* 10. DIGITAL SHAGUN MODAL */}
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

            {/* Direct UPI Deep Link & Fallback Matrix */}
            <div className="mt-6 space-y-3">
              <a
                href={`upi://pay?pa=${wedding.upiVpa}&pn=${encodeURIComponent(
                  `${wedding.bride} and ${wedding.groom} Wedding`,
                )}&am=${shagunAmount}&cu=INR&tn=${encodeURIComponent("Wedding Shagun Blessing")}`}
                className="text-theme-on-primary block w-full rounded-full bg-theme-primary py-3 text-sm font-semibold tracking-wide shadow-lg transition-transform hover:scale-[1.02]"
              >
                Send ₹{shagunAmount.toLocaleString("en-IN")} via UPI App
              </a>
              <p className="text-[11px] text-theme-text-muted opacity-75">
                Opens Google Pay, PhonePe, Paytm, or BHIM instantly
              </p>

              {/* In-App Browser & Desktop Fallback: Copy UPI & QR Code */}
              <div className="border-theme-accent/20 bg-theme-surface/70 rounded-xl border p-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-theme-text-muted">
                      UPI ID / VPA
                    </span>
                    <p className="select-all font-mono text-xs font-semibold text-theme-text-primary">
                      {wedding.upiVpa}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyUpi}
                    type="button"
                    className="border-theme-accent/30 inline-flex items-center gap-1 rounded-md border bg-theme-bg px-2.5 py-1.5 text-xs font-medium text-theme-text-primary hover:border-theme-accent"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-theme-accent" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* QR Code Toggle for Desktop / WhatsApp In-App Browser */}
                <div className="border-theme-accent/10 mt-2.5 flex items-center justify-between border-t pt-2.5">
                  <span className="text-[11px] text-theme-text-muted">On iPhone or laptop?</span>
                  <button
                    type="button"
                    onClick={() => setShowQrCode((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-theme-accent hover:underline"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>{showQrCode ? "Hide QR Code" : "Show QR Code"}</span>
                  </button>
                </div>

                {showQrCode && (
                  <div className="mt-3 flex flex-col items-center justify-center rounded-lg bg-white p-3 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `upi://pay?pa=${wedding.upiVpa}&pn=${encodeURIComponent(
                          `${wedding.bride} and ${wedding.groom} Wedding`,
                        )}&am=${shagunAmount}&cu=INR&tn=${encodeURIComponent("Wedding Shagun Blessing")}`,
                      )}&margin=8`}
                      alt="UPI Payment QR Code"
                      className="h-36 w-36 rounded shadow-inner"
                      loading="lazy"
                    />
                    <p className="mt-2 text-[10px] text-gray-700">
                      Scan with any UPI app on another phone
                    </p>
                  </div>
                )}
              </div>

              {/* NRI & International Relatives Note */}
              <div className="bg-theme-surface/40 rounded-lg p-2.5 text-center text-[10px] leading-relaxed text-theme-text-muted">
                🌐 <strong>NRI &amp; Overseas Relatives:</strong> If UPI is not accessible outside
                India, please contact the couple or concierge for bank wire / account details.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 11. BRAND & CONCIERGE FOOTER */}
      {/* ----------------------------------------------------------- */}
      <footer className="border-theme-accent/15 border-t py-12 text-center text-xs text-theme-text-muted">
        <p className="text-theme-text-primary/80 font-serif text-lg tracking-widest">
          {wedding.bride} &amp; {wedding.groom}
        </p>
        <p className="mt-1 font-serif text-sm opacity-85">
          {wedding.date} · {wedding.venueCity}
        </p>
        <div className="my-3 text-sm text-theme-accent opacity-75">✦ ॐ ✦</div>
        {wedding.showBranding && (
          <p className="text-[11px] tracking-wider opacity-75">
            Website crafted with love on{" "}
            <a
              href="/"
              className="font-serif font-semibold text-theme-text-primary underline hover:text-theme-accent"
            >
              Shadify
            </a>{" "}
            · Want one for your big day? Contact Concierge.
          </p>
        )}
      </footer>

      {/* ----------------------------------------------------------- */}
      {/* 12. MOBILE-FIRST STICKY ACTION DOCK */}
      {/* ----------------------------------------------------------- */}
      <nav
        aria-label="Mobile Quick Actions"
        className="bg-theme-surface/95 border-theme-accent/20 pb-safe fixed inset-x-0 bottom-0 z-40 border-t px-4 py-2 shadow-2xl backdrop-blur-md md:hidden"
      >
        <div className="flex items-center justify-around gap-2 text-center">
          <a
            href={wedding.events[0]?.mapUrl || "#events"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center justify-center py-1.5 text-xs font-medium text-theme-text-primary transition hover:text-theme-accent"
          >
            <MapPin className="mb-0.5 h-4 w-4 text-theme-accent" />
            <span>Map</span>
          </a>
          <a
            href="#rsvp"
            className="text-theme-on-primary flex-1 rounded-full bg-theme-primary py-2 text-xs font-semibold shadow-md transition active:scale-95"
          >
            RSVP
          </a>
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
                showToast("Wedding celebration link copied to clipboard!");
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
