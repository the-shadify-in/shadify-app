import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = performance.now();

  try {
    // 1. Perform database heartbeat query
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
