/**
 * Centralized brand & concierge contact configuration.
 * All public WhatsApp inquiries and support channels resolve from environment variables.
 */

const isDevOrBuild =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.CI === "true";

const rawWhatsapp = process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP?.replace(/\D/g, "");
const envWhatsapp = rawWhatsapp || (isDevOrBuild ? "919876543210" : "");
const envWhatsappDisplay =
  process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP_DISPLAY ||
  (isDevOrBuild ? "+91 98765 43210" : undefined);

if (!envWhatsapp || envWhatsapp === "918000000000") {
  throw new Error(
    "NEXT_PUBLIC_CONCIERGE_WHATSAPP must be configured with a valid business phone number and cannot be the placeholder 918000000000.",
  );
}

export const SITE_CONFIG = {
  name: "Shadify",
  legalEntity: "Shadify",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "shadify.in",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "concierge@shadify.in",
  whatsappNumber: envWhatsapp,
  whatsappDisplay: envWhatsappDisplay || `+${envWhatsapp}`,
  address: "Indiranagar, Bengaluru, Karnataka 560038",
};

/**
 * Builds the direct WhatsApp inquiry URL to the Shadify Concierge with pre-filled message.
 */
export function getConciergeWhatsAppUrl(
  context?: { plan?: string; theme?: string } | string,
): string {
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
