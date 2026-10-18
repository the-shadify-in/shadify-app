/**
 * Centralized brand & concierge contact configuration.
 * Change the business number or support email in this single file.
 */

export const SITE_CONFIG = {
  name: "Shadify",
  legalEntity: "Shadify Technologies Pvt. Ltd.",
  domain: "shadify.in",
  supportEmail: "concierge@shadify.in",
  whatsappNumber: "919876543210", // Dedicated Shadify concierge WhatsApp line
  whatsappDisplay: "+91 98765 43210",
  address: "Indiranagar, Bengaluru, Karnataka 560038",
};

/**
 * Builds the direct WhatsApp inquiry URL to the Shadify Concierge with pre-filled message.
 */
export function getConciergeWhatsAppUrl(context?: { plan?: string; theme?: string }): string {
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
