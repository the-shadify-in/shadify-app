"use client";

import React from "react";
import Link from "next/link";
import { Plus, Eye, LogOut } from "lucide-react";

import type { AllWeddingsChipStats, WeddingChipSummary } from "@/features/analytics/chip-counts";

interface AdminDashboardClientProps {
  allChipStats?: AllWeddingsChipStats;
  perWeddingChips?: WeddingChipSummary[];
}

export default function AdminDashboardClient({
  allChipStats = {
    totalTaps: 0,
    otherSharePercent: 0,
    topicBreakdown: {},
    topTopic: null,
  },
  perWeddingChips = [],
}: AdminDashboardClientProps) {
  // Demo weddings for concierge staff
  const weddings = [
    {
      id: "w-1",
      slug: "priya-rahul",
      couple: "Priya & Rahul",
      date: "Dec 14, 2026",
      plan: "Vivah (Premium)",
      price: "₹7,999",
      rsvps: 184,
      shagunCount: 38,
      shagunTotal: "₹84,500",
      status: "published",
    },
    {
      id: "w-2",
      slug: "ananya-kabir",
      couple: "Ananya & Kabir",
      date: "Jan 22, 2027",
      plan: "Rajwada (Platinum)",
      price: "₹19,999",
      rsvps: 412,
      shagunCount: 92,
      shagunTotal: "₹2,14,000",
      status: "published",
    },
    {
      id: "w-3",
      slug: "rohit-simran",
      couple: "Rohit & Simran",
      date: "Feb 08, 2027",
      plan: "Shubh (Lite)",
      price: "₹2,999",
      rsvps: 45,
      shagunCount: 12,
      shagunTotal: "₹28,000",
      status: "draft",
    },
  ];

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      document.cookie = "shadify_admin_session=; path=/; max-age=0;";
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="min-h-screen bg-[#090406] text-[#FFF9F2]">
      {/* Top Navigation */}
      <header className="border-b border-[#C9933A]/20 bg-[#12070A]/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl font-light text-[#FFF9F2]">
              Shadify{" "}
              <span className="font-sans text-xs uppercase tracking-widest text-[#C9933A]">
                Concierge
              </span>
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <Link
              href="/admin/health"
              className="inline-flex items-center gap-1.5 text-[#C9933A] transition hover:text-[#C9933A]/80"
            >
              Operations & Health
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-[#E2D5C7]/60 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="rounded-xl border border-[#C9933A]/20 bg-[#14080C] p-5">
            <p className="text-xs text-[#E2D5C7]/60">Active Weddings</p>
            <h3 className="mt-1 font-serif text-3xl font-light text-[#FFF9F2]">
              {weddings.length}
            </h3>
          </div>
          <div className="rounded-xl border border-[#C9933A]/20 bg-[#14080C] p-5">
            <p className="text-xs text-[#E2D5C7]/60">Total RSVPs Confirmed</p>
            <h3 className="mt-1 font-serif text-3xl font-light text-[#C9933A]">641</h3>
          </div>
          <div className="rounded-xl border border-[#C9933A]/20 bg-[#14080C] p-5">
            <p className="text-xs text-[#E2D5C7]/60">Direct Shagun Recorded</p>
            <h3 className="mt-1 font-serif text-3xl font-light text-green-400">₹3,26,500</h3>
          </div>
          <div className="rounded-xl border border-[#C9933A]/20 bg-[#14080C] p-5">
            <p className="text-xs text-[#E2D5C7]/60">Net Platform Contribution</p>
            <h3 className="mt-1 font-serif text-3xl font-light text-[#DFB15B]">~84%</h3>
          </div>
        </div>

        {/* Section: Guest Logistics "Ask" Chips Intelligence */}
        <div className="space-y-6 rounded-xl border border-[#C9933A]/30 bg-[#14080C] p-6">
          <div className="flex flex-col justify-between gap-2 border-b border-[#C9933A]/20 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-xl font-light text-[#FFF9F2]">
                Guest &quot;Ask&quot; Chips Intelligence (Zero AI Telemetry)
              </h2>
              <p className="text-xs text-[#E2D5C7]/60">
                Anonymous first-party daily counters measuring which logistics questions guests ask
                most
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="rounded-full bg-[#C9933A]/20 px-3 py-1 font-mono text-[#C9933A]">
                Total Taps: {allChipStats.totalTaps}
              </span>
              <span className="rounded-full bg-[#DFB15B]/20 px-3 py-1 font-mono text-[#DFB15B]">
                &quot;Other&quot; Share: {allChipStats.otherSharePercent}%
              </span>
            </div>
          </div>

          {/* Aggregate Topic Breakdown Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            {[
              { key: "timings", label: "Timings" },
              { key: "venue", label: "Venue & Map" },
              { key: "dress_code", label: "Dress Code" },
              { key: "gifts", label: "Gifts" },
              { key: "rsvp", label: "RSVP" },
              { key: "other", label: "Something Else" },
            ].map(({ key, label }) => {
              const count = allChipStats.topicBreakdown[key] || 0;
              const isTop = allChipStats.topTopic === key && count > 0;
              return (
                <div
                  key={key}
                  className={`rounded-lg border p-3 ${
                    isTop ? "border-[#C9933A] bg-[#1E0E14]" : "border-[#C9933A]/15 bg-[#17090E]"
                  }`}
                >
                  <p className="truncate text-[11px] text-[#E2D5C7]/70">{label}</p>
                  <p className="mt-1 font-serif text-xl text-[#FFF9F2]">{count}</p>
                  {isTop && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#C9933A]">
                      Most Asked
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Per-Wedding Questions Table */}
          {perWeddingChips.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[#C9933A]/15 bg-[#17090E]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#C9933A]/10 bg-[#1B0B10] text-[#E2D5C7]/70">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Wedding</th>
                    <th className="px-4 py-2.5 font-medium">Total Inquiries</th>
                    <th className="px-4 py-2.5 font-medium">Top Question</th>
                    <th className="px-4 py-2.5 font-medium">Timings</th>
                    <th className="px-4 py-2.5 font-medium">Venue</th>
                    <th className="px-4 py-2.5 font-medium">Dress</th>
                    <th className="px-4 py-2.5 font-medium">Gifts</th>
                    <th className="px-4 py-2.5 font-medium">RSVP</th>
                    <th className="px-4 py-2.5 font-medium">Other</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9933A]/10">
                  {perWeddingChips.map((w) => (
                    <tr key={w.id} className="hover:bg-[#1B0B10]/40">
                      <td className="px-4 py-3 font-medium text-[#FFF9F2]">
                        {w.couple} <span className="font-mono text-[#E2D5C7]/40">({w.slug})</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#C9933A]">{w.totalTaps}</td>
                      <td className="px-4 py-3 capitalize text-[#E2D5C7]/80">
                        {w.topQuestion?.replace(/_/g, " ") || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#E2D5C7]/60">
                        {w.breakdown.timings || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#E2D5C7]/60">
                        {w.breakdown.venue || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#E2D5C7]/60">
                        {w.breakdown.dress_code || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#E2D5C7]/60">
                        {w.breakdown.gifts || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#E2D5C7]/60">
                        {w.breakdown.rsvp || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#E2D5C7]/60">
                        {(w.breakdown.other || 0) + (w.breakdown.other_contact_tapped || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-2xl font-light text-[#FFF9F2]">Managed Weddings</h2>
            <p className="text-xs text-[#E2D5C7]/60">
              Create, preview, and update wedding websites
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/theme-preview"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9933A]/30 bg-[#14080C] px-4 py-2.5 text-xs font-medium text-[#FFF9F2] hover:border-[#C9933A]"
            >
              <Eye className="h-4 w-4 text-[#C9933A]" />
              Theme Inspector
            </Link>
            <Link
              href="/admin/weddings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#C9933A] to-[#DFB15B] px-5 py-2.5 text-xs font-semibold text-black shadow-md transition-transform hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Onboard New Wedding
            </Link>
          </div>
        </div>

        {/* Weddings Table */}
        <div className="overflow-hidden rounded-xl border border-[#C9933A]/20 bg-[#14080C]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#C9933A]/10 bg-[#1B0B10] text-[#E2D5C7]/70">
              <tr>
                <th className="px-5 py-3 font-medium">Couple</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">RSVPs</th>
                <th className="px-5 py-3 font-medium">Shagun Declared</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9933A]/10">
              {weddings.map((w) => (
                <tr key={w.id} className="transition-colors hover:bg-[#1B0B10]/40">
                  <td className="px-5 py-4 font-serif text-sm font-medium text-[#FFF9F2]">
                    {w.couple}
                  </td>
                  <td className="px-5 py-4 text-[#E2D5C7]/80">{w.date}</td>
                  <td className="px-5 py-4 text-[#C9933A]">{w.plan}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${
                        w.status === "published"
                          ? "border border-green-500/40 bg-green-950/60 text-green-300"
                          : "border border-yellow-500/40 bg-yellow-950/60 text-yellow-300"
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#E2D5C7]/80">{w.rsvps}</td>
                  <td className="px-5 py-4 font-medium text-green-400">{w.shagunTotal}</td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/${w.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded border border-[#C9933A]/30 px-3 py-1 text-[11px] text-[#C9933A] hover:bg-[#C9933A]/10"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Site
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
