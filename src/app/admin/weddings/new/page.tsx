"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { THEME_PRESETS, validateContrast, type PresetId } from "@/lib/themes/tokens";
import { PRICING_PLANS } from "@/lib/config/pricing";

export default function NewWeddingOnboardingPage() {
  // Form State
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venueCity, setVenueCity] = useState("Udaipur, Rajasthan");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<"lite" | "premium" | "platinum">("premium");
  const [themeId, setThemeId] = useState<PresetId>("royal-crimson");
  const [customPrimary, setCustomPrimary] = useState("");
  const [customAccent, setCustomAccent] = useState("");
  const [monogramText, setMonogramText] = useState("");
  const [upiVpa, setUpiVpa] = useState("");
  const [couplePhone, setCouplePhone] = useState("");
  const [coupleEmail, setCoupleEmail] = useState("");

  const [isSlugManual, setIsSlugManual] = useState(false);
  const [isMonogramManual, setIsMonogramManual] = useState(false);

  // Submission & UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdWedding, setCreatedWedding] = useState<{ slug: string; url: string } | null>(null);

  // Auto-generate slug when names change (if slug hasn't been manually edited)
  useEffect(() => {
    if (!isSlugManual && brideName && groomName) {
      const b = brideName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const g = groomName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const year = weddingDate ? new Date(weddingDate).getFullYear() : "";
      if (b && g) {
        setSlug(`${b}-${g}${year ? `-${year}` : ""}`);
      }
    }
  }, [brideName, groomName, weddingDate, isSlugManual]);

  // Compute monogram default
  useEffect(() => {
    if (!isMonogramManual && brideName && groomName) {
      setMonogramText(`${brideName.trim()[0] || ""} & ${groomName.trim()[0] || ""}`);
    }
  }, [brideName, groomName, isMonogramManual]);

  // Active theme and real-time contrast check
  const activeBasePreset = THEME_PRESETS[themeId] || THEME_PRESETS["royal-crimson"];
  const resolvedPrimary = customPrimary || activeBasePreset.palette.primary;
  const resolvedAccent = customAccent || activeBasePreset.palette.accent;

  const livePalette = {
    ...activeBasePreset.palette,
    primary: resolvedPrimary,
    accent: resolvedAccent,
  };

  const contrastReport = validateContrast({
    canvas: livePalette.canvas,
    surface: livePalette.surface,
    text: livePalette.text,
    textMuted: livePalette.textMuted,
    primary: livePalette.primary,
    onPrimary: livePalette.onPrimary,
    accent: livePalette.accent,
    onAccent: livePalette.onAccent,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!contrastReport.ok) {
      setErrorMessage(
        "Selected colors fail accessibility contrast checks. Please adjust primary or accent."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brideName,
          groomName,
          weddingDate,
          venueCity,
          slug: slug.trim().toLowerCase(),
          plan,
          themeId,
          customPrimary: customPrimary || undefined,
          customAccent: customAccent || undefined,
          monogramText: monogramText.trim() || undefined,
          upiVpa: upiVpa.trim() || undefined,
          couplePhone: couplePhone.trim(),
          coupleEmail: coupleEmail.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "Failed to create wedding.");
      } else {
        setCreatedWedding({ slug: json.slug, url: json.url });
      }
    } catch {
      setErrorMessage("Network error while connecting to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1F1A2E] font-sans pb-20">
      {/* Brand Header */}
      <header className="border-b border-[#EADDCF] bg-white px-6 py-4 sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F1A2E]/70 hover:text-[#D6246E]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Weddings
            </Link>
            <div className="h-4 w-px bg-[#EADDCF]" />
            <h1 className="text-base font-serif font-medium text-[#1F1A2E]">
              Concierge Onboarding — New Wedding
            </h1>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F6] px-3 py-1 text-xs font-medium text-[#D6246E] border border-[#D6246E]/20">
            <Sparkles className="h-3.5 w-3.5" />
            MVP-0 Monolith
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Success Modal */}
        {createdWedding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-8 text-center shadow-2xl space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-serif text-[#1F1A2E]">Wedding Created!</h2>
              <p className="text-xs text-[#1F1A2E]/70">
                The royal digital invitation for{" "}
                <strong>
                  {brideName} &amp; {groomName}
                </strong>{" "}
                is published in draft mode.
              </p>

              <div className="rounded-xl border border-[#EADDCF] bg-[#FFFBF5] p-3 text-xs font-mono break-all text-[#1F1A2E]/80">
                shadify.in{createdWedding.url}
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <a
                  href={createdWedding.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D6246E] py-2.5 text-xs font-semibold text-white shadow hover:opacity-95"
                >
                  Open Live Guest Page <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <Link
                  href="/admin"
                  className="rounded-full border border-[#EADDCF] bg-white py-2.5 text-xs font-medium text-[#1F1A2E]/80 hover:bg-gray-50"
                >
                  Return to Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to create wedding</p>
                <p className="mt-0.5 opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* 1. Couple & Venue Basics */}
          <section className="rounded-2xl border border-[#EADDCF] bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-serif font-medium text-[#1F1A2E]">
                1. Couple &amp; Ceremony Basics
              </h2>
              <p className="text-xs text-[#1F1A2E]/60">Names, wedding date, city, and URL slug.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Bride&apos;s Name *
                </label>
                <input
                  type="text"
                  required
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="e.g. Priya"
                  className="mt-1 w-full rounded-lg border border-[#EADDCF] px-3.5 py-2 text-xs text-[#1F1A2E] focus:border-[#D6246E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Groom&apos;s Name *
                </label>
                <input
                  type="text"
                  required
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="mt-1 w-full rounded-lg border border-[#EADDCF] px-3.5 py-2 text-xs text-[#1F1A2E] focus:border-[#D6246E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Wedding Date *
                </label>
                <input
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#EADDCF] px-3.5 py-2 text-xs text-[#1F1A2E] focus:border-[#D6246E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Venue City / Destination *
                </label>
                <input
                  type="text"
                  required
                  value={venueCity}
                  onChange={(e) => setVenueCity(e.target.value)}
                  placeholder="e.g. Udaipur, Rajasthan"
                  className="mt-1 w-full rounded-lg border border-[#EADDCF] px-3.5 py-2 text-xs text-[#1F1A2E] focus:border-[#D6246E] focus:outline-none"
                />
              </div>
            </div>

            {/* Slug URL */}
            <div>
              <label className="block text-xs font-medium text-[#1F1A2E]/80">
                Custom Guest URL Slug *
              </label>
              <div className="mt-1 flex rounded-lg border border-[#EADDCF] focus-within:border-[#D6246E] bg-white overflow-hidden">
                <span className="inline-flex items-center px-3 text-xs text-[#1F1A2E]/50 bg-gray-50 border-r border-[#EADDCF]">
                  shadify.in/w/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setIsSlugManual(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  placeholder="priya-rahul-2026"
                  className="w-full px-3 py-2 text-xs text-[#1F1A2E] focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#1F1A2E]/50">
                Lowercase letters, numbers, and hyphens only. Guarded against reserved platform
                routes (code 23514).
              </p>
            </div>
          </section>

          {/* 2. Pricing Plan */}
          <section className="rounded-2xl border border-[#EADDCF] bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-serif font-medium text-[#1F1A2E]">
                2. Pricing Tier &amp; Entitlements
              </h2>
              <p className="text-xs text-[#1F1A2E]/60">
                Select the couple&apos;s contracted package.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(["lite", "premium", "platinum"] as const).map((tierKey) => {
                const planData = PRICING_PLANS[tierKey];
                return (
                  <div
                    key={tierKey}
                    onClick={() => setPlan(tierKey)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      plan === tierKey
                        ? "border-[#D6246E] bg-[#FFF1F6] shadow-sm"
                        : "border-[#EADDCF] hover:border-[#D6246E]/50 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs capitalize text-[#1F1A2E]">
                        {planData.name}
                      </span>
                      <span className="font-serif font-bold text-sm text-[#D6246E]">
                        ₹{planData.priceInr.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#1F1A2E]/70">{planData.tagline}</p>
                    <div className="mt-3 text-[10px] space-y-1 text-[#1F1A2E]/60 border-t border-[#EADDCF]/60 pt-2">
                      <p>• {planData.hostingDurationYears}-Year Web Hosting</p>
                      <p>• {planData.rawOriginalsRetentionDays}-Day RAW Retention</p>
                      <p>
                        •{" "}
                        {planData.canHideBranding ? "Zero Shadify branding" : "Neutral footer mark"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Theme & Color Palette Selection */}
          <section className="rounded-2xl border border-[#EADDCF] bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-serif font-medium text-[#1F1A2E]">
                3. Luxury Theme Preset &amp; Contrast Audit
              </h2>
              <p className="text-xs text-[#1F1A2E]/60">
                Choose one of the 5 curated presets. Real-time WCAG AA verification runs on every
                keystroke.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(Object.keys(THEME_PRESETS).filter((k) => k !== "sunset-pastel") as PresetId[]).map(
                (presetKey) => {
                  const p = THEME_PRESETS[presetKey];
                  return (
                    <button
                      type="button"
                      key={presetKey}
                      onClick={() => {
                        setThemeId(presetKey);
                        setCustomPrimary("");
                        setCustomAccent("");
                      }}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        themeId === presetKey
                          ? "border-[#1F1A2E] bg-white ring-2 ring-[#1F1A2E] shadow"
                          : "border-[#EADDCF] hover:bg-gray-50"
                      }`}
                    >
                      <div className="h-6 w-full rounded flex overflow-hidden border border-gray-200 mb-2">
                        <div
                          className="w-1/2 h-full"
                          style={{ backgroundColor: p.palette.canvas }}
                        />
                        <div
                          className="w-1/4 h-full"
                          style={{ backgroundColor: p.palette.primary }}
                        />
                        <div
                          className="w-1/4 h-full"
                          style={{ backgroundColor: p.palette.accent }}
                        />
                      </div>
                      <p className="text-xs font-semibold capitalize text-[#1F1A2E]">
                        {presetKey.replace("-", " ")}
                      </p>
                      <p className="text-[10px] text-[#1F1A2E]/60">{p.typography.displayFont}</p>
                    </button>
                  );
                }
              )}
            </div>

            {/* Custom Color Overrides */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-[#EADDCF] pt-6">
              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Custom Primary Hex (Optional)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={resolvedPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-[#EADDCF]"
                  />
                  <input
                    type="text"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    placeholder={activeBasePreset.palette.primary}
                    className="w-full rounded-lg border border-[#EADDCF] px-3 py-1.5 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Custom Accent Hex (Optional)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={resolvedAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-[#EADDCF]"
                  />
                  <input
                    type="text"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    placeholder={activeBasePreset.palette.accent}
                    className="w-full rounded-lg border border-[#EADDCF] px-3 py-1.5 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Monogram Initials
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={monogramText}
                  onChange={(e) => {
                    setIsMonogramManual(true);
                    setMonogramText(e.target.value);
                  }}
                  placeholder="e.g. P & R"
                  className="mt-1 w-full rounded-lg border border-[#EADDCF] px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Real-Time Contrast Feedback Banner */}
            <div
              className={`rounded-xl border p-4 text-xs ${
                contrastReport.ok
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2">
                  {contrastReport.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  Live Accessibility Contrast Check:{" "}
                  {contrastReport.ok ? "PASSES ALL RULES" : "CONTRAST VIOLATION"}
                </span>
                <span>Text on Canvas: {contrastReport.ratios["text-canvas"]}:1</span>
              </div>

              {contrastReport.warnings.length > 0 && (
                <div className="mt-2 text-[11px] opacity-85 space-y-0.5 border-t border-current/20 pt-1.5">
                  {contrastReport.warnings.map((w, i) => (
                    <p key={i}>• {w}</p>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 4. Couple Financial & WhatsApp Contact */}
          <section className="rounded-2xl border border-[#EADDCF] bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-serif font-medium text-[#1F1A2E]">
                4. Direct UPI Shagun &amp; Couple Contact
              </h2>
              <p className="text-xs text-[#1F1A2E]/60">
                VPA bank address for zero-commission cash blessings, and WhatsApp coordination
                details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Couple&apos;s UPI VPA (Optional)
                </label>
                <div className="mt-1 relative rounded-lg">
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="priya.rahul@okhdfcbank"
                    className="w-full rounded-lg border border-[#EADDCF] px-3.5 py-2 text-xs text-[#1F1A2E] focus:border-[#D6246E] focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#1F1A2E]/50">
                  Opens directly in GPay, PhonePe, Paytm with ₹0 fee.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Couple WhatsApp Mobile *
                </label>
                <input
                  type="tel"
                  required
                  value={couplePhone}
                  onChange={(e) => setCouplePhone(e.target.value)}
                  placeholder="9876543210"
                  className="mt-1 w-full rounded-lg border border-[#EADDCF] px-3.5 py-2 text-xs text-[#1F1A2E] focus:border-[#D6246E] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-[#1F1A2E]/50">
                  Used for concierge invites and owner access.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F1A2E]/80">
                  Couple Email (Optional)
                </label>
                <input
                  type="email"
                  value={coupleEmail}
                  onChange={(e) => setCoupleEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="mt-1 w-full rounded-lg border border-[#EADDCF] px-3.5 py-2 text-xs text-[#1F1A2E] focus:border-[#D6246E] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 border-t border-[#EADDCF] pt-6">
            <Link
              href="/admin"
              className="rounded-full border border-[#EADDCF] bg-white px-6 py-2.5 text-xs font-medium text-[#1F1A2E]/80 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !contrastReport.ok}
              className={`rounded-full px-8 py-2.5 text-xs font-semibold text-white shadow transition-all ${
                isSubmitting || !contrastReport.ok
                  ? "bg-gray-400 cursor-not-allowed opacity-60"
                  : "bg-[#D6246E] hover:opacity-95"
              }`}
            >
              {isSubmitting ? "Creating Wedding..." : "Create & Launch Wedding"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
