"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";

export default function DataRequestClient() {
  const [requestType, setRequestType] = useState<"access_summary" | "correction" | "erasure">(
    "access_summary",
  );
  const [requesterName, setRequesterName] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [weddingSlug, setWeddingSlug] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      // Clean up wedding slug if full URL was pasted
      let slug = weddingSlug.trim();
      if (slug.includes("shadify.in/")) {
        slug = slug.split("shadify.in/")[1]?.split("/")[0] || slug;
      }

      const res = await fetch("/api/privacy/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          requesterName: requesterName.trim(),
          requesterPhone: requesterPhone.trim(),
          requesterEmail: requesterEmail.trim() || undefined,
          weddingSlug: slug,
          details: details.trim(),
        }),
      });

      const data = (await res.json()) as { ticketId?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit privacy request");
      }

      if (data.ticketId) {
        setTicketId(data.ticketId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070305] font-sans text-[#FAF7F2] selection:bg-[#C9933A]/30">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0C0609]/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/privacy"
            className="flex items-center gap-2 text-xs font-medium text-[#FAF7F2]/70 transition hover:text-[#C9933A]"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Privacy Policy
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-light text-[#FAF7F2]">Shadify</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9933A]" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 space-y-2 border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
            <ShieldCheck className="h-4 w-4" />
            DPDP Act 2023 Compliance Portal
          </div>
          <h1 className="font-serif text-3xl font-light text-white sm:text-4xl">
            Data Subject Rights Request
          </h1>
          <p className="text-xs text-[#FAF7F2]/60">
            Submit a formal request to access, correct, or permanently erase your personal data held
            by Shadify under India&apos;s Digital Personal Data Protection Act.
          </p>
        </div>

        {ticketId ? (
          <div className="space-y-6 rounded-3xl border border-emerald-500/30 bg-[#12070A] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-light text-white">
                Request Registered Successfully
              </h2>
              <p className="text-xs text-stone-400">
                Your request has been logged in our immutable compliance register.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C9933A]">
                Reference Tracking ID
              </span>
              <p className="mt-1 font-mono text-xl font-bold tracking-wider text-white">
                {ticketId}
              </p>
            </div>
            <p className="text-xs text-[#FAF7F2]/70">
              Our Data Protection Desk will contact you on your registered phone number (
              <span className="font-mono text-white">{requesterPhone}</span>) for verification.
              Statutory processing timeline is within 30 days.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-block rounded-lg bg-[#C9933A] px-6 py-2.5 text-xs font-semibold text-[#090406] hover:bg-[#D4AF37]"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-[#C9933A]/20 bg-[#12070A] p-6 shadow-xl sm:p-8"
          >
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Request Type */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
                1. Nature of Request
              </label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  {
                    type: "access_summary",
                    title: "Access Summary",
                    desc: "Summary of personal data processed",
                  },
                  {
                    type: "correction",
                    title: "Correction / Update",
                    desc: "Rectify inaccurate information",
                  },
                  {
                    type: "erasure",
                    title: "Permanent Erasure",
                    desc: "Permanent purge under DPDP Act",
                  },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() =>
                      setRequestType(item.type as "access_summary" | "correction" | "erasure")
                    }
                    className={`rounded-xl border p-3.5 text-left transition ${
                      requestType === item.type
                        ? "border-[#C9933A] bg-[#1A0A00] ring-1 ring-[#C9933A]"
                        : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <span className="block text-xs font-medium text-white">{item.title}</span>
                    <span className="mt-1 block text-[10px] text-stone-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Requester Identity */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
                2. Requester Information
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-[#E2D5C7]/70">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="e.g. Senthil Kumar"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#E2D5C7]/70">
                    Mobile Phone (Used for Verification)
                  </label>
                  <input
                    type="tel"
                    required
                    value={requesterPhone}
                    onChange={(e) => setRequesterPhone(e.target.value)}
                    placeholder="10-digit mobile (e.g. 9876543210)"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-[#E2D5C7]/70">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#E2D5C7]/70">
                    Wedding URL or Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={weddingSlug}
                    onChange={(e) => setWeddingSlug(e.target.value)}
                    placeholder="shadify.in/slug or slug"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
                3. Specific Details of Your Request
              </label>
              <textarea
                required
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Specify the exact data to be accessed, corrected, or erased (e.g. 'Remove my RSVP submission', 'Erase uploaded photograph from ceremony gallery', etc.)"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 text-[11px] text-stone-400">
              <span className="font-semibold text-[#C9933A]">Verification Notice:</span> Under
              Section 12 of the DPDP Act 2023, personal data is verified prior to fulfillment to
              prevent unauthorized third-party disclosure.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#C9933A] py-3 text-xs font-semibold text-[#090406] shadow-md transition hover:bg-[#D4AF37] disabled:opacity-50"
            >
              {submitting ? "Registering Request..." : "Submit Data Subject Request"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
