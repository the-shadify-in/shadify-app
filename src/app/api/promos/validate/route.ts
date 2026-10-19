import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import {
  ValidatePromoSchema,
  validatePromoService,
  PromoNotFoundError,
  PromoExpiredError,
  PromoExhaustedError,
  PromoMinOrderError,
} from "@/features/promos";

export async function POST(request: NextRequest) {
  try {
    // 1. IP Rate Limiting to prevent brute-force promo guessing (10 attempts / min)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`promo-check:${ip}`, 10, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Too many promo code attempts. Please wait a minute before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)),
          },
        },
      );
    }

    const body: unknown = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    // 2. Validate input schema
    const parsed = ValidatePromoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 },
      );
    }

    // 3. Execute server-side validation
    const result = await validatePromoService(parsed.data.code, parsed.data.plan);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof PromoNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof PromoExpiredError) {
      return NextResponse.json({ error: error.message }, { status: 410 });
    }
    if (error instanceof PromoExhaustedError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof PromoMinOrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Promo validation route error:", error);
    return NextResponse.json(
      { error: "Failed to validate promo code. Please try again." },
      { status: 500 },
    );
  }
}
