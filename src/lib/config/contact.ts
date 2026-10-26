/**
 * Centralized brand & concierge contact configuration.
 * All public WhatsApp inquiries and support channels resolve from environment variables.
 */

const isProductionTarget =
  (process.env.VERCEL_ENV === "production" ||
    process.env.BUILD_TARGET === "production" ||
    (process.env.NODE_ENV === "production" && process.env.CI !== "true")) &&
  process.env.NEXT_PHASE !== "phase-production-build";

const rawWhatsapp = process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP?.replace(/\D/g, "");

// In production builds and runtime, fail fast if the concierge number is missing, placeholder, or test mock
if (isProductionTarget) {
  if (!rawWhatsapp || rawWhatsapp === "918000000000" || rawWhatsapp === "919876543210") {
    throw new Error(
      "FATAL_CONFIG_ERROR: In production builds and runtime, NEXT_PUBLIC_CONCIERGE_WHATSAPP must be configured with a real business phone number and cannot be unconfigured or set to test placeholder 918000000000/919876543210.",
    );
  }
}

const envWhatsapp = rawWhatsapp || (isProductionTarget ? "" : "919876543210");
const envWhatsappDisplay =
  process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP_DISPLAY ||
  (isProductionTarget ? (envWhatsapp ? `+${envWhatsapp}` : "") : "+91 98765 43210");

export const SITE_CONFIG = {
  name: "Shadify",
  legalEntity: "Shadify",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "shadify.in",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "concierge@shadify.in",
  whatsappNumber: envWhatsapp,
  whatsappDisplay: envWhatsappDisplay || (envWhatsapp ? `+${envWhatsapp}` : ""),
  address: "Indiranagar, Bengaluru, Karnataka 560038",
};

/**
 * Builds the direct WhatsApp inquiry URL to the Shadify Concierge with pre-filled message.
 */
export function getConciergeWhatsAppUrl(
  context?: { plan?: string; theme?: string } | string,
): string {
  if (!SITE_CONFIG.whatsappNumber) {
    return "#contact-unavailable";
  }
  if (typeof context === "string") {
    return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(context)}`;
  }

  const planNote = context?.plan ? ` (${context.plan.toUpperCase()} Plan)` : "";
  const themeNote = context?.theme ? `\nPreferred Theme: ${context.theme}` : "";

  const text = encodeURIComponent(
    `Namaste Shadify Team,\n\nI would like to create a luxury wedding website${planNote}.\n\n` +
      `• Bride & Groom Names: \n` +
      `• Wedding Date: \n` +
      `• City / Venue: ${themeNote}\n\n` +
      `Please share a preview and onboarding details.`,
  );

  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${text}`;
}
