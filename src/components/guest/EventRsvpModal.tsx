"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurnstileWidget } from "@/components/ui/turnstile";
import type { WeddingEventDto } from "@/features/weddings";

interface EventRsvpModalProps {
  event: WeddingEventDto | null;
  weddingSlug: string;
  onClose: () => void;
  onSuccess: (guestName: string) => void;
}

export function EventRsvpModal({ event, weddingSlug, onClose, onSuccess }: EventRsvpModalProps) {
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [mealPref, setMealPref] = useState("pure_veg");
  const [needsStay, setNeedsStay] = useState(false);
  const [notes, setNotes] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!guestName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingSlug,
          eventId: event.id,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          partySize: Number(partySize),
          attending: true,
          mealPreference: mealPref,
          needsAccommodation: needsStay,
          notes: notes.trim(),
          turnstileToken: turnstileToken || undefined,
        }),
      });

      if (res.ok) {
        onSuccess(guestName.trim());
        onClose();
      } else {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setErrorMessage(
          typeof data.message === "string"
            ? data.message
            : "Failed to submit RSVP. Please check your contact number.",
        );
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border-2 border-[#D4AF37] bg-theme-surface p-6 text-theme-text-primary shadow-2xl backdrop-blur-2xl sm:p-8">
        <DialogHeader className="text-center sm:text-center">
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.3em] text-theme-accent">
            Ceremony RSVP
          </p>
          <DialogTitle className="mt-1 font-serif text-2xl font-normal text-theme-text-primary">
            {event.title}
          </DialogTitle>
          <DialogDescription className="mt-1 font-serif text-xs text-theme-text-muted">
            {event.date} • {event.time} • {event.venue}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="my-2 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="modal-name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-theme-accent"
            >
              Full Name *
            </label>
            <Input
              id="modal-name"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Ananya Roy"
              className="bg-theme-bg/70 border-[#D4AF37]/40 text-theme-text-primary focus-visible:ring-[#D4AF37]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="modal-phone"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-theme-accent"
              >
                WhatsApp Phone
              </label>
              <Input
                id="modal-phone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-theme-bg/70 border-[#D4AF37]/40 text-theme-text-primary focus-visible:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="modal-party"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-theme-accent"
              >
                Party Count
              </label>
              <select
                id="modal-party"
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="bg-theme-bg/70 flex h-10 w-full rounded-lg border border-[#D4AF37]/40 px-3 py-2 text-sm text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option
                    key={num}
                    value={num}
                    className="bg-theme-surface text-theme-text-primary"
                  >
                    {num} {num === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-meal"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-theme-accent"
            >
              Meal Preference
            </label>
            <select
              id="modal-meal"
              value={mealPref}
              onChange={(e) => setMealPref(e.target.value)}
              className="bg-theme-bg/70 flex h-10 w-full rounded-lg border border-[#D4AF37]/40 px-3 py-2 text-sm text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="pure_veg" className="bg-theme-surface text-theme-text-primary">
                🥗 Pure Vegetarian
              </option>
              <option value="jain" className="bg-theme-surface text-theme-text-primary">
                🌱 Jain Vegetarian
              </option>
              <option value="non_veg" className="bg-theme-surface text-theme-text-primary">
                🍗 Non-Vegetarian
              </option>
            </select>
          </div>

          <div className="bg-theme-bg/50 flex items-center justify-between rounded-xl border border-[#D4AF37]/30 p-3">
            <div>
              <span className="block text-xs font-semibold text-theme-text-primary">
                Outstation Stay Needed
              </span>
              <span className="mt-0.5 block text-[11px] text-theme-text-muted">
                Require family-arranged accommodation?
              </span>
            </div>
            <input
              type="checkbox"
              checked={needsStay}
              onChange={(e) => setNeedsStay(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-[#D4AF37] accent-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="modal-notes"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-theme-accent"
            >
              Notes / Wishes for Couple
            </label>
            <Input
              id="modal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Arriving on early morning flight"
              className="bg-theme-bg/70 border-[#D4AF37]/40 text-theme-text-primary focus-visible:ring-[#D4AF37]"
            />
          </div>

          <div className="pt-2">
            <TurnstileWidget onSuccess={setTurnstileToken} />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#D4AF37] font-serif text-xs font-bold uppercase tracking-widest text-[#1A0A00] shadow-md transition-all hover:scale-[1.01] hover:bg-[#E8B96B]"
          >
            {isSubmitting ? "Confirming..." : "CONFIRM FOR THIS CEREMONY"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
