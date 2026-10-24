import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { logRequest } from "@/lib/log";
import {
  ProvisionWeddingSchema,
  provisionWeddingTransactional,
  checkSlugAvailability,
  ContrastValidationError,
  ReservedSlugError,
  DuplicateSlugError,
  DuplicatePhoneError,
  DuplicateEmailError,
  DuplicateDomainError,
} from "@/features/weddings";

/**
 * GET /api/admin/weddings/provision
 * Query param: ?slug=xyz
 * Provides real-time debounced slug availability verification and collision suggestions.
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  if (session.role !== "super_admin" && session.role !== "staff") {
    return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Query parameter 'slug' is required" }, { status: 400 });
  }

  const result = await checkSlugAvailability(slug);
  return NextResponse.json(result);
}

/**
 * POST /api/admin/weddings/provision
 * Transactional Provisioning API for Shadify Concierge Studio.
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // 1. Auth Guard (Only super_admin or staff can provision)
  const session = await getAdminSession();
  if (!session) {
    logRequest({
      requestId,
      route: "/api/admin/weddings/provision",
      method: "POST",
      status: 401,
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  if (session.role !== "super_admin" && session.role !== "staff") {
    logRequest({
      requestId,
      route: "/api/admin/weddings/provision",
      method: "POST",
      status: 403,
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json(
      { error: "Forbidden. Insufficient privileges to provision weddings." },
      { status: 403 },
    );
  }

  // 2. Extract Idempotency Key from header or body
  const headerIdempotencyKey =
    req.headers.get("Idempotency-Key") || req.headers.get("idempotency-key");

  try {
    const rawBody: unknown = await req.json();
    const data = ProvisionWeddingSchema.parse(rawBody);

    const effectiveIdempotencyKey = headerIdempotencyKey || data.idempotencyKey;

    // 3. Delegate to Transactional Provisioning Domain Service
    const result = await provisionWeddingTransactional(
      data,
      session.userId,
      effectiveIdempotencyKey,
    );

    // 4. Invalidate cache for new slug
    try {
      revalidatePath(`/${result.slug}`);
      revalidatePath(`/${result.slug}`, "page");
    } catch {
      // In non-Next runtime environments (e.g. tests), skip silently
    }

    logRequest({
      requestId,
      route: "/api/admin/weddings/provision",
      method: "POST",
      status: 200,
      durationMs: Date.now() - startTime,
      weddingId: result.weddingId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings/provision",
        method: "POST",
        status: 400,
        durationMs: Date.now() - startTime,
        error: "Validation failed",
      });
      return NextResponse.json(
        {
          error: "Invalid provisioning payload",
          issues: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        },
        { status: 400 },
      );
    }

    if (err instanceof ContrastValidationError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings/provision",
        method: "POST",
        status: 400,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
      return NextResponse.json(
        {
          error: "Theme colors fail accessibility contrast requirements",
          details: err.details,
        },
        { status: 400 },
      );
    }

    if (err instanceof ReservedSlugError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings/provision",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
      return NextResponse.json(
        {
          error: "That wedding URL slug is reserved for system use. Please select another.",
          slugSuggestions: ["celebration", "wedding-day"],
        },
        { status: 409 },
      );
    }

    if (err instanceof DuplicateSlugError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings/provision",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: err.message,
      });

      const currentYear = new Date().getFullYear();
      return NextResponse.json(
        {
          error: "A wedding with this URL slug already exists.",
          slugSuggestions: [`vivah`, `${currentYear}`, `celebration`],
        },
        { status: 409 },
      );
    }

    if (err instanceof DuplicatePhoneError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings/provision",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
      return NextResponse.json(
        {
          error:
            "A couple user with this contact phone number is already registered. Reusing the existing couple profile is supported, but conflicting attributes were detected.",
        },
        { status: 409 },
      );
    }

    if (err instanceof DuplicateEmailError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings/provision",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
      return NextResponse.json(
        {
          error: "A couple user with this email address already exists.",
        },
        { status: 409 },
      );
    }

    if (err instanceof DuplicateDomainError) {
      return NextResponse.json(
        { error: "The custom domain is already registered to another wedding." },
        { status: 409 },
      );
    }

    const message = err instanceof Error ? err.message : "Internal provisioning failure";
    logRequest({
      requestId,
      route: "/api/admin/weddings/provision",
      method: "POST",
      status: 500,
      durationMs: Date.now() - startTime,
      error: message,
    });

    return NextResponse.json(
      { error: "Unable to provision wedding at this time. Please retry." },
      { status: 500 },
    );
  }
}
