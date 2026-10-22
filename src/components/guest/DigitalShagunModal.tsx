"use client";

import React, { useState } from "react";
import { Gift, Copy, Check, QrCode, Sparkles, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DigitalShagunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bride: string;
  groom: string;
  upiVpa?: string;
}

export function DigitalShagunModal({
  open,
  onOpenChange,
  bride,
  groom,
  upiVpa = "priyarahul@upi",
}: DigitalShagunModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(2101);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const PRESETS = [501, 1101, 2101, 5101, 11001, 21001];

  const effectiveAmount = customAmount ? Number(customAmount) || 0 : selectedAmount;

  // Construct direct NPCI UPI payment intent URI
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
    `${bride} and ${groom}`,
  )}&am=${effectiveAmount}&cu=INR&tn=${encodeURIComponent(
    `Shagun Blessings for ${bride} & ${groom}`,
  )}`;

  const handleCopy = () => {
    void navigator.clipboard.writeText(upiVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          backgroundColor: "var(--theme-surface)",
          color: "var(--theme-text-primary)",
        }}
        className="max-w-lg border-2 border-[#D4AF37] bg-theme-surface p-6 text-theme-text-primary shadow-2xl backdrop-blur-2xl sm:p-8"
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-theme-bg shadow-md">
            <Gift className="h-7 w-7 text-[#D4AF37]" />
          </div>

          <p className="font-serif text-xs font-semibold uppercase tracking-[0.35em] text-theme-accent">
            ✦ AUSPICIOUS SHAGUN ✦
          </p>
          <DialogTitle className="mt-1 font-serif text-2xl font-normal text-theme-text-primary sm:text-3xl">
            Send Shagun &amp; Blessings
          </DialogTitle>
          <DialogDescription className="mt-2 font-serif text-sm leading-relaxed text-theme-text-muted">
            In our tradition, an auspicious ₹1 coin represents prosperity, eternal abundance, and
            pure blessings for the newlyweds.
          </DialogDescription>
        </DialogHeader>

        {/* Auspicious Shagun Presets */}
        <div className="my-6">
          <label className="mb-3 block text-center text-xs font-semibold uppercase tracking-widest text-theme-accent">
            Select Auspicious Offering
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {PRESETS.map((amt) => {
              const isSelected = !customAmount && selectedAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setCustomAmount("");
                    setSelectedAmount(amt);
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all ${
                    isSelected
                      ? "text-theme-on-primary scale-[1.02] border-[#D4AF37] bg-theme-primary font-bold shadow-md"
                      : "bg-theme-bg/60 border-[#D4AF37]/30 text-theme-text-primary hover:border-[#D4AF37]"
                  }`}
                >
                  <span className="font-serif text-base sm:text-lg">
                    ₹{amt.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80">
                    + ₹1 coin 🪙
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Input */}
          <div className="mt-4">
            <Input
              type="number"
              placeholder="Or enter custom amount (e.g. ₹5,001)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              style={{
                color: "var(--theme-text-primary)",
                backgroundColor: "var(--theme-bg)",
              }}
              className="bg-theme-bg/90 placeholder:text-theme-text-muted/70 border-[#D4AF37]/50 text-center font-serif text-base text-theme-text-primary focus-visible:ring-[#D4AF37]"
            />
          </div>
        </div>

        {/* 1-Tap UPI Deep Link CTA */}
        <div className="space-y-3">
          <Button
            asChild
            size="lg"
            className="w-full rounded-xl bg-[#D4AF37] font-serif text-sm font-bold uppercase tracking-widest text-[#1A0A00] shadow-[0_8px_25px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.01] hover:bg-[#E8B96B]"
          >
            <a href={upiIntentUri}>
              <Sparkles className="mr-2 h-4 w-4" />
              <span>SEND ₹{effectiveAmount.toLocaleString("en-IN")} VIA UPI APP</span>
            </a>
          </Button>

          {/* QR Code and Copy Options */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQr(!showQr)}
              className="flex-1 border-[#D4AF37]/40 font-serif text-xs tracking-wider text-theme-text-primary hover:border-[#D4AF37]"
            >
              <QrCode className="mr-1.5 h-3.5 w-3.5 text-theme-accent" />
              <span>{showQr ? "Hide QR Code" : "Show QR Code"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="flex-1 border-[#D4AF37]/40 font-serif text-xs tracking-wider text-theme-text-primary hover:border-[#D4AF37]"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                  <span>Copied VPA</span>
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5 text-theme-accent" />
                  <span>Copy UPI ID</span>
                </>
              )}
            </Button>
          </div>

          {/* QR Code Graphic View */}
          {showQr && (
            <div className="mt-4 rounded-xl border border-[#D4AF37]/30 bg-white p-6 text-center text-black">
              {/* Fallback QR placeholder / SVG */}
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-lg border-2 border-black/10 bg-gray-50 p-2">
                <QrCode className="h-32 w-32 text-gray-800" />
              </div>
              <p className="mt-3 font-mono text-xs font-semibold text-gray-600">{upiVpa}</p>
              <p className="mt-1 text-[11px] text-gray-500">
                Scan with Google Pay, PhonePe, Paytm, or BHIM
              </p>
            </div>
          )}
        </div>

        {/* Direct Settlement Trust Badge */}
        <div className="bg-theme-bg/60 mt-6 flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/20 p-3 text-[11px] font-medium text-theme-text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>
            100% Direct to Couple&apos;s Account • Zero Platform Deductions • Zero Gateway Fees
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
