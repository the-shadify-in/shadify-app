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
} from "lucide-react";

export const metadata = {
  title: "Shadify — Luxury Digital Wedding Invitations & RSVPs",
  description:
    "Stop answering 'what time is the mehendi?' Send one beautiful link with schedule, maps directions, RSVPs, and direct UPI shagun gifts. We set it up from WhatsApp.",
  openGraph: {
    title: "Shadify — Luxury Digital Wedding Invitations",
    description:
      "Your whole wedding in one link your family can open. Instant WhatsApp concierge setup, zero app downloads, 5-year hosting.",
    url: "https://shadify.in",
    siteName: "Shadify",
    locale: "en_IN",
    type: "website",
  },
};

const SAMPLE_WEDDINGS = [
  {
    id: "classic-red-gold",
    feeling: "Classic Red & Gold",
    description: "A North Indian celebration with a grand Sangeet and palatial Vivah.",
    slug: "priya-rahul",
    accentColor: "#941C2F",
    tagline: "Grand Royal Heritage",
  },
  {
    id: "heritage-green",
    feeling: "Heritage Green",
    description:
      "A serene destination weekend surrounded by nature, candlelight, and royal peacocks.",
    slug: "priya-rahul",
    accentColor: "#0D4D33",
    tagline: "Palatial & Serene",
  },
  {
    id: "soft-modern",
    feeling: "Soft & Modern",
    description:
      "A small, elegant ivory ceremony with minimalist typography and contemporary warmth.",
    slug: "priya-rahul",
    accentColor: "#7A5A40",
    tagline: "Minimalist Elegance",
  },
  {
    id: "sunset-sangeet",
    feeling: "Sunset Sangeet",
    description:
      "A vibrant beach-side celebration with festive terracotta, marigold, and dusk tones.",
    slug: "priya-rahul",
    accentColor: "#B8435A",
    tagline: "Festive Beachside Warmth",
  },
];

const FAQS = [
  {
    question: "Do my elders need to install anything?",
    answer:
      "No. Anyone who taps your link opens your wedding page immediately in their phone browser. There is no app to install, no account to create, and no password for grandparents to remember.",
  },
  {
    question: "Why not just send a PDF?",
    answer:
      "A PDF is static. It cannot count RSVPs, cannot launch 1-tap Google Maps navigation to the exact hall or gate, cannot accept direct UPI shagun, and cannot update if a muhurat timing or venue changes. Shadify gives your family an interactive luxury experience that stays current.",
  },
  {
    question: "Is our wedding information private?",
    answer:
      "Yes. Your wedding page is unindexed by search engines like Google and Bing. Only guests with your private link can view it. We never ask for, harvest, or sell your family contact lists.",
  },
  {
    question: "What if the date or venue changes?",
    answer:
      "Simply message our WhatsApp concierge. We update your schedule immediately, so all your guests see the latest details without you needing to re-send or reprint anything.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Once you send us your ceremony details, couple photos, and schedule on WhatsApp, our concierge team delivers your completed, polished page preview within 24 to 48 hours.",
  },
  {
    question: "How do gifts work?",
    answer:
      "Your page displays a direct UPI link, an interactive QR code, and your verified VPA. When guests send blessings, 100% of the funds go directly from their bank to yours. Shadify never touches, deducts, or holds your money.",
  },
];

export default function HomePage() {
  const defaultWhatsAppUrl = getConciergeWhatsAppUrl();

  return (
    <div className="min-h-screen bg-[#FFFBF5] font-sans text-[#1F1A2E] selection:bg-[#D6246E]/20 selection:text-[#1F1A2E]">
      {/* Top Banner */}
      <div className="border-b border-[#EADDCF] bg-[#FFF1F6] px-4 py-2 text-center text-xs font-medium tracking-wide text-[#1F1A2E]">
        <span>✨ Now onboarding for the upcoming wedding season.</span>{" "}
        <a
          href={defaultWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 font-semibold text-[#D6246E] underline decoration-[#D6246E]/40 underline-offset-2 hover:decoration-[#D6246E]"
        >
          Message Concierge on WhatsApp &rarr;
        </a>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 border-b border-[#EADDCF]/80 bg-[#FFFBF5]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D6246E] font-serif text-lg font-bold text-white shadow-sm">
              S
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#1F1A2E]">
                Shadify
              </span>
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-[#D6246E]">
                Luxury
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#1F1A2E]/80 md:flex">
            <a href="#how-it-works" className="transition hover:text-[#D6246E]">
              How it works
            </a>
            <a href="#samples" className="transition hover:text-[#D6246E]">
              Real weddings
            </a>
            <a href="#benefits" className="transition hover:text-[#D6246E]">
              What you get
            </a>
            <a href="#questions" className="transition hover:text-[#D6246E]">
              Questions
            </a>
            <a href="#pricing" className="transition hover:text-[#D6246E]">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/priya-rahul"
              className="hidden rounded-full border border-[#EADDCF] bg-white px-4 py-2 text-xs font-semibold text-[#1F1A2E] shadow-sm transition hover:border-[#D6246E] hover:text-[#D6246E] sm:inline-flex"
            >
              See Sample Wedding
            </Link>
            <a
              href={defaultWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#D6246E] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#B81D5B]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Start on WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden border-b border-[#EADDCF] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A524]/40 bg-[#FFF7E8] px-3.5 py-1 text-xs font-medium text-[#1F1A2E] shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#F5A524]" />
                <span>Luxury Digital Wedding Invitations</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3.5xl lg:text-5.5xl mt-5 font-serif font-extrabold leading-[1.15] tracking-tight text-[#1F1A2E] sm:text-5xl">
                Stop answering &ldquo;what time is the mehendi?&rdquo;{" "}
                <span className="block text-[#D6246E]">Send one link instead.</span>
              </h1>

              {/* Subline */}
              <p className="mt-6 text-base leading-relaxed text-[#1F1A2E]/80 sm:text-lg">
                Schedule, directions, RSVPs and gifts in one beautiful page. We set it up from your
                WhatsApp message. Your family opens it in one tap, with no app and no login.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <a
                  href={defaultWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#D6246E] px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#B81D5B]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Start on WhatsApp</span>
                </a>
                <Link
                  href="/priya-rahul"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADDCF] bg-white px-6 py-3.5 text-sm font-semibold text-[#1F1A2E] shadow-sm transition hover:border-[#D6246E] hover:text-[#D6246E]"
                >
                  <span>See a sample wedding</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Reassurance Chips */}
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#1F1A2E]/70">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#0E9F8E]" /> No app required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#0E9F8E]" /> Opens in 1 tap on any phone
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#0E9F8E]" /> Direct UPI gifts (0% fee)
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#0E9F8E]" /> Zero contact harvesting
                </span>
              </div>
            </div>

            {/* Visual: Real Phone Mockup Preview */}
            <div className="flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-[340px] rounded-[2.5rem] border-[8px] border-[#1F1A2E] bg-white p-3 shadow-2xl">
                {/* Speaker pill */}
                <div className="mx-auto mb-3 h-4 w-28 rounded-full bg-[#1F1A2E]" />

                {/* Simulated Screen */}
                <div className="overflow-hidden rounded-[1.8rem] border border-[#EADDCF] bg-[#0E0709] p-5 text-center text-[#F6EBDD]">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#C9933A]/40 bg-[#C9933A]/10 font-serif text-xs text-[#C9933A]">
                    PR
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-widest text-[#C9933A]">
                    Royal Invitation
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-bold tracking-tight text-[#FAF7F2]">
                    Priya &amp; Rahul
                  </h2>
                  <p className="mt-1 text-[11px] text-[#F6EBDD]/70">
                    Nov 28 &ndash; 30, 2026 &bull; Udaipur
                  </p>

                  {/* Envelope Seal Hook */}
                  <div className="mt-4 rounded-xl border border-[#C9933A]/30 bg-[#1A0A0F] p-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E6B865] via-[#C9933A] to-[#996515] font-serif font-bold text-[#1F0A0E] shadow-md">
                      P&amp;R
                    </div>
                    <p className="mt-2 font-serif text-xs text-[#FAF7F2]">
                      Wax-Seal Envelope Reveal
                    </p>
                    <p className="text-[10px] text-[#F6EBDD]/60">
                      Tap below to experience the live guest journey
                    </p>
                  </div>

                  {/* Live Demo Button inside mockup */}
                  <Link
                    href="/priya-rahul"
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#C9933A] py-2.5 text-xs font-semibold text-[#1A0A0F] transition hover:bg-[#DBA84E]"
                  >
                    <span>Open Live Wedding Demo</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-[#F6EBDD]/50">
                    <span>3 Ceremonies</span>
                    <span>Direct UPI</span>
                    <span>1-Tap Maps</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SOUND FAMILIAR? */}
      <section className="border-b border-[#EADDCF] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D6246E]">
              The Reality of Indian Wedding Planning
            </span>
            <h2 className="text-2.5xl sm:text-3.5xl mt-2 font-serif font-bold tracking-tight text-[#1F1A2E]">
              Wedding planning is hard enough. Chasing information shouldn&apos;t be.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#EADDCF] bg-[#FFFBF5] p-6 text-left shadow-sm">
              <span className="font-serif text-2xl text-[#D6246E]">&ldquo;</span>
              <p className="text-sm font-medium leading-relaxed text-[#1F1A2E]">
                Twelve forwards and three PDFs, and nobody knows the venue address.
              </p>
            </div>
            <div className="rounded-2xl border border-[#EADDCF] bg-[#FFFBF5] p-6 text-left shadow-sm">
              <span className="font-serif text-2xl text-[#D6246E]">&ldquo;</span>
              <p className="text-sm font-medium leading-relaxed text-[#1F1A2E]">
                Chasing 300 replies on WhatsApp for the caterer&apos;s headcount.
              </p>
            </div>
            <div className="rounded-2xl border border-[#EADDCF] bg-[#FFFBF5] p-6 text-left shadow-sm">
              <span className="font-serif text-2xl text-[#D6246E]">&ldquo;</span>
              <p className="text-sm font-medium leading-relaxed text-[#1F1A2E]">
                An uncle calling at 7 AM because he can&apos;t find the muhurat time.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="font-serif text-xl font-bold text-[#D6246E] sm:text-2xl">
              One link replaces all of it.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section id="how-it-works" className="border-b border-[#EADDCF] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D6246E]">
              Simple 3-Step Setup
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl">
              You share the details. We do the work.
            </h2>
            <p className="mt-3 text-base text-[#1F1A2E]/70">
              No complicated builders or design software. Our dedicated concierge handles everything
              from formatting to polish.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-[#EADDCF] bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF1F6] text-[#D6246E]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold text-[#1F1A2E]">
                1. Send details on WhatsApp
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1F1A2E]/75">
                Forward your invitation card, schedule, venue addresses, and couple photo directly
                to our concierge. Voice notes are welcome.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-[#EADDCF] bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7E8] text-[#F5A524]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold text-[#1F1A2E]">
                2. We build and polish your page
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1F1A2E]/75">
                We craft your page with your family colours, names in your native script
                (Devanagari, Gujarati, etc.), and custom monogram within 24 hours.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-[#EADDCF] bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6F8F5] text-[#0E9F8E]">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold text-[#1F1A2E]">
                3. Share one link with family
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1F1A2E]/75">
                Send your private link in WhatsApp family groups. Relatives open it in one tap, view
                the ceremonies, get directions, and RSVP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: REAL SAMPLE WEDDINGS (Replaces themes) */}
      <section id="samples" className="border-b border-[#EADDCF] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D6246E]">
              Craftsmanship &amp; Aesthetic
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl">
              See real weddings, not templates.
            </h2>
            <p className="mt-3 text-base text-[#1F1A2E]/70">
              Every celebration has its own character. Explore finished celebrations as your guests
              would see them on their phones.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_WEDDINGS.map((sample) => (
              <div
                key={sample.id}
                className="group flex flex-col justify-between rounded-2xl border border-[#EADDCF] bg-[#FFFBF5] p-6 shadow-sm transition hover:border-[#D6246E] hover:shadow-md"
              >
                <div>
                  <div
                    className="mb-4 h-2 w-10 rounded-full"
                    style={{ backgroundColor: sample.accentColor }}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1F1A2E]/60">
                    {sample.tagline}
                  </span>
                  <h3 className="mt-1 font-serif text-xl font-bold text-[#1F1A2E]">
                    {sample.feeling}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#1F1A2E]/75">
                    {sample.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#EADDCF] pt-4">
                  <Link
                    href={`/${sample.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D6246E] transition group-hover:translate-x-1"
                  >
                    <span>Open live demo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-[#EADDCF] bg-[#FFFBF5] p-5 text-center">
            <p className="text-sm font-medium text-[#1F1A2E]">
              &ldquo;Your colours, your names in your own script, and your family monogram. Tell us
              the feeling and we&apos;ll match it.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: WHAT YOUR GUESTS GET */}
      <section id="benefits" className="border-b border-[#EADDCF] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#D6246E]">
                Guest Experience
              </span>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl">
                Designed with your elders in mind.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#1F1A2E]/75">
                Technology should bring families together, not create tech support calls on your
                wedding morning. Every detail is optimized for effortless access.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E9F8E]/10 text-[#0E9F8E]">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F1A2E]">
                      Open it from WhatsApp. No app, no login.
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/70">
                      Zero app downloads, zero registrations, and no passwords for anyone to
                      remember.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E9F8E]/10 text-[#0E9F8E]">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F1A2E]">
                      Every ceremony, time and dress code in one place.
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/70">
                      Sangeet, Mehendi, Haldi, and Reception schedules organized chronologically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E9F8E]/10 text-[#0E9F8E]">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F1A2E]">
                      Directions in one tap with Google Maps.
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/70">
                      Takes guests directly to the correct venue gate and parking area.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E9F8E]/10 text-[#0E9F8E]">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F1A2E]">
                      Reply for each event in under a minute.
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/70">
                      Guests submit headcounts and dietary preferences without confusion.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E9F8E]/10 text-[#0E9F8E]">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F1A2E]">
                      Big, clear text that grandparents can read.
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/70">
                      High-contrast typography, large touch targets, and comfortable sizing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Callout */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-[#EADDCF] bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#EADDCF] pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1F6] text-[#D6246E]">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1F1A2E]">
                      Elders-First Guarantee
                    </h3>
                    <p className="text-xs text-[#1F1A2E]/60">Tested across real Indian families</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[#1F1A2E]/80">
                  We specifically test our mobile pages on both high-end phones and budget Android
                  devices commonly used by extended family members, ensuring quick loading even on
                  spotty wedding banquet Wi-Fi.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-[#FFFBF5] p-4 text-center">
                  <div>
                    <div className="font-serif text-2xl font-bold text-[#D6246E]">0</div>
                    <div className="text-xs text-[#1F1A2E]/70">Apps to install</div>
                  </div>
                  <div>
                    <div className="font-serif text-2xl font-bold text-[#0E9F8E]">1 Tap</div>
                    <div className="text-xs text-[#1F1A2E]/70">To open from WhatsApp</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: WHAT YOU GET */}
      <section className="border-b border-[#EADDCF] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D6246E]">
              Peace of Mind for Hosts
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl">
              What you get as the organizing family.
            </h2>
            <p className="mt-3 text-base text-[#1F1A2E]/70">
              Clear counts, caterer exports, and zero stress chasing relatives.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#EADDCF] bg-[#FFFBF5] p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF1F6] text-[#D6246E]">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-base font-bold text-[#1F1A2E]">
                RSVPs counted for you
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#1F1A2E]/75">
                Automatically tallied, split by event (Sangeet, Vivah, Reception) and meal
                preference.
              </p>
            </div>

            <div className="rounded-2xl border border-[#EADDCF] bg-[#FFFBF5] p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7E8] text-[#F5A524]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-base font-bold text-[#1F1A2E]">
                One file for the caterer
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#1F1A2E]/75">
                Clean numbers for Jain, vegetarian, and non-veg diets ready for your catering team.
              </p>
            </div>

            <div className="rounded-2xl border border-[#EADDCF] bg-[#FFFBF5] p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E6F8F5] text-[#0E9F8E]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-base font-bold text-[#1F1A2E]">
                Changes via WhatsApp
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#1F1A2E]/75">
                Need to shift a ceremony time or hall? Send us a quick message and your page updates
                immediately.
              </p>
            </div>

            <div className="rounded-2xl border border-[#EADDCF] bg-[#FFFBF5] p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EEFB] text-[#3D3BC4]">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-base font-bold text-[#1F1A2E]">
                Gifts directly to your UPI
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#1F1A2E]/75">
                Shagun arrives straight in your own bank account via QR code or VPA with 0% platform
                fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: QUESTIONS COUPLES ASK */}
      <section id="questions" className="border-b border-[#EADDCF] py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D6246E]">
              Frequently Asked Questions
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl">
              Questions couples ask before sharing.
            </h2>
            <p className="mt-3 text-base text-[#1F1A2E]/70">
              Clear answers to the most common questions from families.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-[#EADDCF] bg-white p-6 shadow-sm transition hover:border-[#D6246E]/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-base font-bold text-[#1F1A2E] sm:text-lg">
                  <span>{faq.question}</span>
                  <ChevronDown className="h-5 w-5 text-[#D6246E] transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#1F1A2E]/75">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: PRICING */}
      <section id="pricing" className="border-b border-[#EADDCF] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D6246E]">
              Transparent Pricing
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1F1A2E] sm:text-4xl">
              One simple price. No monthly fees.
            </h2>
            <p className="mt-3 text-base text-[#1F1A2E]/70">
              All plans include guaranteed 5-year web hosting so your wedding memories stay live and
              shareable.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {/* LITE PLAN */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-8 shadow-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1F1A2E]/60">
                  {PRICING_PLANS.lite.name}
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-extrabold text-[#1F1A2E]">
                    ₹{PRICING_PLANS.lite.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-[#1F1A2E]/60">one-time</span>
                </div>
                <p className="mt-3 text-xs text-[#1F1A2E]/70">{PRICING_PLANS.lite.tagline}</p>

                <div className="my-6 border-t border-[#EADDCF]" />

                <ul className="space-y-3 text-xs text-[#1F1A2E]/80">
                  {PRICING_PLANS.lite.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
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
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-[#EADDCF] bg-white py-3 text-xs font-semibold text-[#1F1A2E] transition hover:border-[#D6246E] hover:text-[#D6246E]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Choose Lite on WhatsApp</span>
              </a>
            </div>

            {/* PREMIUM PLAN (Featured) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-[#D6246E] bg-white p-8 shadow-xl">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#D6246E] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#D6246E]">
                  {PRICING_PLANS.premium.name}
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-extrabold text-[#1F1A2E]">
                    ₹{PRICING_PLANS.premium.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-[#1F1A2E]/60">one-time</span>
                </div>
                <p className="mt-3 text-xs text-[#1F1A2E]/70">{PRICING_PLANS.premium.tagline}</p>

                <div className="my-6 border-t border-[#EADDCF]" />

                <ul className="space-y-3 text-xs text-[#1F1A2E]/80">
                  {PRICING_PLANS.premium.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
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
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#D6246E] py-3.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#B81D5B]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Choose Premium on WhatsApp</span>
              </a>
            </div>

            {/* PLATINUM PLAN */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#EADDCF] bg-[#FFFBF5] p-8 shadow-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1F1A2E]/60">
                  {PRICING_PLANS.platinum.name}
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-extrabold text-[#1F1A2E]">
                    ₹{PRICING_PLANS.platinum.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-[#1F1A2E]/60">one-time</span>
                </div>
                <p className="mt-3 text-xs text-[#1F1A2E]/70">{PRICING_PLANS.platinum.tagline}</p>

                <div className="my-6 border-t border-[#EADDCF]" />

                <ul className="space-y-3 text-xs text-[#1F1A2E]/80">
                  {PRICING_PLANS.platinum.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
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
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-[#EADDCF] bg-white py-3 text-xs font-semibold text-[#1F1A2E] transition hover:border-[#D6246E] hover:text-[#D6246E]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Choose Platinum on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: FOR PHOTOGRAPHERS AND PLANNERS */}
      <section className="border-b border-[#EADDCF] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#EADDCF] bg-white p-8 shadow-sm sm:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF1F6] px-3.5 py-1 text-xs font-semibold text-[#D6246E]">
                  <Camera className="h-3.5 w-3.5" />
                  <span>For Wedding Photographers &amp; Planners</span>
                </div>
                <h2 className="text-2.5xl mt-3 font-serif font-bold tracking-tight text-[#1F1A2E] sm:text-3xl">
                  Offer luxury digital invitations to your wedding couples.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#1F1A2E]/75">
                  Deliver an end-to-end digital experience for your couples while unlocking partner
                  referral earnings and co-branded portfolio credits.
                </p>

                <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-[#1F1A2E]">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#0E9F8E]" /> Co-branded invitations
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#0E9F8E]" /> Dedicated concierge line
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#0E9F8E]" /> Attractive partner margins
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
                  className="inline-flex items-center gap-2 rounded-full bg-[#1F1A2E] px-6 py-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#D6246E]"
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
      <section className="bg-[#1F1A2E] py-20 text-[#FAF7F2]">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#F5A524]">
            Start Your Invitation Today
          </span>
          <h2 className="sm:text-4.5xl mt-3 font-serif text-3xl font-bold tracking-tight text-[#FAF7F2]">
            Stop answering &ldquo;what time is the sangeet?&rdquo;
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#FAF7F2]/80">
            Send us your wedding date and details on WhatsApp. Our concierge will prepare your first
            preview in 24 hours.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
            <a
              href={defaultWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D6246E] px-8 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#B81D5B]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Message Concierge on WhatsApp</span>
            </a>
            <Link
              href="/priya-rahul"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-sm font-semibold text-[#FAF7F2] backdrop-blur-sm transition hover:bg-white/10"
            >
              <span>Explore Priya &amp; Rahul&apos;s Wedding</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-6 text-xs text-[#FAF7F2]/60">
            One-time payment &bull; 5-year hosting &bull; No credit card needed to preview
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#EADDCF] bg-[#FFFBF5] py-12 text-[#1F1A2E]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#D6246E] font-serif text-sm font-bold text-white">
                S
              </div>
              <span className="font-serif text-base font-bold text-[#1F1A2E]">Shadify</span>
              <span className="text-xs text-[#1F1A2E]/60">&mdash; Modern Indian Weddings</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#1F1A2E]/70">
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

          <div className="mt-8 border-t border-[#EADDCF] pt-6 text-center text-xs text-[#1F1A2E]/60 sm:flex sm:justify-between sm:text-left">
            <p>
              &copy; {new Date().getFullYear()} {SITE_CONFIG.legalEntity}. All rights reserved.
            </p>
            <p className="mt-2 sm:mt-0">
              Zero contact harvesting &bull; Direct UPI &bull; Built with respect for family
              privacy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
