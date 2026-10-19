import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { logRequest } from "@/lib/log";
import {
  CreateWeddingSchema,
  createWeddingService,
  ContrastValidationError,
  ReservedSlugError,
  DuplicateSlugError,
  DuplicatePhoneError,
  DuplicateEmailError,
  DuplicateDomainError,
} from "@/features/weddings";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // 1. Auth Guard (Concierge Staff Only)
  const session = await getAdminSession();
  if (!session) {
    logRequest({
      requestId,
      route: "/api/admin/weddings",
      method: "POST",
      status: 401,
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = CreateWeddingSchema.parse(body);

    // 2. Delegate to weddings domain service
    const wedding = await createWeddingService(data, session.userId);

    // 3. Invalidate cached 404s or existing static entries for this slug
    revalidatePath(`/${wedding.slug}`);
    revalidatePath(`/${wedding.slug}`, "page");

    logRequest({
      requestId,
      route: "/api/admin/weddings",
      method: "POST",
      status: 200,
      durationMs: Date.now() - startTime,
      weddingId: wedding.id,
    });

    return NextResponse.json({
      success: true,
      weddingId: wedding.id,
      slug: wedding.slug,
      url: `/${wedding.slug}`,
    });
  } catch (err: unknown) {
    if (err instanceof ContrastValidationError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings",
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
        route: "/api/admin/weddings",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
      return NextResponse.json(
        {
          error:
            "That wedding URL slug is reserved or contains invalid characters. Please choose another.",
        },
        { status: 409 },
      );
    }

    if (err instanceof DuplicateSlugError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
      return NextResponse.json(
        { error: "A wedding with this URL slug already exists. Please choose a unique slug." },
        { status: 409 },
      );
    }

    if (err instanceof DuplicatePhoneError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    if (err instanceof DuplicateEmailError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    if (err instanceof DuplicateDomainError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings",
        method: "POST",
        status: 409,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    if (err instanceof z.ZodError) {
      logRequest({
        requestId,
        route: "/api/admin/weddings",
        method: "POST",
        status: 400,
        durationMs: Date.now() - startTime,
        error: err.issues[0]?.message,
      });
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input data", details: err.issues },
        { status: 400 },
      );
    }

    logRequest({
      requestId,
      route: "/api/admin/weddings",
      method: "POST",
      status: 500,
      durationMs: Date.now() - startTime,
      error: err,
    });

    return NextResponse.json(
      { error: "An unexpected database error occurred. Please try again." },
      { status: 500 },
    );
  }
}
