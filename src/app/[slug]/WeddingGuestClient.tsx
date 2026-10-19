"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ThemeConfig, ContrastReport } from "@/lib/themes/tokens";
import type {
  WeddingDataDto as WeddingData,
  WeddingEventDto as WeddingEvent,
  VipEntryDto as VipEntry,
} from "@/features/weddings";

import { EnvelopeReveal } from "@/components/guest/EnvelopeReveal";
import { GuestNavbar } from "@/components/guest/GuestNavbar";
import { HeroSection } from "@/components/guest/HeroSection";
import { LoveStorySection } from "@/components/guest/LoveStorySection";
import { EventsSection } from "@/components/guest/EventsSection";
import { GallerySection } from "@/components/guest/GallerySection";
import { VipSection } from "@/components/guest/VipSection";
import { RsvpSection } from "@/components/guest/RsvpSection";
import { DigitalShagunModal } from "@/components/guest/DigitalShagunModal";
import { EventRsvpModal } from "@/components/guest/EventRsvpModal";
import { LiveStreamModal } from "@/components/guest/LiveStreamModal";
import { MusicToggle } from "@/components/guest/MusicToggle";
import { GuestFooter } from "@/components/guest/GuestFooter";
import { MobileDock } from "@/components/guest/MobileDock";

export type { WeddingData, WeddingEvent, VipEntry };

interface WeddingGuestClientProps {
  wedding: WeddingData;
  theme: ThemeConfig;
  contrastReport: ContrastReport;
}

export default function WeddingGuestClient({ wedding, theme }: WeddingGuestClientProps) {
  // 1. Client-Side Real-Time Expiration Gate
  const isExpired = wedding.hostingUntil && Date.now() > new Date(wedding.hostingUntil).getTime();

  // Envelope state (true = opened, false = sealed)
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);
  const [activeRsvpEvent, setActiveRsvpEvent] = useState<WeddingEvent | null>(null);
  const [isShagunModalOpen, setIsShagunModalOpen] = useState(false);
  const [isLiveStreamOpen, setIsLiveStreamOpen] = useState(false);
  const [isAfterWedding, setIsAfterWedding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check localStorage for seen state on mount
  useEffect(() => {
    try {
      const seen = localStorage.getItem(`shadify_envelope_opened_${wedding.slug}`);
      if (seen === "true") {
        setIsEnvelopeOpened(true);
      }
    } catch {
      // Safe fallback
    }
  }, [wedding.slug]);

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

    const colors = ["#FFB347", "#FF6B6B", "#FFD700", "#FF8C94", "#E8B96B", "#FFC0CB"];
    const petals = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight - window.innerHeight,
      size: Math.random() * 7 + 3,
      speed: Math.random() * 1.1 + 0.4,
      angle: Math.random() * Math.PI * 2,
      rot: (Math.random() - 0.5) * 0.04,
      opacity: Math.random() * 0.4 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        p.y += p.speed;
        p.x += Math.sin(p.y * 0.009) * 0.7;
        p.angle += p.rot;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color || "#FFB347";
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

  // Real-time dynamic countdown timer (resets automatically every day to keep demo vibrant)
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    // Dynamic countdown target resolver:
    // If future date is provided, use it; otherwise automatically calculate an upcoming date (e.g. 24 days from today)
    const getTargetMs = () => {
      if (wedding.weddingDateIso) {
        const parsed = new Date(wedding.weddingDateIso).getTime();
        if (parsed > Date.now()) return parsed;
      }
      const now = new Date();
      // Target 24 days ahead at 10:30 AM
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 24, 10, 30, 0);
      return target.getTime();
    };

    const targetMs = getTargetMs();

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
  }, [wedding.weddingDateIso]);

  const c = theme.palette;
  const loveStory = wedding.loveStory;
  const gallery = wedding.gallery || [];

  // Synchronize CSS custom properties to document.documentElement so modals/portals inherit them
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", c.primary);
    root.style.setProperty("--theme-on-primary", c.onPrimary);
    root.style.setProperty("--theme-accent", c.accent);
    root.style.setProperty("--theme-on-accent", c.onAccent);
    root.style.setProperty("--theme-bg", c.canvas);
    root.style.setProperty("--theme-surface", c.surface);
    root.style.setProperty("--theme-text-primary", c.text);
    root.style.setProperty("--theme-text-muted", c.textMuted);
    root.style.setProperty("--theme-envelope-bg", c.envelopeBg);
    root.style.setProperty("--theme-wax-seal", c.waxSeal);
  }, [c]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  if (isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-900 p-6 text-center text-stone-100">
        <h1 className="font-serif text-3xl font-light tracking-wide text-amber-200">
          Celebration Concluded
        </h1>
        <p className="mt-4 max-w-md font-serif text-stone-400">
          The public invitation link for {wedding.bride} &amp; {wedding.groom}&apos;s wedding has
          concluded.
        </p>
      </div>
    );
  }

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
      className="selection:text-theme-on-accent relative min-h-screen bg-theme-bg pb-20 font-sans text-theme-text-primary transition-colors duration-500 selection:bg-theme-accent md:pb-0"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --theme-primary: ${c.primary};
              --theme-on-primary: ${c.onPrimary};
              --theme-accent: ${c.accent};
              --theme-on-accent: ${c.onAccent};
              --theme-bg: ${c.canvas};
              --theme-surface: ${c.surface};
              --theme-text-primary: ${c.text};
              --theme-text-muted: ${c.textMuted};
              --theme-envelope-bg: ${c.envelopeBg};
              --theme-wax-seal: ${c.waxSeal};
            }
          `,
        }}
      />
      {/* 0. Ambient Floating Petals Canvas */}
      <canvas
        ref={canvasRef}
        id="petals-canvas"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
        aria-hidden="true"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#D4AF37]/50 bg-[#1A0A00]/95 px-6 py-3 font-serif text-sm text-[#E8B96B] shadow-2xl backdrop-blur-md transition-all">
          {toastMessage}
        </div>
      )}

      {/* 1. Royal Envelope Overlay (Wax Seal Reveal) */}
      {!isEnvelopeOpened && (
        <EnvelopeReveal
          bride={wedding.bride}
          groom={wedding.groom}
          date={wedding.date}
          venueCity={wedding.venueCity}
          monogram={wedding.monogram}
          slug={wedding.slug}
          waxSealColor={c.waxSeal}
          envelopeBg={c.envelopeBg}
          onOpened={() => setIsEnvelopeOpened(true)}
        />
      )}

      {/* 2. Glassmorphic Guest Navigation Dock */}
      <GuestNavbar
        bride={wedding.bride}
        groom={wedding.groom}
        showLoveStory={!!loveStory}
        showGallery={gallery.length > 0}
        showVips={wedding.vips.length > 0}
        showShagun={true}
        isAfterWedding={isAfterWedding}
        onOpenShagun={() => setIsShagunModalOpen(true)}
        onToggleWeddingMode={() => setIsAfterWedding(!isAfterWedding)}
      />

      {/* 3. Editorial Hero with Ornate Crest & Gold Countdown */}
      <HeroSection
        bride={wedding.bride}
        groom={wedding.groom}
        date={wedding.date}
        venueCity={wedding.venueCity}
        monogram={wedding.monogram}
        heroImage={wedding.heroImage}
        isAfterWedding={isAfterWedding}
        timeLeft={timeLeft}
      />

      {/* 4. Asymmetric Love Story & Milestone Timeline */}
      {loveStory && <LoveStorySection loveStory={loveStory} />}

      {/* 5. Ceremony Itinerary with Shadcn Card & Badge */}
      <EventsSection
        events={wedding.events}
        onSelectEventRsvp={(event) => setActiveRsvpEvent(event)}
        onOpenLiveStream={() => setIsLiveStreamOpen(true)}
      />

      {/* 6. Masonry Photo Gallery with Radix Dialog Lightbox */}
      {gallery.length > 0 && <GallerySection gallery={gallery} />}

      {/* 7. Pillars of Family (VIPs) */}
      {wedding.vips.length > 0 && <VipSection vips={wedding.vips} />}

      {/* 8. Embossed Reply Card RSVP with Shadcn Input & Button */}
      <RsvpSection
        weddingSlug={wedding.slug}
        defaultEventId={wedding.events[0]?.id}
        onToast={showToast}
      />

      {/* 9. Auspicious Digital Shagun Modal with Radix Dialog */}
      <DigitalShagunModal
        open={isShagunModalOpen}
        onOpenChange={setIsShagunModalOpen}
        bride={wedding.bride}
        groom={wedding.groom}
        upiVpa={wedding.upiVpa}
      />

      {/* 10. Ceremony Specific RSVP Modal with Radix Dialog */}
      <EventRsvpModal
        event={activeRsvpEvent}
        weddingSlug={wedding.slug}
        onClose={() => setActiveRsvpEvent(null)}
        onSuccess={(guestName) =>
          showToast(`🎉 Thank you ${guestName}! Your RSVP for this ceremony is confirmed!`)
        }
      />

      {/* 11. Platinum Virtual Broadcast / Live Stream Modal */}
      <LiveStreamModal
        open={isLiveStreamOpen}
        onOpenChange={setIsLiveStreamOpen}
        bride={wedding.bride}
        groom={wedding.groom}
      />

      {/* 12. Floating Shehnai Traditional Flute Music Player */}
      <MusicToggle />

      {/* 13. Auspicious Neutral Footer */}
      <GuestFooter
        bride={wedding.bride}
        groom={wedding.groom}
        date={wedding.date}
        venueCity={wedding.venueCity}
        showBranding={wedding.showBranding}
      />

      {/* 14. Mobile Bottom Quick Action Dock */}
      <MobileDock onOpenShagun={() => setIsShagunModalOpen(true)} showShagun={true} />
    </main>
  );
}
