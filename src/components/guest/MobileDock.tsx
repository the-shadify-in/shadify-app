"use client";

import React from "react";
import { Gift, CalendarCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileDockProps {
  onOpenShagun: () => void;
  onOpenAsk?: () => void;
  showShagun?: boolean;
}

export function MobileDock({ onOpenShagun, onOpenAsk, showShagun = true }: MobileDockProps) {
  return (
    <div className="bg-theme-surface/95 fixed inset-x-0 bottom-0 z-40 border-t border-[#D4AF37]/30 p-2.5 shadow-2xl backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-2">
        {onOpenAsk && (
          <Button
            type="button"
            variant="outline"
            onClick={onOpenAsk}
            className="bg-theme-bg/60 min-h-[44px] flex-1 border-[#D4AF37]/50 font-serif text-xs tracking-wider text-theme-text-primary shadow-sm hover:border-[#D4AF37]"
          >
            <HelpCircle className="mr-1.5 h-4 w-4 text-theme-accent" />
            <span>Ask</span>
          </Button>
        )}

        {showShagun && (
          <Button
            type="button"
            variant="outline"
            onClick={onOpenShagun}
            className="bg-theme-bg/60 min-h-[44px] flex-1 border-[#D4AF37]/50 font-serif text-xs tracking-wider text-theme-text-primary shadow-sm hover:border-[#D4AF37]"
          >
            <Gift className="mr-1.5 h-4 w-4 text-theme-accent" />
            <span>Digital Shagun</span>
          </Button>
        )}

        <Button
          asChild
          className="text-theme-on-primary min-h-[44px] flex-1 rounded-lg bg-theme-primary font-serif text-xs uppercase tracking-widest shadow-md"
        >
          <a href="#rsvp">
            <CalendarCheck className="mr-1.5 h-4 w-4" />
            <span>RSVP</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
