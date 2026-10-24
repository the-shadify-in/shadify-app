import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateSecurityConfiguration,
  getAdminSessionSecret,
  getGuestAccessSecret,
  getErasureHmacSecret,
  signSessionToken,
  verifySessionToken,
  signGuestPinToken,
  verifyGuestPinToken,
} from "../auth";

describe("Runtime Secret Independence & Fail-Closed Guardrails", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("validates independent, strong keys in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    vi.stubEnv("ADMIN_SESSION_SECRET", "admin-secret-minimum-32-characters-001");
    vi.stubEnv("GUEST_ACCESS_SECRET", "guest-secret-minimum-32-characters-002");
    vi.stubEnv("ERASURE_HMAC_SECRET", "erasure-secret-minimum-32-characters-003");

    const result = validateSecurityConfiguration();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);

    expect(getAdminSessionSecret()).toBe("admin-secret-minimum-32-characters-001");
    expect(getGuestAccessSecret()).toBe("guest-secret-minimum-32-characters-002");
    expect(getErasureHmacSecret()).toBe("erasure-secret-minimum-32-characters-003");
  });

  it("rejects weak or missing secrets in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    vi.stubEnv("GUEST_ACCESS_SECRET", "");
    vi.stubEnv("ERASURE_HMAC_SECRET", "");

    const result = validateSecurityConfiguration();
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);

    expect(() => getAdminSessionSecret()).toThrow("FATAL_SECURITY_CONFIG_ERROR");
    expect(() => getGuestAccessSecret()).toThrow("FATAL_SECURITY_CONFIG_ERROR");
    expect(() => getErasureHmacSecret()).toThrow("FATAL_SECURITY_CONFIG_ERROR");
  });

  it("rejects identical keys between admin session and guest access in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    const sharedSecret = "shared-secret-minimum-32-characters-999";
    vi.stubEnv("ADMIN_SESSION_SECRET", sharedSecret);
    vi.stubEnv("GUEST_ACCESS_SECRET", sharedSecret);
    vi.stubEnv("ERASURE_HMAC_SECRET", "distinct-erasure-key-minimum-32-chars-long");

    const result = validateSecurityConfiguration();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "GUEST_ACCESS_SECRET must not share the same value as ADMIN_SESSION_SECRET.",
    );

    expect(() => getAdminSessionSecret()).toThrow("cannot share the same key material");
    expect(() => getGuestAccessSecret()).toThrow("cannot share the same key material");
  });

  it("rejects identical keys between admin session and erasure HMAC in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    const sharedSecret = "shared-secret-minimum-32-characters-888";
    vi.stubEnv("ADMIN_SESSION_SECRET", sharedSecret);
    vi.stubEnv("GUEST_ACCESS_SECRET", "distinct-guest-key-minimum-32-chars-long");
    vi.stubEnv("ERASURE_HMAC_SECRET", sharedSecret);

    const result = validateSecurityConfiguration();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "ERASURE_HMAC_SECRET must not share the same value as ADMIN_SESSION_SECRET.",
    );

    expect(() => getAdminSessionSecret()).toThrow("cannot share the same key material");
    expect(() => getErasureHmacSecret()).toThrow("cannot share the same key material");
  });

  it("rejects identical keys between guest access and erasure HMAC in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    const sharedSecret = "shared-secret-minimum-32-characters-777";
    vi.stubEnv("ADMIN_SESSION_SECRET", "distinct-admin-key-minimum-32-chars-long");
    vi.stubEnv("GUEST_ACCESS_SECRET", sharedSecret);
    vi.stubEnv("ERASURE_HMAC_SECRET", sharedSecret);

    const result = validateSecurityConfiguration();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "ERASURE_HMAC_SECRET must not share the same value as GUEST_ACCESS_SECRET.",
    );

    expect(() => getGuestAccessSecret()).toThrow("cannot share the same key material");
    expect(() => getErasureHmacSecret()).toThrow("cannot share the same key material");
  });

  it("fails closed if build placeholder is somehow present at runtime when signing admin tokens", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");

    expect(() => signSessionToken("user-1", "admin")).toThrow(
      "FATAL_SECURITY_ERROR: Cannot sign admin session token with build placeholder secret in production",
    );
  });

  it("fails closed if build placeholder is somehow present at runtime when verifying admin tokens", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");

    const result = verifySessionToken("fake.token");
    expect(result).toBeNull();
  });

  it("fails closed if build placeholder is somehow present at runtime when signing guest tokens", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("GUEST_ACCESS_SECRET", "");

    expect(() => signGuestPinToken("wedding-1", "hash-1")).toThrow(
      "FATAL_SECURITY_ERROR: Cannot sign guest access token with build placeholder secret in production",
    );
  });

  it("fails closed if build placeholder is somehow present at runtime when verifying guest tokens", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("GUEST_ACCESS_SECRET", "");

    const result = verifyGuestPinToken("fake.token", "wedding-1", "hash-1");
    expect(result).toBe(false);
  });
});
