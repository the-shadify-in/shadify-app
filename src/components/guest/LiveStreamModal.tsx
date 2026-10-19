"use client";

import React from "react";
import { Video, Sparkles, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface LiveStreamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bride: string;
  groom: string;
}

export function LiveStreamModal({ open, onOpenChange, bride, groom }: LiveStreamModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-2 border-[#D4AF37] bg-theme-surface p-6 text-theme-text-primary shadow-2xl backdrop-blur-2xl sm:p-8">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37] bg-theme-bg shadow-sm">
            <Video className="h-6 w-6 animate-pulse text-red-500" />
          </div>

          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-600/15 px-3 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-red-400">
            <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
            <span>PLATINUM VIRTUAL BROADCAST</span>
          </div>

          <DialogTitle className="mt-2 font-serif text-2xl font-normal text-theme-text-primary">
            Virtual Vivah &amp; Live Sacred Pheras
          </DialogTitle>
          <DialogDescription className="mt-1 font-serif text-xs text-theme-text-muted">
            Live from City Palace Gardens, Udaipur for outstation family &amp; global well-wishers
          </DialogDescription>
        </DialogHeader>

        {/* Video Player Mockup / Stream Embed Frame */}
        <div className="relative mt-4 flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-black p-6 text-center text-white shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-black/60 shadow-[0_0_25px_rgba(212,175,55,0.4)]">
              <Sparkles className="h-8 w-8 text-[#E8B96B]" />
            </div>
            <h4 className="mt-4 font-serif text-xl font-medium text-[#E8B96B]">
              {bride} &amp; {groom}&apos;s Live Broadcast
            </h4>
            <p className="mt-1 max-w-sm font-serif text-xs text-white/70">
              The high-definition live stream will commence 15 minutes prior to the sacred Vivah
              ceremony.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs text-[#E8B96B]">
              <Users className="h-3.5 w-3.5" />
              <span>340+ Virtual Guests Ready</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center font-serif text-[11px] text-theme-text-muted">
          Available on mobile, tablet, and smart TV via direct link with family chat enabled.
        </p>
      </DialogContent>
    </Dialog>
  );
}
