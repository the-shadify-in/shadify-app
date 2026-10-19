"use client";

import React from "react";
import { Gift, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileDockProps {
  onOpenShagun: () => void;
  showShagun?: boolean;
}

export function MobileDock({ onOpenShagun, showShagun = true }: MobileDockProps) {
  return (
    <div className="bg-theme-surface/95 fixed inset-x-0 bottom-0 z-40 border-t border-[#D4AF37]/30 p-3 shadow-2xl backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-3">
        {showShagun && (
          <Button
            type="button"
            variant="outline"
            onClick={onOpenShagun}
            className="bg-theme-bg/60 flex-1 border-[#D4AF37]/50 font-serif text-xs tracking-wider text-theme-text-primary shadow-sm"
          >
            <Gift className="mr-1.5 h-3.5 w-3.5 text-theme-accent" />
            <span>Digital Shagun</span>
          </Button>
        )}

        <Button
          asChild
          className="text-theme-on-primary flex-1 rounded-lg bg-theme-primary font-serif text-xs uppercase tracking-widest shadow-md"
        >
          <a href="#rsvp">
            <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
            <span>RSVP NOW</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
