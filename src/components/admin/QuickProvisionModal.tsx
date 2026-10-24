"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sliders,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type SupportedThemeId =
  "royal-crimson" | "emerald-gold" | "ivory-minimal" | "sunset-day" | "sunset-dusk";

const THEME_OPTIONS: Array<{ id: SupportedThemeId; label: string; dot: string }> = [
  { id: "royal-crimson", label: "Royal Crimson", dot: "#941C2F" },
  { id: "emerald-gold", label: "Emerald Gold", dot: "#0D4D33" },
  { id: "ivory-minimal", label: "Ivory Minimal", dot: "#7A5A40" },
  { id: "sunset-day", label: "Sunset Day", dot: "#B8435A" },
  { id: "sunset-dusk", label: "Sunset Dusk", dot: "#D46A7E" },
];

interface QuickProvisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (wedding: { id: string; slug: string }) => void;
}

export function QuickProvisionModal({ open, onOpenChange, onSuccess }: QuickProvisionModalProps) {
  // Step state: 1 = Couple & Ceremony, 2 = Plan & Slug, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venueCity, setVenueCity] = useState("Udaipur, Rajasthan");
  const [couplePhone, setCouplePhone] = useState("");
  const [plan, setPlan] = useState<"lite" | "premium" | "platinum">("premium");
  const [themeId, setThemeId] = useState<SupportedThemeId>("royal-crimson");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Slug verification state
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "unavailable">(
    "idle",
  );
  const [slugMessage, setSlugMessage] = useState<string | null>(null);
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const slugCheckDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdWedding, setCreatedWedding] = useState<{
    weddingId: string;
    slug: string;
    url: string;
    couple: string;
    plan: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate unique idempotency key once per modal open
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  useEffect(() => {
    if (open) {
      setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    } else {
      // Reset on close
      setStep(1);
      setErrorMessage(null);
      setCreatedWedding(null);
      setCopiedLink(false);
    }
  }, [open]);

  // Auto-generate slug suggestion from names when not manually edited
  useEffect(() => {
    if (!isSlugManuallyEdited && brideName && groomName) {
      const b = brideName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const g = groomName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (b && g) {
        setSlug(`${b}-${g}`);
      }
    }
  }, [brideName, groomName, isSlugManuallyEdited]);

  // Debounced server-side slug verification
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus("idle");
      setSlugMessage(null);
      setSlugSuggestions([]);
      return;
    }

    if (slugCheckDebounceTimer.current) {
      clearTimeout(slugCheckDebounceTimer.current);
    }

    setSlugStatus("checking");

    slugCheckDebounceTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/admin/weddings/provision?slug=${encodeURIComponent(slug)}`);
          const data = (await res.json()) as {
            available: boolean;
            reason?: string;
            suggestions?: string[];
          };

          if (data.available) {
            setSlugStatus("available");
            setSlugMessage(null);
            setSlugSuggestions([]);
          } else {
            setSlugStatus("unavailable");
            setSlugMessage(data.reason || "This slug is unavailable");
            setSlugSuggestions(data.suggestions || []);
          }
        } catch {
          setSlugStatus("idle");
        }
      })();
    }, 400);

    return () => {
      if (slugCheckDebounceTimer.current) {
        clearTimeout(slugCheckDebounceTimer.current);
      }
    };
  }, [slug]);

  // Handle Step 1 -> Step 2 transition
  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!brideName.trim() || !groomName.trim()) {
      setErrorMessage("Please enter both the bride and groom's names.");
      return;
    }

    if (!weddingDate) {
      setErrorMessage("Please choose a wedding celebration date.");
      return;
    }

    if (!venueCity.trim()) {
      setErrorMessage("Please enter the primary venue city.");
      return;
    }

    setStep(2);
  };

  // Handle final provision submission
  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (slugStatus === "unavailable") {
      setErrorMessage("Please resolve the URL slug conflict before provisioning.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/weddings/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          brideName: brideName.trim(),
          groomName: groomName.trim(),
          weddingDate,
          venueCity: venueCity.trim(),
          slug: slug.trim().toLowerCase(),
          plan,
          themeId,
          couplePhone: couplePhone.trim() || undefined,
          idempotencyKey,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        weddingId?: string;
        slug?: string;
        url?: string;
        plan?: string;
        couple?: string;
        error?: string;
        issues?: Array<{ field: string; message: string }>;
        slugSuggestions?: string[];
      };

      if (!res.ok || !data.success || !data.weddingId) {
        if (data.issues && data.issues.length > 0) {
          throw new Error(data.issues.map((i) => i.message).join(", "));
        }
        if (data.slugSuggestions && data.slugSuggestions.length > 0) {
          setSlugSuggestions(data.slugSuggestions);
        }
        throw new Error(data.error || "Failed to provision wedding client");
      }

      setCreatedWedding({
        weddingId: data.weddingId,
        slug: data.slug || slug,
        url: data.url || `/${slug}`,
        couple: data.couple || `${brideName} & ${groomName}`,
        plan: data.plan || plan,
      });

      if (onSuccess) {
        onSuccess({ id: data.weddingId, slug: data.slug || slug });
      }

      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error provisioning wedding";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdWedding) return;
    const fullUrl = `${window.location.origin}${createdWedding.url}`;
    void navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const resetForAnother = () => {
    setBrideName("");
    setGroomName("");
    setWeddingDate("");
    setSlug("");
    setIsSlugManuallyEdited(false);
    setCouplePhone("");
    setStep(1);
    setCreatedWedding(null);
    setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-studio-primary max-w-xl border-studio-border bg-studio-surfaceElevated p-7 shadow-2xl">
        <DialogHeader className="border-b border-studio-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-studio-champagne/15 flex h-7 w-7 items-center justify-center rounded-lg text-studio-champagne">
                <Sparkles className="h-4 w-4" />
              </span>
              <DialogTitle className="text-studio-primary font-serif text-xl font-normal">
                {step === 3 ? "Wedding Provisioned!" : "Spin Up Client — 60s Wizard"}
              </DialogTitle>
            </div>
            {step !== 3 && (
              <Badge variant="outline" className="border-studio-champagne/40 text-studio-champagne">
                Step {step} of 2
              </Badge>
            )}
          </div>
          <DialogDescription className="text-studio-muted text-xs">
            {step === 1 && "Couple identity, celebration date, and primary venue city."}
            {step === 2 && "Subscription tier, theme preset, and verified URL slug."}
            {step === 3 && "Client created in draft mode with seeded itinerary & entitlements."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold">Unable to proceed</p>
              <p className="opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: COUPLE & CEREMONY BASICS */}
        {step === 1 && (
          <form onSubmit={handleNextToStep2} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bride-name" className="text-studio-muted">
                  Bride&apos;s Name <span className="text-studio-champagne">*</span>
                </Label>
                <Input
                  id="bride-name"
                  required
                  placeholder="e.g. Priya"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  className="text-studio-primary border-studio-border bg-studio-canvas focus:border-studio-champagne"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="groom-name" className="text-studio-muted">
                  Groom&apos;s Name <span className="text-studio-champagne">*</span>
                </Label>
                <Input
                  id="groom-name"
                  required
                  placeholder="e.g. Rahul"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  className="text-studio-primary border-studio-border bg-studio-canvas focus:border-studio-champagne"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wedding-date" className="text-studio-muted">
                  Wedding Date <span className="text-studio-champagne">*</span>
                </Label>
                <Input
                  id="wedding-date"
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="text-studio-primary border-studio-border bg-studio-canvas focus:border-studio-champagne"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venue-city" className="text-studio-muted">
                  Celebration City <span className="text-studio-champagne">*</span>
                </Label>
                <Input
                  id="venue-city"
                  required
                  placeholder="e.g. Udaipur, Rajasthan"
                  value={venueCity}
                  onChange={(e) => setVenueCity(e.target.value)}
                  className="text-studio-primary border-studio-border bg-studio-canvas focus:border-studio-champagne"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="couple-phone" className="text-studio-muted">
                Primary Contact Mobile (Optional)
              </Label>
              <Input
                id="couple-phone"
                placeholder="+91 98765 43210"
                value={couplePhone}
                onChange={(e) => setCouplePhone(e.target.value)}
                className="text-studio-primary border-studio-border bg-studio-canvas focus:border-studio-champagne"
              />
              <p className="text-studio-muted/70 text-[10px]">
                Used strictly for concierge dispatch; address book is never scanned per DPDP
                charter.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-studio-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-studio-muted hover:text-studio-primary border-studio-border hover:bg-studio-surfaceHighlight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-studio-champagne font-semibold text-black hover:bg-studio-champagneLight"
              >
                Continue to Plan &amp; URL <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: PLAN, THEME & SERVER-VERIFIED SLUG */}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              void handleProvisionSubmit(e);
            }}
            className="space-y-4 pt-2 text-xs"
          >
            {/* Plan Selector */}
            <div className="space-y-1.5">
              <Label className="text-studio-muted">Subscription Tier</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "lite",
                    name: "Shubh (Lite)",
                    price: "₹2,999",
                    highlight: "3 Events · 100 Photos",
                  },
                  {
                    id: "premium",
                    name: "Vivah (Premium)",
                    price: "₹7,999",
                    highlight: "8 Events · 300 Photos · White-label",
                    popular: true,
                  },
                  {
                    id: "platinum",
                    name: "Rajwada (Platinum)",
                    price: "₹19,999",
                    highlight: "15 Events · 1k Photos · Domain",
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id as "lite" | "premium" | "platinum")}
                    className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition ${
                      plan === p.id
                        ? "bg-studio-champagne/15 border-studio-champagne shadow-sm"
                        : "hover:border-studio-champagne/40 border-studio-border bg-studio-canvas"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-studio-primary text-[11px] font-semibold">
                        {p.name}
                      </span>
                      {p.popular && (
                        <span className="py-0.2 rounded bg-studio-champagne px-1 text-[9px] font-bold uppercase text-black">
                          Popular
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 font-mono text-xs text-studio-champagne">
                      {p.price}
                    </span>
                    <span className="text-studio-muted mt-1 text-[10px]">{p.highlight}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-1.5">
              <Label className="text-studio-muted">Celebration Theme Preset</Label>
              <div className="grid grid-cols-5 gap-2">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeId(t.id)}
                    className={`flex flex-col items-center rounded-lg border p-2 text-center transition ${
                      themeId === t.id
                        ? "bg-studio-champagne/15 border-studio-champagne"
                        : "hover:border-studio-champagne/40 border-studio-border bg-studio-canvas"
                    }`}
                  >
                    <span
                      className="shadow-xs h-3.5 w-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: t.dot }}
                    />
                    <span className="text-studio-primary mt-1 text-[10px] font-medium leading-tight">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Server-Verified URL Slug */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug" className="text-studio-muted">
                  Invitation URL Slug <span className="text-studio-champagne">*</span>
                </Label>
                {slugStatus === "checking" && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-studio-champagne">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Verifying...
                  </span>
                )}
                {slugStatus === "available" && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                    <Check className="h-3 w-3" /> Available
                  </span>
                )}
                {slugStatus === "unavailable" && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-red-400">
                    <AlertCircle className="h-3 w-3" /> {slugMessage || "In Use or Reserved"}
                  </span>
                )}
              </div>

              <div className="flex rounded-md border border-studio-border bg-studio-canvas focus-within:border-studio-champagne">
                <span className="text-studio-muted inline-flex items-center border-r border-studio-border px-3 font-mono text-xs">
                  shadify.in/
                </span>
                <input
                  id="slug"
                  required
                  value={slug}
                  onChange={(e) => {
                    setIsSlugManuallyEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  placeholder="priya-rahul"
                  className="text-studio-primary w-full bg-transparent px-3 py-2 font-mono text-xs placeholder:text-stone-600 focus:outline-none"
                />
              </div>

              {/* Suggestions chips on collision */}
              {slugSuggestions.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-studio-muted text-[10px]">Available suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {slugSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setIsSlugManuallyEdited(true);
                          setSlug(s);
                        }}
                        className="bg-studio-champagne/15 hover:bg-studio-champagne/25 rounded px-2 py-0.5 font-mono text-[10px] text-studio-champagne"
                      >
                        +{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-studio-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="text-studio-muted hover:text-studio-primary border-studio-border hover:bg-studio-surfaceHighlight"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
              </Button>
              <Button
                type="submit"
                disabled={submitting || slugStatus === "unavailable" || !slug}
                className="bg-studio-champagne font-semibold text-black hover:bg-studio-champagneLight disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Provisioning...
                  </>
                ) : (
                  <>
                    Provision Draft Wedding <Sparkles className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {step === 3 && createdWedding && (
          <div className="space-y-5 pt-2 text-center text-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-studio-primary font-serif text-2xl font-light">
                {createdWedding.couple}
              </h3>
              <p className="text-studio-muted mt-1 text-xs">
                Wedding client successfully provisioned in{" "}
                <strong className="text-studio-champagne">Draft Mode</strong>.
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-studio-border bg-studio-canvas p-4 text-left">
              <div className="flex items-center justify-between border-b border-studio-border pb-2">
                <span className="text-studio-muted">Client URL:</span>
                <span className="text-studio-primary font-mono">
                  shadify.in{createdWedding.url}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-studio-border pb-2">
                <span className="text-studio-muted">Subscription Tier:</span>
                <span className="font-semibold uppercase tracking-wider text-studio-champagne">
                  {createdWedding.plan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-studio-muted">Itinerary Status:</span>
                <span className="text-stone-400">3 Draft ceremonies seeded</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="text-studio-primary border-studio-border hover:bg-studio-surfaceHighlight"
                >
                  {copiedLink ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> Copied Link
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Client Link
                    </>
                  )}
                </Button>

                <Link
                  href={createdWedding.url}
                  target="_blank"
                  className="text-studio-primary hover:border-studio-champagne/40 inline-flex items-center justify-center rounded-lg border border-studio-border bg-studio-surface px-4 py-2 font-medium"
                >
                  Live Preview <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>

              <Link
                href={`/admin/weddings/${createdWedding.weddingId}`}
                className="inline-flex w-full items-center justify-center rounded-lg bg-studio-champagne py-2.5 font-semibold text-black shadow-md hover:bg-studio-champagneLight"
              >
                Open Concierge Studio Console <Sliders className="ml-1.5 h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={resetForAnother}
                className="text-studio-muted hover:text-studio-primary pt-2 text-[11px]"
              >
                + Provision another wedding
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
