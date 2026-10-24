import React from "react";
import Link from "next/link";
import { PRICING_PLANS } from "@/lib/config/pricing";
import { SITE_CONFIG, getConciergeWhatsAppUrl } from "@/lib/config/contact";
import {
  Check,
  Sparkles,
  ExternalLink,
  MessageCircle,
  HeartHandshake,
  QrCode,
  ArrowRight,
  Smartphone,
  FileSpreadsheet,
  ChevronDown,
  Camera,
  Users,
  MapPin,
  Clock,
  Gift,
} from "lucide-react";

export const metadata = {
  title: "Celebrate with Shadify — Digital Wedding Invitations & RSVPs",
  description:
    "Celebrate with Shadify. Every ceremony, Google Maps venue gate routing, 1-tap family RSVP with diet preferences, and direct 0%-fee UPI shagun in one link. Handcrafted by our WhatsApp concierge within 24 hours.",
  openGraph: {
    title: "Celebrate with Shadify — Digital Wedding Invitations & RSVPs",
    description:
      "Every ceremony, direction, family RSVP, and direct UPI shagun in one link. No app download, 5-year hosting included per terms.",
    url: "https://shadify.in",
    siteName: "Shadify",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Celebrate with Shadify — Digital Wedding Invitations & RSVPs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Celebrate with Shadify — Digital Wedding Invitations & RSVPs",
    description:
      "Every ceremony, direction, family RSVP, and direct UPI shagun in one link. Handcrafted for your family.",
    images: ["/og/og-default.jpg"],
  },
};

const SAMPLE_WEDDINGS = [
  {
    id: "royal-rajputana",
    title: "Royal Rajputana",
    aesthetic: "Velvet Crimson & Antique Gold",
    description:
      "A grand palatial Vivah with candlelit courtyards, royal mandap pheras, and Udaipur lakeside splendour.",
    slug: "priya-rahul",
    accentColor: "#941C2F",
    tagline: "Udaipur & Heritage Forts",
    monogram: "P & R",
    scriptBadge: "॥ शुभ विवाह ॥",
    bestFor: "Best for: Heritage Forts & Palatial Vivah",
  },
  {
    id: "sacred-temple",
    title: "Sacred Temple Heritage",
    aesthetic: "Forest Emerald & Temple Gold",
    description:
      "Warm brass lamps, sacred Vedic chants, delicate jasmine borders, and traditional silk muhurtham.",
    slug: "ananya-kabir",
    accentColor: "#0D4D33",
    tagline: "Vedic & South Indian Ceremonies",
    monogram: "A & K",
    scriptBadge: "கல்யாணம் • శుభం",
    bestFor: "Best for: Temple Mandaps & Sacred Vivah",
  },
  {
    id: "understated-minimalist",
    title: "Understated Minimalist",
    aesthetic: "Soft Ivory, Champagne & Gold",
    description:
      "Clean editorial typography, warm gold accents, and contemporary elegance for intimate farmhouse celebrations.",
    slug: "diya-arjun",
    accentColor: "#7A5A40",
    tagline: "Contemporary Destination Resorts",
    monogram: "D & A",
    scriptBadge: "Shubh Vivah • Minimal",
    bestFor: "Best for: Farmhouses & Modern Elegance",
  },
  {
    id: "sundowner-sangeet",
    title: "Sundowner Sangeet",
    aesthetic: "Terracotta, Rose & Sunset Gold",
    description:
      "Vibrant beachside cocktail soiree with sunset dusk tones, marigold garlands, and high-energy music beats.",
    slug: "zoya-farhan",
    accentColor: "#D46A7E",
    tagline: "Goa Beachside & Festive Sangeet",
    monogram: "Z & F",
    scriptBadge: "Mubarak • Celebration",
    bestFor: "Best for: Beachside Sundowners & Cocktails",
  },
];

const FAQS = [
  {
    question: "Do our elders need to install an app or create an account?",
    answer:
      "No. Anyone who taps your link opens your wedding suite instantly in their phone browser. There is zero app download, zero signup, and no password for grandparents to remember. It runs smoothly on every phone and spotty banquet hall Wi-Fi.",
  },
  {
    question: "Why choose Shadify over a traditional WhatsApp PDF invitation?",
    answer:
      "A PDF is a flat, static picture. It cannot tally RSVPs, cannot launch 1-tap Google Maps navigation to the exact banquet gate, cannot accept direct UPI shagun into your bank account, and cannot be updated if a ceremony muhurat changes. Shadify replaces the chaos of scattered PDFs with a single celebration link that stays always up to date.",
  },
  {
    question: "How do wedding gifts and shagun work?",
    answer:
      "Your wedding page displays your UPI ID and an interactive QR code. When guests send blessings, 100% of the gift transfers directly from their bank account to yours. Shadify charges a 0% platform fee and never holds, touches, or delays your shagun.",
  },
  {
    question: "What if a ceremony timing or hall changes last minute?",
    answer:
      "Simply message our WhatsApp concierge. We update your schedule for you, usually within 24 hours, so every relative and guest sees the correct time without needing you to print corrections or re-forward messages in family groups.",
  },
  {
    question: "Is our family's wedding information private?",
    answer:
      "Private by default: your wedding page is not listed on search engines (noindex). Only guests who receive your direct link can open it. We never sell, harvest, or spam your family contacts or phone numbers.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Within 24 hours. Just forward your wedding card, photos, and schedule on WhatsApp. Our concierge designs and polishes your preview within 24 hours. You approve every detail before sharing.",
  },
  {
    question: "How long does our wedding page stay active online?",
    answer:
      "Included for 5 years, per our terms. Your web-sized photos and ceremony timeline stay hosted for 5 years. Original high-resolution master uploads are accessible for 90 days (with optional extended archiving).",
  },
  {
    question: "Do plan prices include taxes?",
    answer: "All plan fees exclude 18% GST, which will be itemized clearly during payment.",
  },
];

export default function HomePage() {
  const defaultWhatsAppUrl = getConciergeWhatsAppUrl();

  return (
    <div className="min-h-screen bg-[#FFFBF5] font-sans text-[#1F1A2E] antialiased selection:bg-[#D6246E]/15 selection:text-[#1F1A2E]">
      {/* Top Banner */}
      <div className="border-b border-[#EADDCF] bg-[#FFF1F6] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-[#1F1A2E]">
        <span className="font-semibold text-[#D6246E]">✨ Concierge Onboarding:</span>{" "}
        <span>
          Share your wedding details on WhatsApp to receive your polished preview within 24 hours.
        </span>{" "}
        <a
          href={defaultWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 font-bold text-[#D6246E] underline decoration-[#D6246E]/40 underline-offset-2 transition hover:text-[#B81D5B] hover:decoration-[#B81D5B]"
        >
          Message Concierge on WhatsApp &rarr;
        </a>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 border-b border-[#EADDCF]/80 bg-[#FFFBF5]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D6246E] to-[#A81755] font-serif text-xl font-bold text-white shadow-sm ring-1 ring-[#D6246E]/30">
              S
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#1F1A2E]">
                Shadify
              </span>
              <span className="ml-1.5 font-cinzel text-[10px] font-bold uppercase tracking-[0.2em] text-[#D6246E]">
                Celebration
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#1F1A2E]/80 md:flex">
            <a href="#experience" className="transition hover:text-[#D6246E]">
              The Experience
            </a>
            <a href="#how-it-works" className="transition hover:text-[#D6246E]">
              How it works
            </a>
            <a href="#samples" className="transition hover:text-[#D6246E]">
              Real Celebrations
            </a>
            <a href="#benefits" className="transition hover:text-[#D6246E]">
              Host Benefits
            </a>
            <a href="#pricing" className="transition hover:text-[#D6246E]">
              Pricing
            </a>
            <a href="#questions" className="transition hover:text-[#D6246E]">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/priya-rahul"
              className="hidden rounded-full border border-[#EADDCF] bg-white px-4 py-2 text-xs font-semibold text-[#1F1A2E] shadow-sm transition hover:border-[#D6246E] hover:text-[#D6246E] sm:inline-flex"
            >
              Live Demo
            </Link>
            <a
              href={defaultWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#D6246E] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#B81D5B]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Start on WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden border-b border-[#EADDCF] bg-gradient-to-b from-[#FFF5F8]/60 via-[#FFFBF5] to-[#FFFBF5] py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#D6246E]/20 bg-white px-4 py-1.5 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#D6246E]" />
                <span className="font-cinzel text-xs font-semibold uppercase tracking-[0.18em] text-[#A81755]">
                  Digital Wedding Celebration Suite
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="mt-6 font-serif text-4xl tracking-tight text-[#1F1A2E] sm:text-6xl lg:text-[4.25rem] lg:leading-[1.12]">
                Celebrate with Shadify.
                <span className="mt-3 block bg-gradient-to-r from-[#D6246E] via-[#A81755] to-[#D6246E] bg-clip-text font-serif text-transparent">
                  Every Ceremony, Direction &amp; Blessing in One Link.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F1A2E]/80 sm:text-lg sm:leading-8">
                Replace frantic calls, scattered WhatsApp PDFs, and lost caterer counts with an
                elegant digital celebration. Animated wax-seal reveal, 1-tap Google Maps venue
                navigation, sub-event family RSVPs, and 0%-fee direct bank UPI shagun — handcrafted
                for you by our WhatsApp concierge within 24 hours.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <a
                  href={defaultWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#D6246E] px-8 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#B81D5B]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Start Your Wedding on WhatsApp</span>
                </a>
                <Link
                  href="/priya-rahul"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADDCF] bg-white px-7 py-4 text-sm font-semibold text-[#1F1A2E] shadow-sm transition hover:border-[#D6246E] hover:text-[#D6246E]"
                >
                  <span>Experience Priya &amp; Rahul&apos;s Demo</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Reassurance Chips */}
              <div className="mt-10 grid grid-cols-2 gap-3 text-xs font-medium text-[#1F1A2E]/75 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#0E9F8E]" /> Zero app downloads
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#0E9F8E]" /> 1-tap Google Maps directions
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#0E9F8E]" /> Direct UPI gifts (0% fee)
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#0E9F8E]" /> 5-year hosting included per terms
                </span>
              </div>
            </div>

            {/* Visual: Premium Royal Phone Mockup Preview */}
            <div className="flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-[350px] rounded-[2.8rem] border-[10px] border-[#1F1A2E] bg-white p-3.5 shadow-2xl ring-1 ring-black/10">
                {/* Speaker pill */}
                <div className="mx-auto mb-3.5 h-4 w-28 rounded-full bg-[#1F1A2E]" />

                {/* Simulated Screen */}
                <div className="overflow-hidden rounded-[2rem] border border-[#C9933A]/40 bg-[#0E0709] p-5 text-center text-[#F6EBDD]">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#C9933A]/50 bg-[#C9933A]/10 font-cinzel text-xs font-bold text-[#E6B865]">
                    PR
                  </div>
                  <p className="mt-3 font-cinzel text-[10px] uppercase tracking-[0.25em] text-[#C9933A]">
                    Royal Wedding Suite
                  </p>
                  <h2 className="mt-1.5 font-serif text-2xl font-bold tracking-tight text-[#FAF7F2]">
                    Priya &amp; Rahul
                  </h2>
                  <p className="mt-1 text-xs text-[#F6EBDD]/70">
                    Nov 28 &ndash; 30, 2026 &bull; Udaipur Palace
                  </p>

                  {/* Wax Seal Envelope Reveal Box */}
                  <div className="mt-5 rounded-2xl border border-[#C9933A]/30 bg-[#1A0A0F] p-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#E6B865] via-[#C9933A] to-[#996515] font-cinzel text-sm font-bold text-[#1F0A0E] shadow-md ring-2 ring-[#E6B865]/40">
                      P &amp; R
                    </div>
                    <p className="mt-2.5 font-serif text-sm font-semibold text-[#FAF7F2]">
                      Wax-Seal Envelope Reveal
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#F6EBDD]/70">
                      Interactive 3-ceremony schedule, 1-tap navigation &amp; family RSVP
                    </p>
                  </div>

                  {/* Live Demo Button inside mockup */}
                  <Link
                    href="/priya-rahul"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C9933A] to-[#DBA84E] py-3 text-xs font-bold text-[#1A0A0F] shadow-md transition hover:brightness-105"
                  >
                    <span>Open Live Demo</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-cinzel text-[10px] uppercase tracking-wider text-[#F6EBDD]/60">
                    <span>3 Ceremonies</span>
                    <span>Direct UPI</span>
                    <span>Hall Maps</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE CONTRAST (PDF CHAOS VS CELEBRATE WITH SHADIFY) */}
      <section id="experience" className="border-b border-[#EADDCF] bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#D6246E]">
              Why Families Celebrate with Shadify
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl lg:text-5xl">
              Turn wedding chaos into effortless royal celebration.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#1F1A2E]/75 sm:text-lg">
              Indian weddings are grand, multi-day celebrations. Managing them through scattered
              WhatsApp forwards and static PDFs shouldn&apos;t be your headache.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {/* The Old Way */}
            <div className="rounded-3xl border border-red-200 bg-red-50/40 p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3.5 py-1 text-xs font-bold text-red-700">
                <span>The Outdated Way</span>
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#1F1A2E]">
                Scattered WhatsApp PDFs &amp; 7 AM Calls
              </h3>
              <ul className="mt-6 space-y-4 text-sm text-[#1F1A2E]/80">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 font-bold text-red-600">&times;</span>
                  <span>12 forwarded PDFs where nobody can find the correct venue address.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 font-bold text-red-600">&times;</span>
                  <span>
                    Chasing 300 family members across group chats for the caterer&apos;s diet count.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 font-bold text-red-600">&times;</span>
                  <span>
                    Uncles and elders calling on wedding morning because Google Maps lost them.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 font-bold text-red-600">&times;</span>
                  <span>
                    If a ceremony timing shifts, you have to reprint or resend everything.
                  </span>
                </li>
              </ul>
            </div>

            {/* The Shadify Way */}
            <div className="rounded-3xl border-2 border-[#D6246E] bg-white p-8 shadow-lg">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF1F6] px-3.5 py-1 text-xs font-bold text-[#D6246E]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Celebrate with Shadify</span>
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#1F1A2E]">
                One Royal Link for Your Entire Family
              </h3>
              <ul className="mt-6 space-y-4 text-sm text-[#1F1A2E]/85">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0E9F8E]" />
                  <span>
                    <strong>1-Tap Google Maps:</strong> Leads guests to the exact banquet gate &amp;
                    valet parking.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0E9F8E]" />
                  <span>
                    <strong>Automated RSVP &amp; Diet Counts:</strong> Live tallies for Jain, veg,
                    and non-veg meals.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0E9F8E]" />
                  <span>
                    <strong>Direct Bank UPI Gifting:</strong> 0% platform fee, shagun transfers
                    instantly to you.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0E9F8E]" />
                  <span>
                    <strong>Instant Concierge Updates:</strong> Muhurat changes reflect instantly
                    with one WhatsApp message.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section id="how-it-works" className="border-b border-[#EADDCF] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#D6246E]">
              Concierge Handcrafted
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl lg:text-5xl">
              You celebrate. We handle the craft.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#1F1A2E]/75 sm:text-lg">
              No complicated website builders or stressful templates. Our dedicated design team
              personalizes everything from your WhatsApp message.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-3xl border border-[#EADDCF] bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1F6] text-[#D6246E]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-bold text-[#1F1A2E]">
                1. Forward Details on WhatsApp
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#1F1A2E]/75">
                Send your physical wedding card, couple photos, event timings, and venue locations.
                Voice notes are warmly welcomed.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-3xl border border-[#EADDCF] bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF7E8] text-[#F5A524]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-bold text-[#1F1A2E]">
                2. We Craft Your Royal Suite
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#1F1A2E]/75">
                We craft your bespoke color palette, family names in native scripts (Devanagari,
                Tamil, Telugu, Gujarati), and personalized monogram within 24 hours.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-3xl border border-[#EADDCF] bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F8F5] text-[#0E9F8E]">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-bold text-[#1F1A2E]">
                3. Share One Link with Family
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#1F1A2E]/75">
                Share your private link in family WhatsApp groups. Guests tap once, open the royal
                envelope, check timings, navigate, and RSVP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: ROYAL AESTHETICS & HERITAGE THEMES */}
      <section id="samples" className="border-b border-[#EADDCF] bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#D6246E]">
              Royal Aesthetics &amp; Heritage Themes
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl lg:text-5xl">
              Crafted for your family&apos;s heritage &amp; style.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#1F1A2E]/75 sm:text-lg">
              From palatial Rajasthan fortresses to sacred temple mandaps and sunlit Goa beaches.
              Every invitation suite is custom-tailored with your wedding colors, family monograms,
              and native scripts.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_WEDDINGS.map((sample) => (
              <div
                key={sample.id}
                className="group flex flex-col justify-between rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-7 shadow-sm transition hover:border-[#D6246E] hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-8 rounded-full shadow-inner"
                        style={{ backgroundColor: sample.accentColor }}
                      />
                      <span className="font-cinzel text-[11px] font-bold text-[#1F1A2E]/50">
                        {sample.monogram}
                      </span>
                    </div>
                    <span className="shadow-xs rounded-full border border-[#EADDCF] bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#1F1A2E]/70">
                      {sample.scriptBadge}
                    </span>
                  </div>

                  <span className="mt-5 block font-cinzel text-[11px] font-bold uppercase tracking-wider text-[#D6246E]">
                    {sample.tagline}
                  </span>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-[#1F1A2E]">
                    {sample.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold text-[#1F1A2E]/60">
                    {sample.aesthetic}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[#1F1A2E]/75">
                    {sample.description}
                  </p>

                  <div className="mt-4 rounded-xl border border-[#EADDCF]/60 bg-white/70 px-3 py-2 text-[11px] font-medium text-[#1F1A2E]/70">
                    {sample.bestFor}
                  </div>
                </div>

                <div className="mt-8 border-t border-[#EADDCF] pt-4">
                  <Link
                    href={`/${sample.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D6246E] transition group-hover:translate-x-1"
                  >
                    <span>Open Live Demo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Regional Typography & Concierge Customizer Trust Banner */}
          <div className="mt-12 rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-8 shadow-sm">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
              <div className="md:col-span-8">
                <span className="font-cinzel text-[11px] font-bold uppercase tracking-[0.2em] text-[#D6246E]">
                  Inclusive Regional Typography
                </span>
                <h3 className="mt-2 font-serif text-2xl font-bold text-[#1F1A2E] sm:text-3xl">
                  Invitation text in your elders&apos; mother tongue.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1F1A2E]/75">
                  Honor grandparents and extended family across generations. Present your wedding
                  itinerary, muhurtham timings, and sacred blessings in traditional Indic scripts
                  alongside English.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="shadow-2xs rounded-full border border-[#EADDCF] bg-white px-3 py-1 text-[#1F1A2E]">
                    हिंदी (Devanagari)
                  </span>
                  <span className="shadow-2xs rounded-full border border-[#EADDCF] bg-white px-3 py-1 text-[#1F1A2E]">
                    தமிழ் (Tamil)
                  </span>
                  <span className="shadow-2xs rounded-full border border-[#EADDCF] bg-white px-3 py-1 text-[#1F1A2E]">
                    తెలుగు (Telugu)
                  </span>
                  <span className="shadow-2xs rounded-full border border-[#EADDCF] bg-white px-3 py-1 text-[#1F1A2E]">
                    ગુજરાતી (Gujarati)
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D6246E]/20 bg-[#FFF1F6] p-6 text-center md:col-span-4">
                <span className="text-3xl">✨</span>
                <p className="mt-2 font-serif text-lg font-bold text-[#1F1A2E]">
                  Bespoke Concierge Customization
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#1F1A2E]/70">
                  Tell us your vision on WhatsApp. Our concierge tailors your color scheme and
                  monogram at zero extra fee.
                </p>
                <a
                  href={getConciergeWhatsAppUrl(
                    "Hi Shadify Concierge, I would like to see theme customizations for our wedding.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#D6246E] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                >
                  <span>Chat with Concierge</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: GUEST & ELDER EXPERIENCE */}
      <section id="benefits" className="border-b border-[#EADDCF] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <span className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#D6246E]">
                Elder-Friendly Design
              </span>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl lg:text-5xl">
                Built for grandparents, uncles, and every guest.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#1F1A2E]/75 sm:text-lg">
                Celebration software should unite families, not cause frustration on your wedding
                morning. Every single touchpoint is engineered for clarity and effortless reading.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0E9F8E]/10 text-[#0E9F8E]">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F1A2E]">
                      Open directly from WhatsApp with no login
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/70 sm:text-sm">
                      Zero app installations, zero user accounts, and zero passwords for anyone to
                      remember.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0E9F8E]/10 text-[#0E9F8E]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F1A2E]">
                      1-Tap navigation straight to the venue gate
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/70 sm:text-sm">
                      Launches Google Maps with exact coordinates for banquet gates and parking,
                      preventing lost guests.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0E9F8E]/10 text-[#0E9F8E]">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F1A2E]">
                      Chronological ceremony timeline &amp; dress codes
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/70 sm:text-sm">
                      Haldi, Mehendi, Sangeet, Vivah, and Reception schedules organized with clear
                      attire guidance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0E9F8E]/10 text-[#0E9F8E]">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F1A2E]">
                      Direct UPI shagun blessings (0% fee)
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/70 sm:text-sm">
                      Guests send shagun straight into your bank account via UPI QR code or VPA.
                      100% direct to you.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Reassurance Card */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-[#EADDCF] bg-white p-8 shadow-sm sm:p-10">
                <div className="flex items-center gap-3.5 border-b border-[#EADDCF] pb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1F6] text-[#D6246E]">
                    <HeartHandshake className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#1F1A2E]">
                      Thoughtful, Elder-Friendly Mobile Design
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/60">
                      Designed for budget Android phones and iOS Safari
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-[#1F1A2E]/80 sm:text-base">
                  We design our celebration suites for both flagship iPhones and budget Android
                  phones commonly held by elders. The typography has high contrast, buttons have
                  large touch targets, and pages load quickly even on overloaded banquet Wi-Fi.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-[#FFFBF5] p-5 text-center">
                  <div>
                    <div className="font-serif text-3xl font-bold text-[#D6246E]">0</div>
                    <div className="mt-1 text-xs font-medium text-[#1F1A2E]/70">
                      Apps to install
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-[#0E9F8E]">1 Tap</div>
                    <div className="mt-1 text-xs font-medium text-[#1F1A2E]/70">
                      To open on WhatsApp
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: PEACE OF MIND FOR ORGANIZING HOSTS */}
      <section className="border-b border-[#EADDCF] bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#D6246E]">
              Host Peace of Mind
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl lg:text-5xl">
              What you get as the organizing family.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#1F1A2E]/75 sm:text-lg">
              Accurate headcounts, instant caterer spreadsheets, and zero stress chasing relatives.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1F6] text-[#D6246E]">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold text-[#1F1A2E]">
                RSVPs Counted For You
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#1F1A2E]/75 sm:text-sm">
                Automatically tallied headcounts broken down by event (Mehendi, Sangeet, Vivah) and
                diet preference.
              </p>
            </div>

            <div className="rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF7E8] text-[#F5A524]">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold text-[#1F1A2E]">
                One File for the Caterer
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#1F1A2E]/75 sm:text-sm">
                Clean numbers for Jain, vegetarian, and non-veg diets ready for your catering team
                with zero manual counting.
              </p>
            </div>

            <div className="rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F8F5] text-[#0E9F8E]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold text-[#1F1A2E]">
                WhatsApp Concierge Updates
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#1F1A2E]/75 sm:text-sm">
                Need to adjust a muhurat time or venue hall? Message our concierge and we update it
                for you, usually within 24 hours.
              </p>
            </div>

            <div className="rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EEFB] text-[#3D3BC4]">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold text-[#1F1A2E]">
                Gifts Directly to Your UPI
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#1F1A2E]/75 sm:text-sm">
                Blessings arrive straight in your family bank account via your direct UPI QR code or
                UPI ID with 0% platform fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: PRICING */}
      <section id="pricing" className="border-b border-[#EADDCF] bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#D6246E]">
              Transparent Investment
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl lg:text-5xl">
              One simple price. 5-year hosting included.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#1F1A2E]/75 sm:text-lg">
              No monthly subscription fees. Included for 5 years per our terms (web-sized photos for
              5 years; originals for 90 days).
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* LITE PLAN */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-8 shadow-sm sm:p-9">
              <div>
                <span className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#1F1A2E]/60">
                  {PRICING_PLANS.lite.name}
                </span>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-serif text-4xl font-extrabold text-[#1F1A2E]">
                    ₹{PRICING_PLANS.lite.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-[#1F1A2E]/60">one-time</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#1F1A2E]/70 sm:text-sm">
                  {PRICING_PLANS.lite.tagline}
                </p>

                <div className="my-6 border-t border-[#EADDCF]" />

                <ul className="space-y-3.5 text-xs text-[#1F1A2E]/80 sm:text-sm">
                  {PRICING_PLANS.lite.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#0E9F8E]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={getConciergeWhatsAppUrl({ plan: "lite" })}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-[#EADDCF] bg-white py-3.5 text-xs font-semibold text-[#1F1A2E] shadow-sm transition hover:border-[#D6246E] hover:text-[#D6246E]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Choose Lite on WhatsApp</span>
              </a>
            </div>

            {/* PREMIUM PLAN (Featured) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-[#D6246E] bg-white p-8 shadow-xl sm:p-9">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#D6246E] px-4 py-1 font-cinzel text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                Most Popular
              </div>

              <div>
                <span className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#D6246E]">
                  {PRICING_PLANS.premium.name}
                </span>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-serif text-4xl font-extrabold text-[#1F1A2E]">
                    ₹{PRICING_PLANS.premium.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-[#1F1A2E]/60">one-time</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#1F1A2E]/70 sm:text-sm">
                  {PRICING_PLANS.premium.tagline}
                </p>

                <div className="my-6 border-t border-[#EADDCF]" />

                <ul className="space-y-3.5 text-xs text-[#1F1A2E]/85 sm:text-sm">
                  {PRICING_PLANS.premium.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#D6246E]" />
                      <span className="font-medium text-[#1F1A2E]">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={getConciergeWhatsAppUrl({ plan: "premium" })}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#D6246E] py-4 text-xs font-bold text-white shadow-md transition hover:bg-[#B81D5B]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Choose Premium on WhatsApp</span>
              </a>
            </div>

            {/* PLATINUM PLAN */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-8 shadow-sm sm:p-9">
              <div>
                <span className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#1F1A2E]/60">
                  {PRICING_PLANS.platinum.name}
                </span>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-serif text-4xl font-extrabold text-[#1F1A2E]">
                    ₹{PRICING_PLANS.platinum.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-[#1F1A2E]/60">one-time</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#1F1A2E]/70 sm:text-sm">
                  {PRICING_PLANS.platinum.tagline}
                </p>

                <div className="my-6 border-t border-[#EADDCF]" />

                <ul className="space-y-3.5 text-xs text-[#1F1A2E]/80 sm:text-sm">
                  {PRICING_PLANS.platinum.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#0E9F8E]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={getConciergeWhatsAppUrl({ plan: "platinum" })}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-[#EADDCF] bg-white py-3.5 text-xs font-semibold text-[#1F1A2E] shadow-sm transition hover:border-[#D6246E] hover:text-[#D6246E]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Choose Platinum on WhatsApp</span>
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-[#1F1A2E]/60">
            *All prices exclude 18% GST. Full payment upon your satisfaction before sharing.
          </p>
        </div>
      </section>

      {/* SECTION 8: FAQS */}
      <section id="questions" className="border-b border-[#EADDCF] py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#D6246E]">
              Frequently Asked Questions
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl lg:text-5xl">
              Questions families ask before sharing.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#1F1A2E]/70 sm:text-lg">
              Everything you need to know about our privacy, concierge setup, and pricing.
            </p>
          </div>

          <div className="mt-14 space-y-4">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group rounded-3xl border border-[#EADDCF] bg-white p-6 shadow-sm transition hover:border-[#D6246E]/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-lg font-bold text-[#1F1A2E] sm:text-xl">
                  <span>{faq.question}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-[#D6246E] transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-[#1F1A2E]/75 sm:text-base">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: FOR PHOTOGRAPHERS AND PLANNERS */}
      <section className="border-b border-[#EADDCF] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#EADDCF] bg-white p-8 shadow-sm sm:p-14">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF1F6] px-4 py-1 text-xs font-bold text-[#D6246E]">
                  <Camera className="h-4 w-4" />
                  <span>For Wedding Photographers &amp; Planners</span>
                </div>
                <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight text-[#1F1A2E] sm:text-3xl lg:text-4xl">
                  Offer luxury digital wedding suites to your couples.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#1F1A2E]/75 sm:text-base">
                  Deliver an end-to-end digital experience for your couples while unlocking partner
                  referral margins and co-branded portfolio credits.
                </p>

                <div className="mt-6 flex flex-wrap gap-5 text-xs font-semibold text-[#1F1A2E] sm:text-sm">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-[#0E9F8E]" /> Co-branded wedding links
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-[#0E9F8E]" /> Priority concierge turnaround
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-[#0E9F8E]" /> Generous partner commissions
                  </span>
                </div>
              </div>

              <div className="flex justify-start lg:col-span-4 lg:justify-end">
                <a
                  href={getConciergeWhatsAppUrl(
                    "Namaste Shadify Team, I am a wedding planner/photographer interested in partnering.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1F1A2E] px-7 py-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#D6246E]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Join Partner Network</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: FINAL CALL TO ACTION */}
      <section className="bg-[#1F1A2E] py-24 text-[#FAF7F2]">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="font-cinzel text-xs font-bold uppercase tracking-[0.25em] text-[#F5A524]">
            Start Your Celebration
          </span>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-[#FAF7F2] sm:text-5xl lg:text-6xl">
            Celebrate with Shadify.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#FAF7F2]/80 sm:text-lg sm:leading-8">
            Forward your wedding date and details on WhatsApp. Our concierge team will prepare your
            first polished preview in 24 hours.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={defaultWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D6246E] px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#B81D5B]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Message Concierge on WhatsApp</span>
            </a>
            <Link
              href="/priya-rahul"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-[#FAF7F2] backdrop-blur-sm transition hover:bg-white/10"
            >
              <span>Explore Priya &amp; Rahul&apos;s Wedding</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-8 text-xs font-medium text-[#FAF7F2]/60">
            One-time payment &bull; Included for 5 years per terms &bull; No credit card needed to
            preview
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#EADDCF] bg-[#FFFBF5] py-14 text-[#1F1A2E]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D6246E] font-serif text-sm font-bold text-white shadow-sm">
                S
              </div>
              <span className="font-serif text-lg font-bold text-[#1F1A2E]">Shadify</span>
              <span className="text-xs text-[#1F1A2E]/60">
                &mdash; Modern Royal Indian Weddings
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[#1F1A2E]/70">
              <Link href="/terms" className="transition hover:text-[#D6246E]">
                Terms of Service
              </Link>
              <Link href="/privacy" className="transition hover:text-[#D6246E]">
                Privacy Policy
              </Link>
              <Link href="/refunds" className="transition hover:text-[#D6246E]">
                Refund &amp; Postponement Policy
              </Link>
            </div>
          </div>

          <div className="mt-10 border-t border-[#EADDCF] pt-6 text-center text-xs text-[#1F1A2E]/60 sm:flex sm:justify-between sm:text-left">
            <p>
              &copy; {new Date().getFullYear()} {SITE_CONFIG.legalEntity}. All rights reserved.
            </p>
            <p className="mt-2 sm:mt-0">
              Zero contact harvesting &bull; Direct UPI &bull; Handcrafted with care for family
              privacy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
