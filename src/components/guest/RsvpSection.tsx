"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/ui/turnstile";

import type { WeddingEventDto } from "@/features/weddings";

interface RsvpSectionProps {
  weddingSlug: string;
  defaultEventId?: string;
  events?: WeddingEventDto[];
  onToast: (msg: string) => void;
  externalRsvpUrl?: string;
  coupleNames?: string;
  isDemo?: boolean;
}

export function RsvpSection({
  weddingSlug,
  defaultEventId,
  events,
  onToast,
  externalRsvpUrl,
  coupleNames,
  isDemo,
}: RsvpSectionProps) {
  const [selectedEventId, setSelectedEventId] = useState(
    defaultEventId || events?.[0]?.id || "main-wedding",
  );
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [attending, setAttending] = useState("yes");
  const [partySize, setPartySize] = useState(1);
  const [mealPref, setMealPref] = useState("pure_veg");
  const [needsStay, setNeedsStay] = useState(false);
  const [blessing, setBlessing] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!guestName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setIsSubmitting(true);

    // Demo celebrations simulate success and never write to the real database
    if (isDemo) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setIsSubmitted(true);
      onToast(`Demo RSVP simulated for ${guestName.split(" ")[0]}! Nothing was saved.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingSlug,
          eventId: selectedEventId || defaultEventId || "main-wedding",
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          partySize: Number(partySize),
          attending: attending === "yes",
          mealPreference: mealPref,
          needsAccommodation: needsStay,
          notes: blessing.trim(),
          turnstileToken: turnstileToken || undefined,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
        onToast(`🎉 Thank you ${guestName.split(" ")[0]}! Your RSVP has been confirmed with love!`);
      } else {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setErrorMessage(
          typeof data.message === "string"
            ? data.message
            : "Unable to register RSVP. Please check your contact number.",
        );
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Strictly enforce HTTPS-only external RSVP URLs to prevent unsafe schemes or MITM redirects
  // Rejects embedded credentials (user:pass@) and non-FQDN destinations
  let safeExternalUrl: string | null = null;
  let externalDomain: string | null = null;
  if (externalRsvpUrl) {
    try {
      const u = new URL(externalRsvpUrl);
      const host = u.hostname.toLowerCase();
      const hasValidHost =
        host.includes(".") && !host.startsWith(".") && !host.endsWith(".") && host !== "localhost";
      const hasNoAuth = !u.username && !u.password;

      if (u.protocol === "https:" && hasValidHost && hasNoAuth) {
        safeExternalUrl = u.href;
        externalDomain = u.hostname;
      }
    } catch {
      safeExternalUrl = null;
    }
  }

  if (safeExternalUrl && externalDomain) {
    return (
      <section id="rsvp" className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-theme-accent">
              ✦ CELEBRATION ATTENDANCE ✦
            </span>
            <h2 className="mt-2 font-serif text-3xl font-normal text-theme-text-primary sm:text-4xl md:text-5xl">
              Will You <em>Join Us?</em>
            </h2>
            <p className="mt-3 font-serif text-base text-theme-text-muted sm:text-lg">
              Your presence is the most cherished blessing on our special day.
            </p>
          </div>

          <div className="relative rounded-3xl border-2 border-[#D4AF37] bg-theme-surface p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-12">
            <div className="pointer-events-none absolute inset-3 rounded-2xl border border-dashed border-[#D4AF37]/40" />
            <div className="relative z-10 py-4">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-theme-bg shadow-md">
                <ExternalLink className="h-7 w-7 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-theme-text-primary">
                Official RSVP Form
              </h3>
              <p className="mx-auto mt-3 max-w-md font-serif text-sm leading-relaxed text-theme-text-muted">
                {coupleNames ? `${coupleNames}` : "The couple"} is collecting responses via their
                official form on{" "}
                <span className="font-semibold text-theme-accent">{externalDomain}</span>. Tap below
                to confirm your presence and preferences.
              </p>
              <div className="mt-8">
                <a
                  href={safeExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-theme-on-primary inline-flex items-center gap-2 rounded-xl border border-[#D4AF37] bg-theme-primary px-8 py-4 font-serif text-sm font-semibold tracking-wider shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                >
                  <span>Open Official RSVP Form</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-4 text-xs text-theme-text-muted opacity-80">
                You will be redirected securely to{" "}
                <span className="font-mono">{externalDomain}</span>.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="rsvp" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl">
        {/* Section Header */}
        <div className="mb-12 text-center sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-theme-accent">
            ✦ CELEBRATION ATTENDANCE ✦
          </span>
          <h2 className="mt-2 font-serif text-3xl font-normal text-theme-text-primary sm:text-4xl md:text-5xl">
            Will You <em>Join Us?</em>
          </h2>
          <p className="mt-3 font-serif text-base text-theme-text-muted sm:text-lg">
            Your presence is the most cherished blessing on our special day.
          </p>
        </div>

        {/* Embossed Luxury Reply Card */}
        <div className="relative rounded-3xl border-2 border-[#D4AF37] bg-theme-surface p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-12">
          {/* Inner Dashed Border */}
          <div className="pointer-events-none absolute inset-3 rounded-2xl border border-dashed border-[#D4AF37]/40" />

          {isSubmitted ? (
            <div className="relative z-10 py-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-theme-bg shadow-md">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-theme-text-primary sm:text-3xl">
                RSVP Received with Gratitude!
              </h3>
              <p className="mx-auto mt-3 max-w-md font-serif text-base text-theme-text-muted">
                Thank you, {guestName}! We cannot wait to celebrate our union with you in Rajasthan.
              </p>
              {isDemo && (
                <p className="mx-auto mt-2 max-w-md text-xs font-medium text-amber-500">
                  ✦ Demo Celebration: Simulated response only. No personal data was saved.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubmitted(false)}
                className="mt-8 border-[#D4AF37]/50 font-serif text-xs uppercase tracking-widest text-theme-text-primary hover:border-[#D4AF37]"
              >
                Submit Another Response
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              {isDemo && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs font-medium text-amber-600 dark:text-amber-300">
                  <span className="font-bold uppercase tracking-wider">Demo Mode:</span>
                  <span>
                    Responses are simulated for demonstration and never saved to the database.
                  </span>
                </div>
              )}
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Attendance Choice Radio Chips */}
              <div>
                <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-theme-accent">
                  Attendance Confirmation
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAttending("yes")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-4 font-serif text-xs tracking-wider transition-all sm:text-sm ${
                      attending === "yes"
                        ? "text-theme-on-primary border-[#D4AF37] bg-theme-primary font-semibold shadow-md"
                        : "bg-theme-bg/50 border-[#D4AF37]/30 text-theme-text-muted hover:border-[#D4AF37]/60"
                    }`}
                  >
                    <span>🌸 Joyfully Attending</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttending("no")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-4 font-serif text-xs tracking-wider transition-all sm:text-sm ${
                      attending === "no"
                        ? "text-theme-on-primary border-[#D4AF37] bg-theme-primary font-semibold shadow-md"
                        : "bg-theme-bg/50 border-[#D4AF37]/30 text-theme-text-muted hover:border-[#D4AF37]/60"
                    }`}
                  >
                    <span>💌 Regretfully Declining</span>
                  </button>
                </div>
              </div>

              {/* Name & WhatsApp Inputs using Shadcn Input */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="rsvp-name"
                    className="mb-2 block text-xs font-semibold uppercase tracking-widest text-theme-accent"
                  >
                    Your Full Name *
                  </label>
                  <Input
                    id="rsvp-name"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Vikramaditya Sharma"
                    style={{
                      color: "var(--theme-text-primary)",
                      backgroundColor: "var(--theme-bg)",
                    }}
                    className="bg-theme-bg/90 placeholder:text-theme-text-muted/70 border-[#D4AF37]/50 text-theme-text-primary focus-visible:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rsvp-phone"
                    className="mb-2 block text-xs font-semibold uppercase tracking-widest text-theme-accent"
                  >
                    WhatsApp Number
                  </label>
                  <Input
                    id="rsvp-phone"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{
                      color: "var(--theme-text-primary)",
                      backgroundColor: "var(--theme-bg)",
                    }}
                    className="bg-theme-bg/90 placeholder:text-theme-text-muted/70 border-[#D4AF37]/50 text-theme-text-primary focus-visible:ring-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Party Size & Dietary Preferences if Attending */}
              {attending === "yes" && (
                <>
                  {events && events.length > 0 && (
                    <div>
                      <label
                        htmlFor="rsvp-event-select"
                        className="mb-2 block text-xs font-semibold uppercase tracking-widest text-theme-accent"
                      >
                        Ceremony / Event Attending *
                      </label>
                      <Select
                        id="rsvp-event-select"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        style={{
                          color: "var(--theme-text-primary)",
                          backgroundColor: "var(--theme-bg)",
                        }}
                      >
                        {events.map((evt) => (
                          <option
                            key={evt.id}
                            value={evt.id}
                            style={{
                              backgroundColor: "var(--theme-surface, #1A0D14)",
                              color: "var(--theme-text-primary, #FDF8F0)",
                            }}
                          >
                            {evt.title} ({evt.date} • {evt.time})
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="rsvp-party-size"
                        className="mb-2 block text-xs font-semibold uppercase tracking-widest text-theme-accent"
                      >
                        Total Guests in Party
                      </label>
                      <Select
                        id="rsvp-party-size"
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        style={{
                          color: "var(--theme-text-primary)",
                          backgroundColor: "var(--theme-bg)",
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <option
                            key={num}
                            value={num}
                            style={{
                              backgroundColor: "var(--theme-surface, #1A0D14)",
                              color: "var(--theme-text-primary, #FDF8F0)",
                            }}
                          >
                            {num} {num === 1 ? "Guest" : "Guests"}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label
                        htmlFor="rsvp-meal-pref"
                        className="mb-2 block text-xs font-semibold uppercase tracking-widest text-theme-accent"
                      >
                        Dietary Preference
                      </label>
                      <Select
                        id="rsvp-meal-pref"
                        value={mealPref}
                        onChange={(e) => setMealPref(e.target.value)}
                        style={{
                          color: "var(--theme-text-primary)",
                          backgroundColor: "var(--theme-bg)",
                        }}
                      >
                        <option
                          value="pure_veg"
                          style={{
                            backgroundColor: "var(--theme-surface, #1A0D14)",
                            color: "var(--theme-text-primary, #FDF8F0)",
                          }}
                        >
                          🥗 Pure Vegetarian
                        </option>
                        <option
                          value="jain"
                          style={{
                            backgroundColor: "var(--theme-surface, #1A0D14)",
                            color: "var(--theme-text-primary, #FDF8F0)",
                          }}
                        >
                          🌱 Jain Vegetarian
                        </option>
                        <option
                          value="non_veg"
                          style={{
                            backgroundColor: "var(--theme-surface, #1A0D14)",
                            color: "var(--theme-text-primary, #FDF8F0)",
                          }}
                        >
                          🍗 Non-Vegetarian
                        </option>
                      </Select>
                    </div>
                  </div>

                  {/* Outstation Accommodation Toggle */}
                  <div className="bg-theme-bg/50 flex items-center justify-between rounded-xl border border-[#D4AF37]/30 p-4">
                    <div>
                      <span className="block text-xs font-semibold text-theme-text-primary">
                        Outstation Travel &amp; Stay Accommodation
                      </span>
                      <span className="mt-0.5 block text-xs text-theme-text-muted">
                        Will you require hotel accommodation arranged by the family?
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={needsStay}
                      onChange={(e) => setNeedsStay(e.target.checked)}
                      className="h-5 w-5 cursor-pointer rounded border-[#D4AF37] text-theme-primary accent-[#D4AF37]"
                    />
                  </div>
                </>
              )}

              {/* Heartfelt Blessings Note */}
              <div>
                <label
                  htmlFor="rsvp-blessing"
                  className="mb-2 block text-xs font-semibold uppercase tracking-widest text-theme-accent"
                >
                  Warm Blessings &amp; Message for the Couple
                </label>
                <Textarea
                  id="rsvp-blessing"
                  rows={3}
                  value={blessing}
                  onChange={(e) => setBlessing(e.target.value)}
                  placeholder="Share a heartfelt blessing or message for the couple..."
                  style={{
                    color: "var(--theme-text-primary)",
                    backgroundColor: "var(--theme-bg)",
                  }}
                />
              </div>

              {/* Cloudflare Turnstile */}
              <div className="pt-2">
                <TurnstileWidget onSuccess={setTurnstileToken} />
              </div>

              {/* Submit Button using Shadcn Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#D4AF37] font-serif text-sm font-bold uppercase tracking-widest text-[#1A0A00] shadow-[0_10px_30px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.01] hover:bg-[#E8B96B]"
              >
                {isSubmitting ? (
                  <span>Sending Your Blessings...</span>
                ) : (
                  <span>CONFIRM ATTENDANCE WITH LOVE 💌</span>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
