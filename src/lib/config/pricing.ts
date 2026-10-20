/**
 * Authoritative Pricing Tiers & Entitlements for Shadify
 * Amounts are in Indian Rupees (and paise for database/PG accounting).
 */

export interface PricingPlan {
  id: "lite" | "premium" | "platinum";
  name: string;
  tagline: string;
  priceInr: number;
  pricePaise: number;
  hostingDurationYears: number;
  rawOriginalsRetentionDays: number;
  features: string[];
  allowedPresets: string[];
  maxEvents: number;
  maxPhotos: number;
  maxVideoBites: number;
  canHideBranding: boolean;
  canCustomDomain: boolean;
}

export const PRICING_PLANS: Record<"lite" | "premium" | "platinum", PricingPlan> = {
  lite: {
    id: "lite",
    name: "Lite",
    tagline: "The essential digital invitation & RSVP for modern weddings",
    priceInr: 2999,
    pricePaise: 299900,
    hostingDurationYears: 5,
    rawOriginalsRetentionDays: 90,
    maxEvents: 3,
    maxPhotos: 100,
    maxVideoBites: 0,
    canHideBranding: false,
    canCustomDomain: false,
    allowedPresets: ["royal-crimson", "emerald-gold", "ivory-minimal"],
    features: [
      "Interactive Wax Seal Envelope Reveal",
      "Up to 3 ceremony itineraries with Google Maps",
      "Photo gallery (up to 100 web-optimized photos)",
      "Per-event RSVP with dietary preferences",
      "Direct 0%-fee UPI Shagun link (to your UPI ID)",
      "Client-side 1-tap WhatsApp invite studio",
      "5-Year hosting included per terms (90-day original photo storage)",
      "Discreet 'Made with Shadify' neutral footer mark",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    tagline: "The complete luxury digital experience with VIP concierge",
    priceInr: 7999,
    pricePaise: 799900,
    hostingDurationYears: 5,
    rawOriginalsRetentionDays: 90,
    maxEvents: 8,
    maxPhotos: 300,
    maxVideoBites: 1,
    canHideBranding: true,
    canCustomDomain: false,
    allowedPresets: ["royal-crimson", "emerald-gold", "ivory-minimal", "sunset-day", "sunset-dusk"],
    features: [
      "All 5 curated celebration theme presets",
      "Up to 8 ceremony itineraries & dress codes",
      "Photo gallery (up to 300 web-optimized photos)",
      "1 Personal video bite message",
      "Meet the VIPs (family & wedding party cards)",
      "Dedicated WhatsApp concierge setup & onboarding",
      "RSVP catering export with dietary counts",
      "Option to remove Shadify branding entirely",
      "5-Year hosting included per terms (90-day original photo storage)",
    ],
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    tagline: "Bespoke design, custom domain & high-touch concierge",
    priceInr: 19999,
    pricePaise: 1999900,
    hostingDurationYears: 5,
    rawOriginalsRetentionDays: 90,
    maxEvents: 15,
    maxPhotos: 1000,
    maxVideoBites: 5,
    canHideBranding: true,
    canCustomDomain: true,
    allowedPresets: [
      "royal-crimson",
      "emerald-gold",
      "ivory-minimal",
      "sunset-day",
      "sunset-dusk",
      "bespoke",
    ],
    features: [
      "Everything in Premium",
      "Up to 15 ceremony itineraries & dress codes",
      "Photo gallery (up to 1,000 web-optimized photos)",
      "Up to 5 personal video bite messages",
      "Priority phone & WhatsApp concierge support",
      "Custom wedding domain (e.g. priyarahul.wedding) (Coming soon)",
      "Multi-photographer live QR upload pass for crew (Coming soon)",
      "Bespoke designer theme tailored to invitation card (Coming soon)",
      "5-Year hosting included per terms (90-day original photo storage)",
    ],
  },
};

export function getPlanPhotoLimit(plan: "lite" | "premium" | "platinum"): number {
  return PRICING_PLANS[plan]?.maxPhotos ?? 100;
}

export function getPlanVideoBiteLimit(plan: "lite" | "premium" | "platinum"): number {
  return PRICING_PLANS[plan]?.maxVideoBites ?? 0;
}
