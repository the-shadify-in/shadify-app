import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimitDistributed, getClientIp, hashIpForStorage } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { normalizePhoneNumber } from "@/lib/phone";
import { GUEST_PIN_COOKIE_NAME, verifyGuestPinToken } from "@/lib/auth";

const RsvpSubmissionSchema = z.object({
  weddingId: z.string().optional(),
  weddingSlug: z.string().optional(),
  eventId: z.string().optional(),
  guestId: z.string().optional(),
  respondentName: z.string().optional(),
  guestName: z.string().optional(),
  respondentPhone: z.string().optional(),
  guestPhone: z.string().optional(),
  attending: z.boolean().optional(),
  partySize: z.union([z.number(), z.string()]).optional(),
  mealPreference: z.enum(["pure_veg", "jain", "non_veg", "no_preference"]).nullish(),
  needsStay: z.boolean().optional(),
  needsAccommodation: z.boolean().optional(),
  arrivalNotes: z.string().optional(),
  blessingMessage: z.string().optional(),
  notes: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const ipHash = hashIpForStorage(ip);
    const rawBody: unknown = await request.json();
    const parseResult = RsvpSubmissionSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 },
      );
    }

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
    } = parseResult.data;

    // 1. Distributed Rate Limiting: Keyed by wedding AND hashed client IP (60/min) for shared venue Wi-Fi
    // Primary bot defense is Cloudflare Turnstile token verification; gracefully degrades to local limiter on Redis outage
    const weddingKey = (weddingSlug || rawWeddingId || "global").toString().toLowerCase().trim();
    const rateCheck = await checkRateLimitDistributed(`rsvp:${weddingKey}:${ipHash}`, 60, 60, {
      failClosed: false,
      fallbackLocalLimit: 30,
    });
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

    // Resolve weddingId and enforce private PIN gate if applicable
    let weddingId = rawWeddingId;
    const lookupWhere = weddingId
      ? { id: weddingId }
      : weddingSlug
        ? { slug: String(weddingSlug).toLowerCase().trim() }
        : null;

    if (lookupWhere && prisma.wedding?.findUnique) {
      let w = await prisma.wedding.findUnique({
        where: lookupWhere,
        select: { id: true, privatePinHash: true, themeConfig: true },
      });

      if (!w && weddingSlug && prisma.weddingAlias?.findUnique) {
        const alias = await prisma.weddingAlias.findUnique({
          where: { alias: String(weddingSlug).toLowerCase().trim() },
          select: {
            retiredAt: true,
            wedding: { select: { id: true, privatePinHash: true, themeConfig: true } },
          },
        });
        if (alias && !alias.retiredAt && alias.wedding) {
          w = alias.wedding;
        }
      }

      if (w) {
        weddingId = w.id;

        // Demo celebrations strictly simulate responses and never persist guest data to the database
        const isDemo = Boolean((w.themeConfig as Record<string, unknown> | null)?.isDemo);
        if (isDemo) {
          return NextResponse.json({
            success: true,
            isDemo: true,
            message:
              "Demo celebration — your response was simulated and not saved to any database.",
            rsvpId: "demo-simulated-rsvp-id",
          });
        }

        if (w.privatePinHash) {
          const pinCookie =
            request.cookies.get(GUEST_PIN_COOKIE_NAME) ||
            request.cookies.get("__Host-shadify_guest_access") ||
            request.cookies.get("shadify_guest_access") ||
            // Legacy fallback
            request.cookies.get(`__Host-shadify_pin_${w.id}`) ||
            request.cookies.get(`shadify_pin_${w.id}`);

          if (!pinCookie?.value || !verifyGuestPinToken(pinCookie.value, w.id, w.privatePinHash)) {
            return NextResponse.json(
              { error: "Access denied. PIN verification required for this private celebration." },
              {
                status: 403,
                headers: { "Cache-Control": "private, no-store, must-revalidate" },
              },
            );
          }
        }
      }
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

    // Tenant isolation: verify that the event ceremony actually belongs to this wedding celebration,
    // has not been deleted, and the parent wedding is not deleted and active/accepting RSVPs
    if (prisma.event?.findFirst) {
      const eventBelongsToWedding = await prisma.event.findFirst({
        where: {
          id: eventId,
          weddingId,
          deletedAt: null,
          wedding: {
            deletedAt: null,
            status: { in: ["published", "preview"] },
          },
        },
        select: {
          id: true,
          wedding: { select: { themeConfig: true } },
        },
      });
      if (!eventBelongsToWedding) {
        return NextResponse.json(
          {
            error:
              "The specified ceremony event is unavailable, not accepting RSVPs, or does not belong to this wedding celebration.",
          },
          { status: 404 },
        );
      }

      // Trusted database relation check: If the ceremony's parent wedding in the DB has themeConfig.isDemo,
      // simulate response and strictly prevent real RSVP persistence.
      const isEventWeddingDemo = Boolean(
        (eventBelongsToWedding.wedding?.themeConfig as Record<string, unknown> | null)?.isDemo,
      );
      if (isEventWeddingDemo) {
        return NextResponse.json({
          success: true,
          isDemo: true,
          message: "Demo celebration — your response was simulated and not saved to any database.",
          rsvpId: "demo-simulated-rsvp-id",
        });
      }
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
