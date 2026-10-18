import React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, HelpCircle } from "lucide-react";
import { SITE_CONFIG, getConciergeWhatsAppUrl } from "@/lib/config/contact";

export const metadata = {
  title: "Cancellation & Refund Policy | Shadify",
  description:
    "Refund, cancellation, and free postponement policy for Shadify digital wedding websites.",
};

export default function RefundsPage() {
  const whatsappUrl = getConciergeWhatsAppUrl(
    "Hi Shadify Team, I have an inquiry regarding cancellation, refunds, or rescheduling my wedding date.",
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
            Consumer Protection & Transparency
          </span>
          <h1 className="font-serif text-3xl font-light text-[#FAF7F2] sm:text-5xl">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-[#FAF7F2]/50">
            Last updated: October 2026 • Clear rules before and after onboarding
          </p>
        </div>

        {/* Free Postponement Banner */}
        <div className="space-y-3 rounded-3xl border border-[#C9933A]/30 bg-[#12070A] p-8 shadow-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
            <CalendarCheck className="h-5 w-5" />
            Postponing Your Wedding? It&apos;s 100% Free.
          </div>
          <h2 className="font-serif text-2xl text-[#FAF7F2]">
            Never cancel when you can simply reschedule.
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/75">
            Weddings are complex, and dates often shift due to venue availability, family
            considerations, or auspicious timings. We allow you to reschedule your wedding date,
            ceremony itineraries, and venue locations <strong>completely free of charge</strong> for
            up to twelve (12) months from your original date. Your 5-year hosting window adjusts to
            commence from your newly rescheduled date.
          </p>
        </div>

        {/* Section 1: Refund Stages */}
        <section className="space-y-6">
          <h2 className="font-serif text-xl text-[#FAF7F2]">
            1. Cancellation & Cooling-Off Windows
          </h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Because Shadify delivers bespoke digital assets with human concierge design labor, our
            refund policy is structured across clear operational phases:
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Phase 1 */}
            <div className="space-y-2 rounded-2xl border border-emerald-500/20 bg-[#0E1712] p-5">
              <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                100% Full Refund
              </span>
              <h3 className="font-serif text-base text-[#FAF7F2]">Within 48 Hours</h3>
              <p className="text-[11px] leading-relaxed text-[#FAF7F2]/70">
                Cancel within 48 hours of purchase, provided our concierge team has not yet
                delivered your custom preview link.
              </p>
            </div>

            {/* Phase 2 */}
            <div className="space-y-2 rounded-2xl border border-amber-500/20 bg-[#17120E] p-5">
              <span className="inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                50% Partial Refund
              </span>
              <h3 className="font-serif text-base text-[#FAF7F2]">Preview Delivered</h3>
              <p className="text-[11px] leading-relaxed text-[#FAF7F2]/70">
                If our design team has generated and delivered your personalized preview, a 50%
                refund is available prior to public launch.
              </p>
            </div>

            {/* Phase 3 */}
            <div className="space-y-2 rounded-2xl border border-white/5 bg-[#140A0D] p-5">
              <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#FAF7F2]/60">
                Non-Refundable
              </span>
              <h3 className="font-serif text-base text-[#FAF7F2]">Site Published</h3>
              <p className="text-[11px] leading-relaxed text-[#FAF7F2]/70">
                Once your site is published, live invites are dispatched to guests, or custom
                domains are bound, the service is fully rendered.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Non-Refundable Items */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">2. Non-Refundable Third-Party Costs</h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Certain specialized additions involve irreversible third-party registration costs that
            cannot be refunded once initiated:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 text-xs text-[#FAF7F2]/70">
            <li>
              <strong>Custom Domain Registrations</strong> (e.g. <code>.wedding</code>,{" "}
              <code>.com</code>, <code>.in</code>): Domain names are registered with external ICANN
              registrars in the couple&apos;s name and cannot be cancelled or refunded once
              acquired.
            </li>
            <li>
              <strong>Completed Add-Ons:</strong> Physical QR invitation print kits or video editing
              services once completed by our production team.
            </li>
          </ul>
        </section>

        {/* Section 3: Processing */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-[#FAF7F2]">3. Refund Processing Timelines</h2>
          <p className="text-xs leading-relaxed text-[#FAF7F2]/70">
            Approved refund requests are processed immediately by our accounts team. Funds will be
            credited back to the original payment source (UPI ID, Net Banking, or Credit/Debit Card)
            within <strong>5 to 7 business days</strong>, subject to your issuing bank&apos;s
            clearance cycles.
          </p>
        </section>

        {/* Contact Footer */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#12070A] p-6 text-xs text-[#FAF7F2]/80">
          <div className="flex items-center gap-2 font-serif text-base text-[#FAF7F2]">
            <HelpCircle className="h-5 w-5 text-[#C9933A]" />
            Requesting a Refund or Schedule Update
          </div>
          <p className="text-[#FAF7F2]/60">
            To request a cancellation or change your celebration date, message our concierge desk
            with your registered mobile number and wedding slug.
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
