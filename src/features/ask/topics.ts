/**
 * Topic definitions and URL hash parsing for the Guest "Ask" Chips Drawer.
 * Deep linking uses URL hashes (e.g. #ask=venue) so guest pages remain 100% statically cacheable.
 */

export const ASK_TOPICS = ["timings", "venue", "dress_code", "gifts", "rsvp", "other"] as const;

export type AskTopic = (typeof ASK_TOPICS)[number];

export const TELEMETRY_TOPICS = [...ASK_TOPICS, "other_contact_tapped"] as const;

export type TelemetryTopic = (typeof TELEMETRY_TOPICS)[number];

export interface ParsedAskHash {
  isOpen: boolean;
  topic: AskTopic | null;
}

/**
 * Normalizes URL hash string (e.g. "#ask=dress-code", "#ask=venue", "#ask")
 * and extracts the targeted topic.
 *
 * Rules:
 * - Empty or non-#ask hash -> isOpen: false, topic: null
 * - "#ask" -> isOpen: true, topic: null (shows topic list)
 * - "#ask=venue" -> isOpen: true, topic: "venue"
 * - Unknown topic in hash (e.g. "#ask=weather") -> isOpen: true, topic: null (topic list fallback)
 */
export function parseAskHash(hash: string): ParsedAskHash {
  if (!hash) {
    return { isOpen: false, topic: null };
  }

  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!clean.startsWith("ask")) {
    return { isOpen: false, topic: null };
  }

  // Exact match for "#ask"
  if (clean === "ask") {
    return { isOpen: true, topic: null };
  }

  // Check for parameter format: "ask=..."
  if (clean.startsWith("ask=")) {
    const rawVal = clean.slice(4).trim().toLowerCase();
    const normalized = rawVal.replace(/-/g, "_");

    if (ASK_TOPICS.includes(normalized as AskTopic)) {
      return { isOpen: true, topic: normalized as AskTopic };
    }

    // Unknown value under ask parameter -> open topic list
    return { isOpen: true, topic: null };
  }

  return { isOpen: false, topic: null };
}

/**
 * Builds the URL hash corresponding to a chosen topic.
 */
export function getHashForTopic(topic: AskTopic | null): string {
  if (!topic) return "#ask";
  const slug = topic.replace(/_/g, "-");
  return `#ask=${slug}`;
}
