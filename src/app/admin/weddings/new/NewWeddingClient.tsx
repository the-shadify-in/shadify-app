"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { THEME_PRESETS, validateContrast, type PresetId } from "@/lib/themes/tokens";
import { PRICING_PLANS } from "@/lib/config/pricing";
import { IntakePanel } from "./IntakePanel";
import type { DraftExtraction } from "@/features/intake/schema";

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

  // Review gate state: true when AI intake draft contains unconfirmed items
  const [isReviewGated, setIsReviewGated] = useState(false);

  // Submission & UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdWedding, setCreatedWedding] = useState<{ slug: string; url: string } | null>(null);

  const handleApplyDraft = (draft: DraftExtraction) => {
    if (draft.couple) {
      if (draft.couple.partnerAName) setBrideName(draft.couple.partnerAName);
      if (draft.couple.partnerBName) setGroomName(draft.couple.partnerBName);
    }
    if (draft.weddingDate?.value) {
      setWeddingDate(draft.weddingDate.value);
    }
    if (draft.city?.value) {
      setVenueCity(draft.city.value);
    }
    if (draft.themeFeeling?.suggestedPreset) {
      setThemeId(draft.themeFeeling.suggestedPreset);
    }
    if (draft.upiVpaCandidates && draft.upiVpaCandidates.length > 0 && draft.upiVpaCandidates[0]) {
      setUpiVpa(draft.upiVpaCandidates[0].value);
    }
    if (draft.contacts && draft.contacts.length > 0 && draft.contacts[0]) {
      const primary = draft.contacts[0];
      setCouplePhone(primary.phoneE164 || primary.phoneRaw || "");
    }
  };

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
        "Selected colors fail accessibility contrast checks. Please adjust primary or accent.",
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

      const json = (await res.json()) as { error?: string; slug?: string; url?: string };

      if (!res.ok) {
        setErrorMessage(json.error || "Failed to create wedding.");
      } else if (json.slug && json.url) {
        setCreatedWedding({ slug: json.slug, url: json.url });
      }
    } catch {
      setErrorMessage("Network error while connecting to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-studio-primary min-h-screen bg-studio-canvas pb-20 font-sans">
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Executive In-Page Hero */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-studio-primary font-serif text-2xl font-light sm:text-3xl">
              Concierge Onboarding — New Wedding
            </h1>
            <p className="text-studio-muted mt-1 text-xs">
              Configure celebration identity, subscription plan, visual preset, and financial
              routing
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-studio-champagne/40 bg-studio-champagne/15 px-3 py-1 text-xs font-medium text-studio-champagne">
            <Sparkles className="h-3.5 w-3.5" />
            Full Provisioning Suite
          </span>
        </div>

        {/* Success Modal */}
        {createdWedding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="text-studio-primary w-full max-w-md space-y-4 rounded-2xl border border-studio-border bg-studio-surfaceElevated p-8 text-center shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="text-studio-primary font-serif text-2xl">Wedding Created!</h2>
              <p className="text-studio-muted text-xs">
                The royal digital invitation for{" "}
                <strong className="text-studio-primary">
                  {brideName} &amp; {groomName}
                </strong>{" "}
                is published in draft mode.
              </p>

              <div className="text-studio-primary break-all rounded-xl border border-studio-border bg-studio-canvas p-3 font-mono text-xs">
                shadify.in{createdWedding.url}
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <a
                  href={createdWedding.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-studio-champagne py-2.5 text-xs font-semibold text-black shadow hover:bg-studio-champagneLight"
                >
                  Open Live Guest Page <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <Link
                  href="/admin"
                  className="text-studio-muted hover:text-studio-primary rounded-full border border-studio-border bg-studio-surface py-2.5 text-xs font-medium hover:bg-studio-surfaceElevated"
                >
                  Return to Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* AI Intake Assistant Panel for Staff */}
        <div className="mb-8">
          <IntakePanel onApplyDraft={handleApplyDraft} onReviewGateChange={setIsReviewGated} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="font-semibold">Unable to create wedding</p>
                <p className="mt-0.5 opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* 1. Couple & Venue Basics */}
          <section className="space-y-6 rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
            <div>
              <h2 className="text-studio-primary font-serif text-lg font-medium">
                1. Couple &amp; Ceremony Basics
              </h2>
              <p className="text-studio-muted text-xs">Names, wedding date, city, and URL slug.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Bride&apos;s Name *
                </label>
                <input
                  type="text"
                  required
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="e.g. Priya"
                  className="text-studio-primary placeholder:text-studio-subtle mt-1 w-full rounded-lg border border-studio-border bg-studio-canvas px-3.5 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                />
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Groom&apos;s Name *
                </label>
                <input
                  type="text"
                  required
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="text-studio-primary placeholder:text-studio-subtle mt-1 w-full rounded-lg border border-studio-border bg-studio-canvas px-3.5 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                />
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Wedding Date *
                </label>
                <input
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="text-studio-primary mt-1 w-full rounded-lg border border-studio-border bg-studio-canvas px-3.5 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                />
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Venue City / Destination *
                </label>
                <input
                  type="text"
                  required
                  value={venueCity}
                  onChange={(e) => setVenueCity(e.target.value)}
                  placeholder="e.g. Udaipur, Rajasthan"
                  className="text-studio-primary placeholder:text-studio-subtle mt-1 w-full rounded-lg border border-studio-border bg-studio-canvas px-3.5 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                />
              </div>
            </div>

            {/* Slug URL */}
            <div>
              <label className="text-studio-muted block text-xs font-medium">
                Custom Guest URL Slug *
              </label>
              <div className="mt-1 flex overflow-hidden rounded-lg border border-studio-border bg-studio-canvas focus-within:border-studio-champagne">
                <span className="text-studio-muted inline-flex items-center border-r border-studio-border bg-studio-surfaceElevated px-3 text-xs">
                  shadify.in/
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
                  className="text-studio-primary placeholder:text-studio-subtle w-full bg-transparent px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <p className="text-studio-muted/70 mt-1 text-[11px]">
                Lowercase letters, numbers, and hyphens only. Guarded against reserved platform
                routes (code 23514).
              </p>
            </div>
          </section>
          {/* 2. Pricing Plan */}
          <section className="space-y-4 rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
            <div>
              <h2 className="text-studio-primary font-serif text-lg font-medium">
                2. Pricing Tier &amp; Entitlements
              </h2>
              <p className="text-studio-muted text-xs">
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
                        ? "border-studio-champagne bg-studio-champagne/15 shadow-sm"
                        : "border-studio-border bg-studio-surfaceElevated hover:border-studio-champagne/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-studio-primary text-xs font-semibold capitalize">
                        {planData.name}
                      </span>
                      <span className="font-serif text-sm font-bold text-studio-champagne">
                        ₹{planData.priceInr.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-studio-muted mt-1 text-[11px]">{planData.tagline}</p>
                    <div className="text-studio-muted/80 mt-3 space-y-1 border-t border-studio-border pt-2 text-[10px]">
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
          <section className="space-y-6 rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
            <div>
              <h2 className="text-studio-primary font-serif text-lg font-medium">
                3. Luxury Theme Preset &amp; Contrast Audit
              </h2>
              <p className="text-studio-muted text-xs">
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
                          ? "border-studio-champagne bg-studio-champagne/15 shadow ring-1 ring-studio-champagne"
                          : "border-studio-border bg-studio-surfaceElevated hover:border-studio-champagne/40"
                      }`}
                    >
                      <div className="mb-2 flex h-6 w-full overflow-hidden rounded border border-white/10">
                        <div
                          className="h-full w-1/2"
                          style={{ backgroundColor: p.palette.canvas }}
                        />
                        <div
                          className="h-full w-1/4"
                          style={{ backgroundColor: p.palette.primary }}
                        />
                        <div
                          className="h-full w-1/4"
                          style={{ backgroundColor: p.palette.accent }}
                        />
                      </div>
                      <p className="text-studio-primary text-xs font-semibold capitalize">
                        {presetKey.replace("-", " ")}
                      </p>
                      <p className="text-studio-muted text-[10px]">{p.typography.displayFont}</p>
                    </button>
                  );
                },
              )}
            </div>

            {/* Custom Color Overrides */}
            <div className="grid grid-cols-1 gap-4 border-t border-studio-border pt-6 sm:grid-cols-3">
              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Custom Primary Hex (Optional)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={resolvedPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-studio-border bg-transparent"
                  />
                  <input
                    type="text"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    placeholder={activeBasePreset.palette.primary}
                    className="text-studio-primary placeholder:text-studio-subtle w-full rounded-lg border border-studio-border bg-studio-canvas px-3 py-1.5 font-mono text-xs uppercase focus:border-studio-champagne focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Custom Accent Hex (Optional)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={resolvedAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-studio-border bg-transparent"
                  />
                  <input
                    type="text"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    placeholder={activeBasePreset.palette.accent}
                    className="text-studio-primary placeholder:text-studio-subtle w-full rounded-lg border border-studio-border bg-studio-canvas px-3 py-1.5 font-mono text-xs uppercase focus:border-studio-champagne focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
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
                  placeholder="e.g. P &amp; R"
                  className="text-studio-primary placeholder:text-studio-subtle mt-1 w-full rounded-lg border border-studio-border bg-studio-canvas px-3 py-1.5 text-xs focus:border-studio-champagne focus:outline-none"
                />
              </div>
            </div>

            {/* Real-Time Contrast Feedback Banner */}
            <div
              className={`rounded-xl border p-4 text-xs ${
                contrastReport.ok
                  ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                  : "border-red-500/30 bg-red-950/30 text-red-300"
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2">
                  {contrastReport.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  Live Accessibility Contrast Check:{" "}
                  {contrastReport.ok ? "PASSES ALL RULES" : "CONTRAST VIOLATION"}
                </span>
                <span>Text on Canvas: {contrastReport.ratios["text-canvas"]}:1</span>
              </div>

              {contrastReport.warnings.length > 0 && (
                <div className="border-current/20 mt-2 space-y-0.5 border-t pt-1.5 text-[11px] opacity-85">
                  {contrastReport.warnings.map((w, i) => (
                    <p key={i}>• {w}</p>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 4. Couple Financial & WhatsApp Contact */}
          <section className="space-y-4 rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
            <div>
              <h2 className="text-studio-primary font-serif text-lg font-medium">
                4. Direct UPI Shagun &amp; Couple Contact
              </h2>
              <p className="text-studio-muted text-xs">
                VPA bank address for zero-commission cash blessings, and WhatsApp coordination
                details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Couple&apos;s UPI VPA (Optional)
                </label>
                <div className="relative mt-1 rounded-lg">
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="priya.rahul@okhdfcbank"
                    className="text-studio-primary placeholder:text-studio-subtle w-full rounded-lg border border-studio-border bg-studio-canvas px-3.5 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                  />
                </div>
                <p className="text-studio-muted/70 mt-1 text-[11px]">
                  Opens directly in GPay, PhonePe, Paytm with ₹0 fee.
                </p>
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Couple WhatsApp Mobile *
                </label>
                <input
                  type="tel"
                  required
                  value={couplePhone}
                  onChange={(e) => setCouplePhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="text-studio-primary placeholder:text-studio-subtle mt-1 w-full rounded-lg border border-studio-border bg-studio-canvas px-3.5 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                />
                <p className="text-studio-muted/70 mt-1 text-[11px]">
                  Used for concierge invites and owner access.
                </p>
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Couple Email (Optional)
                </label>
                <input
                  type="email"
                  value={coupleEmail}
                  onChange={(e) => setCoupleEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="text-studio-primary placeholder:text-studio-subtle mt-1 w-full rounded-lg border border-studio-border bg-studio-canvas px-3.5 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex flex-col items-center justify-end gap-4 border-t border-studio-border pt-6 sm:flex-row">
            {isReviewGated && (
              <span className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-300">
                ⚠️ Review Gate: Review and confirm all flagged checklist items in the Intake
                Assistant above to enable creation.
              </span>
            )}
            <Link
              href="/admin"
              className="text-studio-muted hover:text-studio-primary rounded-full border border-studio-border bg-studio-surface px-6 py-2.5 text-xs font-medium hover:bg-studio-surfaceElevated"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !contrastReport.ok || isReviewGated}
              className={`rounded-full px-8 py-2.5 text-xs font-semibold shadow transition-all ${
                isSubmitting || !contrastReport.ok || isReviewGated
                  ? "text-studio-muted/50 cursor-not-allowed bg-studio-surfaceHighlight opacity-60"
                  : "bg-studio-champagne text-black hover:bg-studio-champagneLight"
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
