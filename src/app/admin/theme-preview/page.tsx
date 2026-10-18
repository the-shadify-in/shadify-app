"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { THEME_PRESETS, validateContrast } from "@/lib/themes/tokens";

export default function ThemePreviewAndSwatchPage() {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("royal-crimson");
  const selectedTheme = THEME_PRESETS[selectedPresetKey] || THEME_PRESETS["royal-crimson"];
  const contrastResult = validateContrast(selectedTheme);

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1F1A2E] font-sans">
      {/* Brand Header */}
      <header className="border-b border-[#EADDCF] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F1A2E]/70 hover:text-[#D6246E]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
            <div className="h-4 w-px bg-[#EADDCF]" />
            <h1 className="text-base font-serif font-medium text-[#1F1A2E]">
              Design System &amp; Theme Inspector
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1F6] px-3 py-1 text-xs font-medium text-[#D6246E] border border-[#D6246E]/20">
              <Sparkles className="h-3.5 w-3.5" />
              Dual Namespace Active
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-12">
        {/* ------------------------------------------------------------- */}
        {/* 1. BRAND PALETTE (ISOLATED TO ADMIN & MARKETING) */}
        {/* ------------------------------------------------------------- */}
        <section className="rounded-2xl border border-[#EADDCF] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#D6246E] uppercase">Namespace: --brand-*</span>
              <h2 className="text-xl font-serif font-medium text-[#1F1A2E]">Shadify Platform Identity</h2>
              <p className="text-xs text-[#1F1A2E]/60">Used solely in marketing, staff concierge, and error screens. Never injected into couple sites.</p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
              Zero Guest Page Bleed
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-6">
            <div className="rounded-xl border border-[#EADDCF] p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#D6246E] shadow-inner" />
              <p className="mt-2 text-xs font-semibold">Rani Pink</p>
              <p className="text-[11px] font-mono text-[#1F1A2E]/60">#D6246E</p>
              <span className="mt-1 inline-block text-[10px] text-[#D6246E] font-medium">Primary Accent</span>
            </div>

            <div className="rounded-xl border border-[#EADDCF] p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#F5A524] shadow-inner" />
              <p className="mt-2 text-xs font-semibold">Marigold</p>
              <p className="text-[11px] font-mono text-[#1F1A2E]/60">#F5A524</p>
              <span className="mt-1 inline-block text-[10px] text-amber-700 font-medium">Highlight / Badges</span>
            </div>

            <div className="rounded-xl border border-[#EADDCF] p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#0E9F8E] shadow-inner" />
              <p className="mt-2 text-xs font-semibold">Peacock Teal</p>
              <p className="text-[11px] font-mono text-[#1F1A2E]/60">#0E9F8E</p>
              <span className="mt-1 inline-block text-[10px] text-teal-700 font-medium">Secondary Accent</span>
            </div>

            <div className="rounded-xl border border-[#EADDCF] p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#3D3BC4] shadow-inner" />
              <p className="mt-2 text-xs font-semibold">Royal Indigo</p>
              <p className="text-[11px] font-mono text-[#1F1A2E]/60">#3D3BC4</p>
              <span className="mt-1 inline-block text-[10px] text-indigo-700 font-medium">Infographics</span>
            </div>

            <div className="rounded-xl border border-[#EADDCF] p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#FFFBF5] border border-gray-200 shadow-inner" />
              <p className="mt-2 text-xs font-semibold">Ivory Ground</p>
              <p className="text-[11px] font-mono text-[#1F1A2E]/60">#FFFBF5</p>
              <span className="mt-1 inline-block text-[10px] text-gray-600 font-medium">Canvas Background</span>
            </div>

            <div className="rounded-xl border border-[#EADDCF] p-3 text-center">
              <div className="h-12 w-full rounded-lg bg-[#1F1A2E] shadow-inner" />
              <p className="mt-2 text-xs font-semibold text-[#1F1A2E]">Midnight Ink</p>
              <p className="text-[11px] font-mono text-[#1F1A2E]/60">#1F1A2E</p>
              <span className="mt-1 inline-block text-[10px] text-purple-900 font-medium">Reading Text</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 2. THEME PRESETS INSPECTOR */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#941C2F] uppercase">Namespace: --theme-*</span>
              <h2 className="text-xl font-serif font-medium text-[#1F1A2E]">Couples Theme Presets</h2>
              <p className="text-xs text-[#1F1A2E]/60">Curated cultural presets with validated WCAG AA color contrast.</p>
            </div>

            {/* Preset Selector */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(THEME_PRESETS).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedPresetKey(key)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium capitalize transition-all ${
                    selectedPresetKey === key
                      ? "bg-[#1F1A2E] text-white shadow-md"
                      : "bg-white border border-[#EADDCF] text-[#1F1A2E]/70 hover:bg-[#FFF1F6]"
                  }`}
                >
                  {key.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Active Preset Inspector Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left: Token Details & Accessibility Audit */}
            <div className="rounded-2xl border border-[#EADDCF] bg-white p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold capitalize text-[#1F1A2E]">{selectedTheme.presetId.replace("-", " ")}</h3>
                <p className="text-xs text-[#1F1A2E]/60">Preset Version: {selectedTheme.version}.0</p>
              </div>

              {/* Contrast Checker Card */}
              <div className={`rounded-xl border p-4 text-xs ${
                contrastResult.valid ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  {contrastResult.valid ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                  <span>WCAG AA Contrast: {contrastResult.ratio}:1</span>
                </div>
                <p className="mt-1 text-[11px] opacity-80">
                  {contrastResult.valid 
                    ? "Passes 4.5:1 ratio. High legibility in harsh Indian outdoor sunlight."
                    : "Fails 4.5:1 ratio. Adjust textPrimary or background to prevent eye strain."}
                </p>
              </div>

              {/* Palette Details */}
              <div className="space-y-3 text-xs">
                <p className="font-semibold text-[#1F1A2E]/80">Palette Tokens</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: selectedTheme.palette.primary }} />
                    <span>Primary: {selectedTheme.palette.primary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border" style={{ backgroundColor: selectedTheme.palette.accent }} />
                    <span>Accent: {selectedTheme.palette.accent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border" style={{ backgroundColor: selectedTheme.palette.background }} />
                    <span>Background: {selectedTheme.palette.background}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border" style={{ backgroundColor: selectedTheme.palette.surface }} />
                    <span>Surface: {selectedTheme.palette.surface}</span>
                  </div>
                </div>
              </div>

              {/* Typography & Monogram */}
              <div className="border-t border-[#EADDCF] pt-4 text-xs space-y-2">
                <p><span className="font-semibold">Display Font:</span> {selectedTheme.typography.displayFont}</p>
                <p><span className="font-semibold">Body Font:</span> {selectedTheme.typography.bodyFont}</p>
                <p><span className="font-semibold">Monogram:</span> &ldquo;{selectedTheme.monogram.text}&rdquo; ({selectedTheme.monogram.style})</p>
                <p><span className="font-semibold">Ornaments:</span> {selectedTheme.ornaments.motif} ({selectedTheme.ornaments.borderStyle})</p>
              </div>
            </div>

            {/* Right: Live Scoped Simulated Mobile Viewport */}
            <div className="lg:col-span-2 flex justify-center">
              <div 
                className="w-full max-w-sm rounded-[32px] border-4 border-[#2B2327] p-6 shadow-2xl transition-all"
                style={{ 
                  backgroundColor: selectedTheme.palette.background,
                  color: selectedTheme.palette.textPrimary,
                  fontFamily: `"${selectedTheme.typography.bodyFont}", sans-serif`
                }}
              >
                {/* Simulated Envelope Seal */}
                <div 
                  className="rounded-2xl border p-6 text-center shadow-lg mb-6"
                  style={{
                    backgroundColor: selectedTheme.palette.surface,
                    borderColor: `${selectedTheme.palette.accent}40`,
                  }}
                >
                  <div 
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border text-sm font-serif font-bold shadow-md"
                    style={{
                      backgroundColor: selectedTheme.palette.waxSeal,
                      borderColor: selectedTheme.palette.accent,
                      color: selectedTheme.palette.accent,
                    }}
                  >
                    {selectedTheme.monogram.text}
                  </div>
                  <p className="text-[10px] tracking-widest uppercase" style={{ color: selectedTheme.palette.accent }}>
                    Royal Wedding Invitation
                  </p>
                  <h4 
                    className="mt-1 text-2xl font-light"
                    style={{ fontFamily: `"${selectedTheme.typography.displayFont}", serif` }}
                  >
                    Priya &amp; Rahul
                  </h4>
                  <p className="mt-1 text-xs opacity-70" style={{ color: selectedTheme.palette.textMuted }}>
                    December 14, 2026 • Udaipur
                  </p>
                </div>

                {/* Ceremony Schedule Card */}
                <div 
                  className="rounded-xl border p-4 space-y-2"
                  style={{
                    backgroundColor: selectedTheme.palette.surface,
                    borderColor: `${selectedTheme.palette.accent}30`,
                  }}
                >
                  <span 
                    className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: `${selectedTheme.palette.primary}30`, color: selectedTheme.palette.accent }}
                  >
                    The Sacred Pheras
                  </span>
                  <p className="text-xs font-medium">Royal Lakeside Mandap</p>
                  <p className="text-[11px] opacity-70" style={{ color: selectedTheme.palette.textMuted }}>6:00 PM onwards</p>
                </div>

                {/* Neutral Low-Opacity Brand Footer Mark (Never clashes!) */}
                <div className="mt-10 pt-4 border-t text-center text-[10px]" style={{ borderColor: `${selectedTheme.palette.textMuted}20` }}>
                  <p style={{ color: selectedTheme.palette.textMuted, opacity: 0.4 }}>
                    Made with love on <span className="font-semibold underline">Shadify</span>
                  </p>
                  <span className="block mt-0.5 text-[9px] opacity-30">
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
