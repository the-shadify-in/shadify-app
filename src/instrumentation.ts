/**
 * Next.js Server Runtime Initialization Hook
 *
 * Runs eagerly during server boot BEFORE any incoming traffic is routed or served.
 * Guarantees that invalid configuration (e.g., missing Redis credentials, unconfigured Cloudflare secret,
 * or disabled fail-closed policy) halts server initialization immediately, rather than failing lazily on first request.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // During Next.js static build phase, bypass runtime credentials check
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return;
    }

    try {
      const { validateEnv } = await import("./lib/env");
      const { validateRateLimitConfiguration } = await import("./lib/ratelimit");

      // Eagerly validate all critical environment variables
      validateEnv();

      // Eagerly validate rate limit operational guarantees
      const rateLimitConfig = validateRateLimitConfiguration();
      if (!rateLimitConfig.valid) {
        const errorMsg = `FATAL_CONFIG_ERROR: Production runtime initialization rejected due to invalid rate limit configuration:\n${rateLimitConfig.errors.map((e) => `  - ${e}`).join("\n")}`;
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[FATAL_STARTUP_ERROR] Server startup rejected: ${message}`);

      const isProduction =
        process.env.NODE_ENV === "production" ||
        process.env.VERCEL_ENV === "production" ||
        process.env.BUILD_TARGET === "production";

      const isVercelProduction = process.env.VERCEL_ENV === "production";

      // The test runner bypass is strictly ignored in Vercel production to eliminate fail-open switches
      const isTestRunner =
        !isVercelProduction && (process.env.VITEST === "true" || process.env.NODE_ENV === "test");

      if (isProduction && !isTestRunner && typeof process.exit === "function") {
        process.exit(1);
      }

      throw err;
    }
  }
}
