import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { signSessionToken, verifySessionToken, CURRENT_SESSION_VERSION } from "../auth";

describe("Admin Authentication & Invalidation in Depth (A12)", () => {
  it("signs and verifies a valid admin session token", () => {
    const token = signSessionToken("user-123", "staff");
    const session = verifySessionToken(token);

    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-123");
    expect(session?.role).toBe("staff");
    expect(session?.version).toBe(CURRENT_SESSION_VERSION);
  });

  it("rejects tampered tokens with invalid signature", () => {
    const token = signSessionToken("user-123", "staff");
    const tampered = token.slice(0, -4) + "abcd";
    const session = verifySessionToken(tampered);

    expect(session).toBeNull();
  });

  it("rejects expired tokens", () => {
    // Generate token with negative TTL
    const expiredToken = signSessionToken("user-123", "staff", -1000);
    const session = verifySessionToken(expiredToken);

    expect(session).toBeNull();
  });

  it("invalidates tokens when session version is changed (global revocation)", () => {
    // Generate valid token under current version
    const token = signSessionToken("user-123", "staff");
    expect(verifySessionToken(token)).not.toBeNull();

    // Manually construct a token signed under an older version
    const payload = JSON.stringify({
      userId: "user-123",
      role: "staff",
      v: "v0_legacy",
      iat: Date.now(),
      exp: Date.now() + 60000,
    });
    const encodedPayload = Buffer.from(payload).toString("base64url");
    const secret =
      process.env.ADMIN_SESSION_SECRET ?? "fallback-dev-secret-do-not-use-in-production";
    const sig = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    const legacyToken = `${encodedPayload}.${sig}`;

    const session = verifySessionToken(legacyToken);
    expect(session).toBeNull();
  });
});
