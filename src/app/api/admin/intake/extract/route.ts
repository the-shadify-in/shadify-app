import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth";
import { runIntakeExtraction } from "@/features/intake/provider";
import { intakeMetrics } from "@/features/intake/metrics";
import { checkRateLimit } from "@/lib/ratelimit";

export const maxDuration = 30; // Maximum allowed serverless execution time in seconds

const MAX_INPUT_CHARS = 20000;

const IntakeExtractRequestSchema = z.object({
  text: z.string().min(5).max(MAX_INPUT_CHARS),
});

export async function POST(request: NextRequest) {
  const requestId = `intake_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const startTime = Date.now();
  intakeMetrics.recordAttempt();

  try {
    // 1. Staff Authentication Gate
    let session;
    try {
      session = await requireAdminSession();
    } catch {
      return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
    }

    // 2. Kill Switch Feature Flag Check — defaults OFF until data-terms are reviewed
    const isAiEnabled = process.env.INTAKE_AI_ENABLED === "true";
    if (!isAiEnabled) {
      return NextResponse.json(
        { error: "AI Intake Assistant is currently disabled by administrator kill switch." },
        { status: 503 },
      );
    }

    // 3. CSRF Verification
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { error: "Cross-site request forgery blocked." },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
      }
    }

    // 4. Per-Staff and Global Rate Limiting
    const staffLimitKey = `intake:staff:${session.userId}`;
    const staffCheck = checkRateLimit(staffLimitKey, 30, 3600000); // 30 extractions per staff per hour
    if (!staffCheck.success) {
      return NextResponse.json(
        { error: "Hourly intake extraction quota exceeded for your staff account." },
        { status: 429 },
      );
    }

    const globalCheck = checkRateLimit("intake:global:daily", 500, 86400000); // 500 extractions/day
    if (!globalCheck.success) {
      return NextResponse.json(
        { error: "Global platform daily intake limit reached." },
        { status: 429 },
      );
    }

    // 5. Parse and Validate Request Payload
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const parseResult = IntakeExtractRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Input text must be between 5 and 20,000 characters.",
          details: parseResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { text } = parseResult.data;

    // 6. Execute Extraction through Provider Abstraction
    const result = await runIntakeExtraction({
      rawText: text,
      staffId: session.userId,
    });

    const latencyMs = Date.now() - startTime;
    intakeMetrics.recordSuccess(latencyMs, result.costEstimateInr);

    // 7. Structured Privacy-Safe Telemetry Log (ZERO PII: no names, phones, text logged)
    console.info(
      JSON.stringify({
        level: 30,
        requestId,
        staffId: session.userId,
        inputLength: text.length,
        latencyMs,
        provider: result.provider,
        model: result.model,
        eventsCount: result.draft.events.length,
        contactsCount: result.draft.contacts.length,
        conflictsCount: result.draft.conflicts.length,
        outcome: "success",
      }),
    );

    return NextResponse.json({
      success: true,
      draft: result.draft,
      meta: {
        requestId,
        provider: result.provider,
        model: result.model,
        latencyMs,
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    intakeMetrics.recordParseFailure();

    const errorClass = error instanceof Error ? error.name : "UnknownError";

    // Privacy-Safe Error Log
    console.error(
      JSON.stringify({
        level: 50,
        requestId,
        latencyMs,
        errorClass,
        outcome: "failure",
      }),
    );

    return NextResponse.json(
      {
        success: false,
        error: "Could not draft wedding from provided details. Please enter information manually.",
      },
      { status: 422 },
    );
  }
}
