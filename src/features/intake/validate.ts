/**
 * Post-processing, security sanitization, and source-snippet verification for AI Intake Assistant.
 * Validates output code-side without trusting the model.
 */

import { normalizePhoneNumber } from "@/lib/phone";
import type { DraftExtraction, ConfidenceLevel } from "./schema";

const ALLOWED_MAP_HOSTS = new Set([
  "maps.google.com",
  "www.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

/**
 * Strips HTML tags, control characters (ASCII 0-31 except \n and \t), and trims whitespace.
 */
export function sanitizeString(val: string | null | undefined, maxLen = 500): string | null {
  if (!val || typeof val !== "string") return null;
  // Strip <script>...</script> and <style>...</style> blocks completely
  let cleaned = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  // Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  // Strip control characters except newline and tab
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  cleaned = cleaned.trim();
  if (cleaned.length === 0) return null;
  return cleaned.slice(0, maxLen);
}

/**
 * Checks if a snippet actually exists within the raw input text.
 * Normalizes Unicode with NFC and extra whitespace for resilient substring matching.
 */
export function snippetExistsInInput(
  snippet: string | null | undefined,
  rawInput: string,
): boolean {
  if (!snippet || typeof snippet !== "string") return false;
  const cleanSnippet = snippet.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
  if (cleanSnippet.length === 0) return false;
  const cleanInput = rawInput.normalize("NFC").replace(/\s+/g, " ").toLowerCase();
  return cleanInput.includes(cleanSnippet);
}

/**
 * Validates and sanitizes a complete DraftExtraction against the raw input.
 * - Rejects hallucinated values whose source snippet does not appear in the input.
 * - Cross-checks extracted dates, phone numbers, and names against snippet content.
 * - Normalizes and validates phone numbers to E.164.
 * - Validates UPI VPAs by NPCI format.
 * - Validates map links against the allowlist.
 * - Identifies missing required fields.
 */
export function postProcessDraftExtraction(
  draft: DraftExtraction,
  rawInput: string,
): DraftExtraction {
  const result = JSON.parse(JSON.stringify(draft)) as DraftExtraction;
  const missingRequired = new Set<string>(result.missingRequired || []);
  const normalizedRaw = rawInput.normalize("NFC");

  // Helper to verify source snippet. If invalid/missing, nullify value & add conflict
  const verifySource = (
    value: string | null | undefined,
    source: string | null | undefined,
    fieldName: string,
  ): { value: string | null; confidence: ConfidenceLevel; source: string | null } => {
    if (!value) {
      return { value: null, confidence: "low", source: null };
    }
    const sanitizedVal = sanitizeString(value);
    if (!sanitizedVal) {
      return { value: null, confidence: "low", source: null };
    }

    if (!source || !snippetExistsInInput(source, normalizedRaw)) {
      result.conflicts.push({
        field: fieldName,
        values: [sanitizedVal],
        note: `Hallucination guard: Source snippet '${source || "none"}' was not found in the pasted text. Field rejected.`,
      });
      return { value: null, confidence: "low", source: null };
    }

    return { value: sanitizedVal, confidence: "high", source: source.trim() };
  };

  // 1. Validate Couple Names
  if (result.couple) {
    result.couple.partnerAName = sanitizeString(result.couple.partnerAName, 100) || "";
    result.couple.partnerBName = sanitizeString(result.couple.partnerBName, 100) || "";

    const checkNameInText = (name: string, field: string) => {
      if (!name) return;
      const normalizedName = name.normalize("NFC").toLowerCase();
      const normalizedInput = normalizedRaw.toLowerCase();
      const firstName = normalizedName.split(/\s+/)[0] || "";
      if (firstName.length >= 2 && !normalizedInput.includes(firstName)) {
        result.conflicts.push({
          field,
          values: [name],
          note: `Hallucination guard: Name '${name}' does not appear in the input text. Flagged for review.`,
        });
      }
    };

    checkNameInText(result.couple.partnerAName, "couple.partnerAName");
    checkNameInText(result.couple.partnerBName, "couple.partnerBName");

    if (!result.couple.partnerAName || !result.couple.partnerBName) {
      missingRequired.add("couple.names");
    }
  } else {
    missingRequired.add("couple.names");
  }

  // 2. Validate Wedding Date
  if (result.weddingDate.value) {
    const verified = verifySource(
      result.weddingDate.value,
      result.weddingDate.source,
      "weddingDate",
    );
    if (verified.value) {
      // Validate ISO date format YYYY-MM-DD
      const parsedDate = new Date(verified.value);
      if (isNaN(parsedDate.getTime())) {
        result.conflicts.push({
          field: "weddingDate",
          values: [verified.value],
          note: "Invalid date format produced by model.",
        });
        result.weddingDate = { value: null, confidence: "low", source: null };
        missingRequired.add("weddingDate");
      } else {
        const isoDate = verified.value.slice(0, 10);
        // Anti-hallucination date cross-check: verify day digits exist in snippet
        const dayPart = isoDate.split("-")[2];
        const snippet = (verified.source || "").normalize("NFC");
        if (
          dayPart &&
          !snippet.includes(dayPart) &&
          !snippet.includes(String(parseInt(dayPart, 10)))
        ) {
          result.conflicts.push({
            field: "weddingDate",
            values: [isoDate],
            note: `Hallucination guard: Extracted day '${dayPart}' does not appear in source snippet '${snippet}'.`,
          });
          result.weddingDate = {
            value: isoDate,
            confidence: "low",
            source: verified.source,
          };
        } else {
          result.weddingDate = {
            value: isoDate,
            confidence: result.weddingDate.confidence,
            source: verified.source,
          };
        }
      }
    } else {
      result.weddingDate = { value: null, confidence: "low", source: null };
      missingRequired.add("weddingDate");
    }
  } else {
    missingRequired.add("weddingDate");
  }

  // 3. Validate City
  if (result.city.value) {
    const verified = verifySource(result.city.value, result.city.source, "city");
    result.city = {
      value: verified.value,
      confidence: verified.value ? result.city.confidence : "low",
      source: verified.source,
    };
  }

  // 4. Validate Events
  if (Array.isArray(result.events)) {
    result.events = result.events.map((evt, idx) => {
      const verifiedTitle = verifySource(evt.title, evt.source, `events[${idx}].title`);
      const title = verifiedTitle.value || `Ceremony ${idx + 1}`;

      // Check map query / url safety
      let mapQuery = sanitizeString(evt.mapQuery, 300);
      if (mapQuery && (mapQuery.startsWith("http://") || mapQuery.startsWith("https://"))) {
        try {
          const parsed = new URL(mapQuery);
          if (parsed.protocol !== "https:" || !ALLOWED_MAP_HOSTS.has(parsed.hostname)) {
            result.conflicts.push({
              field: `events[${idx}].mapQuery`,
              values: [mapQuery],
              note: `Disallowed map host '${parsed.hostname}'. Discarded external link.`,
            });
            mapQuery = null;
          }
        } catch {
          mapQuery = null;
        }
      }

      return {
        ...evt,
        title,
        typeTag: sanitizeString(evt.typeTag, 50) || "Ceremony",
        date: sanitizeString(evt.date, 50),
        startTime: sanitizeString(evt.startTime, 30),
        endTime: sanitizeString(evt.endTime, 30),
        timeZoneFlagged: true, // Flagged because zone is assumed Asia/Kolkata
        venueName: sanitizeString(evt.venueName, 150),
        venueAddress: sanitizeString(evt.venueAddress, 250),
        mapQuery,
        dressCode: sanitizeString(evt.dressCode, 150),
        notes: sanitizeString(evt.notes, 300),
      };
    });
  }

  // 5. Validate Contacts & Phone Normalization (E.164)
  if (Array.isArray(result.contacts)) {
    result.contacts = result.contacts.map((contact, idx) => {
      const rawPhone = sanitizeString(contact.phoneRaw, 40) || "";
      const phoneNorm = normalizePhoneNumber(rawPhone);

      let phoneE164: string | null = null;
      let confidence = contact.confidence;

      if (phoneNorm.valid && phoneNorm.e164) {
        phoneE164 = phoneNorm.e164;
      } else if (rawPhone.length > 0) {
        confidence = "low";
        result.conflicts.push({
          field: `contacts[${idx}].phone`,
          values: [rawPhone],
          note: `Invalid phone number format: '${rawPhone}'. Requires manual verification.`,
        });
      }

      // Anti-hallucination check: ensure phone digits exist in raw input text
      const phoneDigits = rawPhone.replace(/\D/g, "");
      const inputDigits = normalizedRaw.replace(/\D/g, "");
      if (phoneDigits.length >= 7 && !inputDigits.includes(phoneDigits)) {
        confidence = "low";
        result.conflicts.push({
          field: `contacts[${idx}].phone`,
          values: [rawPhone],
          note: `Hallucination guard: Phone number digits '${phoneDigits}' do not appear in the input text.`,
        });
      }

      return {
        ...contact,
        name: sanitizeString(contact.name, 100) || "Contact",
        role: sanitizeString(contact.role, 80) || "Family / Coordinator",
        phoneRaw: rawPhone,
        phoneE164,
        confidence,
        source: sanitizeString(contact.source, 200),
      };
    });
  }

  // 6. Validate UPI VPA Candidates
  if (Array.isArray(result.upiVpaCandidates)) {
    result.upiVpaCandidates = result.upiVpaCandidates
      .map((candidate) => {
        const raw = sanitizeString(candidate.value, 100) || "";
        const isValid = UPI_REGEX.test(raw);
        if (!isValid && raw.length > 0) {
          result.conflicts.push({
            field: "upiVpa",
            values: [raw],
            note: `Malformed UPI VPA '${raw}'. Must be handle@psp.`,
          });
        }
        return {
          ...candidate,
          value: raw,
          confidence: isValid ? candidate.confidence : "low",
        };
      })
      .filter((c) => c.value.length > 0);
  }

  result.missingRequired = Array.from(missingRequired);
  return result;
}
