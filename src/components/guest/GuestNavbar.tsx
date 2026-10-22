"use client";

import React, { useState, useEffect } from "react";
import { Gift, Menu, X, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuestNavbarProps {
  bride: string;
  groom: string;
  showLoveStory?: boolean;
  showGallery?: boolean;
  showVips?: boolean;
  showShagun?: boolean;
  isAfterWedding?: boolean;
  onOpenShagun: () => void;
  onOpenAsk?: () => void;
  onToggleWeddingMode?: () => void;
}

export function GuestNavbar({
  bride,
  groom,
  showLoveStory = true,
  showGallery = true,
  showVips = true,
  showShagun = true,
  isAfterWedding = false,
  onOpenShagun,
  onOpenAsk,
  onToggleWeddingMode,
}: GuestNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-500 ease-in-out ${
        isScrolled
          ? "bg-theme-surface/95 border-[#D4AF37]/30 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl"
          : "border-transparent bg-gradient-to-b from-black/80 via-black/40 to-transparent py-4 sm:py-5"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        {/* Couple Brand */}
        <div className="flex items-center gap-3">
          <a
            href="#hero"
            className={`font-serif text-lg font-semibold tracking-wider transition-colors duration-300 md:text-xl ${
              isScrolled ? "text-theme-primary" : "text-white hover:text-[#E8B96B]"
            }`}
          >
            {bride} <span className="font-serif italic text-[#D4AF37]">&amp;</span> {groom}
          </a>

          {/* Platinum Tier Demo Badge */}
          <span className="hidden items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-[#E8B96B] backdrop-blur-md lg:inline-flex">
            <Sparkles className="h-3 w-3 text-[#D4AF37]" />
            <span>PLATINUM DEMO</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div
          className={`hidden items-center gap-7 text-xs font-medium uppercase tracking-[0.16em] transition-colors duration-300 md:flex ${
            isScrolled ? "text-theme-text-primary" : "text-white/90 drop-shadow-sm"
          }`}
        >
          {showLoveStory && (
            <a
              href="#story"
              className="transition-colors hover:scale-105 hover:text-[#D4AF37] active:scale-95"
            >
              Our Story
            </a>
          )}
          <a
            href="#events"
            className="transition-colors hover:scale-105 hover:text-[#D4AF37] active:scale-95"
          >
            Ceremonies
          </a>
          {showGallery && (
            <a
              href="#gallery"
              className="transition-colors hover:scale-105 hover:text-[#D4AF37] active:scale-95"
            >
              Moments
            </a>
          )}
          {showVips && (
            <a
              href="#vips"
              className="transition-colors hover:scale-105 hover:text-[#D4AF37] active:scale-95"
            >
              Family
            </a>
          )}
          <a
            href="#rsvp"
            className="transition-colors hover:scale-105 hover:text-[#D4AF37] active:scale-95"
          >
            {isAfterWedding ? "Guestbook" : "RSVP"}
          </a>
        </div>

        {/* Action Buttons using Shadcn Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Pre / Post Wedding View Mode Switcher */}
          {onToggleWeddingMode && (
            <button
              type="button"
              onClick={onToggleWeddingMode}
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 font-serif text-[11px] tracking-wider transition-all sm:inline-flex ${
                isAfterWedding
                  ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-200"
                  : isScrolled
                    ? "bg-theme-bg/60 border-[#D4AF37]/40 text-theme-text-primary hover:border-[#D4AF37]"
                    : "border-white/30 bg-black/40 text-white/90 hover:border-[#D4AF37]"
              }`}
            >
              <span>{isAfterWedding ? "🎊 After-Vivah View" : "💍 Upcoming Mode"}</span>
            </button>
          )}

          {onOpenAsk && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenAsk}
              className={`font-serif text-xs tracking-wider shadow-sm transition-all duration-300 ${
                isScrolled
                  ? "border-[#D4AF37]/50 bg-theme-surface text-theme-text-primary hover:border-[#D4AF37]"
                  : "border-[#D4AF37]/60 bg-black/45 text-white hover:border-[#D4AF37] hover:bg-black/60"
              }`}
            >
              <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-theme-accent" />
              <span>Ask</span>
            </Button>
          )}

          {showShagun && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenShagun}
              className={`font-serif text-xs tracking-wider shadow-sm transition-all duration-300 ${
                isScrolled
                  ? "border-[#D4AF37]/50 bg-theme-surface text-theme-text-primary hover:border-[#D4AF37]"
                  : "border-[#D4AF37]/60 bg-black/45 text-white hover:border-[#D4AF37] hover:bg-black/60"
              }`}
            >
              <Gift className="mr-1.5 h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Digital Shagun</span>
            </Button>
          )}

          <Button
            asChild
            size="sm"
            className="rounded-full bg-[#D4AF37] px-5 font-serif text-xs font-bold uppercase tracking-widest text-[#1A0A00] shadow-md transition-all hover:scale-105 hover:bg-[#E8B96B]"
          >
            <a href="#rsvp">{isAfterWedding ? "WISHES" : "RSVP"}</a>
          </Button>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`rounded-lg p-1.5 transition-colors md:hidden ${
              isScrolled ? "text-theme-text-primary" : "text-white"
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="bg-theme-surface/98 animate-in slide-in-from-top-4 border-b border-[#D4AF37]/30 px-6 py-5 shadow-2xl backdrop-blur-2xl duration-200 md:hidden">
          <div className="flex flex-col gap-3.5 text-xs font-medium uppercase tracking-[0.18em] text-theme-text-primary">
            {showLoveStory && (
              <a
                href="#story"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 transition-colors hover:text-[#D4AF37]"
              >
                Our Story
              </a>
            )}
            <a
              href="#events"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 transition-colors hover:text-[#D4AF37]"
            >
              Ceremonies
            </a>
            {showGallery && (
              <a
                href="#gallery"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 transition-colors hover:text-[#D4AF37]"
              >
                Moments
              </a>
            )}
            {showVips && (
              <a
                href="#vips"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 transition-colors hover:text-[#D4AF37]"
              >
                Family
              </a>
            )}
            <a
              href="#rsvp"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 transition-colors hover:text-[#D4AF37]"
            >
              {isAfterWedding ? "Guestbook & Wishes" : "RSVP"}
            </a>

            {onOpenAsk && (
              <button
                type="button"
                onClick={() => {
                  onOpenAsk();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 py-1.5 text-left transition-colors hover:text-[#D4AF37]"
              >
                <HelpCircle className="h-3.5 w-3.5 text-theme-accent" />
                <span>Ask Questions</span>
              </button>
            )}

            {onToggleWeddingMode && (
              <button
                type="button"
                onClick={() => {
                  onToggleWeddingMode();
                  setMobileMenuOpen(false);
                }}
                className="bg-theme-bg/60 mt-2 rounded-lg border border-[#D4AF37]/40 px-3 py-2 text-left font-serif text-xs tracking-wider text-theme-accent"
              >
                Switch to: {isAfterWedding ? "💍 Upcoming Mode" : "🎊 After-Vivah View"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
