"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldCheck, Sparkles, AlertCircle, AlertTriangle } from "lucide-react";
import { THEME_PRESETS, validateContrast } from "@/lib/themes/tokens";

export default function ThemePreviewAndSwatchPage() {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("royal-crimson");
  const selectedTheme = THEME_PRESETS[selectedPresetKey] || THEME_PRESETS["royal-crimson"];
  const contrastReport = validateContrast(selectedTheme.palette);

  return (
    <div className="text-studio-primary min-h-screen bg-studio-canvas font-sans">
      <main className="mx-auto max-w-7xl space-y-10 p-6 sm:p-8">
        {/* Executive In-Page Hero */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-studio-primary font-serif text-2xl font-light sm:text-3xl">
              Design System &amp; Theme Inspector
            </h1>
            <p className="text-studio-muted mt-1 text-xs">
              Live audit of brand isolation, dual token namespaces, and client theme contrast
              matrices
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="border-studio-champagne/40 bg-studio-champagne/15 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-studio-champagne">
              <Sparkles className="h-3.5 w-3.5" />
              Dual Namespace Active
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 1. BRAND PALETTE (ISOLATED TO ADMIN & MARKETING) */}
        {/* ------------------------------------------------------------- */}
        <section className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-studio-champagne">
                Namespace: --brand-*
              </span>
              <h2 className="text-studio-primary font-serif text-xl font-medium">
                Shadify Platform Identity
              </h2>
              <p className="text-studio-muted text-xs">
                Used solely in marketing, staff concierge, and error screens. Never injected into
                couple sites.
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-300 sm:mt-0">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Zero Guest Page Bleed
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-6">
            <div className="rounded-xl border border-studio-border bg-studio-surfaceElevated p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#D6246E] shadow-inner" />
              <p className="text-studio-primary mt-2 text-xs font-semibold">Rani Pink</p>
              <p className="text-studio-muted font-mono text-[11px]">#D6246E</p>
              <span className="mt-1 inline-block text-[10px] font-medium text-[#D6246E]">
                Primary Accent
              </span>
            </div>

            <div className="rounded-xl border border-studio-border bg-studio-surfaceElevated p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#F5A524] shadow-inner" />
              <p className="text-studio-primary mt-2 text-xs font-semibold">Marigold</p>
              <p className="text-studio-muted font-mono text-[11px]">#F5A524</p>
              <span className="mt-1 inline-block text-[10px] font-medium text-amber-400">
                Highlight / Badges
              </span>
            </div>

            <div className="rounded-xl border border-studio-border bg-studio-surfaceElevated p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#0E9F8E] shadow-inner" />
              <p className="text-studio-primary mt-2 text-xs font-semibold">Peacock Teal</p>
              <p className="text-studio-muted font-mono text-[11px]">#0E9F8E</p>
              <span className="mt-1 inline-block text-[10px] font-medium text-teal-400">
                Secondary Accent
              </span>
            </div>

            <div className="rounded-xl border border-studio-border bg-studio-surfaceElevated p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#3D3BC4] shadow-inner" />
              <p className="text-studio-primary mt-2 text-xs font-semibold">Royal Indigo</p>
              <p className="text-studio-muted font-mono text-[11px]">#3D3BC4</p>
              <span className="mt-1 inline-block text-[10px] font-medium text-indigo-400">
                Infographics
              </span>
            </div>

            <div className="rounded-xl border border-studio-border bg-studio-surfaceElevated p-3 text-center">
              <div className="h-12 w-full rounded-lg border border-gray-600 bg-[#FFFBF5] shadow-inner" />
              <p className="text-studio-primary mt-2 text-xs font-semibold">Ivory Ground</p>
              <p className="text-studio-muted font-mono text-[11px]">#FFFBF5</p>
              <span className="mt-1 inline-block text-[10px] font-medium text-stone-300">
                Canvas Background
              </span>
            </div>

            <div className="rounded-xl border border-studio-border bg-studio-surfaceElevated p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#1F1A2E] shadow-inner" />
              <p className="text-studio-primary mt-2 text-xs font-semibold">Midnight Ink</p>
              <p className="text-studio-muted font-mono text-[11px]">#1F1A2E</p>
              <span className="mt-1 inline-block text-[10px] font-medium text-purple-300">
                Reading Text
              </span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 2. THEME CONTRAST & ACCESSIBILITY AUDIT */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-studio-champagne">
                Namespace: --theme-*
              </span>
              <h2 className="text-studio-primary font-serif text-xl font-medium">
                Client Wedding Theme Presets
              </h2>
              <p className="text-studio-muted text-xs">
                Every preset is audited across the 8-point contrast matrix for mobile legibility.
              </p>
            </div>

            {/* Preset Selector */}
            <div className="flex flex-wrap items-center gap-2">
              {Object.keys(THEME_PRESETS)
                .filter((k) => k !== "sunset-pastel")
                .map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPresetKey(key)}
                    className={`rounded-lg px-4 py-2 text-xs font-medium capitalize transition-all ${
                      selectedPresetKey === key
                        ? "bg-studio-champagne/20 border border-studio-champagne text-studio-champagne shadow-md"
                        : "text-studio-muted hover:text-studio-primary hover:border-studio-champagne/40 border border-studio-border bg-studio-surface"
                    }`}
                  >
                    {key.replace("-", " ")}
                  </button>
                ))}
            </div>
          </div>

          {/* Active Preset Inspector Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left: Token Details & Contrast Matrix */}
            <div className="space-y-6 rounded-2xl border border-studio-border bg-studio-surface p-6">
              <div>
                <h3 className="text-studio-primary text-sm font-semibold capitalize">
                  {selectedTheme.presetId.replace("-", " ")}
                </h3>
                <p className="text-studio-muted text-xs">
                  Preset Version: {selectedTheme.version}.0
                </p>
              </div>

              {/* Contrast Checker Card */}
              <div
                className={`rounded-xl border p-4 text-xs ${
                  contrastReport.ok
                    ? "border-green-200 bg-green-50 text-green-900"
                    : "border-red-200 bg-red-50 text-red-900"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {contrastReport.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Full Contrast Matrix: {contrastReport.ok ? "PASSED" : "FAILED"}</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px]">
                  <p>
                    • Text on Canvas: <strong>{contrastReport.ratios["text-canvas"]}:1</strong> (min
                    4.5)
                  </p>
                  <p>
                    • Muted on Canvas: <strong>{contrastReport.ratios["muted-canvas"]}:1</strong>{" "}
                    (min 4.5)
                  </p>
                  <p>
                    • onPrimary on Primary:{" "}
                    <strong>{contrastReport.ratios["onprimary-primary"]}:1</strong> (min 4.5)
                  </p>
                  <p>
                    • onAccent on Accent:{" "}
                    <strong>{contrastReport.ratios["onaccent-accent"]}:1</strong> (min 4.5)
                  </p>
                  <p>
                    • Accent on Canvas: <strong>{contrastReport.ratios["accent-canvas"]}:1</strong>{" "}
                    {contrastReport.accentTextAllowed ? "(text allowed)" : "(border/fill only)"}
                  </p>
                  <p>
                    • Effective Footer:{" "}
                    <strong>{contrastReport.ratios["footer-effective"]}:1</strong> (at 70% opacity)
                  </p>
                </div>

                {contrastReport.warnings.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-amber-200 pt-2 text-[10px] text-amber-800">
                    {contrastReport.warnings.map((w, idx) => (
                      <p key={idx} className="flex items-start gap-1">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{w}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Palette Details */}
              <div className="space-y-3 text-xs">
                <p className="text-studio-primary font-semibold">Palette Tokens</p>
                <div className="text-studio-muted grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: selectedTheme.palette.primary }}
                    />
                    <span>Primary: {selectedTheme.palette.primary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded border"
                      style={{ backgroundColor: selectedTheme.palette.accent }}
                    />
                    <span>Accent: {selectedTheme.palette.accent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded border"
                      style={{ backgroundColor: selectedTheme.palette.canvas }}
                    />
                    <span>Canvas: {selectedTheme.palette.canvas}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded border"
                      style={{ backgroundColor: selectedTheme.palette.surface }}
                    />
                    <span>Surface: {selectedTheme.palette.surface}</span>
                  </div>
                </div>
              </div>

              {/* Typography & Monogram */}
              <div className="text-studio-muted space-y-2 border-t border-studio-border pt-4 text-xs">
                <p>
                  <span className="text-studio-primary font-semibold">Display Font:</span>{" "}
                  {selectedTheme.typography.displayFont}
                </p>
                <p>
                  <span className="text-studio-primary font-semibold">Body Font:</span>{" "}
                  {selectedTheme.typography.bodyFont}
                </p>
                <p>
                  <span className="text-studio-primary font-semibold">Monogram:</span> &ldquo;
                  {selectedTheme.monogram.text}&rdquo; ({selectedTheme.monogram.style})
                </p>
                <p>
                  <span className="text-studio-primary font-semibold">Ornaments:</span>{" "}
                  {selectedTheme.ornaments.motif} ({selectedTheme.ornaments.borderStyle})
                </p>
              </div>
            </div>

            {/* Right: Live Scoped Simulated Mobile Viewport */}
            <div className="flex justify-center lg:col-span-2">
              <div
                className="w-full max-w-sm rounded-[32px] border-4 border-[#2B2327] p-6 shadow-2xl transition-all"
                style={{
                  backgroundColor: selectedTheme.palette.canvas,
                  color: selectedTheme.palette.text,
                  fontFamily: `"${selectedTheme.typography.bodyFont}", sans-serif`,
                }}
              >
                {/* Simulated Envelope Seal */}
                <div
                  className="mb-6 rounded-2xl border p-6 text-center shadow-lg"
                  style={{
                    backgroundColor: selectedTheme.palette.envelopeBg,
                    borderColor: `${selectedTheme.palette.accent}40`,
                  }}
                >
                  <div
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border font-serif text-sm font-bold shadow-md"
                    style={{
                      backgroundColor: selectedTheme.palette.waxSeal,
                      borderColor: selectedTheme.palette.accent,
                      color: selectedTheme.palette.accent,
                    }}
                  >
                    {selectedTheme.monogram.text}
                  </div>
                  <p
                    className="text-[10px] font-medium uppercase tracking-widest"
                    style={{ color: selectedTheme.palette.accent }}
                  >
                    Royal Wedding Invitation
                  </p>
                  <h4
                    className="mt-1 text-2xl font-light"
                    style={{ fontFamily: `"${selectedTheme.typography.displayFont}", serif` }}
                  >
                    Priya &amp; Rahul
                  </h4>
                  <p
                    className="mt-1 text-xs opacity-75"
                    style={{ color: selectedTheme.palette.textMuted }}
                  >
                    December 14, 2026 • Udaipur
                  </p>

                  <div className="mt-4">
                    <button
                      className="rounded-full px-4 py-1.5 text-xs font-semibold shadow"
                      style={{
                        backgroundColor: selectedTheme.palette.primary,
                        color: selectedTheme.palette.onPrimary,
                        border: contrastReport.primaryNeedsBorder
                          ? `2px solid ${selectedTheme.palette.accent}`
                          : "none",
                      }}
                    >
                      Open Invitation
                    </button>
                  </div>
                </div>

                {/* Ceremony Schedule Card */}
                <div
                  className="space-y-2 rounded-xl border p-4"
                  style={{
                    backgroundColor: selectedTheme.palette.surface,
                    borderColor: `${selectedTheme.palette.accent}30`,
                  }}
                >
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: selectedTheme.palette.primary,
                      color: selectedTheme.palette.onPrimary,
                    }}
                  >
                    The Sacred Pheras
                  </span>
                  <p className="text-xs font-medium">Royal Lakeside Mandap</p>
                  <p className="text-[11px]" style={{ color: selectedTheme.palette.textMuted }}>
                    6:00 PM onwards
                  </p>
                </div>

                {/* Neutral Low-Opacity Brand Footer Mark (Never clashes!) */}
                <div
                  className="mt-10 border-t pt-4 text-center text-[10px]"
                  style={{ borderColor: `${selectedTheme.palette.accent}20` }}
                >
                  <p style={{ color: selectedTheme.palette.textMuted, opacity: 0.7 }}>
                    Made with love on <span className="font-semibold underline">Shadify</span>
                  </p>
                  <span className="mt-0.5 block text-[9px] opacity-40">
                    (Neutral monochrome footer mark adapts to couple palette)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
