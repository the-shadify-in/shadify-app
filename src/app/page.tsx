import React from "react";
import Link from "next/link";
import { PRICING_PLANS } from "@/lib/config/pricing";
import { SITE_CONFIG, getConciergeWhatsAppUrl } from "@/lib/config/contact";
import {
  Check,
  Sparkles,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Clock,
  HeartHandshake,
  QrCode,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Shadify — The Digital Operating System for Modern Indian Weddings",
  description:
    "Luxury digital wedding websites featuring 3D wax-seal envelope reveals, 1-tap WhatsApp invites, multi-event itineraries, direct UPI Shagun gifting, and real-time photo galleries.",
  openGraph: {
    title: "Shadify — Luxury Digital Wedding Websites",
    description:
      "A wedding invitation that feels like royal mail. Curated presets, zero contact harvesting, 5-year hosting.",
    url: "https://shadify.in",
    siteName: "Shadify",
    locale: "en_IN",
    type: "website",
  },
};

const THEME_PREVIEWS = [
  {
    id: "royal-crimson",
    name: "Royal Crimson",
    tagline: "Rani Crimson & Antique Gold",
    mood: "Classic royal heritage & grandeur",
    primary: "#941C2F",
    accent: "#C9933A",
    canvas: "#0E0709",
    text: "#F6EBDD",
  },
  {
    id: "emerald-gold",
    name: "Emerald Gold",
    tagline: "Peacock Emerald & Warm Gold",
    mood: "Opulent palatial celebration",
    primary: "#0D4D33",
    accent: "#D4AF37",
    canvas: "#051811",
    text: "#F4EFE0",
  },
  {
    id: "ivory-minimal",
    name: "Ivory Minimal",
    tagline: "Ivory Linen & Charcoal Ink",
    mood: "Understated modern refinement",
    primary: "#7A5A40",
    accent: "#8F6418",
    canvas: "#FAF7F2",
    text: "#2B2118",
    darkText: true,
  },
  {
    id: "sunset-day",
    name: "Sunset Ochre",
    tagline: "Warm Terracotta & Desert Ochre",
    mood: "Festive daytime sangeet warmth",
    primary: "#B8435A",
    accent: "#A8502F",
    canvas: "#FFF8F5",
    text: "#3A1F26",
    darkText: true,
  },
  {
    id: "sunset-dusk",
    name: "Sunset Dusk",
    tagline: "Twilight Magenta & Rose Gold",
    mood: "Chic evening cocktail glamour",
    primary: "#D46A7E",
    accent: "#E29578",
    canvas: "#12080D",
    text: "#FBEAEA",
  },
];

export default function HomePage() {
  const defaultWhatsAppUrl = getConciergeWhatsAppUrl();

  return (
    <div className="min-h-screen bg-[#070305] font-sans text-[#FAF7F2] selection:bg-[#C9933A]/30 selection:text-[#FAF7F2]">
      {/* Top Banner */}
      <div className="border-b border-[#C9933A]/20 bg-[#12070A]/80 px-4 py-2 text-center text-xs tracking-wide text-[#EADDCF]/80 backdrop-blur-md">
        <span>✨ Now onboarding for the upcoming wedding season.</span>{" "}
        <a
          href={defaultWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 inline-flex items-center gap-1 font-medium text-[#C9933A] hover:underline"
        >
          Chat with Concierge <ArrowRight className="h-3 w-3" />
        </a>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#070305]/90 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-light tracking-wide text-[#FAF7F2]">
              Shadify
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9933A]" />
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-medium uppercase tracking-wider text-[#FAF7F2]/70 sm:flex">
            <a href="#features" className="transition hover:text-[#C9933A]">
              Features
            </a>
            <a href="#themes" className="transition hover:text-[#C9933A]">
              Themes
            </a>
            <a href="#pricing" className="transition hover:text-[#C9933A]">
              Pricing
            </a>
            <Link href="/priya-rahul" className="transition hover:text-[#C9933A]">
              Live Demo
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="hidden text-xs text-[#FAF7F2]/50 hover:text-[#FAF7F2] sm:inline-block"
            >
              Sign In
            </Link>
            <a
              href={defaultWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#C9933A]/40 bg-[#C9933A]/10 px-4 py-2 text-xs font-medium text-[#FAF7F2] shadow-sm transition hover:bg-[#C9933A] hover:text-[#070305]"
            >
              <MessageCircle className="h-3.5 w-3.5 text-[#C9933A]" />
              Concierge Desk
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pb-28 pt-20 text-center sm:pb-36 sm:pt-28">
        {/* Subtle radial ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#941C2F]/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 -z-10 h-72 w-72 rounded-full bg-[#C9933A]/15 blur-[100px]" />

        <div className="mx-auto max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9933A]/30 bg-[#12070A] px-4 py-1.5 text-xs font-medium text-[#C9933A] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            The Digital Operating System for Modern Indian Weddings
          </div>

          <h1 className="font-serif text-4xl font-light tracking-tight text-[#FAF7F2] sm:text-6xl md:text-7xl">
            A wedding invitation that feels like{" "}
            <span className="italic text-[#C9933A]">royal mail</span>.
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#FAF7F2]/70 sm:text-base md:text-lg">
            Elevate your wedding announcement with interactive wax-seal envelope reveals, 1-tap
            WhatsApp invitations, multi-event itineraries, direct UPI Shagun gifting, and live guest
            photo galleries.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row">
            <a
              href={defaultWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[#C9933A] px-8 text-xs font-semibold uppercase tracking-wider text-[#070305] shadow-lg shadow-[#C9933A]/20 transition hover:bg-[#d8a34b] sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              Start on WhatsApp
            </a>

            <Link
              href="/priya-rahul"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 text-xs font-semibold uppercase tracking-wider text-[#FAF7F2] backdrop-blur transition hover:bg-white/10 sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 text-[#C9933A]" />
              Explore Live Demo
            </Link>
          </div>

          {/* Micro Trust Indicators */}
          <div className="grid grid-cols-2 gap-3 pt-10 text-[11px] text-[#FAF7F2]/60 sm:grid-cols-4 sm:gap-6">
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#C9933A]" />
              <span>5-Year Hosting Guarantee</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5 text-[#C9933A]" />
              <span>0% Commission on Shagun</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C9933A]" />
              <span>Zero Contact Harvesting</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C9933A]" />
              <span>5 Curated Heritage Themes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="border-t border-white/5 bg-[#0C0609] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl space-y-16">
          <div className="space-y-3 text-center">
            <h2 className="text-xs font-medium uppercase tracking-widest text-[#C9933A]">
              Thoughtfully Designed for Celebrations
            </h2>
            <p className="font-serif text-3xl font-light text-[#FAF7F2] sm:text-5xl">
              Every ceremonial detail, digitalized with reverence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-3xl border border-white/5 bg-[#140A0D] p-8 shadow-xl transition hover:border-[#C9933A]/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9933A]/10 text-[#C9933A]">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-medium text-[#FAF7F2]">
                Royal Wax-Seal Reveal
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#FAF7F2]/65">
                Guests tap an embossed gold wax seal to slide open a virtual royal envelope. Unfolds
                smoothly on every mobile browser without apps or heavy downloads.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-white/5 bg-[#140A0D] p-8 shadow-xl transition hover:border-[#C9933A]/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9933A]/10 text-[#C9933A]">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-medium text-[#FAF7F2]">
                Multi-Ceremony Itinerary
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#FAF7F2]/65">
                Clear schedules for Mehendi, Haldi, Sangeet, and the Sacred Pheras. Features 1-tap
                Google Maps directions and dress code tips for out-of-town guests.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-white/5 bg-[#140A0D] p-8 shadow-xl transition hover:border-[#C9933A]/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9933A]/10 text-[#C9933A]">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-medium text-[#FAF7F2]">
                Direct UPI Shagun Gifting
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#FAF7F2]/65">
                Guests gift auspicious blessings (₹101, ₹501, ₹2,100) directly to your bank account
                via Google Pay, PhonePe, or Paytm. Zero middleman cuts or wallet lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Presets Showcase */}
      <section id="themes" className="border-t border-white/5 bg-[#070305] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl space-y-16">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <h2 className="text-xs font-medium uppercase tracking-widest text-[#C9933A]">
              Curated Heritage Colorways
            </h2>
            <p className="font-serif text-3xl font-light text-[#FAF7F2] sm:text-5xl">
              Five palettes inspired by Indian bridal textiles.
            </p>
            <p className="text-xs leading-relaxed text-[#FAF7F2]/60">
              Every palette is audited against WCAG AA standards (4.5:1 text contrast) to ensure
              effortless readability for elders in bright daylight.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {THEME_PREVIEWS.map((theme) => (
              <div
                key={theme.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-5 shadow-lg transition hover:scale-[1.02]"
                style={{ backgroundColor: theme.canvas }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: theme.accent }}
                    >
                      {theme.name}
                    </span>
                    <span
                      className="h-3 w-3 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.primary }}
                    />
                  </div>

                  <p className="mt-3 font-serif text-sm font-medium" style={{ color: theme.text }}>
                    {theme.tagline}
                  </p>
                  <p className="mt-1 text-[11px] opacity-75" style={{ color: theme.text }}>
                    {theme.mood}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex gap-1.5">
                    <span
                      className="h-4 w-4 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                  <Link
                    href={`/priya-rahul`}
                    className="text-[11px] font-medium underline underline-offset-4 hover:opacity-80"
                    style={{ color: theme.accent }}
                  >
                    View Demo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-white/5 bg-[#0B0508] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl space-y-16">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <h2 className="text-xs font-medium uppercase tracking-widest text-[#C9933A]">
              Transparent, One-Time Investment
            </h2>
            <p className="font-serif text-3xl font-light text-[#FAF7F2] sm:text-5xl">
              No subscriptions. 5 years of hosting included.
            </p>
            <p className="text-xs leading-relaxed text-[#FAF7F2]/60">
              One simple upfront fee. Your site stays live for half a decade to preserve memories,
              wedding vows, and photo archives.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Lite Plan */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#12070A] p-8 shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xl text-[#FAF7F2]">
                    {PRICING_PLANS.lite.name}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-[#FAF7F2]/70">
                    Essential
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#FAF7F2]/60">{PRICING_PLANS.lite.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-light text-[#FAF7F2]">
                    ₹{PRICING_PLANS.lite.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-[#FAF7F2]/50">/ one-time</span>
                </div>

                <div className="my-6 h-px bg-white/5" />

                <ul className="space-y-3 text-xs text-[#FAF7F2]/80">
                  {PRICING_PLANS.lite.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#C9933A]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <a
                  href={getConciergeWhatsAppUrl({ plan: "lite" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-full items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-medium text-[#FAF7F2] transition hover:bg-white/10"
                >
                  Choose Lite Plan
                </a>
              </div>
            </div>

            {/* Premium Plan (Featured) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-[#C9933A] bg-[#160A0E] p-8 shadow-2xl shadow-[#C9933A]/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#C9933A] px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#070305]">
                Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xl text-[#C9933A]">
                    {PRICING_PLANS.premium.name}
                  </span>
                  <span className="rounded-full bg-[#C9933A]/10 px-3 py-1 text-[10px] uppercase tracking-wider text-[#C9933A]">
                    Complete Luxury
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#FAF7F2]/60">{PRICING_PLANS.premium.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-light text-[#FAF7F2]">
                    ₹{PRICING_PLANS.premium.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-[#FAF7F2]/50">/ one-time</span>
                </div>

                <div className="my-6 h-px bg-white/10" />

                <ul className="space-y-3 text-xs text-[#FAF7F2]/90">
                  {PRICING_PLANS.premium.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#C9933A]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <a
                  href={getConciergeWhatsAppUrl({ plan: "premium" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-full items-center justify-center rounded-full bg-[#C9933A] text-xs font-semibold uppercase tracking-wider text-[#070305] shadow-lg shadow-[#C9933A]/20 transition hover:bg-[#d8a34b]"
                >
                  Choose Premium Plan
                </a>
              </div>
            </div>

            {/* Platinum Plan */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#12070A] p-8 shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xl text-[#FAF7F2]">
                    {PRICING_PLANS.platinum.name}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-[#FAF7F2]/70">
                    Bespoke
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#FAF7F2]/60">{PRICING_PLANS.platinum.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-light text-[#FAF7F2]">
                    ₹{PRICING_PLANS.platinum.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-[#FAF7F2]/50">/ one-time</span>
                </div>

                <div className="my-6 h-px bg-white/5" />

                <ul className="space-y-3 text-xs text-[#FAF7F2]/80">
                  {PRICING_PLANS.platinum.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#C9933A]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <a
                  href={getConciergeWhatsAppUrl({ plan: "platinum" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-full items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-medium text-[#FAF7F2] transition hover:bg-white/10"
                >
                  Choose Platinum Plan
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#FAF7F2]/50">
            Note: All prices are exclusive of 18% statutory GST. Invoices generated with verifiable
            GSTIN upon concierge setup.
          </p>
        </div>
      </section>

      {/* Partner & Referral Program Callout */}
      <section className="border-t border-white/5 bg-[#090406] px-6 py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 rounded-3xl border border-[#C9933A]/20 bg-[#12070A] p-8 text-center sm:flex-row sm:text-left">
          <div className="max-w-xl space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9933A]">
              Photographer & Planner Program
            </span>
            <h3 className="font-serif text-2xl text-[#FAF7F2]">Have a partner or referral code?</h3>
            <p className="text-xs text-[#FAF7F2]/70">
              Apply a verified partner code (e.g.{" "}
              <code className="rounded bg-black/40 px-1.5 py-0.5 text-[#C9933A]">
                STUDIOPARTNER
              </code>{" "}
              or{" "}
              <code className="rounded bg-black/40 px-1.5 py-0.5 text-[#C9933A]">NAMASTE299</code>)
              during concierge onboarding to receive an instant ₹299 discount.
            </p>
          </div>

          <a
            href={defaultWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#C9933A] bg-[#C9933A]/10 px-6 py-2.5 text-xs font-medium text-[#FAF7F2] transition hover:bg-[#C9933A] hover:text-[#070305]"
          >
            Redeem with Concierge
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050204] px-6 py-16 text-xs text-[#FAF7F2]/60">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <span className="font-serif text-xl font-light text-[#FAF7F2]">Shadify</span>
              <p className="text-xs leading-relaxed text-[#FAF7F2]/50">
                The bespoke digital operating system for luxury Indian weddings.
              </p>
              <p className="text-[11px] text-[#FAF7F2]/40">{SITE_CONFIG.address}</p>
            </div>

            <div>
              <h4 className="font-semibold uppercase tracking-wider text-[#FAF7F2]/80">Product</h4>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <a href="#features" className="hover:text-[#C9933A]">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#themes" className="hover:text-[#C9933A]">
                    Curated Themes
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-[#C9933A]">
                    Pricing Tiers
                  </a>
                </li>
                <li>
                  <Link href="/priya-rahul" className="hover:text-[#C9933A]">
                    Live Wedding Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold uppercase tracking-wider text-[#FAF7F2]/80">
                Legal & Privacy
              </h4>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <span className="cursor-pointer hover:text-[#C9933A]">Terms of Service</span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-[#C9933A]">
                    Privacy Policy (DPDP Aligned)
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-[#C9933A]">
                    Refund & Postponement Policy
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-[#C9933A]">
                    Zero-Contact Harvesting Guarantee
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold uppercase tracking-wider text-[#FAF7F2]/80">
                Concierge Desk
              </h4>
              <p className="mt-3 text-xs leading-relaxed text-[#FAF7F2]/50">
                Direct WhatsApp assistance for couples and wedding creators.
              </p>
              <div className="mt-3">
                <a
                  href={defaultWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[#C9933A] hover:underline"
                >
                  {SITE_CONFIG.whatsappDisplay}
                </a>
              </div>
              <div className="mt-1 text-[11px] text-[#FAF7F2]/40">{SITE_CONFIG.supportEmail}</div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-[11px] text-[#FAF7F2]/40 sm:flex-row">
            <div>© 2026 {SITE_CONFIG.legalEntity}. All rights reserved.</div>
            <div>Crafted with reverence for Indian celebrations.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
