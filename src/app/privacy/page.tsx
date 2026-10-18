import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { getConciergeWhatsAppUrl } from "@/lib/config/contact";

export const metadata = {
  title: "Privacy Policy | Shadify",
  description:
    "Privacy policy and zero contact-harvesting commitment for Shadify wedding websites, aligned with the DPDP Act 2023.",
};

export default function PrivacyPage() {
  const whatsappUrl = getConciergeWhatsAppUrl(
    "Hi Shadify Privacy Team, I have an inquiry regarding data privacy or an erasure request.",
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
            Privacy & Trust Charter
          </span>
          <h1 className="font-serif text-3xl font-light text-[#FAF7F2] sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#FAF7F2]/50">
            Last updated: October 2026 • Aligned with the Digital Personal Data Protection (DPDP)
            Act, 2023
          </p>
        </div>

        {/* The Core Commitment */}
        <div className="space-y-4 rounded-3xl border border-[#C9933A]/30 bg-[#12070A] p-8 shadow-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
            <ShieldCheck className="h-5 w-5" />
            Zero Contact-Harvesting Guarantee
          </div>
          <h2 className="font-serif text-2xl text-[#FAF7F2]">
            We never upload, scan, or store your phone&apos;s address book.
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/75">
            Unlike mass invitation portals that demand access to your entire contact list, Shadify
            uses a <strong>client-side WhatsApp dispatch studio</strong>. When you send invites,
            your browser simply generates a native <code>https://wa.me</code> link. You share
            directly from your own WhatsApp. Your contacts remain on your device and are never
            transmitted to our servers.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">1. Information We Collect</h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            We limit data collection strictly to what is necessary to render your wedding
            celebration website:
          </p>

          <div className="space-y-3 text-xs text-[#FAF7F2]/70">
            <div className="rounded-xl border border-white/5 bg-[#140A0D] p-4">
              <strong className="text-[#FAF7F2]">Couple & Host Information:</strong> Names of the
              bride, groom, and key family members, wedding date, ceremony venue details, contact
              phone number, email address, and optional UPI VPA for receiving Shagun.
            </div>

            <div className="rounded-xl border border-white/5 bg-[#140A0D] p-4">
              <strong className="text-[#FAF7F2]">Guest Voluntary Submissions (RSVP):</strong> When a
              guest responds to an invitation, they voluntarily provide their name, attendance
              status, party headcount, meal preference (e.g. Vegetarian, Jain), accommodation
              requirements, and optional blessings.
            </div>

            <div className="rounded-xl border border-white/5 bg-[#140A0D] p-4">
              <strong className="text-[#FAF7F2]">Photographs & Media:</strong> Images and portrait
              video clips uploaded by the couple or authorized guest photographers for inclusion in
              the gallery lightbox.
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            2. Zero Third-Party Trackers on Wedding Websites
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Your wedding celebration is an intimate family milestone. We uphold strict architectural
            boundaries on guest pages:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 text-xs text-[#FAF7F2]/70">
            <li>
              <strong>No Meta, Google, or Advertising Pixels</strong> are embedded on couple
              websites (<code>/[slug]</code>).
            </li>
            <li>
              <strong>No Session Replay Software</strong> (e.g. Hotjar or Clarity) that records
              screen activity or form keystrokes.
            </li>
            <li>
              We utilize only first-party aggregate counters (e.g. total page views, RSVP counts)
              with no guest profiling or cross-site tracking.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            3. Ephemeral Server Logging & Retention
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Server logs are captured solely for operational diagnostics and detecting server errors:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 text-xs text-[#FAF7F2]/70">
            <li>
              <strong>Strict Redaction:</strong> Guest phone numbers, names, UPI IDs, passwords, and
              preview tokens are automatically scrubbed by our JSON logger prior to recording.
            </li>
            <li>
              <strong>14 to 30 Day Retention:</strong> Diagnostic application logs are permanently
              deleted after 14 to 30 days.
            </li>
            <li>
              <strong>No IP Storage:</strong> Raw IP addresses are never recorded in long-term
              application log drains.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            4. Data Security & Storage Architecture
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Your data is stored within encrypted cloud facilities complying with ISO 27001 and SOC 2
            standards. Relational wedding records reside in secure PostgreSQL databases with strict
            multi-tenant isolation. Photography media is stored within Cloudflare R2 object storage
            with automated 90-day lifecycle expiration for master RAW files.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">5. Your Rights Under DPDP Act 2023</h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Under India&apos;s Digital Personal Data Protection Act, 2023, you hold the following
            rights:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 text-xs text-[#FAF7F2]/70">
            <li>
              <strong>Right to Access & Summary:</strong> Request an export of all RSVP responses,
              guestbook blessings, and photographs associated with your celebration.
            </li>
            <li>
              <strong>Right to Correction:</strong> Update or rectify any misattributed ceremony
              details, VIP entries, or guest responses.
            </li>
            <li>
              <strong>Right to Erasure (Forget Me):</strong> Request the permanent, irreversible
              deletion of your wedding website, RSVP database, and Cloudflare R2 media files across
              our systems.
            </li>
          </ul>
        </section>

        {/* Erasure Runbook Contact */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#12070A] p-6 text-xs text-[#FAF7F2]/80">
          <div className="flex items-center gap-2 font-serif text-base text-[#FAF7F2]">
            <Lock className="h-5 w-5 text-[#C9933A]" />
            Exercising Your Privacy Rights
          </div>
          <p className="text-[#FAF7F2]/60">
            To submit a data access or permanent erasure request, write to our Data Protection Desk.
            Requests are verified via your registered mobile number and processed within statutory
            timelines (maximum 30 days).
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href={`mailto:privacy@shadify.in`}
              className="font-mono text-[#C9933A] hover:underline"
            >
              privacy@shadify.in
            </a>
            <span className="text-white/20">•</span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FAF7F2]/70 hover:underline"
            >
              WhatsApp Data Concierge
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
