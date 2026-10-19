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
 * Examples:
 * - "9876543210" -> "+919876543210"
 * - "098765 43210" -> "+919876543210"
 * - "+91 98765 43210" -> "+919876543210"
 * - "+1 (555) 234-5678" -> "+15552345678"
 */
export function normalizePhoneNumber(
  raw: string,
  defaultCountry: CountryCode = "IN",
): PhoneValidationResult {
  if (!raw || typeof raw !== "string") {
    return { valid: false, error: "Phone number is required." };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Phone number is required." };
  }

  try {
    const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
    // Use isPossible() to allow newly minted telecom prefixes while ensuring proper country and length
    if (!parsed || !parsed.isPossible()) {
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
