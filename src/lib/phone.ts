import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export interface PhoneValidationResult {
  valid: boolean;
  e164?: string;
  country?: string;
  error?: string;
}

/**
 * Normalizes any national or international phone number to canonical E.164 format.
 * Defaults to "IN" (India) if no international calling code is provided.
 *
 * Handles:
 * - Standard 10-digit: "9876543210" -> "+919876543210"
 * - Trunk prefix 0: "098765 43210" -> "+919876543210"
 * - International + prefix: "+91 98765 43210" -> "+919876543210"
 * - International with spaces: "+ 91 98765 43210" -> "+919876543210"
 * - IDD 00 prefix: "00919876543210" -> "+919876543210", "00447911123456" -> "+447911123456"
 * - Rejects invalid numbers: "1234567", "0000000000"
 */
export function normalizePhoneNumber(
  raw: string,
  defaultCountry: CountryCode = "IN",
): PhoneValidationResult {
  if (!raw || typeof raw !== "string") {
    return { valid: false, error: "Phone number is required." };
  }

  let cleaned = raw.trim();
  if (cleaned.length === 0) {
    return { valid: false, error: "Phone number is required." };
  }

  // Handle leading + with spaces, e.g. "+ 91 98765 43210" -> "+91 98765 43210"
  cleaned = cleaned.replace(/^\+\s+/, "+");

  // Handle IDD 00 prefix (e.g. 0091... -> +91..., 0044... -> +44...)
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  try {
    const parsed = parsePhoneNumberFromString(cleaned, defaultCountry);

    // Strictly enforce isValid() (not isPossible()) so invalid numbers like 0000000000 are rejected
    if (!parsed || !parsed.isValid()) {
      return {
        valid: false,
        error: "Please enter a valid phone number (e.g. +91 98765 43210 or 10-digit mobile).",
      };
    }

    const country =
      parsed.country ||
      (parsed.countryCallingCode === "44"
        ? "GB"
        : parsed.countryCallingCode === "1"
          ? "US"
          : undefined);

    return {
      valid: true,
      e164: parsed.number, // Canonical E.164 string, e.g. "+919876543210"
      country,
    };
  } catch {
    return { valid: false, error: "Invalid phone number format." };
  }
}

/**
 * Returns plain numeric digits without leading '+' for WhatsApp click-to-chat links
 * (e.g. "+919876543210" -> "919876543210" for https://wa.me/919876543210)
 */
export function toWhatsAppNumber(e164: string): string {
  return e164.replace(/^\+/, "").replace(/\D/g, "");
}
