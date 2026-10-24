import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { validateSecurityConfiguration } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = performance.now();

  // 1. Verify Production Security Secrets
  const secConfig = validateSecurityConfiguration();
  if (!secConfig.valid) {
    logger.error({ errors: secConfig.errors }, "Security configuration validation failed");
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Security configuration error: Missing or invalid production secrets.",
        details: process.env.NODE_ENV === "production" ? undefined : secConfig.errors,
      },
      { status: 503 },
    );
  }

  try {
    // 2. Perform database heartbeat query
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: "connected",
          latencyMs,
        },
        services: {
          api: "up",
          database: "up",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    logger.error(
      { error: error instanceof Error ? error.message : String(error), latencyMs },
      "Database health check failed",
    );

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: "disconnected",
          latencyMs,
          error: "Database heartbeat query failed",
        },
        services: {
          api: "up",
          database: "down",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
