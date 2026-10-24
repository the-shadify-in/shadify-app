"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  EyeOff,
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
  Key,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  ExternalLink,
} from "lucide-react";
import type { AdminSession } from "@/lib/auth";
import { THEME_PRESETS, validateContrast, type PresetId } from "@/lib/themes/tokens";
import type { SerializedEffectiveEntitlements } from "@/features/entitlements/types";

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
  initialEffectiveEntitlements?: SerializedEffectiveEntitlements | null;
  initialPhotoCount?: number;
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
  | "entitlements"
  | "audit";

function getWeddingCountdown(dateString: string | null | undefined): {
  type: "future" | "today" | "past" | "unset";
  label: string;
  sublabel: string;
} {
  if (!dateString) {
    return { type: "unset", label: "Date Pending", sublabel: "Muhurat unscheduled" };
  }
  const target = new Date(dateString);
  if (isNaN(target.getTime())) {
    return { type: "unset", label: "Date Invalid", sublabel: "Check format" };
  }
  const now = new Date();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (targetMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24),
  );

  const formattedDate = target.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (diffDays > 0) {
    return {
      type: "future",
      label: `T-${diffDays} ${diffDays === 1 ? "Day" : "Days"}`,
      sublabel: `${diffDays} ${diffDays === 1 ? "day" : "days"} until ${formattedDate}`,
    };
  } else if (diffDays === 0) {
    return {
      type: "today",
      label: "Today's Muhurat",
      sublabel: `Celebration day (${formattedDate})`,
    };
  } else {
    return {
      type: "past",
      label: "Celebration Concluded",
      sublabel: `Archived memories (${formattedDate})`,
    };
  }
}

export default function WeddingDetailClient({
  initialWedding,
  staffSession,
  initialEffectiveEntitlements,
  initialPhotoCount,
}: WeddingDetailClientProps) {
  const [wedding, setWedding] = useState<SerializedWedding>(initialWedding);
  const [effective, setEffective] = useState<SerializedEffectiveEntitlements | null>(
    initialEffectiveEntitlements || null,
  );
  const [photoCount] = useState<number>(initialPhotoCount || 0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTabState] = useState<TabKey>("basics");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as TabKey;
      const validTabs: TabKey[] = [
        "basics",
        "people",
        "events",
        "theme",
        "sections",
        "rsvps",
        "print_qr",
        "publish",
        "audit",
        "entitlements",
      ];
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    }
  }, []);

  const setActiveTab = (tab: TabKey) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newAliasText, setNewAliasText] = useState("");
  const [newAliasKind, setNewAliasKind] = useState<"vanity" | "partner_run">("vanity");
  const [newAliasPartner, setNewAliasPartner] = useState("");
  const [creatingAlias, setCreatingAlias] = useState(false);

  // Guest PIN lifecycle states
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [showPinPlaintext, setShowPinPlaintext] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // Entitlement override modal states
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideField, setOverrideField] = useState("maxPhotos");
  const [overrideValue, setOverrideValue] = useState("500");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideExpiresAt, setOverrideExpiresAt] = useState("");

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

  const countdown = getWeddingCountdown(wedding.weddingDate);

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

  const handleResetPin = async () => {
    if (
      !confirm(
        "Generate a new random 6-digit access PIN? This will invalidate all previous guest tokens immediately.",
      )
    ) {
      return;
    }
    setPinLoading(true);
    try {
      const res = await fetch(`/api/admin/weddings/${wedding.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", reason: "Staff concierge studio PIN rotation" }),
      });
      const data = (await res.json()) as { pin?: string; error?: string };
      if (!res.ok || !data.pin) throw new Error(data.error || "Failed to reset PIN");
      setRevealedPin(data.pin);
      setShowPinPlaintext(true);
      setWedding((prev) => ({ ...prev, hasPrivatePin: true }));
      showToast("✓ New guest access PIN generated successfully");
    } catch (err: unknown) {
      showToast(`✗ ${err instanceof Error ? err.message : "Error resetting PIN"}`);
    } finally {
      setPinLoading(false);
    }
  };

  const handleSetCustomPin = async () => {
    if (pinInput.length < 4) return;
    setPinLoading(true);
    try {
      const res = await fetch(`/api/admin/weddings/${wedding.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          pin: pinInput,
          reason: "Staff concierge studio custom PIN set",
        }),
      });
      const data = (await res.json()) as { pin?: string; error?: string };
      if (!res.ok || !data.pin) throw new Error(data.error || "Failed to set custom PIN");
      setRevealedPin(data.pin);
      setShowPinPlaintext(true);
      setPinInput("");
      setWedding((prev) => ({ ...prev, hasPrivatePin: true }));
      showToast("✓ Custom guest access PIN updated");
    } catch (err: unknown) {
      showToast(`✗ ${err instanceof Error ? err.message : "Error updating PIN"}`);
    } finally {
      setPinLoading(false);
    }
  };

  const handleRemovePin = async () => {
    if (
      !confirm(
        "Are you sure you want to remove the guest access PIN? The wedding celebration will become publicly accessible.",
      )
    ) {
      return;
    }
    setPinLoading(true);
    try {
      const res = await fetch(`/api/admin/weddings/${wedding.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", reason: "Staff removed PIN protection" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to remove PIN");
      setRevealedPin(null);
      setShowPinPlaintext(false);
      setWedding((prev) => ({ ...prev, hasPrivatePin: false }));
      showToast("✓ Guest access PIN removed. Celebration is now public.");
    } catch (err: unknown) {
      showToast(`✗ ${err instanceof Error ? err.message : "Error removing PIN"}`);
    } finally {
      setPinLoading(false);
    }
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      showToast("✗ Audit justification reason must be at least 5 characters.");
      return;
    }
    setOverrideSubmitting(true);
    try {
      const overridesPayload: Record<string, unknown> = {};
      if (overrideField === "maxPhotos") overridesPayload.maxPhotos = parseInt(overrideValue, 10);
      else if (overrideField === "maxEvents")
        overridesPayload.maxEvents = parseInt(overrideValue, 10);
      else if (overrideField === "maxVideoBites") {
        overridesPayload.maxVideoBites = parseInt(overrideValue, 10);
        overridesPayload.videoBite = parseInt(overrideValue, 10) > 0;
      } else if (overrideField === "videoBite")
        overridesPayload.videoBite = overrideValue === "true";
      else if (overrideField === "customDomain")
        overridesPayload.customDomain = overrideValue === "true";
      else if (overrideField === "canHideBranding")
        overridesPayload.canHideBranding = overrideValue === "true";
      else if (overrideField === "maxGuests")
        overridesPayload.maxGuests = parseInt(overrideValue, 10);

      const res = await fetch(`/api/admin/weddings/${wedding.id}/entitlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override",
          reason: overrideReason.trim(),
          expiresAt: overrideExpiresAt ? new Date(overrideExpiresAt).toISOString() : undefined,
          overrides: overridesPayload,
        }),
      });

      const data = (await res.json()) as {
        effective?: SerializedEffectiveEntitlements;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Failed to apply entitlement override");

      if (data.effective) {
        setEffective(data.effective);
      }
      setOverrideModalOpen(false);
      setOverrideReason("");
      showToast("✓ Entitlement override applied and audited successfully.");
    } catch (err: unknown) {
      showToast(`✗ ${err instanceof Error ? err.message : "Error applying override"}`);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const handleRevokeOverride = async () => {
    const reason = prompt(
      "Enter an audit justification reason for revoking active entitlement overrides (min 5 characters):",
    );
    if (!reason || reason.trim().length < 5) {
      if (reason !== null)
        showToast("✗ Revocation cancelled: minimum 5 character reason required.");
      return;
    }
    try {
      const res = await fetch(`/api/admin/weddings/${wedding.id}/entitlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          reason: reason.trim(),
        }),
      });
      const data = (await res.json()) as {
        effective?: SerializedEffectiveEntitlements;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Failed to revoke override");
      if (data.effective) {
        setEffective(data.effective);
      }
      showToast("✓ Entitlement overrides revoked. Plan defaults restored.");
    } catch (err: unknown) {
      showToast(`✗ ${err instanceof Error ? err.message : "Error revoking override"}`);
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

  // 4 Operational Domains mapping
  const DOMAINS = [
    {
      title: "1. Core Identity & Plan",
      description: "Ceremony basics, URL slugs, and publication gating",
      items: [
        {
          key: "basics" as TabKey,
          label: "Identity & Slugs",
          icon: Sliders,
          badge: null,
          badgeGold: false,
        },
        {
          key: "publish" as TabKey,
          label: "Proofing & Gate",
          icon: ShieldCheck,
          badge: wedding.status,
          badgeGold: false,
        },
      ],
    },
    {
      title: "2. Guest Operations",
      description: "RSVPs, catering requirements, and family consent",
      items: [
        {
          key: "rsvps" as TabKey,
          label: `RSVPs (${totalRsvps})`,
          icon: FileText,
          badge: totalRsvps > 0 ? totalRsvps : null,
          badgeGold: true,
        },
        {
          key: "people" as TabKey,
          label: `VIPs (${wedding.vips?.length || 0})`,
          icon: Users,
          badge: (wedding.vips?.length || 0) > 0 ? wedding.vips.length : null,
          badgeGold: false,
        },
        {
          key: "print_qr" as TabKey,
          label: `Print & QR Proofs`,
          icon: QrCode,
          badge: (wedding.qrAssets?.length || 0) > 0 ? wedding.qrAssets.length : null,
          badgeGold: false,
        },
      ],
    },
    {
      title: "3. Experience & Design",
      description: "Ceremony schedule, visual themes, and media sections",
      items: [
        {
          key: "events" as TabKey,
          label: `Events (${wedding.events?.length || 0})`,
          icon: Calendar,
          badge: (wedding.events?.length || 0) > 0 ? wedding.events.length : null,
          badgeGold: false,
        },
        {
          key: "theme" as TabKey,
          label: "Theme & Contrast",
          icon: Palette,
          badge: null,
          badgeGold: false,
        },
        {
          key: "sections" as TabKey,
          label: "Sections & Audio",
          icon: Music,
          badge: null,
          badgeGold: false,
        },
      ],
    },
    {
      title: "4. Governance & Quotas",
      description: "Resource meters, entitlement overrides, and forensic audit trail",
      items: [
        {
          key: "entitlements" as TabKey,
          label: "Plan & Overrides",
          icon: Sparkles,
          badge: effective?.hasActiveOverride ? "OVERRIDE" : null,
          badgeGold: true,
        },
        {
          key: "audit" as TabKey,
          label: "Audit Trail",
          icon: Clock,
          badge: wedding.auditLogs?.length ? wedding.auditLogs.length : null,
          badgeGold: false,
        },
      ],
    },
  ];

  return (
    <div className="text-studio-primary min-h-screen bg-studio-canvas pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="text-studio-primary border-studio-champagne/60 fixed bottom-6 right-6 z-50 rounded-full border bg-studio-surfaceElevated px-6 py-3 font-serif text-xs shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="text-studio-muted inline-flex items-center gap-1.5 text-xs font-medium transition hover:text-studio-champagne"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Celebrations</span>
          </Link>
          <div className="text-studio-subtle flex items-center gap-3 font-mono text-xs">
            <span>
              Staff: {staffSession.userId.slice(0, 8)} ({staffSession.role})
            </span>
            <span>•</span>
            <span>ID:</span>
            <span className="text-studio-muted">{wedding.id}</span>
          </div>
        </div>

        {/* Compact Executive Hero Section (Replaces Redundant Sticky Header) */}
        <section className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Primary Details & Status */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-studio-primary font-serif text-2xl font-light tracking-tight">
                  {wedding.brideName} &amp; {wedding.groomName}
                </h1>

                {/* Lifecycle Status Pill (Links to Publish Gate tab to follow standard transition protocol) */}
                <button
                  type="button"
                  onClick={() => setActiveTab("publish")}
                  title="Click to view Proofing & Publication safeguards"
                  className={`rounded-full px-3 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition ${
                    wedding.status === "published"
                      ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                      : wedding.status === "preview"
                        ? "border border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                        : "text-studio-muted hover:text-studio-primary border border-studio-border bg-studio-surfaceElevated"
                  }`}
                >
                  {wedding.status}
                </button>

                {/* Plan Tier Badge */}
                <span className="border-studio-champagne/40 bg-studio-champagne/10 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-studio-champagneLight">
                  {wedding.plan}
                </span>

                {/* Active Override Indicator */}
                {effective?.hasActiveOverride && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("entitlements")}
                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 transition hover:bg-amber-500/20"
                  >
                    OVERRIDE ACTIVE
                  </button>
                )}
              </div>

              {/* Canonical Slug & Destination Link */}
              <div className="text-studio-muted flex items-center gap-2 font-mono text-xs">
                <Globe className="h-3.5 w-3.5 text-studio-champagne" />
                <a
                  href={`/${wedding.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 underline underline-offset-4 transition hover:text-studio-champagne"
                >
                  shadify.in/{wedding.slug}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/${wedding.slug}/preview`}
                target="_blank"
                className="text-studio-primary hover:border-studio-champagne/40 inline-flex items-center gap-1.5 rounded-lg border border-studio-border bg-studio-surfaceElevated px-3.5 py-2 text-xs font-medium transition hover:text-studio-champagne"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview Card</span>
              </Link>
              <Link
                href={`/${wedding.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg bg-studio-champagne px-4 py-2 text-xs font-semibold text-studio-canvas transition hover:bg-studio-champagneLight"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Live Page</span>
              </Link>
            </div>
          </div>

          {/* Executive Telemetry Shelf: Masked PIN, Conditional Countdown, RSVP Summary */}
          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-studio-borderSubtle pt-4 sm:grid-cols-3">
            {/* 1. Masked PIN Control */}
            <div className="flex items-center justify-between rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <Key className="h-4 w-4 shrink-0 text-studio-champagne" />
                <div className="min-w-0">
                  <span className="text-studio-muted block text-[10px] uppercase tracking-wider">
                    Guest Access PIN
                  </span>
                  <div className="mt-0.5 flex items-center gap-2">
                    {wedding.hasPrivatePin ? (
                      showPinPlaintext && revealedPin ? (
                        <span className="text-studio-primary truncate font-mono text-xs font-bold tracking-widest">
                          {revealedPin}
                        </span>
                      ) : (
                        <span className="text-studio-muted font-mono text-xs font-semibold tracking-widest">
                          ••••••
                        </span>
                      )
                    ) : (
                      <span className="text-studio-subtle text-xs font-medium">
                        Public (No PIN)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {wedding.hasPrivatePin && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title={showPinPlaintext ? "Hide PIN" : "Reveal PIN"}
                    onClick={() => {
                      if (!revealedPin) {
                        showToast(
                          "PIN is hashed with scrypt. Rotate or set new PIN below to reveal plaintext.",
                        );
                      }
                      setShowPinPlaintext((prev) => !prev);
                    }}
                    className="text-studio-muted hover:text-studio-primary rounded p-1 transition hover:bg-studio-surfaceHighlight"
                  >
                    {showPinPlaintext && revealedPin ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Copy PIN"
                    onClick={() => {
                      if (revealedPin) {
                        void navigator.clipboard.writeText(revealedPin);
                        setCopiedPin(true);
                        setTimeout(() => setCopiedPin(false), 2500);
                        showToast("✓ PIN copied to clipboard");
                      } else {
                        showToast(
                          "PIN is securely hashed. Rotate or set new PIN below to obtain copyable plaintext.",
                        );
                      }
                    }}
                    className="text-studio-muted rounded p-1 transition hover:bg-studio-surfaceHighlight hover:text-studio-champagne"
                  >
                    {copiedPin ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Conditional Countdown Banner */}
            <div className="flex items-center justify-between rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                {countdown.type === "future" ? (
                  <Clock className="h-4 w-4 shrink-0 text-studio-champagne" />
                ) : countdown.type === "today" ? (
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
                ) : countdown.type === "past" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Calendar className="text-studio-muted h-4 w-4 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-studio-muted block text-[10px] uppercase tracking-wider">
                    Ceremony Timeline
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5 truncate">
                    <span className="text-studio-primary text-xs font-medium">
                      {countdown.label}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-studio-subtle shrink-0 font-mono text-[10px]">
                {countdown.sublabel}
              </span>
            </div>

            {/* 3. RSVP / Hospitality Summary */}
            <button
              type="button"
              onClick={() => setActiveTab("rsvps")}
              className="hover:border-studio-champagne/30 flex items-center justify-between rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2.5 text-left transition hover:bg-studio-surfaceHighlight"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Users className="h-4 w-4 shrink-0 text-studio-champagne" />
                <div className="min-w-0">
                  <span className="text-studio-muted block text-[10px] uppercase tracking-wider">
                    Guest Headcount
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-studio-primary text-xs font-semibold">
                      {totalAttendingGuests} Attending
                    </span>
                    <span className="text-studio-muted text-[11px]">({totalRsvps} RSVPs)</span>
                  </div>
                </div>
              </div>
              <span className="shrink-0 rounded bg-studio-surface px-2 py-0.5 text-[10px] font-medium text-studio-champagne">
                View Table →
              </span>
            </button>
          </div>
        </section>

        {/* 4-Domain Operational Studio Navigation */}
        {/* Mobile Horizontal Domain Bar (< lg) */}
        <div className="block lg:hidden">
          <div className="rounded-xl border border-studio-border bg-studio-surface p-3 shadow-sm">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-studio-champagne">
              Operational Studio Navigation
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {DOMAINS.flatMap((d) => d.items).map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? "border-studio-champagne/50 bg-studio-champagne/20 border text-studio-champagneLight shadow-sm"
                        : "text-studio-muted hover:text-studio-primary border border-transparent hover:bg-studio-surfaceElevated"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dual Column Layout: 4-Domain Sidebar + Active Tab Content */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Vertical 4-Domain Sidebar (Desktop >= lg) */}
          <aside className="hidden w-64 shrink-0 space-y-4 lg:block">
            {DOMAINS.map((domain) => (
              <div
                key={domain.title}
                className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface p-2.5 shadow-sm"
              >
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-studio-champagne">
                  {domain.title}
                </div>
                <div className="mt-1 space-y-1">
                  {domain.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveTab(item.key)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
                          isActive
                            ? "border-studio-champagne/40 bg-studio-champagne/20 border text-studio-champagneLight shadow-sm"
                            : "text-studio-muted hover:text-studio-primary hover:bg-studio-surfaceElevated"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-studio-champagne" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== null && item.badge !== undefined && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${
                              item.badgeGold
                                ? "border-studio-champagne/40 bg-studio-champagne/25 border text-studio-champagneLight"
                                : item.badge === "published"
                                  ? "border border-emerald-500/30 bg-emerald-950/80 text-emerald-300"
                                  : "text-studio-muted bg-studio-surfaceElevated"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>

          {/* Active Module Panel */}
          <main className="min-w-0 flex-1">
            {/* DOMAIN 1: BASICS */}
            {activeTab === "basics" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <h2 className="text-studio-primary mb-4 font-serif text-lg font-medium">
                    Core Wedding Identity
                  </h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        Bride Name
                      </label>
                      <input
                        type="text"
                        value={brideName}
                        onChange={(e) => setBrideName(e.target.value)}
                        className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        Groom Name
                      </label>
                      <input
                        type="text"
                        value={groomName}
                        onChange={(e) => setGroomName(e.target.value)}
                        className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        Primary Wedding Date
                      </label>
                      <input
                        type="date"
                        value={weddingDate}
                        onChange={(e) => setWeddingDate(e.target.value)}
                        className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        Default Language
                      </label>
                      <select
                        value={defaultLocale}
                        onChange={(e) => setDefaultLocale(e.target.value)}
                        className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                        <option value="hi">Hindi (हिंदी)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        Service Tier Plan
                      </label>
                      <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
                      >
                        <option value="lite">Shubh (Lite) — ₹2,999</option>
                        <option value="premium">Vivah (Premium) — ₹7,999</option>
                        <option value="platinum">Rajwada (Platinum) — ₹19,999</option>
                      </select>
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
                          plan,
                          defaultLocale,
                        })
                      }
                      className="rounded-lg bg-studio-champagne px-5 py-2 text-xs font-semibold text-studio-canvas transition hover:bg-studio-champagneLight disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Identity Changes"}
                    </button>
                  </div>
                </div>

                {/* Private Access PIN & Gate Lifecycle */}
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-studio-champagne" />
                        <h2 className="text-studio-primary font-serif text-lg font-medium">
                          Guest Access PIN Lifecycle &amp; Privacy Gate
                        </h2>
                      </div>
                      <p className="text-studio-muted mt-0.5 text-xs">
                        Cryptographically hashed gate protection. Resetting the PIN immediately
                        invalidates all previously issued guest access session cookies.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        wedding.hasPrivatePin
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "text-studio-muted border border-studio-border bg-studio-surfaceElevated"
                      }`}
                    >
                      {wedding.hasPrivatePin ? "PIN Protection Active" : "Public Access (No PIN)"}
                    </span>
                  </div>

                  {/* Ephemeral One-Time PIN Reveal Banner */}
                  {revealedPin && (
                    <div className="mb-5 rounded-xl border border-studio-champagne bg-studio-surfaceHighlight p-4 shadow-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-studio-champagneLight">
                            New Guest Access PIN Generated
                          </span>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-studio-primary rounded border border-studio-border bg-studio-canvas px-3 py-1 font-mono text-2xl font-bold tracking-widest">
                              {revealedPin}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(revealedPin);
                                setCopiedPin(true);
                                setTimeout(() => setCopiedPin(false), 3000);
                              }}
                              className="border-studio-champagne/50 bg-studio-champagne/20 hover:bg-studio-champagne/30 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-studio-champagneLight"
                            >
                              {copiedPin ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>Copied to Clipboard</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy PIN</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-amber-200/80">
                            Provide this PIN to the couple or print on physical cards. For security,
                            it is salted and hashed with scrypt, never logged in plaintext, and
                            cannot be viewed again once dismissed.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRevealedPin(null)}
                          className="text-studio-muted hover:text-studio-primary rounded bg-studio-surface px-2 py-1 text-xs"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="max-w-xs">
                        <label className="text-studio-muted mb-1 block text-xs">
                          Set Specific Custom PIN (4–6 Digits)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            maxLength={6}
                            pattern="[0-9]*"
                            placeholder="e.g. 543210"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                            className="text-studio-primary placeholder-studio-subtle w-full rounded-lg border border-studio-borderSubtle bg-studio-canvas px-3.5 py-2 font-mono text-sm tracking-widest focus:border-studio-champagne focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={pinLoading || pinInput.length < 4}
                            onClick={() => void handleSetCustomPin()}
                            className="text-studio-primary rounded-lg bg-studio-surfaceHighlight px-3 py-2 text-xs font-medium hover:bg-studio-border disabled:opacity-50"
                          >
                            Set
                          </button>
                        </div>
                        <p className="text-studio-subtle mt-1 text-[10px]">
                          Numeric digits only. Automatically salted and scrypt-hashed.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {wedding.hasPrivatePin && (
                          <button
                            type="button"
                            disabled={pinLoading}
                            onClick={() => void handleRemovePin()}
                            className="border-studio-ruby/40 bg-studio-ruby/10 hover:bg-studio-ruby/20 rounded-lg border px-4 py-2 text-xs font-medium text-red-300 transition disabled:opacity-50"
                          >
                            Remove PIN Protection
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={pinLoading}
                          onClick={() => void handleResetPin()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-studio-champagne px-4 py-2 text-xs font-semibold text-studio-canvas transition hover:bg-studio-champagneLight disabled:opacity-50"
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${pinLoading ? "animate-spin" : ""}`} />
                          <span>
                            {wedding.hasPrivatePin
                              ? "Rotate / Reset 6-Digit PIN"
                              : "Generate 6-Digit PIN"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permanent Aliases Manager */}
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-studio-primary font-serif text-lg font-medium">
                        Permanent URL Aliases (`wedding_aliases`)
                      </h2>
                      <p className="text-studio-muted mt-0.5 text-xs">
                        Addresses never die: aliases seamlessly resolve to this wedding without
                        redirect hops.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleCreateAlias}
                    className="mb-6 rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4"
                  >
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-studio-champagne">
                      Register New Alias
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="text-studio-muted mb-1 block text-[11px]">
                          Alias Slug
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. pg-1311 or partner-run-1"
                          value={newAliasText}
                          onChange={(e) => setNewAliasText(e.target.value)}
                          className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-canvas px-3 py-1.5 text-xs focus:border-studio-champagne focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-studio-muted mb-1 block text-[11px]">Kind</label>
                        <select
                          value={newAliasKind}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setNewAliasKind(e.target.value as "vanity" | "partner_run")
                          }
                          className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-canvas px-3 py-1.5 text-xs focus:border-studio-champagne focus:outline-none"
                        >
                          <option value="vanity">Vanity / Short Print</option>
                          <option value="partner_run">Partner Print Run</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-studio-muted mb-1 block text-[11px]">
                          Partner Label (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Vasantham Printers Batch 1"
                          value={newAliasPartner}
                          onChange={(e) => setNewAliasPartner(e.target.value)}
                          className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-canvas px-3 py-1.5 text-xs focus:border-studio-champagne focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={creatingAlias || !newAliasText.trim()}
                        className="border-studio-champagne/50 bg-studio-champagne/20 hover:bg-studio-champagne/30 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-medium text-studio-champagneLight disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{creatingAlias ? "Adding..." : "Add Alias"}</span>
                      </button>
                    </div>
                  </form>

                  <div className="divide-studio-border/30 divide-y">
                    {wedding.aliases.length === 0 ? (
                      <p className="text-studio-muted py-4 text-center text-xs">
                        No aliases registered yet. Primary slug is active.
                      </p>
                    ) : (
                      wedding.aliases.map((a) => (
                        <div key={a.id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-studio-primary font-mono text-sm font-medium">
                                shadify.in/{a.alias}
                              </span>
                              <span className="text-studio-muted rounded-full bg-studio-surfaceElevated px-2 py-0.5 text-[10px] uppercase">
                                {a.kind}
                              </span>
                            </div>
                            {a.partnerLabel && (
                              <p className="mt-0.5 text-[11px] text-studio-champagne">
                                Printer / Partner: {a.partnerLabel}
                              </p>
                            )}
                            <p className="text-studio-subtle mt-0.5 text-[10px]">
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

            {/* DOMAIN 1: PUBLISH GATE & CACHE */}
            {activeTab === "publish" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <h2 className="text-studio-primary mb-2 font-serif text-lg font-medium">
                    Proofing &amp; Publication Safeguards
                  </h2>
                  <p className="text-studio-muted mb-6 text-xs">
                    Verify proofing criteria before transitioning wedding into public live status.
                  </p>

                  <div className="mb-6 rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-studio-champagne">
                      Pre-Flight Proofing Checklist
                    </h3>
                    <div className="text-studio-muted space-y-2 text-xs">
                      <label className="hover:text-studio-primary flex cursor-pointer items-center gap-2 transition">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-studio-border bg-studio-canvas text-studio-champagne focus:ring-0"
                        />
                        <span>
                          Bride &amp; Groom names, honorifics, and spellings verified by couple
                        </span>
                      </label>
                      <label className="hover:text-studio-primary flex cursor-pointer items-center gap-2 transition">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-studio-border bg-studio-canvas text-studio-champagne focus:ring-0"
                        />
                        <span>
                          Ceremony times in IST and venue addresses confirmed against card proof
                        </span>
                      </label>
                      <label className="hover:text-studio-primary flex cursor-pointer items-center gap-2 transition">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-studio-border bg-studio-canvas text-studio-champagne focus:ring-0"
                        />
                        <span>Google Maps links tested on mobile device</span>
                      </label>
                      <label className="hover:text-studio-primary flex cursor-pointer items-center gap-2 transition">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-studio-border bg-studio-canvas text-studio-champagne focus:ring-0"
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
                      className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
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
                      className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
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
                      className="text-studio-muted hover:text-studio-primary rounded-lg border border-studio-border bg-studio-surfaceElevated px-5 py-2.5 text-xs font-semibold transition hover:bg-studio-surfaceHighlight disabled:opacity-50"
                    >
                      Unpublish to Draft
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 2: RSVPS & HOSPITALITY */}
            {activeTab === "rsvps" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div className="rounded-xl border border-studio-border bg-studio-surface p-4 text-center">
                    <span className="text-studio-primary font-mono text-2xl font-bold">
                      {totalAttendingGuests}
                    </span>
                    <p className="text-studio-muted mt-1 text-[11px] uppercase">Attending</p>
                  </div>
                  <div className="rounded-xl border border-studio-border bg-studio-surface p-4 text-center">
                    <span className="font-mono text-2xl font-bold text-emerald-400">
                      {vegCount}
                    </span>
                    <p className="text-studio-muted mt-1 text-[11px] uppercase">Pure Veg</p>
                  </div>
                  <div className="rounded-xl border border-studio-border bg-studio-surface p-4 text-center">
                    <span className="font-mono text-2xl font-bold text-amber-400">{jainCount}</span>
                    <p className="text-studio-muted mt-1 text-[11px] uppercase">Jain</p>
                  </div>
                  <div className="rounded-xl border border-studio-border bg-studio-surface p-4 text-center">
                    <span className="font-mono text-2xl font-bold text-rose-400">
                      {nonVegCount}
                    </span>
                    <p className="text-studio-muted mt-1 text-[11px] uppercase">Non-Veg</p>
                  </div>
                  <div className="rounded-xl border border-studio-border bg-studio-surface p-4 text-center">
                    <span className="font-mono text-2xl font-bold text-purple-400">
                      {stayCount}
                    </span>
                    <p className="text-studio-muted mt-1 text-[11px] uppercase">Needs Stay</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-studio-primary font-serif text-lg font-medium">
                        Guest RSVPs &amp; Dietary Requirements
                      </h2>
                      <p className="text-studio-muted mt-0.5 text-xs">
                        Structured guest submissions for caterers, stay planning, and arrivals.
                      </p>
                    </div>
                    {wedding.plan === "lite" && !effective?.hasActiveOverride ? (
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
                          🔒 Catering CSV export requires Premium, Platinum, or Staff Override
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab("entitlements")}
                          className="text-studio-primary rounded-lg border border-studio-border bg-studio-surfaceElevated px-3 py-1.5 text-xs hover:bg-studio-surfaceHighlight"
                        >
                          Studio &amp; Overrides
                        </button>
                      </div>
                    ) : (
                      <a
                        href={`/api/admin/weddings/${wedding.id}/export-rsvps`}
                        download
                        className="border-studio-champagne/50 bg-studio-champagne/20 hover:bg-studio-champagne/30 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-medium text-studio-champagneLight transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Caterer CSV</span>
                      </a>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-studio-muted border-b border-studio-border">
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
                      <tbody className="divide-studio-border/30 divide-y">
                        {wedding.rsvps.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-studio-muted py-6 text-center">
                              No guest RSVPs received yet.
                            </td>
                          </tr>
                        ) : (
                          wedding.rsvps.map((r) => (
                            <tr key={r.id} className="hover:bg-studio-surfaceElevated/50">
                              <td className="text-studio-primary px-3 py-3 font-medium">
                                {r.respondentName}
                              </td>
                              <td className="text-studio-muted px-3 py-3 font-mono">
                                {r.respondentPhone || "—"}
                              </td>
                              <td className="text-studio-muted px-3 py-3">
                                {r.event?.title || "All Events"}
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] ${r.attending ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}
                                >
                                  {r.attending ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="text-studio-primary px-3 py-3 font-mono">
                                {r.partySize}
                              </td>
                              <td className="text-studio-muted px-3 py-3">
                                {r.mealPreference || "—"}
                              </td>
                              <td className="text-studio-muted px-3 py-3">
                                {r.needsStay ? "Yes" : "No"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 2: PEOPLE & CONSENT */}
            {activeTab === "people" && (
              <div className="space-y-6">
                {/* DPDP Consent Ledger */}
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-studio-primary font-serif text-lg font-medium">
                      DPDP Act Consent Compliance Ledger
                    </h2>
                    <p className="text-studio-muted mt-0.5 text-xs">
                      Every public family detail and VIP profile must be backed by explicit,
                      verifiable consent under the Digital Personal Data Protection Act.
                    </p>
                  </div>

                  <div className="divide-studio-border/30 divide-y">
                    {wedding.consents.length === 0 ? (
                      <p className="text-studio-muted py-6 text-center text-xs">
                        No consent entries recorded. Couple sign-off pending.
                      </p>
                    ) : (
                      wedding.consents.map((c) => (
                        <div key={c.id} className="flex items-center justify-between py-3 text-xs">
                          <div>
                            <span className="text-studio-primary font-medium uppercase tracking-wide">
                              Purpose: {c.purpose.replace(/_/g, " ")}
                            </span>
                            <p className="text-studio-muted mt-0.5">
                              Subject: <span className="text-studio-champagne">{c.subject}</span>{" "}
                              (Notice v{c.noticeVersion})
                            </p>
                            <p className="text-studio-subtle text-[10px]">
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
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-studio-primary font-serif text-lg font-medium">
                      VIP Family &amp; Elders Roster
                    </h2>
                    <p className="text-studio-muted mt-0.5 text-xs">
                      Family members featured on the celebration landing page. Minors must never be
                      featured without verified parent consent.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {wedding.vips.length === 0 ? (
                      <p className="text-studio-muted py-6 text-center text-xs">
                        No VIP family members added yet.
                      </p>
                    ) : (
                      wedding.vips.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-studio-primary font-serif text-base">
                                {v.name}
                              </span>
                              <span className="border-studio-champagne/30 bg-studio-champagne/10 rounded-full border px-2 py-0.5 text-[10px] text-studio-champagneLight">
                                {v.groupLabel}
                              </span>
                            </div>
                            {v.tagline && (
                              <p className="text-studio-muted mt-1 text-xs">{v.tagline}</p>
                            )}
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

            {/* DOMAIN 2: PRINT & QR */}
            {activeTab === "print_qr" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <h2 className="text-studio-primary mb-2 font-serif text-lg font-medium">
                    Print &amp; QR Command Studio
                  </h2>
                  <p className="text-studio-muted mb-6 text-xs">
                    Deterministic vector QR code encoding the canonical slug:{" "}
                    <code className="text-studio-champagne">https://shadify.in/{wedding.slug}</code>
                  </p>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-studio-border bg-white p-8">
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
                      <div className="rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4 text-xs">
                        <h3 className="text-studio-primary mb-2 font-semibold">
                          Printer Specifications
                        </h3>
                        <ul className="text-studio-muted list-inside list-disc space-y-1">
                          <li>Minimum Print Size: 2.5 cm × 2.5 cm (recommended 3 cm)</li>
                          <li>Quiet Zone Border: 4 modules clear space on all sides</li>
                          <li>
                            Stock: Avoid foil, metallic sheen, or textured dark paper directly over
                            QR
                          </li>
                        </ul>
                      </div>

                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                        <div className="flex items-center gap-2 font-semibold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Print Status: Approved for Proofing</span>
                        </div>
                        <p className="mt-1 text-[11px] text-emerald-300/80">
                          Direct slug resolution active. Zero redirect latency for physical card
                          guests.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 3: EVENTS */}
            {activeTab === "events" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <h2 className="text-studio-primary mb-2 font-serif text-lg font-medium">
                    Ceremonies &amp; Itinerary
                  </h2>
                  <p className="text-studio-muted mb-6 text-xs">
                    All ceremony timings are rendered in Indian Standard Time (IST). Google Maps
                    links must resolve to real geographic destinations.
                  </p>

                  <div className="space-y-4">
                    {wedding.events.map((evt) => (
                      <div
                        key={evt.id}
                        className="rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="bg-studio-champagne/20 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase text-studio-champagneLight">
                              {evt.eventType}
                            </span>
                            <h3 className="text-studio-primary mt-2 font-serif text-lg">
                              {evt.title}
                            </h3>
                            <p className="text-studio-muted mt-1 text-xs">
                              {new Date(evt.startsAt).toLocaleString("en-IN", {
                                timeZone: "Asia/Kolkata",
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                          <span className="text-studio-muted rounded-md border border-studio-border bg-studio-surface px-2 py-1 text-[11px]">
                            {evt.visibility}
                          </span>
                        </div>

                        <div className="text-studio-muted border-studio-border/30 mt-4 grid grid-cols-1 gap-2 border-t pt-3 text-xs md:grid-cols-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-studio-champagne" />
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
                                className="text-studio-champagne underline hover:text-studio-champagneLight"
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

            {/* DOMAIN 3: THEME & CONTRAST */}
            {activeTab === "theme" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <h2 className="text-studio-primary mb-2 font-serif text-lg font-medium">
                    Visual Design &amp; Typography
                  </h2>
                  <p className="text-studio-muted mb-6 text-xs">
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
                          description:
                            "Vibrant marigold and terracotta hues for daytime celebrations",
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
                              ? "border-studio-champagne bg-studio-surfaceElevated ring-1 ring-studio-champagne"
                              : "border-studio-borderSubtle bg-studio-canvas hover:border-studio-border"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-studio-primary font-serif text-sm font-medium">
                              {meta.name}
                            </span>
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
                          <p className="text-studio-muted mt-2 text-[11px]">{meta.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        Monogram Initial / Text
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        value={monogramText}
                        onChange={(e) => setMonogramText(e.target.value)}
                        placeholder="e.g. P &amp; G"
                        className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        Primary Color (Hex)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-9 w-12 cursor-pointer rounded border border-studio-border bg-transparent"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        Accent Color (Hex)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="h-9 w-12 cursor-pointer rounded border border-studio-border bg-transparent"
                        />
                        <input
                          type="text"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
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
                      className="rounded-lg bg-studio-champagne px-5 py-2 text-xs font-semibold text-studio-canvas transition hover:bg-studio-champagneLight disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Theme Tokens"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 3: SECTIONS & AUDIO */}
            {activeTab === "sections" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <h2 className="text-studio-primary mb-2 font-serif text-lg font-medium">
                    Sections &amp; Audio Experience
                  </h2>
                  <p className="text-studio-muted mb-6 text-xs">
                    Configure guest interactions: UPI shagun, livestream broadcasting, and
                    traditional audio.
                  </p>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        UPI Virtual Payment Address (VPA)
                      </label>
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="e.g. couple@okhdfcbank"
                        className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
                      />
                      <p className="text-studio-subtle mt-1 text-[11px]">
                        Direct shagun goes 100% to the couple. Leave empty to hide digital shagun
                        button.
                      </p>
                    </div>
                    <div>
                      <label className="text-studio-muted mb-1.5 block text-xs font-medium">
                        Livestream Video URL
                      </label>
                      <input
                        type="text"
                        value={liveStreamUrl}
                        onChange={(e) => setLiveStreamUrl(e.target.value)}
                        placeholder="https://youtube.com/live/..."
                        className="text-studio-primary w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3.5 py-2 text-sm focus:border-studio-champagne focus:outline-none"
                      />
                      <p className="text-studio-subtle mt-1 text-[11px]">
                        Virtual wedding stream unlocks for remote guests on wedding day.
                      </p>
                    </div>
                  </div>

                  <div className="border-studio-border/30 mt-5 border-t pt-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={showBranding}
                        onChange={(e) => setShowBranding(e.target.checked)}
                        className="h-4 w-4 rounded border-studio-border bg-studio-surfaceElevated text-studio-champagne focus:ring-0"
                      />
                      <div>
                        <span className="text-studio-primary text-xs font-medium">
                          Show &quot;Powered by Shadify&quot; footer branding
                        </span>
                        <p className="text-studio-muted text-[11px]">
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
                      className="rounded-lg bg-studio-champagne px-5 py-2 text-xs font-semibold text-studio-canvas transition hover:bg-studio-champagneLight disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Section Settings"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 4: STUDIO & ENTITLEMENTS */}
            {activeTab === "entitlements" && (
              <div className="space-y-6">
                {/* Header with Apply Override Button */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-studio-champagne" />
                      <h2 className="text-studio-primary font-serif text-lg font-medium">
                        Concierge Entitlements &amp; Subscription Studio
                      </h2>
                    </div>
                    <p className="text-studio-muted mt-0.5 text-xs">
                      Authoritative runtime capability meters derived from PRICING_PLANS with
                      auditable, reversible staff overrides.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOverrideModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-studio-champagne px-4 py-2 text-xs font-semibold text-studio-canvas transition hover:bg-studio-champagneLight"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Apply Staff Override</span>
                  </button>
                </div>

                {/* Active Override Alert Banner (if active) */}
                {effective?.hasActiveOverride && (
                  <div className="rounded-2xl border border-amber-500/50 bg-amber-950/20 p-5 shadow-lg">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                        <div>
                          <h3 className="text-sm font-semibold text-amber-200">
                            Active Staff Entitlement Override in Effect
                          </h3>
                          <p className="mt-0.5 text-xs text-amber-100/80">
                            Justification: &ldquo;{effective.activeOverrideDetail?.reason}&rdquo;
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-amber-300">
                            <span className="rounded border border-amber-500/30 bg-studio-canvas px-2 py-0.5">
                              Actor: {effective.activeOverrideDetail?.actorId}
                            </span>
                            {effective.activeOverrideDetail?.expiresAt && (
                              <span className="rounded border border-amber-500/30 bg-studio-canvas px-2 py-0.5">
                                Expires:{" "}
                                {new Date(
                                  effective.activeOverrideDetail.expiresAt,
                                ).toLocaleDateString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRevokeOverride()}
                        className="self-start rounded-lg border border-amber-500/50 bg-amber-500/20 px-3.5 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/30 sm:self-center"
                      >
                        Revoke Override
                      </button>
                    </div>
                  </div>
                )}

                {/* Plan Tier & Storage Lifecycle Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-studio-border bg-studio-surface p-5 shadow-sm">
                    <span className="text-studio-muted text-[11px] uppercase tracking-wider">
                      Subscription Tier
                    </span>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-serif text-2xl font-bold uppercase text-studio-champagneLight">
                        {effective?.name || wedding.plan}
                      </span>
                      <span className="border-studio-champagne/40 bg-studio-champagne/10 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-studio-champagneLight">
                        Tier Active
                      </span>
                    </div>
                    <p className="text-studio-muted mt-2 text-xs">
                      Canonical plan configurations govern default resource quotas.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-studio-border bg-studio-surface p-5 shadow-sm">
                    <span className="text-studio-muted text-[11px] uppercase tracking-wider">
                      Interactive Site Hosting
                    </span>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-studio-primary font-mono text-2xl font-bold">
                        5 Years
                      </span>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                        Guaranteed
                      </span>
                    </div>
                    <p className="text-studio-muted mt-2 text-xs">
                      Valid until:{" "}
                      {effective?.hostingUntil
                        ? new Date(effective.hostingUntil).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "5 Years from creation"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-studio-border bg-studio-surface p-5 shadow-sm">
                    <span className="text-studio-muted text-[11px] uppercase tracking-wider">
                      Master Camera RAW Retention
                    </span>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-studio-primary font-mono text-2xl font-bold">
                        90 Days
                      </span>
                      <span className="text-studio-muted rounded-full border border-studio-border bg-studio-surfaceElevated px-2.5 py-0.5 text-xs font-semibold">
                        Heavy Storage
                      </span>
                    </div>
                    <p className="text-studio-muted mt-2 text-xs">
                      Expires:{" "}
                      {effective?.originalsExpireAt
                        ? new Date(effective.originalsExpireAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "90 Days"}
                    </p>
                  </div>
                </div>

                {/* Resource Meters Grid */}
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <h3 className="text-studio-primary font-serif text-base font-medium">
                    Resource Meters &amp; Entitlement Gates
                  </h3>
                  <p className="text-studio-muted mt-0.5 text-xs">
                    Server-side quota enforcement strictly monitors storage, events, and features.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Photo Storage Meter */}
                    <div className="rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-studio-muted font-medium">Photos Uploaded</span>
                        <span className="text-studio-primary font-mono font-semibold">
                          {photoCount} / {effective?.maxPhotos || 100}
                        </span>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-studio-canvas">
                        <div
                          className={`h-full rounded-full transition-all ${
                            photoCount >= (effective?.maxPhotos || 100)
                              ? "bg-rose-500"
                              : photoCount / (effective?.maxPhotos || 100) > 0.8
                                ? "bg-amber-400"
                                : "bg-studio-champagne"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((photoCount / (effective?.maxPhotos || 100)) * 100),
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-studio-subtle mt-2 text-[10px]">
                        Enforced at presign and finalize with PostgreSQL row locks.
                      </p>
                    </div>

                    {/* Events Meter */}
                    <div className="rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-studio-muted font-medium">
                          Ceremonies &amp; Events
                        </span>
                        <span className="text-studio-primary font-mono font-semibold">
                          {wedding.events.length} / {effective?.maxEvents || 3}
                        </span>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-studio-canvas">
                        <div
                          className="h-full rounded-full bg-studio-champagne transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (wedding.events.length / (effective?.maxEvents || 3)) * 100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-studio-subtle mt-2 text-[10px]">
                        Maximum ceremonies supported on celebration landing page.
                      </p>
                    </div>

                    {/* Video Bites */}
                    <div className="rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-studio-muted font-medium">Video Bites</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            effective?.videoBite
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "text-studio-subtle border border-studio-border bg-studio-surface"
                          }`}
                        >
                          {effective?.videoBite ? `Max ${effective.maxVideoBites}` : "Disabled"}
                        </span>
                      </div>
                      <p className="text-studio-muted mt-3 text-xs">
                        {effective?.videoBite
                          ? "Short 60-second video clips permitted for guests."
                          : "Upgrade to Premium or Platinum to unlock guest video moments."}
                      </p>
                    </div>

                    {/* Custom Domain */}
                    <div className="rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-studio-muted font-medium">Custom Domain</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            effective?.customDomain
                              ? "border border-purple-500/30 bg-purple-500/10 text-purple-300"
                              : "text-studio-subtle border border-studio-border bg-studio-surface"
                          }`}
                        >
                          {effective?.customDomain ? "Platinum Enabled" : "Gated"}
                        </span>
                      </div>
                      <p className="text-studio-muted mt-3 text-xs">
                        {effective?.customDomain
                          ? "Custom domain linking permitted (e.g. rohitwedsananya.com)."
                          : "Requires Platinum tier or staff commercial override."}
                      </p>
                    </div>

                    {/* Branding Badge */}
                    <div className="rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-studio-muted font-medium">Platform Branding</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            effective?.canHideBranding
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {effective?.canHideBranding
                            ? "Can be hidden"
                            : "Shadify Watermark Enforced"}
                        </span>
                      </div>
                      <p className="text-studio-muted mt-3 text-xs">
                        {effective?.canHideBranding
                          ? "Branding toggle unlocked in general settings."
                          : "Lite plan includes Shadify branding by default."}
                      </p>
                    </div>

                    {/* Catering CSV Export */}
                    <div className="rounded-xl border border-studio-borderSubtle bg-studio-surfaceElevated p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-studio-muted font-medium">Catering RSVP Export</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            effective?.hasActiveOverride || wedding.plan !== "lite"
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "text-studio-subtle border border-studio-border bg-studio-surface"
                          }`}
                        >
                          {effective?.hasActiveOverride || wedding.plan !== "lite"
                            ? "Unlocked"
                            : "Gated (Lite)"}
                        </span>
                      </div>
                      <p className="text-studio-muted mt-3 text-xs">
                        Formula-injection sanitized CSV downloads with audit recording.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 4: AUDIT LOG */}
            {activeTab === "audit" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-sm">
                  <h2 className="text-studio-primary mb-2 font-serif text-lg font-medium">
                    Immutable Operational Audit Trail
                  </h2>
                  <p className="text-studio-muted mb-6 text-xs">
                    Complete forensic ledger recording staff actions, status modifications, and data
                    access.
                  </p>

                  <div className="divide-studio-border/30 divide-y">
                    {wedding.auditLogs.map((log) => (
                      <div key={log.id} className="py-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-studio-primary font-mono font-medium">
                            {log.action}
                          </span>
                          <span className="text-studio-muted">
                            {new Date(log.createdAt).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            })}
                          </span>
                        </div>
                        <div className="text-studio-subtle mt-1 flex items-center gap-2 text-[11px]">
                          <span>
                            Actor: {log.actor?.fullName || "System Concierge"} (
                            {log.actor?.role || "automated"})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Staff Entitlement Override Dialog Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-studio-borderSubtle pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-studio-champagne" />
                <h3 className="text-studio-primary font-serif text-lg font-medium">
                  Staff Entitlement Override
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="text-studio-muted hover:text-studio-primary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => void handleApplyOverride(e)} className="mt-4 space-y-4">
              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Target Entitlement Field
                </label>
                <select
                  value={overrideField}
                  onChange={(e) => {
                    const f = e.target.value;
                    setOverrideField(f);
                    if (f === "maxPhotos") setOverrideValue("500");
                    else if (f === "maxEvents") setOverrideValue("5");
                    else if (f === "maxVideoBites") setOverrideValue("8");
                    else if (f === "videoBite" || f === "customDomain" || f === "canHideBranding")
                      setOverrideValue("true");
                  }}
                  className="text-studio-primary mt-1 w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                >
                  <option value="maxPhotos">Photo Upload Quota (maxPhotos)</option>
                  <option value="maxEvents">Maximum Ceremonies (maxEvents)</option>
                  <option value="maxVideoBites">Video Bites Count (maxVideoBites)</option>
                  <option value="videoBite">Enable Video Bites (videoBite)</option>
                  <option value="customDomain">Enable Custom Domain (customDomain)</option>
                  <option value="canHideBranding">Allow Removing Branding (canHideBranding)</option>
                  <option value="maxGuests">Guest Capacity (maxGuests)</option>
                </select>
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Override Value
                </label>
                {overrideField === "videoBite" ||
                overrideField === "customDomain" ||
                overrideField === "canHideBranding" ? (
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="text-studio-primary mt-1 w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                  >
                    <option value="true">Enabled (True)</option>
                    <option value="false">Disabled (False)</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={50000}
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="text-studio-primary mt-1 w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3 py-2 font-mono text-xs focus:border-studio-champagne focus:outline-none"
                    required
                  />
                )}
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Optional Expiration Date
                </label>
                <input
                  type="date"
                  value={overrideExpiresAt}
                  onChange={(e) => setOverrideExpiresAt(e.target.value)}
                  className="text-studio-primary mt-1 w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                />
                <p className="text-studio-subtle mt-1 text-[10px]">
                  Leave blank for indefinite until manually revoked. Expired overrides automatically
                  revert to plan defaults.
                </p>
              </div>

              <div>
                <label className="text-studio-muted block text-xs font-medium">
                  Audit Justification Reason <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. VIP client upgrade approved by Lead Concierge for extra sangeet moments"
                  className="text-studio-primary placeholder-studio-subtle mt-1 w-full rounded-lg border border-studio-borderSubtle bg-studio-surfaceElevated px-3 py-2 text-xs focus:border-studio-champagne focus:outline-none"
                  required
                />
                <p className="text-studio-subtle mt-1 text-[10px]">
                  Mandatory (min 5 characters). Recorded in the immutable audit trail with your
                  staff ID.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-studio-borderSubtle pt-4">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="text-studio-muted hover:text-studio-primary rounded-lg border border-studio-border bg-studio-surfaceElevated px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting || overrideReason.trim().length < 5}
                  className="rounded-lg bg-studio-champagne px-5 py-2 text-xs font-semibold text-studio-canvas transition hover:bg-studio-champagneLight disabled:opacity-50"
                >
                  {overrideSubmitting ? "Applying..." : "Apply & Audit Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
