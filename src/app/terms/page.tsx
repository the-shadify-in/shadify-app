import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, HardDrive, HeartHandshake } from "lucide-react";
import { SITE_CONFIG, getConciergeWhatsAppUrl } from "@/lib/config/contact";

export const metadata = {
  title: "Terms of Service | Shadify",
  description:
    "Statutory terms of service governing Shadify wedding websites, 5-year hosting window, 90-day master archive retention, and media ownership.",
};

export default function TermsPage() {
  const whatsappUrl = getConciergeWhatsAppUrl(
    "Hi Shadify Team, I have a question regarding the Terms of Service.",
  );

  return (
    <div className="min-h-screen bg-[#070305] font-sans text-[#FAF7F2] selection:bg-[#C9933A]/30">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0C0609]/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-[#FAF7F2]/70 transition hover:text-[#C9933A]"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Shadify Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-light text-[#FAF7F2]">Shadify</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9933A]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl space-y-12 px-6 py-16">
        {/* Title */}
        <div className="space-y-3 border-b border-white/10 pb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C9933A]">
            Legal & Customer Agreement
          </span>
          <h1 className="font-serif text-3xl font-light text-[#FAF7F2] sm:text-5xl">
            Terms of Service
          </h1>
          <p className="text-xs text-[#FAF7F2]/50">
            Last updated: October 2026 • Effective for all active Shadify weddings
          </p>
        </div>

        {/* Highlight Callouts */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-[#12070A] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
              <Clock className="h-4 w-4" />
              5-Year Web Hosting Included
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#FAF7F2]/70">
              Every purchased wedding website remains active and accessible on its direct slug or
              custom domain for 5 full years from activation date.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12070A] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
              <HardDrive className="h-4 w-4" />
              90-Day RAW Storage Lifecycle
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#FAF7F2]/70">
              Master uncompressed RAW photo originals are retained for 90 days post-wedding for
              full-resolution downloads; web-optimized previews remain live for 5 years.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">1. Parties & Scope of Agreement</h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            This Customer Service Agreement (&quot;Agreement&quot;) is entered into between{" "}
            <strong>{SITE_CONFIG.legalEntity}</strong> (&quot;Shadify&quot;, &quot;we&quot;,
            &quot;us&quot;) and the couple or client purchasing an invitation plan
            (&quot;Client&quot;, &quot;you&quot;). By subscribing to a Shadify wedding plan (Lite,
            Premium, or Platinum) or accessing the concierge admin portal, you agree to these terms.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            2. 5-Year Web Hosting Term & Expiration
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Shadify plans are one-time investments with no recurring annual subscription fees during
            the term. Your wedding website is provisioned for five (5) consecutive years starting on
            your activation date. Upon expiration of the 5-year hosting window:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 text-xs text-[#FAF7F2]/70">
            <li>
              The public website gracefully switches to a dignified &quot;Celebration
              Concluded&quot; memorial page.
            </li>
            <li>
              Clients will receive notice at least 60 days prior to expiration with the option to
              renew long-term hosting or download a static offline HTML/media archive.
            </li>
            <li>
              No client data is deleted without prior written notice to the registered couple email.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            3. Photography & Storage Policy (90-Day RAW Lifecycle)
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            To ensure zero storage surcharges and unlimited high-speed viewing for your guests,
            Shadify operates a dual-tier Cloudflare R2 storage architecture:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 text-xs text-[#FAF7F2]/70">
            <li>
              <strong>Web-Optimized Previews (5 Years)</strong>: Previews, compressed lightboxes,
              and invitation graphics are hosted for the full 5-year hosting term without egress
              charges.
            </li>
            <li>
              <strong>Master Uncompressed Files (90 Days)</strong>: Original high-resolution
              photographs uploaded by couples or guest photographers are preserved in pristine
              quality for ninety (90) days following the main wedding date.
            </li>
            <li>
              After 90 days, automated lifecycle rules purge master RAW binaries while web-optimized
              gallery viewing remains live. Clients are encouraged to download their master photo
              zip archive within this 90-day window.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            4. Content Rights, Copyright & Display License
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Intellectual property ownership in uploaded photographs, videos, and creative works
            remains with the respective copyright holders (the couple, family members, or contracted
            professional wedding photographers in accordance with your individual photography
            service contracts).
          </p>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            By uploading media, you represent and warrant that you hold all necessary licenses,
            permissions, or author authorizations to publish such content. You grant Shadify a
            limited, non-exclusive, royalty-free license solely to process, compress, host, and
            display the media to invited guests on your celebration website during your hosting
            term. Shadify will never sell, sublicense, or use your private celebration media for
            commercial promotional campaigns without your express, written opt-in consent.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            5. Zero-Commission UPI Shagun Facilitation
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Shadify facilitates peer-to-peer monetary gifting (&quot;Shagun&quot;) by rendering
            native UPI intent QR codes mapped to your personal or family VPA (e.g.{" "}
            <code>couple@okbank</code>).
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 text-xs text-[#FAF7F2]/70">
            <li>
              <strong>0% Platform Commission</strong>: Shadify does not touch, hold, escrow, or
              deduct commission from Shagun gifts. 100% of the funds transfer directly from the
              guest&apos;s banking app to your linked bank account.
            </li>
            <li>
              <strong>No Stored Value</strong>: Shadify does not operate a wallet, prepaid
              instrument, or stored-value facility. All transactions occur under National Payments
              Corporation of India (NPCI) guidelines.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            6. Wedding Postponements & Date Changes
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            We understand that wedding logistics, mahurats, and family circumstances can change. If
            your wedding celebration is postponed:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 text-xs text-[#FAF7F2]/70">
            <li>
              You may update your wedding date, ceremony itinerary, venue address, and dress codes{" "}
              <strong>free of charge</strong> within twelve (12) months of your original date.
            </li>
            <li>
              Your 5-year hosting term will automatically adjust to commence from your newly
              rescheduled celebration date.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            7. Governing Law & Dispute Resolution
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            This Agreement is governed by the laws of India. Any disputes arising out of or in
            connection with these Terms shall be subject to the exclusive jurisdiction of the
            competent courts in Bengaluru, Karnataka.
          </p>
        </section>

        {/* Contact Footer */}
        <div className="space-y-3 rounded-2xl border border-[#C9933A]/30 bg-[#12070A] p-6 text-xs text-[#FAF7F2]/80">
          <div className="flex items-center gap-2 font-serif text-base text-[#FAF7F2]">
            <HeartHandshake className="h-5 w-5 text-[#C9933A]" />
            Questions regarding these Terms?
          </div>
          <p className="text-[#FAF7F2]/60">
            Our concierge desk is ready to clarify any clause or assist with custom enterprise
            agreements for destination wedding planners.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-[#C9933A] hover:underline"
            >
              WhatsApp Concierge: {SITE_CONFIG.whatsappDisplay}
            </a>
            <span className="text-white/20">•</span>
            <a
              href={`mailto:${SITE_CONFIG.supportEmail}`}
              className="text-[#FAF7F2]/70 hover:underline"
            >
              {SITE_CONFIG.supportEmail}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
