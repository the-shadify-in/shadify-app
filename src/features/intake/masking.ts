/**
 * Local PII Masking & De-identification Module.
 * Strips phone numbers, email addresses, and UPI IDs locally in server memory
 * before sending text to third-party AI model providers, restoring them upon return.
 */

export interface MaskResult {
  maskedText: string;
  tokenMap: Map<string, string>;
}

// Matches Indian & International phone numbers (e.g. +91 98765 43210, 98765-43210, +1 555-123-4567)
const PHONE_REGEX = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4,5}\b/g;

// Matches email addresses
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Matches UPI VPAs (e.g. couple@okhdfcbank, payment@upi)
const UPI_REGEX = /\b[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,64}\b/g;

/**
 * Replaces phone numbers, emails, and UPI handles with privacy-preserving tokens.
 */
export function maskPii(input: string): MaskResult {
  const tokenMap = new Map<string, string>();
  let emailCounter = 1;
  let upiCounter = 1;
  let phoneCounter = 1;

  // 1. Mask Emails first
  let masked = input.replace(EMAIL_REGEX, (match) => {
    const token = `[EMAIL_REF_${emailCounter++}]`;
    tokenMap.set(token, match);
    return token;
  });

  // 2. Mask UPI VPAs (that weren't already matched as emails)
  masked = masked.replace(UPI_REGEX, (match) => {
    // Check if it's already a placeholder token
    if (match.startsWith("[") && match.endsWith("]")) return match;
    const token = `[UPI_REF_${upiCounter++}]`;
    tokenMap.set(token, match);
    return token;
  });

  // 3. Mask Phones (only numeric sequences of at least 8 digits to prevent masking years/times)
  masked = masked.replace(PHONE_REGEX, (match) => {
    const digitsOnly = match.replace(/\D/g, "");
    // Ignore short numbers like 4-digit years (2026) or times (1800)
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      return match;
    }
    const token = `[PHONE_REF_${phoneCounter++}]`;
    tokenMap.set(token, match);
    return token;
  });

  return { maskedText: masked, tokenMap };
}

/**
 * Restores original PII into text that was previously masked.
 */
export function unmaskText(text: string, tokenMap: Map<string, string>): string {
  let unmasked = text;
  tokenMap.forEach((originalValue, token) => {
    unmasked = unmasked.replaceAll(token, originalValue);
  });
  return unmasked;
}

/**
 * Recursively unmasks string fields in parsed data structures.
 */
export function unmaskData<T>(data: T, tokenMap: Map<string, string>): T {
  if (tokenMap.size === 0 || data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return unmaskText(data, tokenMap) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item: unknown) => unmaskData(item, tokenMap)) as unknown as T;
  }

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const copy: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(record)) {
      copy[key] = unmaskData(val, tokenMap);
    }
    return copy as T;
  }

  return data;
}
