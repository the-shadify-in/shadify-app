import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  try {
    // 1. IP Rate Limiting (max 5 submissions per 60s window)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = checkRateLimit(`rsvp:${ip}`, 5, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) } }
      );
    }

    const body = await request.json();
    const {
      weddingId,
      eventId,
      guestId,
      respondentName,
      respondentPhone,
      attending,
      partySize = 1,
      mealPreference,
      needsStay = false,
      arrivalNotes,
      blessingMessage,
    } = body;

    // 2. Validate mandatory fields
    if (!weddingId || !eventId || !respondentName || typeof attending !== "boolean") {
      return NextResponse.json(
        { error: "Missing required RSVP fields." },
        { status: 400 }
      );
    }

    // Party size check (1 to 20)
    const parsedPartySize = Number(partySize);
    if (parsedPartySize < 0 || parsedPartySize > 20) {
      return NextResponse.json(
        { error: "Party size must be between 0 and 20." },
        { status: 400 }
      );
    }

    // 3. Normalized inputs
    const normalizedName = respondentName.trim();
    const normalizedPhone = respondentPhone ? respondentPhone.trim() : null;

    // 4. Create RSVP entry
    const rsvp = await prisma.eventRsvp.create({
      data: {
        weddingId,
        eventId,
        guestId: guestId || null,
        respondentName: normalizedName,
        respondentPhone: normalizedPhone,
        attending,
        partySize: parsedPartySize,
        mealPreference: mealPreference || null,
        needsStay: Boolean(needsStay),
        arrivalNotes: arrivalNotes ? String(arrivalNotes).slice(0, 500) : null,
        blessingMessage: blessingMessage ? String(blessingMessage).slice(0, 1000) : null,
      },
    });

    return NextResponse.json({ success: true, rsvpId: rsvp.id });
  } catch (error: unknown) {
    // Check for Postgres unique constraint violation (code 23505 or Prisma P2002)
    const err = error as { code?: string; message?: string };
    if (err?.code === "P2002" || err?.message?.includes("uq_rsvp")) {
      return NextResponse.json(
        { error: "An RSVP with this name and phone has already been submitted for this ceremony." },
        { status: 409 }
      );
    }

    console.error("RSVP submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP. Please try again." },
      { status: 500 }
    );
  }
}
