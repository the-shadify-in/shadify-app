"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";

export default function ReportClient() {
  const [reportType, setReportType] = useState<
    "unwanted_photo" | "unwanted_message" | "inappropriate_content" | "privacy_violation" | "other"
  >("unwanted_photo");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [weddingSlug, setWeddingSlug] = useState("");
  const [targetUrlOrId, setTargetUrlOrId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      let slug = weddingSlug.trim();
      if (slug.includes("shadify.in/")) {
        slug = slug.split("shadify.in/")[1]?.split("/")[0] || slug;
      }

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          reporterName: reporterName.trim(),
          reporterPhone: reporterPhone.trim(),
          weddingSlug: slug,
          targetUrlOrId: targetUrlOrId.trim(),
          reason: reason.trim(),
        }),
      });

      const data = (await res.json()) as { ticketId?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit takedown request");
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
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0C0609]/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
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

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 space-y-2 border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Safety &amp; Content Takedown Desk
          </div>
          <h1 className="font-serif text-3xl font-light text-white sm:text-4xl">
            Report a Problem or Request Removal
          </h1>
          <p className="text-xs text-[#FAF7F2]/60">
            If a photo, message, or personal detail has been posted without your consent or is
            inappropriate, notify our concierge team for immediate removal.
          </p>
        </div>

        {ticketId ? (
          <div className="space-y-6 rounded-3xl border border-emerald-500/30 bg-[#12070A] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-light text-white">
                Report Logged for Review
              </h2>
              <p className="text-xs text-stone-400">
                Our safety team has received your submission and placed the item on review queue.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C9933A]">
                Report Tracking Ticket
              </span>
              <p className="mt-1 font-mono text-xl font-bold tracking-wider text-white">
                {ticketId}
              </p>
            </div>
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

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
                1. Nature of the Issue
              </label>
              <select
                value={reportType}
                onChange={(e) =>
                  setReportType(
                    e.target.value as
                      | "unwanted_photo"
                      | "unwanted_message"
                      | "inappropriate_content"
                      | "privacy_violation"
                      | "other",
                  )
                }
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-[#C9933A] focus:outline-none"
              >
                <option value="unwanted_photo">Unwanted Photograph (Remove My Photo)</option>
                <option value="unwanted_message">Unwanted or Spam Guestbook Message</option>
                <option value="privacy_violation">Exposing Private Information / Minor</option>
                <option value="inappropriate_content">Inappropriate Content</option>
                <option value="other">Other Concern</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
                2. Your Contact Information
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-[#E2D5C7]/70">Your Name</label>
                  <input
                    type="text"
                    required
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#E2D5C7]/70">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
                3. Content to be Removed
              </label>
              <div>
                <label className="mb-1 block text-xs text-[#E2D5C7]/70">Wedding URL or Slug</label>
                <input
                  type="text"
                  required
                  value={weddingSlug}
                  onChange={(e) => setWeddingSlug(e.target.value)}
                  placeholder="shadify.in/slug or slug"
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#E2D5C7]/70">
                  Target Photo / Message / Link
                </label>
                <input
                  type="text"
                  required
                  value={targetUrlOrId}
                  onChange={(e) => setTargetUrlOrId(e.target.value)}
                  placeholder="e.g. Photo in reception gallery, or link, or quote text"
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#E2D5C7]/70">
                  Reason for Takedown Request
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe why this content should be taken down"
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#C9933A] py-3 text-xs font-semibold text-[#090406] shadow-md transition hover:bg-[#D4AF37] disabled:opacity-50"
            >
              {submitting ? "Submitting Takedown Report..." : "Submit Removal Request"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
