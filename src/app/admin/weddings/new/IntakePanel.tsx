"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DraftExtraction, ConfidenceLevel } from "@/features/intake/schema";

interface IntakePanelProps {
  onApplyDraft: (draft: DraftExtraction) => void;
  onReviewGateChange: (isGated: boolean) => void;
}

interface ReviewItem {
  id: string;
  label: string;
  value: string;
  confidence: ConfidenceLevel;
  source: string | null;
  reason?: string;
  confirmed: boolean;
}

export function IntakePanel({ onApplyDraft, onReviewGateChange }: IntakePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedDraft, setExtractedDraft] = useState<DraftExtraction | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

  const handleExtract = async () => {
    if (!inputText.trim()) {
      setError("Please paste the couple's wedding message or itinerary details.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/intake/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = (await res.json()) as {
        success: boolean;
        draft?: DraftExtraction;
        error?: string;
      };

      if (!res.ok || !data.success || !data.draft) {
        setError(data.error || "Could not draft details. Please enter information manually.");
        return;
      }

      const draft = data.draft;
      setExtractedDraft(draft);

      // Build Review Gate Checklist: Every critical field requires human verification
      const items: ReviewItem[] = [];

      // 1. Couple names check: ALWAYS requires operator verification
      if (draft.couple?.partnerAName && draft.couple?.partnerBName) {
        items.push({
          id: "couple-names",
          label: "Couple Names",
          value: `${draft.couple.partnerAName} & ${draft.couple.partnerBName}`,
          confidence: "high",
          source: null,
          reason: "Verify bride and groom names match invitation wording.",
          confirmed: false,
        });
      } else {
        items.push({
          id: "missing-names",
          label: "Couple Names Missing",
          value: "Not detected",
          confidence: "low",
          source: null,
          reason: "Please verify and enter bride and groom names in the form.",
          confirmed: false,
        });
      }

      // 2. Wedding Date: ALWAYS requires operator verification
      if (draft.weddingDate.value) {
        items.push({
          id: "date",
          label: "Wedding Date",
          value: draft.weddingDate.value,
          confidence: draft.weddingDate.confidence,
          source: draft.weddingDate.source,
          reason: "Verify main wedding date against calendar.",
          confirmed: false,
        });
      } else {
        items.push({
          id: "missing-date",
          label: "Wedding Date Missing",
          value: "Not detected",
          confidence: "low",
          source: null,
          reason: "Select main wedding date manually.",
          confirmed: false,
        });
      }

      // 3. Destination City
      if (draft.city?.value) {
        items.push({
          id: "city",
          label: "City / Destination",
          value: draft.city.value,
          confidence: draft.city.confidence,
          source: draft.city.source,
          reason: "Verify wedding destination city.",
          confirmed: false,
        });
      }

      // 4. Events: Each ceremony requires per-field operator verification
      draft.events.forEach((evt, idx) => {
        items.push({
          id: `evt-${idx}`,
          label: `Ceremony: ${evt.title}`,
          value: `${evt.date || "Date unconfirmed"} at ${evt.startTime || "Time unconfirmed"} (${evt.venueName || "Venue unconfirmed"})`,
          confidence: evt.confidence,
          source: evt.source,
          reason: "Review ceremony date, timings, and venue details.",
          confirmed: false,
        });
      });

      // 5. Contacts / Phones: Each contact requires per-field operator verification
      draft.contacts.forEach((c, idx) => {
        items.push({
          id: `contact-${idx}`,
          label: `Contact: ${c.name} (${c.role})`,
          value: c.phoneE164 || c.phoneRaw || "Missing phone",
          confidence: c.confidence,
          source: c.source,
          reason: c.phoneE164
            ? "Confirm contact name and phone number."
            : "Phone number requires manual verification (could not format to E.164).",
          confirmed: false,
        });
      });

      // 6. UPI VPA
      draft.upiVpaCandidates.forEach((u, idx) => {
        items.push({
          id: `upi-${idx}`,
          label: "Shagun UPI VPA",
          value: u.value,
          confidence: u.confidence,
          source: null,
          reason: "Verify UPI VPA handle before publishing to guests.",
          confirmed: false,
        });
      });

      // 7. Conflicts
      draft.conflicts.forEach((conf, idx) => {
        items.push({
          id: `conflict-${idx}`,
          label: `Conflict: ${conf.field}`,
          value: conf.values.join(" vs "),
          confidence: "low",
          source: null,
          reason: conf.note,
          confirmed: false,
        });
      });

      setReviewItems(items);

      // Gate the create button if there are items needing confirmation
      onReviewGateChange(items.length > 0);

      // Apply prefill to main form
      onApplyDraft(draft);
    } catch {
      setError("Network or server error during intake extraction. Please enter manually.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConfirmItem = (id: string) => {
    const updated = reviewItems.map((item) =>
      item.id === id ? { ...item, confirmed: !item.confirmed } : item,
    );
    setReviewItems(updated);
    const unconfirmed = updated.some((item) => !item.confirmed);
    onReviewGateChange(unconfirmed);
  };

  const allConfirmed = reviewItems.length > 0 && reviewItems.every((item) => item.confirmed);
  const pendingCount = reviewItems.filter((item) => !item.confirmed).length;

  return (
    <div className="rounded-xl border border-[#C9933A]/30 bg-[#160A10] p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-left font-serif text-lg font-light text-[#FFF9F2] hover:text-[#C9933A] focus-visible:outline-none"
        >
          <Sparkles className="h-5 w-5 text-[#C9933A]" />
          <span>Paste WhatsApp Message (AI Intake Draft Assistant)</span>
          <span className="rounded-full bg-[#C9933A]/20 px-2 py-0.5 font-mono text-[10px] text-[#C9933A]">
            Staff Only
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-[#E2D5C7]/60 hover:text-white"
        >
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4 border-t border-[#C9933A]/15 pt-3">
          <p className="text-xs leading-relaxed text-[#E2D5C7]/70">
            Paste forwarded WhatsApp invitations, itinerary messages, or couple details. Our
            deterministic assistant extracts names, timings, venues, and contacts into a prefilled
            draft for your review.
            <strong className="text-[#C9933A]">
              {" "}
              Zero data is saved until you manually click Create Wedding.
            </strong>
          </p>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            maxLength={20000}
            placeholder="Paste raw WhatsApp text here (e.g. 'Priya weds Rahul, 14 Dec 2026 at Taj Lake Palace, Udaipur. Sangeet at 7 PM...')"
            className="w-full rounded-lg border border-[#C9933A]/30 bg-[#0E0508] p-3 font-mono text-xs text-[#FFF9F2] placeholder-[#E2D5C7]/30 focus:border-[#C9933A] focus:outline-none"
          />

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#E2D5C7]/40">
              {inputText.length} / 20,000 characters
            </span>

            <Button
              type="button"
              disabled={isLoading || !inputText.trim()}
              onClick={handleExtract}
              className="rounded-lg bg-gradient-to-r from-[#C9933A] to-[#DFB15B] px-5 py-2 text-xs font-semibold text-black shadow-md transition hover:scale-105 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Draft...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Draft from Details
                </>
              )}
            </Button>
          </div>

          {/* REVIEW GATE CHECKLIST */}
          {reviewItems.length > 0 && (
            <div className="mt-5 space-y-3 rounded-lg border border-amber-500/30 bg-[#1D0F16] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-400" />
                  <h4 className="font-serif text-sm font-semibold text-[#FFF9F2]">
                    Review Gate: Human Verification Required
                  </h4>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] ${
                    allConfirmed
                      ? "border border-green-500/40 bg-green-950/80 text-green-300"
                      : "border border-amber-500/40 bg-amber-950/80 text-amber-300"
                  }`}
                >
                  {allConfirmed ? "✓ All Confirmed" : `${pendingCount} Pending Items`}
                </span>
              </div>

              <p className="text-[11px] text-[#E2D5C7]/70">
                To prevent publishing errors, please inspect each flagged field below. The{" "}
                <strong>&quot;Create Wedding&quot;</strong> button remains locked until every item
                is reviewed and marked confirmed.
              </p>

              <div className="space-y-2 pt-2">
                {reviewItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between gap-3 rounded-md border p-2.5 text-xs transition ${
                      item.confirmed
                        ? "border-green-500/30 bg-green-950/20 text-[#E2D5C7]/70"
                        : "border-amber-500/30 bg-[#180A10] text-[#FFF9F2]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{item.label}</span>
                        <span
                          className={`py-0.2 rounded px-1.5 text-[9px] font-bold uppercase ${
                            item.confidence === "high"
                              ? "bg-green-900/60 text-green-300"
                              : item.confidence === "medium"
                                ? "bg-yellow-900/60 text-yellow-300"
                                : "bg-red-900/60 text-red-300"
                          }`}
                        >
                          {item.confidence}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-[#C9933A]">{item.value}</p>
                      {item.reason && (
                        <p className="text-[10px] text-[#E2D5C7]/60">{item.reason}</p>
                      )}
                      {item.source && (
                        <p className="text-[10px] italic text-[#E2D5C7]/40">
                          Source snippet: &quot;{item.source}&quot;
                        </p>
                      )}
                    </div>

                    <label className="mt-1 flex shrink-0 cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.confirmed}
                        onChange={() => handleToggleConfirmItem(item.id)}
                        className="h-4 w-4 rounded border-amber-500/50 bg-[#0E0508] text-[#C9933A] focus:ring-amber-500"
                      />
                      <span className="text-[11px] text-[#E2D5C7]/80">
                        {item.confirmed ? "Confirmed" : "Verify"}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extractedDraft && reviewItems.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-950/30 p-3 text-xs text-green-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
              <span>All extracted fields scored High confidence! Form has been prefilled.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
