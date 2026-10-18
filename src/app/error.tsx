"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { getConciergeWhatsAppUrl } from "@/lib/config/contact";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Application error:", error);
  }, [error]);

  const whatsappUrl = getConciergeWhatsAppUrl(
    "Hi Shadify Concierge, I encountered an issue on the platform.",
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] px-4 text-center text-[#1F1A2E]">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#8B1E3F]/10 font-serif text-2xl text-[#8B1E3F]">
        !
      </div>
      <h1 className="font-serif text-3xl tracking-tight text-[#1F1A2E] sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-[#1F1A2E]/70">
        We encountered an unexpected error while loading this celebration page. Please try
        refreshing or contact our 24/7 concierge.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="rounded-full bg-[#8B1E3F] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#8B1E3F]/90"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-full border border-[#EADDCF] bg-white px-5 py-2.5 text-xs font-medium text-[#1F1A2E] transition hover:bg-gray-50"
        >
          Return Home
        </Link>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-[#EADDCF] bg-white px-5 py-2.5 text-xs font-medium text-[#1F1A2E] transition hover:bg-gray-50"
        >
          WhatsApp Concierge
        </a>
      </div>
    </div>
  );
}
