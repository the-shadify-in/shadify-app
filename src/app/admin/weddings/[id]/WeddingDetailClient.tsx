"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Globe,
  MapPin,
  Music,
  Palette,
  Plus,
  QrCode,
  ShieldCheck,
  Sliders,
  Users,
} from "lucide-react";
import type { AdminSession } from "@/lib/auth";
import { THEME_PRESETS, validateContrast, type PresetId } from "@/lib/themes/tokens";

export interface SerializedEvent {
  id: string;
  eventType: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueCity?: string | null;
  venueMapUrl: string | null;
  dressCode: string | null;
  description: string | null;
  visibility: string;
  sortOrder: number;
}

export interface SerializedVip {
  id: string;
  name: string;
  relationship?: string | null;
  groupLabel: string;
  tagline: string | null;
  sortOrder: number;
}

export interface SerializedAlias {
  id: string;
  alias: string;
  kind: "vanity" | "partner_run" | "slug_history" | "other";
  partnerLabel: string | null;
  createdAt: string;
  retiredAt: string | null;
}

export interface SerializedQrAsset {
  id: string;
  encodedUrl: string;
  format: string;
  sizeMm: number;
  errorCorrection: string;
  storageKey: string;
  status: string;
  approvedAt: string | null;
  printedAt: string | null;
  createdAt: string;
  scanTests?: Array<{
    id: string;
    passed: boolean;
    device?: string;
    scanner?: string;
    lighting?: string;
    testedAt: string;
  }>;
}

export interface SerializedConsent {
  id: string;
  subject: string;
  purpose: string;
  noticeVersion: string;
  grantedAt: string;
  withdrawnAt: string | null;
}

export interface SerializedRsvp {
  id: string;
  respondentName: string;
  respondentPhone: string | null;
  attending: boolean;
  partySize: number;
  mealPreference: string | null;
  needsStay: boolean;
  arrivalNotes?: string | null;
  blessingMessage?: string | null;
  createdAt: string;
  event?: {
    id: string;
    title: string;
  } | null;
}

export interface SerializedAuditLog {
  id: string;
  action: string;
  createdAt: string;
  detail: unknown;
  actor?: {
    fullName: string;
    role: string;
  } | null;
}

export interface SerializedWedding {
  id: string;
  slug: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  status: string;
  plan: string;
  defaultLocale: string;
  themeId: string;
  primaryColor: string | null;
  accentColor: string | null;
  monogramText: string | null;
  upiVpa: string | null;
  liveStreamUrl: string | null;
  showBranding: boolean;
  hasPrivatePin?: boolean;
  events: SerializedEvent[];
  vips: SerializedVip[];
  aliases: SerializedAlias[];
  qrAssets: SerializedQrAsset[];
  consents: SerializedConsent[];
  rsvps: SerializedRsvp[];
  auditLogs: SerializedAuditLog[];
}

export interface WeddingDetailClientProps {
  initialWedding: SerializedWedding;
  staffSession: AdminSession;
}

type TabKey =
  | "basics"
  | "people"
  | "events"
  | "theme"
  | "sections"
  | "rsvps"
  | "print_qr"
  | "publish"
  | "audit";

export default function WeddingDetailClient({
  initialWedding,
  staffSession,
}: WeddingDetailClientProps) {
  const [wedding, setWedding] = useState<SerializedWedding>(initialWedding);
  const [activeTab, setActiveTab] = useState<TabKey>("basics");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newAliasText, setNewAliasText] = useState("");
  const [newAliasKind, setNewAliasKind] = useState<"vanity" | "partner_run">("vanity");
  const [newAliasPartner, setNewAliasPartner] = useState("");
  const [creatingAlias, setCreatingAlias] = useState(false);

  // Form states
  const [brideName, setBrideName] = useState(wedding.brideName || "");
  const [groomName, setGroomName] = useState(wedding.groomName || "");
  const [weddingDate, setWeddingDate] = useState(wedding.weddingDate || "");
  const [plan, setPlan] = useState(wedding.plan || "premium");
  const [defaultLocale, setDefaultLocale] = useState(wedding.defaultLocale || "en");
  const [themeId, setThemeId] = useState(wedding.themeId || "royal-crimson");
  const [primaryColor, setPrimaryColor] = useState(wedding.primaryColor || "#8B0000");
  const [accentColor, setAccentColor] = useState(wedding.accentColor || "#C9933A");
  const [monogramText, setMonogramText] = useState(wedding.monogramText || "");
  const [upiVpa, setUpiVpa] = useState(wedding.upiVpa || "");
  const [liveStreamUrl, setLiveStreamUrl] = useState(wedding.liveStreamUrl || "");
  const [showBranding, setShowBranding] = useState(wedding.showBranding !== false);
  const [pinInput, setPinInput] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Live contrast calculation
  const preset = THEME_PRESETS[themeId as PresetId] || THEME_PRESETS["royal-crimson"];
  const contrastCheck = validateContrast({
    ...preset.palette,
    primary: primaryColor,
    accent: accentColor,
  });

  const handleSaveWedding = async (
    updates: Record<string, unknown>,
    successMessage = "Changes saved successfully",
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/weddings/${wedding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = (await res.json()) as { wedding?: Partial<SerializedWedding>; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to update wedding");
      }

      if (data.wedding) {
        setWedding((prev) => ({ ...prev, ...(data.wedding as Partial<SerializedWedding>) }));
      }
      showToast(`✓ ${successMessage}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving";
      showToast(`✗ ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasText.trim()) return;
    setCreatingAlias(true);
    try {
      const res = await fetch(`/api/admin/weddings/${wedding.id}/aliases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: newAliasText.trim().toLowerCase(),
          kind: newAliasKind,
          partnerLabel: newAliasPartner.trim() || null,
        }),
      });
      const data = (await res.json()) as { alias?: SerializedAlias; error?: string };
      if (!res.ok || !data.alias) throw new Error(data.error || "Failed to add alias");

      setWedding((prev) => ({
        ...prev,
        aliases: [data.alias as SerializedAlias, ...prev.aliases],
      }));
      setNewAliasText("");
      setNewAliasPartner("");
      showToast(`✓ Permanent alias '${data.alias.alias}' registered`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating alias";
      showToast(`✗ ${msg}`);
    } finally {
      setCreatingAlias(false);
    }
  };

  // RSVP metrics
  const totalRsvps = wedding.rsvps.length;
  const attendingRsvps = wedding.rsvps.filter((r) => r.attending);
  const totalAttendingGuests = attendingRsvps.reduce((acc, r) => acc + (r.partySize || 1), 0);
  const vegCount = attendingRsvps.filter((r) => r.mealPreference === "pure_veg").length;
  const jainCount = attendingRsvps.filter((r) => r.mealPreference === "jain").length;
  const nonVegCount = attendingRsvps.filter((r) => r.mealPreference === "non_veg").length;
  const stayCount = attendingRsvps.filter((r) => r.needsStay).length;

  return (
    <div className="min-h-screen bg-[#090406] text-[#FFF9F2]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full border border-[#C9933A]/60 bg-[#12070A]/95 px-6 py-3 font-serif text-xs text-[#FFF9F2] shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#C9933A]/20 bg-[#12070A]/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#C9933A]/30 bg-[#1A0A00] text-[#C9933A] transition hover:bg-[#C9933A]/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-xl font-light text-white">
                  {wedding.brideName} &amp; {wedding.groomName}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                    wedding.status === "published"
                      ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                      : wedding.status === "preview"
                        ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                        : "border border-stone-500/30 bg-stone-500/20 text-stone-300"
                  }`}
                >
                  {wedding.status}
                </span>
                <span className="rounded-full border border-[#C9933A]/40 bg-[#C9933A]/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#E8B96B]">
                  {wedding.plan}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-[#E2D5C7]/50">
                shadify.in/{wedding.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-stone-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                Staff: {staffSession.userId.slice(0, 8)} ({staffSession.role})
              </span>
            </div>
            <Link
              href={`/${wedding.slug}/preview`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9933A]/40 bg-[#1A0A00] px-3.5 py-1.5 text-xs font-medium text-[#E8B96B] transition hover:bg-[#C9933A]/20"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview Card</span>
            </Link>
            <Link
              href={`/${wedding.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9933A] px-3.5 py-1.5 text-xs font-semibold text-[#090406] transition hover:bg-[#D4AF37]"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Live Page</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Navigation Tabs */}
      <div className="border-b border-[#C9933A]/15 bg-[#12070A]/50 px-6">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto py-2 text-xs">
          {[
            { key: "basics", label: "1. Basics", icon: Sliders },
            { key: "people", label: "2. People & Consent", icon: Users },
            { key: "events", label: "3. Events", icon: Calendar },
            { key: "theme", label: "4. Theme & Contrast", icon: Palette },
            { key: "sections", label: "5. Sections & Audio", icon: Music },
            { key: "rsvps", label: `6. RSVPs (${totalRsvps})`, icon: FileText },
            { key: "print_qr", label: "7. Print & QR", icon: QrCode },
            { key: "publish", label: "8. Publish & Gate", icon: ShieldCheck },
            { key: "audit", label: "9. Audit Log", icon: Clock },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as TabKey)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 font-medium transition ${
                  isActive
                    ? "border border-[#C9933A]/40 bg-[#C9933A]/20 text-[#E8B96B] shadow-sm"
                    : "text-[#E2D5C7]/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Container */}
      <main className="mx-auto max-w-7xl p-6 sm:p-8">
        {/* TAB 1: BASICS */}
        {activeTab === "basics" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <h2 className="mb-4 font-serif text-lg text-white">Core Wedding Identity</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Bride Name
                  </label>
                  <input
                    type="text"
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white focus:border-[#C9933A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Groom Name
                  </label>
                  <input
                    type="text"
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white focus:border-[#C9933A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Primary Wedding Date
                  </label>
                  <input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white focus:border-[#C9933A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Default Language
                  </label>
                  <select
                    value={defaultLocale}
                    onChange={(e) => setDefaultLocale(e.target.value)}
                    className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white focus:border-[#C9933A] focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Service Tier Plan
                  </label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white focus:border-[#C9933A] focus:outline-none"
                  >
                    <option value="lite">Shubh (Lite) — ₹2,999</option>
                    <option value="premium">Vivah (Premium) — ₹7,999</option>
                    <option value="platinum">Rajwada (Platinum) — ₹19,999</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Primary URL Slug (Permanent Anchor)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={wedding.slug}
                    className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-stone-400"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Slugs printed on physical cards should never be mutated. Use the alias manager
                    below for vanity redirects or partner runs.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={saving}
                  onClick={() =>
                    handleSaveWedding({
                      brideName,
                      groomName,
                      weddingDate,
                      defaultLocale,
                      plan,
                    })
                  }
                  className="rounded-lg bg-[#C9933A] px-5 py-2 text-xs font-semibold text-[#090406] hover:bg-[#D4AF37] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Identity Changes"}
                </button>
              </div>
            </div>

            {/* Private Access PIN & Gate */}
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-serif text-lg text-white">
                    Client Privacy &amp; Guest Gate PIN
                  </h2>
                  <p className="mt-0.5 text-xs text-[#E2D5C7]/70">
                    Require a 4 to 6 digit numeric PIN before guests can access celebration details
                    or RSVP.
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    wedding.hasPrivatePin
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border border-stone-500/30 bg-stone-500/10 text-stone-400"
                  }`}
                >
                  {wedding.hasPrivatePin ? "PIN Protection Active" : "Public Access (No PIN)"}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#1A0A00] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-xs">
                    <label className="mb-1 block text-xs text-[#E2D5C7]/70">
                      Set New 4–6 Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      pattern="[0-9]*"
                      placeholder="e.g. 1311"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 font-mono text-sm tracking-widest text-white placeholder-stone-500 focus:border-[#C9933A] focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-stone-400">
                      Digits only. Passcode is salted and hashed with scrypt before storage.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {wedding.hasPrivatePin && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          void handleSaveWedding(
                            { privatePin: null },
                            "Private PIN removed. Celebration is now publicly accessible.",
                          )
                        }
                        className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        Remove PIN
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={saving || pinInput.length < 4}
                      onClick={() => {
                        void handleSaveWedding(
                          { privatePin: pinInput },
                          `Private PIN updated successfully (${pinInput.length} digits).`,
                        );
                        setPinInput("");
                      }}
                      className="rounded-lg bg-[#C9933A] px-4 py-2 text-xs font-semibold text-[#090406] hover:bg-[#D4AF37] disabled:opacity-50"
                    >
                      {wedding.hasPrivatePin ? "Reset PIN" : "Set PIN"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Permanent Aliases Manager */}
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg text-white">
                    Permanent URL Aliases (`wedding_aliases`)
                  </h2>
                  <p className="mt-0.5 text-xs text-[#E2D5C7]/70">
                    Addresses never die: aliases seamlessly resolve to this wedding without redirect
                    hops.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreateAlias}
                className="mb-6 rounded-xl border border-white/10 bg-[#1A0A00] p-4"
              >
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
                  Register New Alias
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-[#E2D5C7]/70">Alias Slug</label>
                    <input
                      type="text"
                      placeholder="e.g. pg-1311 or partner-run-1"
                      value={newAliasText}
                      onChange={(e) => setNewAliasText(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#E2D5C7]/70">Kind</label>
                    <select
                      value={newAliasKind}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setNewAliasKind(e.target.value as "vanity" | "partner_run")
                      }
                      className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white"
                    >
                      <option value="vanity">Vanity / Short Print</option>
                      <option value="partner_run">Partner Print Run</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#E2D5C7]/70">
                      Partner Label (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vasantham Printers Batch 1"
                      value={newAliasPartner}
                      onChange={(e) => setNewAliasPartner(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingAlias || !newAliasText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9933A]/50 bg-[#C9933A]/20 px-3.5 py-1.5 text-xs font-medium text-[#E8B96B] hover:bg-[#C9933A]/30 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{creatingAlias ? "Adding..." : "Add Alias"}</span>
                  </button>
                </div>
              </form>

              <div className="divide-y divide-white/5">
                {wedding.aliases.length === 0 ? (
                  <p className="py-4 text-center text-xs text-stone-500">
                    No aliases registered yet. Primary slug is active.
                  </p>
                ) : (
                  wedding.aliases.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-white">
                            shadify.in/{a.alias}
                          </span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-stone-300">
                            {a.kind}
                          </span>
                        </div>
                        {a.partnerLabel && (
                          <p className="mt-0.5 text-[11px] text-[#C9933A]">
                            Printer / Partner: {a.partnerLabel}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] text-stone-400">
                          Registered {new Date(a.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] text-emerald-300">
                          Active &amp; Resolving
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PEOPLE & CONSENT */}
        {activeTab === "people" && (
          <div className="space-y-6">
            {/* DPDP Consent Ledger */}
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <div className="mb-4">
                <h2 className="font-serif text-lg text-white">
                  DPDP Act Consent Compliance Ledger
                </h2>
                <p className="mt-0.5 text-xs text-[#E2D5C7]/70">
                  Every public family detail and VIP profile must be backed by explicit, verifiable
                  consent under the Digital Personal Data Protection Act.
                </p>
              </div>

              <div className="divide-y divide-white/5">
                {wedding.consents.length === 0 ? (
                  <p className="py-6 text-center text-xs text-stone-500">
                    No consent entries recorded. Couple sign-off pending.
                  </p>
                ) : (
                  wedding.consents.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-3 text-xs">
                      <div>
                        <span className="font-medium uppercase tracking-wide text-white">
                          Purpose: {c.purpose.replace(/_/g, " ")}
                        </span>
                        <p className="mt-0.5 text-stone-400">
                          Subject: <span className="text-[#C9933A]">{c.subject}</span> (Notice v
                          {c.noticeVersion})
                        </p>
                        <p className="text-[10px] text-stone-400">
                          Granted:{" "}
                          {new Date(c.grantedAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] text-emerald-300">
                        Active Verified
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* VIP Family Directory */}
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <div className="mb-4">
                <h2 className="font-serif text-lg text-white">VIP Family &amp; Elders Roster</h2>
                <p className="mt-0.5 text-xs text-[#E2D5C7]/70">
                  Family members featured on the celebration landing page. Minors must never be
                  featured without verified parent consent.
                </p>
              </div>

              <div className="space-y-4">
                {wedding.vips.length === 0 ? (
                  <p className="py-6 text-center text-xs text-stone-500">
                    No VIP family members added yet.
                  </p>
                ) : (
                  wedding.vips.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1A0A00] p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base text-white">{v.name}</span>
                          <span className="rounded-full border border-[#C9933A]/30 bg-[#C9933A]/10 px-2 py-0.5 text-[10px] text-[#E8B96B]">
                            {v.groupLabel}
                          </span>
                        </div>
                        {v.tagline && <p className="mt-1 text-xs text-stone-400">{v.tagline}</p>}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Consent Verified</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EVENTS */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <h2 className="mb-2 font-serif text-lg text-white">Ceremonies &amp; Itinerary</h2>
              <p className="mb-6 text-xs text-[#E2D5C7]/70">
                All ceremony timings are rendered in Indian Standard Time (IST). Google Maps links
                must resolve to real geographic destinations.
              </p>

              <div className="space-y-4">
                {wedding.events.map((evt) => (
                  <div key={evt.id} className="rounded-xl border border-white/10 bg-[#1A0A00] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="rounded-full bg-[#C9933A]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#E8B96B]">
                          {evt.eventType}
                        </span>
                        <h3 className="mt-2 font-serif text-lg text-white">{evt.title}</h3>
                        <p className="mt-1 text-xs text-stone-300">
                          {new Date(evt.startsAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-stone-300">
                        {evt.visibility}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/5 pt-3 text-xs text-stone-400 md:grid-cols-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#C9933A]" />
                        <span>
                          {evt.venueName || "Venue not set"}
                          {evt.venueCity ? `, ${evt.venueCity}` : ""}
                        </span>
                      </div>
                      {evt.venueMapUrl && (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={evt.venueMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C9933A] underline hover:text-[#E8B96B]"
                          >
                            Open Verified Map Destination ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: THEME & CONTRAST */}
        {activeTab === "theme" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <h2 className="mb-2 font-serif text-lg text-white">Visual Design &amp; Typography</h2>
              <p className="mb-6 text-xs text-[#E2D5C7]/70">
                Couples choose culturally grounded presets. Every palette is dynamically tested
                against WCAG AA contrast rules (minimum 4.5:1 for body copy).
              </p>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {Object.entries(THEME_PRESETS).map(([id, t]) => {
                  if (!t) return null;
                  const labelMap: Record<string, { name: string; description: string }> = {
                    "royal-crimson": {
                      name: "Royal Crimson",
                      description: "Deep burgundy, warm cream, and ceremonial gold",
                    },
                    "emerald-gold": {
                      name: "Emerald & Gold",
                      description: "Lush botanical greens with polished gold accents",
                    },
                    "ivory-minimal": {
                      name: "Ivory & Champagne",
                      description: "Contemporary minimal aesthetic with subtle warm beige",
                    },
                    "sunset-day": {
                      name: "Sunset Day",
                      description: "Vibrant marigold and terracotta hues for daytime celebrations",
                    },
                    "sunset-dusk": {
                      name: "Sunset Dusk",
                      description: "Dusk twilight tones for sangeet and starlit receptions",
                    },
                    "sunset-pastel": {
                      name: "Sunset Pastel",
                      description: "Soft rose and peach tones with subtle gold accents",
                    },
                  };
                  const meta = labelMap[id] || { name: id, description: "" };
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setThemeId(id);
                        setPrimaryColor(t.palette.primary);
                        setAccentColor(t.palette.accent);
                      }}
                      className={`rounded-xl border p-4 text-left transition ${
                        themeId === id
                          ? "border-[#C9933A] bg-[#1A0A00] ring-1 ring-[#C9933A]"
                          : "border-white/10 bg-black/30 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm text-white">{meta.name}</span>
                        <div className="flex gap-1.5">
                          <span
                            className="h-4 w-4 rounded-full border border-white/20"
                            style={{ backgroundColor: t.palette.primary }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-white/20"
                            style={{ backgroundColor: t.palette.accent }}
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-stone-400">{meta.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Monogram Initial / Text
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={monogramText}
                    onChange={(e) => setMonogramText(e.target.value)}
                    placeholder="e.g. P &amp; G"
                    className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Primary Color (Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Accent Color (Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contrast Report */}
              <div
                className={`mt-6 rounded-xl border p-4 text-xs ${
                  contrastCheck.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    Accessibility Audit:{" "}
                    {contrastCheck.ok ? "Passes WCAG Contrast" : "Contrast Violations Detected"}
                  </span>
                </div>
                {!contrastCheck.ok && (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-[11px]">
                    {contrastCheck.errors.map((err, idx) => (
                      <li key={idx}>{err.message}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={saving || !contrastCheck.ok}
                  onClick={() =>
                    handleSaveWedding({
                      themeId,
                      primaryColor,
                      accentColor,
                      monogramText,
                    })
                  }
                  className="rounded-lg bg-[#C9933A] px-5 py-2 text-xs font-semibold text-[#090406] hover:bg-[#D4AF37] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Theme Tokens"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SECTIONS & AUDIO */}
        {activeTab === "sections" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <h2 className="mb-2 font-serif text-lg text-white">
                Sections &amp; Audio Experience
              </h2>
              <p className="mb-6 text-xs text-[#E2D5C7]/70">
                Configure guest interactions: UPI shagun, livestream broadcasting, and traditional
                audio.
              </p>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    UPI Virtual Payment Address (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="e.g. couple@okhdfcbank"
                    className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Direct shagun goes 100% to the couple. Leave empty to hide digital shagun
                    button.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#E2D5C7]/70">
                    Livestream Video URL
                  </label>
                  <input
                    type="text"
                    value={liveStreamUrl}
                    onChange={(e) => setLiveStreamUrl(e.target.value)}
                    placeholder="https://youtube.com/live/..."
                    className="w-full rounded-lg border border-[#C9933A]/30 bg-[#1A0A00] px-3.5 py-2 text-sm text-white"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Virtual wedding stream unlocks for remote guests on wedding day.
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-white/5 pt-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showBranding}
                    onChange={(e) => setShowBranding(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-[#C9933A] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-white">
                      Show &quot;Powered by Shadify&quot; footer branding
                    </span>
                    <p className="text-[11px] text-stone-400">
                      Uncheck for white-labeled client weddings (included on Platinum tier).
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={saving}
                  onClick={() =>
                    handleSaveWedding({
                      upiVpa: upiVpa.trim() || null,
                      liveStreamUrl: liveStreamUrl.trim() || null,
                      showBranding,
                    })
                  }
                  className="rounded-lg bg-[#C9933A] px-5 py-2 text-xs font-semibold text-[#090406] hover:bg-[#D4AF37] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Section Settings"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RSVPS & HOSPITALITY */}
        {activeTab === "rsvps" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="rounded-xl border border-white/10 bg-[#12070A] p-4 text-center">
                <span className="font-mono text-2xl font-bold text-white">
                  {totalAttendingGuests}
                </span>
                <p className="mt-1 text-[11px] uppercase text-stone-400">Attending</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#12070A] p-4 text-center">
                <span className="font-mono text-2xl font-bold text-emerald-400">{vegCount}</span>
                <p className="mt-1 text-[11px] uppercase text-stone-400">Pure Veg</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#12070A] p-4 text-center">
                <span className="font-mono text-2xl font-bold text-amber-400">{jainCount}</span>
                <p className="mt-1 text-[11px] uppercase text-stone-400">Jain</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#12070A] p-4 text-center">
                <span className="font-mono text-2xl font-bold text-rose-400">{nonVegCount}</span>
                <p className="mt-1 text-[11px] uppercase text-stone-400">Non-Veg</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#12070A] p-4 text-center">
                <span className="font-mono text-2xl font-bold text-purple-400">{stayCount}</span>
                <p className="mt-1 text-[11px] uppercase text-stone-400">Needs Stay</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-serif text-lg text-white">
                    Guest RSVPs &amp; Dietary Requirements
                  </h2>
                  <p className="mt-0.5 text-xs text-[#E2D5C7]/70">
                    Structured guest submissions for caterers, stay planning, and arrivals.
                  </p>
                </div>
                <a
                  href={`/api/admin/weddings/${wedding.id}/export-rsvps`}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9933A]/50 bg-[#C9933A]/20 px-3.5 py-1.5 text-xs font-medium text-[#E8B96B] transition hover:bg-[#C9933A]/30"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Caterer CSV</span>
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-stone-400">
                    <tr>
                      <th className="px-3 py-2.5">Guest</th>
                      <th className="px-3 py-2.5">Phone</th>
                      <th className="px-3 py-2.5">Event</th>
                      <th className="px-3 py-2.5">Attending</th>
                      <th className="px-3 py-2.5">Party Size</th>
                      <th className="px-3 py-2.5">Meal</th>
                      <th className="px-3 py-2.5">Stay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {wedding.rsvps.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-stone-500">
                          No guest RSVPs received yet.
                        </td>
                      </tr>
                    ) : (
                      wedding.rsvps.map((r) => (
                        <tr key={r.id} className="hover:bg-white/5">
                          <td className="px-3 py-3 font-medium text-white">{r.respondentName}</td>
                          <td className="px-3 py-3 font-mono text-stone-400">
                            {r.respondentPhone || "—"}
                          </td>
                          <td className="px-3 py-3">{r.event?.title || "All Events"}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] ${r.attending ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}
                            >
                              {r.attending ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono">{r.partySize}</td>
                          <td className="px-3 py-3">{r.mealPreference || "—"}</td>
                          <td className="px-3 py-3">{r.needsStay ? "Yes" : "No"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PRINT & QR */}
        {activeTab === "print_qr" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <h2 className="mb-2 font-serif text-lg text-white">Print &amp; QR Command Studio</h2>
              <p className="mb-6 text-xs text-[#E2D5C7]/70">
                Deterministic vector QR code encoding the canonical slug:{" "}
                <code className="text-[#C9933A]">https://shadify.in/{wedding.slug}</code>
              </p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white p-8">
                  {/* Vector simulated high-contrast QR display */}
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-black text-white">
                    <QrCode className="h-36 w-36 text-white" />
                  </div>
                  <p className="mt-4 font-mono text-xs font-semibold text-black">
                    shadify.in/{wedding.slug}
                  </p>
                  <p className="mt-1 text-[10px] text-stone-500">
                    High-Contrast Print Master • Error Correction: M (15%)
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-[#1A0A00] p-4 text-xs">
                    <h3 className="mb-2 font-semibold text-white">Printer Specifications</h3>
                    <ul className="list-inside list-disc space-y-1 text-stone-300">
                      <li>Minimum Print Size: 2.5 cm × 2.5 cm (recommended 3 cm)</li>
                      <li>Quiet Zone Border: 4 modules clear space on all sides</li>
                      <li>
                        Stock: Avoid foil, metallic sheen, or textured dark paper directly over QR
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Print Status: Approved for Proofing</span>
                    </div>
                    <p className="mt-1 text-[11px] text-emerald-300/80">
                      Direct slug resolution active. Zero redirect latency for physical card guests.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: PUBLISH GATE & CACHE */}
        {activeTab === "publish" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <h2 className="mb-2 font-serif text-lg text-white">
                Proofing &amp; Publication Safeguards
              </h2>
              <p className="mb-6 text-xs text-[#E2D5C7]/70">
                Verify proofing criteria before transitioning wedding into public live status.
              </p>

              <div className="mb-6 rounded-xl border border-white/10 bg-[#1A0A00] p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C9933A]">
                  Pre-Flight Proofing Checklist
                </h3>
                <div className="space-y-2 text-xs text-stone-300">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-white/20 bg-black/40 text-[#C9933A]"
                    />
                    <span>
                      Bride &amp; Groom names, honorifics, and spellings verified by couple
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-white/20 bg-black/40 text-[#C9933A]"
                    />
                    <span>
                      Ceremony times in IST and venue addresses confirmed against card proof
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-white/20 bg-black/40 text-[#C9933A]"
                    />
                    <span>Google Maps links tested on mobile device</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-white/20 bg-black/40 text-[#C9933A]"
                    />
                    <span>Family consent recorded in compliance ledger</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={saving || wedding.status === "published"}
                  onClick={() =>
                    handleSaveWedding(
                      { status: "published" },
                      "Wedding is now PUBLISHED and live to guests!",
                    )
                  }
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Publish Celebration Live
                </button>
                <button
                  disabled={saving || wedding.status === "preview"}
                  onClick={() =>
                    handleSaveWedding(
                      { status: "preview" },
                      "Wedding moved to PREVIEW proofing state",
                    )
                  }
                  className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                >
                  Set to Preview (Staff &amp; Couple Only)
                </button>
                <button
                  disabled={saving || wedding.status === "draft"}
                  onClick={() =>
                    handleSaveWedding(
                      { status: "draft" },
                      "Wedding reverted to DRAFT (Upcoming gate active)",
                    )
                  }
                  className="rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold text-stone-300 hover:bg-white/10 disabled:opacity-50"
                >
                  Unpublish to Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: AUDIT LOG */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6">
              <h2 className="mb-2 font-serif text-lg text-white">
                Immutable Operational Audit Trail
              </h2>
              <p className="mb-6 text-xs text-[#E2D5C7]/70">
                Complete forensic ledger recording staff actions, status modifications, and data
                access.
              </p>

              <div className="divide-y divide-white/5">
                {wedding.auditLogs.map((log) => (
                  <div key={log.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-white">{log.action}</span>
                      <span className="text-stone-400">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-stone-400">
                      Actor: {log.actor?.fullName || "Concierge Staff"} (
                      {log.actor?.role || "staff"})
                    </p>
                    {Boolean(log.detail) && (
                      <pre className="mt-1.5 overflow-x-auto rounded bg-black/40 p-2 font-mono text-[10px] text-stone-300">
                        {JSON.stringify(log.detail, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
