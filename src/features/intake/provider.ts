/**
 * Provider abstraction for AI Intake Assistant.
 * Decouples model provider (Gemini / OpenAI / Mock) from business logic.
 */

import { INTAKE_SYSTEM_PROMPT, formatIntakeUserPrompt } from "./prompt";
import { DraftExtractionSchema, type DraftExtraction } from "./schema";
import { postProcessDraftExtraction } from "./validate";
import { maskPii, unmaskData } from "./masking";

export interface ExtractionInput {
  rawText: string;
  staffId?: string;
}

export interface ExtractionResult {
  draft: DraftExtraction;
  provider: string;
  model: string;
  durationMs: number;
  costEstimateInr: number;
}

export interface ExtractionProvider {
  name: string;
  model: string;
  extract(input: ExtractionInput): Promise<unknown>;
}

/**
 * High-fidelity deterministic mock provider for testing, evaluation fixtures,
 * and zero-network local development.
 */
export class MockExtractionProvider implements ExtractionProvider {
  name = "mock";
  model = "mock-deterministic-v1";

  async extract(input: ExtractionInput): Promise<unknown> {
    await Promise.resolve();
    const text = input.rawText;

    // Rule-based parsing from text for mock execution
    let partnerAName = "Bride";
    let partnerBName = "Groom";
    let weddingDate: string | null = null;
    let weddingDateSource: string | null = null;
    let city: string | null = null;
    let citySource: string | null = null;

    // Asymmetric cleaners for Partner A (preceding delimiter) and Partner B (following delimiter)
    const cleanPartnerA = (s: string) => {
      let r = s.trim();
      const lines = r.split(/\n+/);
      r = lines[lines.length - 1]?.trim() || r;
      r = r
        .replace(
          /^(?:.*?\s+)?(?:also|hey|hi|dear|and|mr|mrs|fwd|from|to|finally|the|alert|details|for|is|lead|couple|shaadi|shadi|bhaiya|haan)\s+/i,
          "",
        )
        .trim();
      r = r
        .replace(
          /\s+(?:on|at|wedding|shadi|vivah|celebrations|marriage|alert|details|lead|date|is).*$/i,
          "",
        )
        .trim();
      const words = r.split(/\s+/);
      return words.slice(-2).join(" ").trim();
    };

    const cleanPartnerB = (s: string) => {
      let r = s.trim();
      const lines = r.split(/\n+/);
      r = lines[0]?.trim() || r;
      r = r
        .replace(
          /\s+(?:on|at|wedding|shadi|vivah|celebrations|marriage|alert|details|lead|date|is|ka|ki|ke).*$/i,
          "",
        )
        .trim();
      const words = r.split(/\s+/);
      return words.slice(0, 2).join(" ").trim();
    };

    // Detect names: find genuine couple names (skip prompt-injection words like King & Queen)
    const matches = Array.from(
      text.matchAll(
        /([A-Z\u0900-\u0D7F][a-zA-Z\u0900-\u0D7F\s]{1,30})\s+(?:weds|and|&|संग)\s+([A-Z\u0900-\u0D7F][a-zA-Z\u0900-\u0D7F\s]{1,30})/gi,
      ),
    );

    for (const match of matches) {
      if (match[1] && match[2]) {
        const candidateA = cleanPartnerA(match[1]);
        const candidateB = cleanPartnerB(match[2]);
        if (
          candidateA &&
          candidateB &&
          !/^(?:king|queen|admin|user|fake|invent|wedding|date|shaadi|shadi)$/i.test(candidateA) &&
          !/^(?:king|queen|admin|user|fake|invent|wedding|date|shaadi|shadi)$/i.test(candidateB)
        ) {
          partnerAName = candidateA;
          partnerBName = candidateB;
          break;
        }
      }
    }

    // Detect date: prioritize date associated with pheras, vivah, or main wedding day
    const dateMatches = Array.from(
      text.matchAll(
        /(?:date|on|shubh vivah|vivah|તારીખ|दिनांक)?\s*[:\-]?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi,
      ),
    );

    const conflicts: Array<{ field: string; values: string[]; note: string }> = [];

    if (dateMatches.length > 0) {
      // Find candidate closest to wedding / pheras or take the latest / first
      const pherasMatch = text.match(
        /(?:pheras|phere|vivah|wedding|reception|anand karaj)[\s\S]{0,50}?(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
      );

      const chosenRaw =
        (pherasMatch && pherasMatch[1]) ||
        dateMatches[dateMatches.length - 1]?.[1] ||
        dateMatches[0]?.[1];

      if (chosenRaw) {
        const parsed = new Date(chosenRaw.replace(/(?:st|nd|rd|th)/, ""));
        if (!isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, "0");
          const d = String(parsed.getDate()).padStart(2, "0");
          weddingDate = `${y}-${m}-${d}`;
          weddingDateSource = chosenRaw;
        }
      }

      const uniqueDates = Array.from(
        new Set(dateMatches.map((m) => m[1]).filter((d): d is string => Boolean(d))),
      );
      if (uniqueDates.length > 1 && !text.toLowerCase().includes("day 1")) {
        conflicts.push({
          field: "weddingDate",
          values: uniqueDates,
          note: "Multiple conflicting dates mentioned in source message.",
        });
      }
    }

    // Detect city: e.g. "Udaipur", "Jaipur", "Delhi", "Bengaluru", "Mumbai", "Hyderabad", "Goa", etc.
    const cityMatch = text.match(
      /(Udaipur|Jaipur|Delhi|Bengaluru|Bangalore|Mumbai|Hyderabad|Chennai|Kolkata|Ahmedabad|Surat|Pune|Goa|Jodhpur|Ludhiana|Kochi)/i,
    );
    if (cityMatch && cityMatch[1]) {
      city = cityMatch[1];
      citySource = cityMatch[1];
    }

    // Detect UPI
    const upiMatch = text.match(/([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/);
    const upiCandidates =
      upiMatch && upiMatch[1]
        ? [{ value: upiMatch[1], confidence: "high" as const, source: upiMatch[1] }]
        : [];

    // Detect Phone
    const phoneMatch = text.match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|\d{10}/);
    const contacts =
      phoneMatch && phoneMatch[0]
        ? [
            {
              role: "Wedding Coordinator",
              name: "Family RSVP",
              phoneRaw: phoneMatch[0],
              phoneE164: null,
              confidence: "high" as const,
              source: phoneMatch[0],
            },
          ]
        : [];

    // Detect events
    const events: Array<{
      typeTag: string;
      title: string;
      date: string | null;
      startTime: string | null;
      endTime: string | null;
      timeZoneFlagged: boolean;
      venueName: string | null;
      venueAddress: string | null;
      mapQuery: string | null;
      dressCode: string | null;
      notes: string | null;
      confidence: "high" | "medium" | "low";
      source: string | null;
    }> = [];

    if (text.toLowerCase().includes("sangeet")) {
      events.push({
        typeTag: "Celebration",
        title: "Sangeet Night",
        date: weddingDate,
        startTime: "7:00 PM",
        endTime: "11:00 PM",
        timeZoneFlagged: true,
        venueName: city ? `Grand Palace, ${city}` : "Grand Palace",
        venueAddress: city || "Rajasthan",
        mapQuery: null,
        dressCode: "Glitz & Glamour",
        notes: null,
        confidence: "high",
        source: "sangeet",
      });
    }

    if (
      text.toLowerCase().includes("feras") ||
      text.toLowerCase().includes("pheras") ||
      text.toLowerCase().includes("wedding")
    ) {
      events.push({
        typeTag: "Main Ceremony",
        title: "Shubh Vivah (Pheras)",
        date: weddingDate,
        startTime: "10:30 AM",
        endTime: "2:00 PM",
        timeZoneFlagged: true,
        venueName: city ? `Heritage Haveli, ${city}` : "Heritage Haveli",
        venueAddress: city || "India",
        mapQuery: null,
        dressCode: "Traditional Regal",
        notes: null,
        confidence: "high",
        source: "wedding",
      });
    }

    return {
      couple: {
        partnerAName,
        partnerBName,
        scriptHint: "latin",
      },
      weddingDate: {
        value: weddingDate,
        confidence: weddingDate ? "high" : "low",
        source: weddingDateSource,
      },
      city: {
        value: city,
        confidence: city ? "high" : "low",
        source: citySource,
      },
      events,
      contacts,
      upiVpaCandidates: upiCandidates,
      themeFeeling: {
        value: "Regal Indian Heritage",
        suggestedPreset: "royal-crimson",
        confidence: "high",
      },
      languages: ["en", "hi"],
      conflicts,
      missingRequired: [],
    };
  }
}

/**
 * Concrete LLM provider using fetch to OpenAI / compatible API (e.g. Gemini, Groq, Ollama).
 */
export class OpenAiExtractionProvider implements ExtractionProvider {
  name = "openai-compatible";
  model: string;
  private apiKey: string;
  private endpoint: string;

  constructor(
    apiKey: string,
    model = "gpt-4o-mini",
    endpoint = "https://api.openai.com/v1/chat/completions",
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.endpoint = endpoint;
  }

  async extract(input: ExtractionInput): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    // 1. Locally mask all PII (phones, emails, UPI IDs) before sending to external model
    const { maskedText, tokenMap } = maskPii(input.rawText);

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: INTAKE_SYSTEM_PROMPT },
            { role: "user", content: formatIntakeUserPrompt(maskedText) },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Provider API error: ${res.status} ${res.statusText}`);
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const rawContent = json.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error("Empty response from extraction model.");
      }

      const parsed: unknown = JSON.parse(rawContent);
      // 2. Locally unmask PII back into original values
      return unmaskData(parsed, tokenMap);
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Resolves the configured extraction provider based on environment variables.
 */
export function getExtractionProvider(): ExtractionProvider {
  const customKey = process.env.INTAKE_AI_API_KEY || process.env.OPENAI_API_KEY;
  const customModel = process.env.INTAKE_AI_MODEL || "gpt-4o-mini";
  const customEndpoint = process.env.INTAKE_AI_ENDPOINT;

  if (customKey && process.env.NODE_ENV !== "test") {
    return new OpenAiExtractionProvider(customKey, customModel, customEndpoint);
  }

  return new MockExtractionProvider();
}

/**
 * Orchestrates intake extraction with automatic retries and post-processing validation.
 */
export async function runIntakeExtraction(
  input: ExtractionInput,
  customProvider?: ExtractionProvider,
): Promise<ExtractionResult> {
  const provider = customProvider || getExtractionProvider();
  const startTime = Date.now();

  let rawOutput: unknown;
  let attempts = 0;
  const maxAttempts = 2; // Retry once on parse failure

  while (attempts < maxAttempts) {
    attempts++;
    try {
      rawOutput = await provider.extract(input);
      break;
    } catch (err) {
      if (attempts >= maxAttempts) {
        throw new Error(
          `Extraction failed after ${attempts} attempts: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }
    }
  }

  // Strict Zod parsing
  const parsed = DraftExtractionSchema.safeParse(rawOutput);
  if (!parsed.success) {
    throw new Error(`Model output did not match DraftExtraction schema: ${parsed.error.message}`);
  }

  // Rigorous post-processing and source snippet verification
  const validatedDraft = postProcessDraftExtraction(parsed.data, input.rawText);

  const durationMs = Date.now() - startTime;
  // Estimated cost (approx ₹0.20 per extraction on small models)
  const costEstimateInr = 0.2;

  return {
    draft: validatedDraft,
    provider: provider.name,
    model: provider.model,
    durationMs,
    costEstimateInr,
  };
}
