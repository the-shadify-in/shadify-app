import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { normalizePhoneNumber } from "@/lib/phone";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const {
      weddingId: rawWeddingId,
      weddingSlug,
      eventId,
      guestId,
      respondentName: rawRespondentName,
      guestName,
      respondentPhone: rawRespondentPhone,
      guestPhone,
      attending,
      partySize = 1,
      mealPreference,
      needsStay = false,
      needsAccommodation = false,
      arrivalNotes,
      blessingMessage,
      notes,
      turnstileToken,
    } = body;

    // 1. Rate Limiting: Keyed by wedding AND client IP with generous allowance (60/min) for shared venue Wi-Fi
    // Primary bot defense is Cloudflare Turnstile token verification
    const weddingKey = (weddingSlug || rawWeddingId || "global").toString().toLowerCase().trim();
    const rateCheck = checkRateLimit(`rsvp:${weddingKey}:${ip}`, 60, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) } },
      );
    }

    // 2. Cloudflare Turnstile Bot Protection Verification
    const turnstileCheck = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { error: turnstileCheck.error || "Bot protection check failed." },
        { status: 403 },
      );
    }

    // Resolve weddingId if weddingSlug is supplied
    let weddingId = rawWeddingId;
    if (!weddingId && weddingSlug) {
      const w = await prisma.wedding.findUnique({
        where: { slug: String(weddingSlug).toLowerCase().trim() },
        select: { id: true },
      });
      if (w) weddingId = w.id;
    }

    const normalizedName = (rawRespondentName || guestName || "").trim();

    // Strict E.164 phone normalization across domestic and international guests
    const rawPhone = (rawRespondentPhone || guestPhone || "").trim();
    let normalizedPhone: string | null = null;
    if (rawPhone) {
      const phoneValidation = normalizePhoneNumber(rawPhone);
      if (!phoneValidation.valid) {
        return NextResponse.json(
          { error: phoneValidation.error || "Invalid phone number format." },
          { status: 400 },
        );
      }
      normalizedPhone = phoneValidation.e164 || null;
    }

    const resolvedAttending = typeof attending === "boolean" ? attending : true;
    const resolvedNeedsStay = Boolean(needsStay || needsAccommodation);
    const resolvedBlessing = blessingMessage || notes;

    // 3. Validate mandatory fields
    if (!weddingId || !eventId || !normalizedName) {
      return NextResponse.json({ error: "Missing required RSVP fields." }, { status: 400 });
    }

    // Party size check (1 to 20)
    const parsedPartySize = Number(partySize);
    if (parsedPartySize < 0 || parsedPartySize > 20) {
      return NextResponse.json({ error: "Party size must be between 0 and 20." }, { status: 400 });
    }

    // 4. Create RSVP entry
    const rsvp = await prisma.eventRsvp.create({
      data: {
        weddingId,
        eventId,
        guestId: guestId || null,
        respondentName: normalizedName,
        respondentPhone: normalizedPhone,
        attending: resolvedAttending,
        partySize: parsedPartySize,
        mealPreference: mealPreference || null,
        needsStay: resolvedNeedsStay,
        arrivalNotes: arrivalNotes ? String(arrivalNotes).slice(0, 500) : null,
        blessingMessage: resolvedBlessing ? String(resolvedBlessing).slice(0, 1000) : null,
      },
    });

    return NextResponse.json({ success: true, rsvpId: rsvp.id });
  } catch (error: unknown) {
    // Check for Postgres unique constraint violation (code 23505 or Prisma P2002)
    const err = error as { code?: string; message?: string };
    if (err?.code === "P2002" || err?.message?.includes("uq_rsvp")) {
      return NextResponse.json(
        { error: "An RSVP with this name and phone has already been submitted for this ceremony." },
        { status: 409 },
      );
    }

    console.error("RSVP submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP. Please try again." },
      { status: 500 },
    );
  }
}
