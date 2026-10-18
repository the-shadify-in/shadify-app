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
    canHideBranding: false,
    canCustomDomain: false,
    allowedPresets: ["royal-crimson", "emerald-gold", "ivory-minimal"],
    features: [
      "Royal CSS Envelope Reveal",
      "Up to 3 ceremony itineraries with Google Maps",
      "Per-event RSVP with dietary preferences",
      "Zero-commission direct UPI Shagun link",
      "Client-side 1-tap WhatsApp invitation studio",
      "5-Year web preview hosting",
      "90-Day master photo storage",
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
    canHideBranding: true,
    canCustomDomain: false,
    allowedPresets: ["royal-crimson", "emerald-gold", "ivory-minimal", "sunset-day", "sunset-dusk"],
    features: [
      "All 5 curated luxury theme presets",
      "Unlimited ceremony events & dress codes",
      "Meet the VIPs (family & wedding party cards)",
      "Dedicated WhatsApp concierge setup & onboarding",
      "Exportable RSVP spreadsheets with family groupings",
      "Option to remove Shadify branding entirely",
      "5-Year web preview hosting",
      "90-Day master photo storage",
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
    canHideBranding: true,
    canCustomDomain: true,
    allowedPresets: ["royal-crimson", "emerald-gold", "ivory-minimal", "sunset-day", "sunset-dusk", "bespoke"],
    features: [
      "Everything in Premium",
      "Bespoke designer theme tailored to invitation card",
      "Custom wedding domain (e.g. priyarahul.wedding)",
      "Multi-photographer live QR upload pass for crew",
      "Priority phone & WhatsApp concierge support",
      "5-Year web preview hosting",
      "90-Day master photo storage",
    ],
  },
};
