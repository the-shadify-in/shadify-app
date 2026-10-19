/**
 * Centralized brand & concierge contact configuration.
 * All public WhatsApp inquiries and support channels resolve from environment variables.
 */

const envWhatsapp = process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP?.replace(/\D/g, "");
const envWhatsappDisplay = process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP_DISPLAY;

export const SITE_CONFIG = {
  name: "Shadify",
  legalEntity: "Shadify Technologies Pvt. Ltd.",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "shadify.in",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "concierge@shadify.in",
  whatsappNumber: envWhatsapp || "918000000000",
  whatsappDisplay: envWhatsappDisplay || "+91 (Concierge Line)",
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
