import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";
import net from "net";

describe("src/instrumentation.ts Eager Server Initialization Hook", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is a no-op when NEXT_RUNTIME is not nodejs (e.g. edge or client)", async () => {
    process.env.NEXT_RUNTIME = "edge";
    const { register } = await import("../instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("executes cleanly in development or test environment without production secrets", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    vi.stubEnv("NODE_ENV", "test");
    const { register } = await import("../instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("allows build-time static generation without runtime production secrets (NEXT_PHASE=phase-production-build)", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PHASE = "phase-production-build";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { register } = await import("../instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("strictly halts production server startup when required Upstash credentials or fail-closed settings are missing", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PHASE; // Runtime, NOT build phase!
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { register } = await import("../instrumentation");
    await expect(register()).rejects.toThrow();
  });

  it("strictly halts production server startup when TRUSTED_PROXY_PROVIDER is set to direct", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PHASE;
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "valid_token";
    process.env.RATE_LIMIT_FAIL_CLOSED = "true";
    process.env.TRUSTED_PROXY_PROVIDER = "direct"; // Strictly forbidden in prod

    const { register } = await import("../instrumentation");
    await expect(register()).rejects.toThrow(/TRUSTED_PROXY_PROVIDER cannot be 'direct'/);
  });

  it("strictly halts production server startup when Cloudflare provider lacks origin verification secret", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PHASE;
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "valid_token";
    process.env.RATE_LIMIT_FAIL_CLOSED = "true";
    process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
    delete process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET;

    const { register } = await import("../instrumentation");
    await expect(register()).rejects.toThrow(/CLOUDFLARE_ORIGIN_VERIFY_SECRET is required/);
  });

  it("strictly halts production server startup when RATE_LIMIT_HASH_SECRET is missing or collides with another secret", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PHASE;
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "valid_token";
    process.env.RATE_LIMIT_FAIL_CLOSED = "true";
    process.env.TRUSTED_PROXY_PROVIDER = "vercel";
    delete process.env.RATE_LIMIT_HASH_SECRET;

    const { register } = await import("../instrumentation");
    await expect(register()).rejects.toThrow(/RATE_LIMIT_HASH_SECRET/);
  });

  it("succeeds when Cloudflare provider has valid origin verification secret", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PHASE;
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/shadify";
    process.env.ADMIN_SESSION_SECRET = "super_secure_admin_session_secret_32_chars_long";
    process.env.GUEST_ACCESS_SECRET = "super_secure_guest_access_secret_32_chars_long";
    process.env.ERASURE_HMAC_SECRET = "super_secure_erasure_hmac_secret_32_chars_long";
    process.env.RATE_LIMIT_HASH_SECRET = "super_secure_rate_limit_hash_secret_32_long";
    process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP = "919876543219";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "valid_production_token";
    process.env.RATE_LIMIT_FAIL_CLOSED = "true";
    process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
    process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET = "super_secret_origin_pull_token_123";

    const { register } = await import("../instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("succeeds when all production runtime operational requirements are satisfied (Vercel mode)", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PHASE;
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/shadify";
    process.env.ADMIN_SESSION_SECRET = "super_secure_admin_session_secret_32_chars_long";
    process.env.GUEST_ACCESS_SECRET = "super_secure_guest_access_secret_32_chars_long";
    process.env.ERASURE_HMAC_SECRET = "super_secure_erasure_hmac_secret_32_chars_long";
    process.env.RATE_LIMIT_HASH_SECRET = "super_secure_rate_limit_hash_secret_32_long";
    process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP = "919876543219";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "valid_production_token";
    process.env.RATE_LIMIT_FAIL_CLOSED = "true";
    process.env.TRUSTED_PROXY_PROVIDER = "vercel";

    const { register } = await import("../instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("integration: proves standalone next start terminates immediately with exit code 1 under invalid production configuration", async () => {
    const cwd = path.resolve(__dirname, "../..");
    const buildIdPath = path.join(cwd, ".next/BUILD_ID");

    // In a clean CI checkout where tests run prior to 'npm run build', skip pre-build;
    // this check is guaranteed by the post-build CI gate: 'Verify Fail-Closed Production Startup Gate'
    if (!fs.existsSync(buildIdPath)) {
      console.warn(
        "[CI_NOTICE] Skipping standalone 'next start' integration test because .next build is not present (will execute in post-build step).",
      );
      return;
    }

    // Safely reserve an OS-allocated ephemeral free port
    const freePort = await new Promise<number>((resolve, reject) => {
      const srv = net.createServer();
      srv.on("error", reject);
      srv.listen(0, "127.0.0.1", () => {
        const port = (srv.address() as net.AddressInfo).port;
        srv.close(() => resolve(port));
      });
    });
    const portStr = freePort.toString();

    const result = spawnSync("./node_modules/.bin/next", ["start", "-p", portStr], {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: portStr,
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: "",
        RATE_LIMIT_FAIL_CLOSED: "false",
        VITEST: "", // Clear VITEST to test actual server runtime exit behavior
      },
      encoding: "utf-8",
      timeout: 10000,
    });

    // Server process MUST terminate with exit code 1
    expect(result.status).toBe(1);
    const combinedOutput = `${result.stdout} ${result.stderr}`;
    expect(combinedOutput).toContain("[FATAL_STARTUP_ERROR]");
    expect(combinedOutput).not.toContain("✓ Ready in");
  });
});
