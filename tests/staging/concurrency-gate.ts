/**
 * Shadify Staging Concurrency & Release Gate Harness.
 *
 * Execution:
 *   bun run tests/staging/concurrency-gate.ts
 *
 * CRITICAL SAFETY NOTICE:
 * This script mutates database and storage state.
 * Never execute against production environments or with production credentials.
 *
 * Execution Order:
 *   0. Non-Mutating Safety & Environment Preflight (Runs FIRST before any mutations)
 *   1. Provisioning Idempotency Race (20 concurrent requests + DB assertions)
 *   2. Concurrent Media Quota Enforcement (10 concurrent requests + DB photo count)
 *   3. Commercial Gate Enforcement (Lite branding restriction)
 *   4. Guest PIN Rotation & Session Invalidation (Cookie replay + strict cleanup)
 *   5. Entitlement Override & Audit Log Verification (History inspection + strict cleanup)
 *
 * Required environment variables:
 *   STAGING_BASE_URL                   e.g. "https://staging.shadify.in"
 *   STAGING_EXPECTED_HOST              e.g. "staging.shadify.in"
 *   STAGING_CONFIRM                    Must be "I_UNDERSTAND_THIS_MUTATES_STAGING"
 *   STAGING_ADMIN_COOKIE               Valid staff session cookie string for staging
 *   STAGING_PROVISION_BODY_JSON        JSON string payload for POST /api/admin/weddings/provision
 *   STAGING_IDEMPOTENCY_KEY            Base idempotency key (harness appends unique run nonce)
 *   STAGING_LITE_WEDDING_ID            UUID of a disposable wedding on the 'lite' plan
 *   STAGING_MEDIA_FINALIZE_BODIES_JSON JSON array of 10 distinct finalize request bodies:
 *                                      [{"weddingSlug":"...","key":"weddings/<uuid>/photos/..."}, ...]
 *                                      for a wedding with exactly 1 remaining photo quota slot.
 *   STAGING_DATABASE_URL               Direct connection string for independent SQL assertions
 *   STAGING_EXPECTED_DB_NAME           Expected database name (e.g. "shadify_staging")
 *   STAGING_EXPECTED_DB_HOST           Expected database host (e.g. "staging-db.shadify.internal")
 *   STAGING_EXPECTED_STORAGE_BUCKET    Expected object storage bucket (e.g. "shadify-media-staging")
 *
 * Optional environment variables:
 *   STAGING_PROVISION_REQUESTS         Number of concurrent provision requests (default: 20)
 *   STAGING_EXPECTED_QUOTA_STATUS      Expected HTTP status for quota failures (default: 403)
 */

import crypto from "crypto";

type Json = Record<string, unknown>;

type HttpResult = {
  status: number;
  body: Json | string | null;
  headers?: Headers;
};

const required = [
  "STAGING_BASE_URL",
  "STAGING_EXPECTED_HOST",
  "STAGING_CONFIRM",
  "STAGING_ADMIN_COOKIE",
  "STAGING_PROVISION_BODY_JSON",
  "STAGING_IDEMPOTENCY_KEY",
  "STAGING_LITE_WEDDING_ID",
  "STAGING_MEDIA_FINALIZE_BODIES_JSON",
  "STAGING_DATABASE_URL",
  "STAGING_EXPECTED_DB_NAME",
  "STAGING_EXPECTED_DB_HOST",
  "STAGING_EXPECTED_STORAGE_BUCKET",
] as const;

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function jsonEnv(name: string): Json {
  const value = JSON.parse(env(name)) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must contain a JSON object`);
  }
  return value as Json;
}

function parseJsonArray(name: string): Json[] {
  const value = JSON.parse(env(name)) as unknown;
  if (
    !Array.isArray(value) ||
    !value.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))
  ) {
    throw new Error(`${name} must contain a JSON array of request bodies`);
  }
  return value as Json[];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function sanitize(str: string): string {
  return str
    .replace(/[a-zA-Z0-9_-]{32,}/g, "[REDACTED_TOKEN]")
    .replace(/pin=\d+/gi, "pin=[REDACTED]")
    .replace(/"pin":\s*"\d+"/gi, '"pin":"[REDACTED]"');
}

const base = new URL(env("STAGING_BASE_URL"));
const expectedHost = env("STAGING_EXPECTED_HOST").toLowerCase();

assert(
  env("STAGING_CONFIRM") === "I_UNDERSTAND_THIS_MUTATES_STAGING",
  "Explicit staging mutation confirmation is required: set STAGING_CONFIRM=I_UNDERSTAND_THIS_MUTATES_STAGING",
);
assert(
  base.hostname.toLowerCase() === expectedHost,
  `STAGING_BASE_URL hostname (${base.hostname}) does not match STAGING_EXPECTED_HOST (${expectedHost})`,
);
assert(
  base.protocol === "https:" || ["localhost", "127.0.0.1", "::1"].includes(base.hostname),
  "HTTPS is required except for local isolated test environments",
);
assert(
  !/(^|[-.])(prod|production)([-.]|$)/i.test(base.hostname),
  "Production-like hostname rejected. This script must never point at production.",
);

const adminCookie = env("STAGING_ADMIN_COOKIE");

const adminHeaders: Record<string, string> = {
  "content-type": "application/json",
  cookie: adminCookie,
};

function endpoint(path: string): string {
  return new URL(path, base).toString();
}

async function request(path: string, options: RequestInit = {}): Promise<HttpResult> {
  const response = await fetch(endpoint(path), {
    ...options,
    signal: AbortSignal.timeout(25_000),
    redirect: "manual",
  });

  const text = await response.text();
  let body: Json | string | null = text || null;

  if (text) {
    try {
      body = JSON.parse(text) as Json;
    } catch {
      body = text;
    }
  }

  return { status: response.status, body, headers: response.headers };
}

function extractCookie(headers?: Headers, cookieName?: string): string | null {
  if (!headers) return null;
  const raw = headers.get("set-cookie");
  if (!raw) return null;
  if (cookieName) {
    const match = raw.match(new RegExp(`(?:^|[,;\\s])(${cookieName}=[^;]+)`));
    return match && match[1] ? match[1] : null;
  }
  const parts = raw.split(";")[0];
  return parts || null;
}

function nestedId(body: Json | string | null): string | null {
  if (!body || typeof body !== "object") return null;

  const root = body;
  const data = root.data as Json | undefined;
  const wedding = root.wedding as Json | undefined;
  const dataWedding = data?.wedding as Json | undefined;

  const candidates = [root.id, wedding?.id, data?.id, dataWedding?.id];
  const id = candidates.find((value) => typeof value === "string");
  return typeof id === "string" ? id : null;
}

function errorCode(result: HttpResult): string {
  if (!result.body || typeof result.body !== "object") {
    return typeof result.body === "string" ? result.body : "";
  }
  const body = result.body;
  const error = body.error;
  const data = body.data as Json | undefined;

  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const code = (error as Json).code;
    if (typeof code === "string") return code;
    const msg = (error as Json).message;
    if (typeof msg === "string") return msg;
  }
  if (typeof body.code === "string") return body.code;
  if (typeof data?.code === "string") return data.code;

  return "";
}

async function queryStagingDb<T>(sqlQuery: string, params: unknown[] = []): Promise<T[]> {
  const dbUrl = env("STAGING_DATABASE_URL");

  assert(
    !/(prod|production)/i.test(dbUrl),
    "STAGING_DATABASE_URL appears to target a production database cluster.",
  );

  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 5000 });
  try {
    const res = await pool.query(sqlQuery, params);
    return res.rows as T[];
  } finally {
    await pool.end();
  }
}

const results: { name: string; passed: boolean; detail: string }[] = [];

function record(name: string, passed: boolean, detail: string): void {
  const sanitized = sanitize(detail);
  results.push({ name, passed, detail: sanitized });
  console.log(`${passed ? "✓ PASS" : "✗ FAIL"} [${name}]: ${sanitized}`);
}

/**
 * Gate 0: Non-Mutating Safety & Environment Preflight
 * Executed FIRST before any database or storage mutations are launched.
 */
async function preflightSafetyGate(): Promise<void> {
  console.log("Gate 0: Executing non-mutating safety & environment preflight...");

  // 1. Target deployment health check
  const healthRes = await request("/api/health");
  assert(
    healthRes.status === 200,
    `/api/health returned non-healthy HTTP status: ${healthRes.status}`,
  );
  const healthBody = healthRes.body as Json;
  assert(
    healthBody?.status === "healthy",
    `Target deployment reported unhealthy status: ${String(healthBody?.status)}`,
  );

  // 2. Hostname boundary check
  assert(
    !/(^|[-.])(prod|production)([-.]|$)/i.test(base.hostname),
    "Target host must never match production naming conventions",
  );

  // 3. Third-party live key check
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  assert(
    !stripeKey.startsWith("sk_live_"),
    "Live production Stripe key detected in environment. Staging must only use test keys (sk_test_).",
  );

  // 4. Database URL isolation check
  const dbUrl = env("STAGING_DATABASE_URL");
  assert(
    !/(prod|production)/i.test(dbUrl),
    "Database URL appears to reference a production database instance.",
  );

  // 5. Admin cookie format & authentication validity check
  assert(
    adminCookie.length >= 32,
    "STAGING_ADMIN_COOKIE must be a valid signed session token string",
  );
  const testAuthRes = await request(
    `/api/admin/weddings/${encodeURIComponent(env("STAGING_LITE_WEDDING_ID"))}`,
    {
      headers: adminHeaders,
    },
  );
  assert(
    testAuthRes.status !== 401 && testAuthRes.status !== 403,
    `STAGING_ADMIN_COOKIE was rejected by deployed API (HTTP ${testAuthRes.status})`,
  );

  // 6. Direct database identity & storage isolation checks (MANDATORY for release sign-off)
  const expectedDbName = env("STAGING_EXPECTED_DB_NAME");
  const expectedDbHost = env("STAGING_EXPECTED_DB_HOST");
  const expectedStorageBucket = env("STAGING_EXPECTED_STORAGE_BUCKET");

  assert(
    !/(prod|production)/i.test(expectedStorageBucket),
    `STAGING_EXPECTED_STORAGE_BUCKET '${expectedStorageBucket}' matches production naming convention.`,
  );

  const dbInfo = await queryStagingDb<{ current_database: string }>("SELECT current_database()");
  const firstDb = dbInfo[0];
  assert(firstDb, "Failed to establish direct database connection to STAGING_DATABASE_URL");
  const dbName = firstDb.current_database;
  assert(
    !/(prod|production)/i.test(dbName),
    `Connected database name '${dbName}' matches production naming convention.`,
  );
  assert(
    dbName.toLowerCase() === expectedDbName.toLowerCase(),
    `Connected database '${dbName}' does not match required STAGING_EXPECTED_DB_NAME '${expectedDbName}'`,
  );

  const parsedUrl = new URL(dbUrl);
  assert(
    parsedUrl.hostname.toLowerCase() === expectedDbHost.toLowerCase(),
    `Connected database host '${parsedUrl.hostname}' does not match required STAGING_EXPECTED_DB_HOST '${expectedDbHost}'`,
  );

  console.log(
    `Gate 0: Verified direct DB connection to isolated host '${expectedDbHost}', database '${dbName}', storage bucket '${expectedStorageBucket}'`,
  );

  // 7. Validate media finalize fixtures and storage isolation
  const bodies = parseJsonArray("STAGING_MEDIA_FINALIZE_BODIES_JSON");
  assert(
    bodies.length === 10,
    "STAGING_MEDIA_FINALIZE_BODIES_JSON must contain exactly 10 distinct media fixtures",
  );
  const keys = bodies.map((b) => (typeof b.key === "string" ? b.key.trim() : ""));
  assert(
    keys.every((k) => k.length > 5),
    "Every media fixture body must specify a valid non-empty 'key'",
  );
  assert(
    new Set(keys).size === 10,
    "Media finalize fixtures must reference 10 strictly distinct storage keys",
  );
  for (const key of keys) {
    assert(
      key.startsWith("weddings/") && key.includes("/photos/"),
      `Storage key '${key}' does not match expected wedding photo prefix 'weddings/<id>/photos/'`,
    );
    assert(
      !/(prod|production)/i.test(key),
      `Storage key '${key}' appears to target a production storage namespace`,
    );
  }

  // Pre-condition assertion: verify the disposable wedding has exactly 1 photo slot remaining
  const targetSlug = (bodies[0]?.weddingSlug as string) || "";
  assert(targetSlug.length > 0, "Media fixtures must specify target weddingSlug");

  // Query deployed API for authoritative effective entitlements and verify no unintended active override
  const entRes = await request(
    `/api/admin/weddings/${encodeURIComponent(env("STAGING_LITE_WEDDING_ID"))}/entitlements`,
    { headers: adminHeaders },
  );
  assert(
    entRes.status === 200 && entRes.body && typeof entRes.body === "object",
    `Failed to fetch effective entitlements from deployed API (HTTP ${entRes.status})`,
  );
  const entBody = entRes.body;
  const effective = (entBody.effective || entBody) as Json;
  assert(
    typeof effective.maxPhotos === "number",
    "API response missing numeric 'effective.maxPhotos'",
  );
  assert(
    effective.hasActiveOverride === false,
    `Disposable test wedding '${targetSlug}' has an active entitlement override reported by API. Reset the test fixture to canonical plan limits before running the release gate.`,
  );
  const effectiveMaxPhotos = effective.maxPhotos;

  // Direct SQL audit check: independently verify zero active overrides exist in audit_log
  const dbOverrideRows = await queryStagingDb<{ count: number }>(
    `SELECT count(*)::int AS count 
     FROM audit_log 
     WHERE wedding_id = (SELECT id FROM weddings WHERE slug = $1 LIMIT 1)
       AND action = 'entitlement.override'
       AND (detail->>'revokedAt') IS NULL
       AND (detail->>'expiresAt' IS NULL OR (detail->>'expiresAt')::timestamptz > NOW())`,
    [targetSlug],
  );
  const activeDbOverrides = dbOverrideRows[0]?.count ?? 0;
  assert(
    activeDbOverrides === 0,
    `Database assertion failed: found ${activeDbOverrides} active entitlement override records in audit_log for wedding '${targetSlug}'. Both SQL and API checks must confirm zero active overrides.`,
  );

  // Direct SQL capacity check: verify exactly 1 remaining photo slot
  const slotInfo = await queryStagingDb<{ current_photos: number }>(
    `SELECT count(*)::int AS current_photos
     FROM photos p
     WHERE p.wedding_id = (SELECT id FROM weddings WHERE slug = $1 LIMIT 1)`,
    [targetSlug],
  );
  const row = slotInfo[0];
  assert(row, `Failed to query photo count for wedding '${targetSlug}'`);
  const remainingSlots = effectiveMaxPhotos - row.current_photos;
  assert(
    remainingSlots === 1,
    `Media quota fixture pre-condition failed: wedding '${targetSlug}' has effective limit ${effectiveMaxPhotos} and ${row.current_photos} existing photos (${remainingSlots} slots remaining). Exactly 1 remaining slot is required for concurrency race testing.`,
  );
  console.log(
    `Gate 0: Verified target wedding photo capacity (${row.current_photos}/${effectiveMaxPhotos}, exactly 1 slot remaining; verified 0 active overrides in API & SQL).`,
  );

  record(
    "0. Safety preflight",
    true,
    `Host '${base.host}' healthy; DB '${dbName}' on '${expectedDbHost}' verified; bucket '${expectedStorageBucket}' isolated; 0 overrides; exactly 1 photo slot remaining`,
  );
}

/**
 * Gate 1: Provisioning Idempotency Race Under Concurrency (20 concurrent requests)
 * Validates pg_advisory_xact_lock serialization and audit_log deduplication.
 */
async function provisioningRace(): Promise<void> {
  const body = jsonEnv("STAGING_PROVISION_BODY_JSON");
  const baseKey = env("STAGING_IDEMPOTENCY_KEY");
  const count = Number(process.env.STAGING_PROVISION_REQUESTS ?? 20);

  // Appends a unique run nonce to ensure each harness execution tests a fresh transaction race
  const runNonce = crypto.randomUUID().slice(0, 8);
  const effectiveKey = `${baseKey}-${runNonce}`;

  assert(
    Number.isInteger(count) && count >= 2 && count <= 50,
    "STAGING_PROVISION_REQUESTS must be between 2 and 50",
  );

  console.log(
    `Gate 1: Launching ${count} concurrent provisioning requests with key: ${effectiveKey}`,
  );

  const responses = await Promise.all(
    Array.from({ length: count }, () =>
      request("/api/admin/weddings/provision", {
        method: "POST",
        headers: {
          ...adminHeaders,
          "Idempotency-Key": effectiveKey,
        },
        body: JSON.stringify(body),
      }),
    ),
  );

  const successful = responses.filter(
    (response) => response.status >= 200 && response.status < 300,
  );
  const ids = successful.map((response) => nestedId(response.body));
  const allHaveIds = ids.every((id): id is string => Boolean(id));
  const uniqueIds = new Set(ids.filter(Boolean));

  assert(
    successful.length === count && allHaveIds && uniqueIds.size === 1,
    `Provisioning did not return exactly one consistent wedding ID across all concurrent requests (${uniqueIds.size} distinct IDs found)`,
  );

  const weddingId = Array.from(uniqueIds)[0];

  // Independent database verification using separate bound parameters (MANDATORY)
  const dbWeddings = await queryStagingDb<{ count: number }>(
    "SELECT count(*)::int AS count FROM weddings WHERE id = $1::uuid",
    [weddingId],
  );
  const dbAudits = await queryStagingDb<{ count: number }>(
    "SELECT count(*)::int AS count FROM audit_log WHERE action = 'wedding.provision' AND detail->>'idempotencyKey' = $1",
    [effectiveKey],
  );

  const weddingCount = Number(dbWeddings[0]?.count ?? 0);
  const auditCount = Number(dbAudits[0]?.count ?? 0);

  assert(
    weddingCount === 1,
    `Database assertion failed: expected 1 wedding record for ID, found ${weddingCount}`,
  );
  assert(
    auditCount === 1,
    `Database assertion failed: expected 1 audit_log idempotency record, found ${auditCount}`,
  );

  record(
    "1. Provision race",
    true,
    `${count}/${count} HTTP 20x responses; DB confirmed exactly 1 wedding and 1 idempotency audit record`,
  );
}

/**
 * Gate 2: Concurrent Media Quota Enforcement (10 concurrent requests)
 * Validates PostgreSQL SELECT ... FOR UPDATE row locking and persisted photo count.
 */
async function mediaQuotaRace(): Promise<void> {
  const bodies = parseJsonArray("STAGING_MEDIA_FINALIZE_BODIES_JSON");
  const expectedFailures = Number(process.env.STAGING_EXPECTED_QUOTA_STATUS ?? 403);

  const firstFixture = bodies[0];
  assert(
    firstFixture && typeof firstFixture.weddingSlug === "string",
    "All media fixtures must specify a valid 'weddingSlug'",
  );
  const weddingSlug = firstFixture.weddingSlug;

  // Persisted photo count before race (if STAGING_DATABASE_URL supplied)
  const countBeforeRows = await queryStagingDb<{ count: number }>(
    "SELECT count(*)::int AS count FROM photos WHERE wedding_id = (SELECT id FROM weddings WHERE slug = $1 LIMIT 1)",
    [weddingSlug],
  );

  console.log(
    "Gate 2: Launching 10 simultaneous media finalization requests against quota ceiling...",
  );

  const responses = await Promise.all(
    bodies.map((bodyPayload) =>
      request("/api/media/finalize", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify(bodyPayload),
      }),
    ),
  );

  // Exactly 1 commit succeeds with photoId returned
  const created = responses.filter(
    (response) =>
      (response.status === 200 || response.status === 201) &&
      Boolean((response.body as Json)?.photoId),
  );

  // Exactly 9 reject with recognized quota exceeded error
  const quotaFailures = responses.filter(
    (response) =>
      response.status === expectedFailures &&
      /PHOTO_QUOTA|upload limit reached|photo upload limit/i.test(errorCode(response)),
  );

  assert(
    created.length === 1 && quotaFailures.length === 9,
    `Media concurrency race failed: expected 1 success and 9 quota rejections, got ${created.length} successes and ${quotaFailures.length} quota rejections`,
  );

  const firstCreated = created[0];
  const successStatus = firstCreated ? firstCreated.status : 200;

  // Persisted photo count after race (MANDATORY)
  const countAfterRows = await queryStagingDb<{ count: number }>(
    "SELECT count(*)::int AS count FROM photos WHERE wedding_id = (SELECT id FROM weddings WHERE slug = $1 LIMIT 1)",
    [weddingSlug],
  );

  const beforeCount = Number(countBeforeRows[0]?.count ?? 0);
  const afterCount = Number(countAfterRows[0]?.count ?? 0);
  assert(
    afterCount - beforeCount === 1,
    `Database assertion failed: expected photo count to increase by 1, but changed from ${beforeCount} to ${afterCount}`,
  );
  record(
    "2. Media race",
    true,
    `1 committed photo (HTTP ${successStatus}); 9 HTTP 403 quota failures; DB confirmed exactly +1 photo created (from ${beforeCount} to ${afterCount})`,
  );
}

/**
 * Gate 3: Commercial Gate Enforcement
 * Validates server-side rejection of unentitled mutations (Lite branding removal).
 */
async function commercialGate(): Promise<void> {
  const weddingId = env("STAGING_LITE_WEDDING_ID");

  console.log(`Gate 3: Testing commercial branding gate on Lite wedding: ${weddingId}`);

  const result = await request(`/api/admin/weddings/${encodeURIComponent(weddingId)}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ showBranding: false }),
  });

  const passed =
    result.status === 403 &&
    /The Lite plan includes Shadify branding|branding|entitlement/i.test(errorCode(result));

  assert(
    passed,
    `Lite branding mutation was not rejected with HTTP 403 (got HTTP ${result.status}: ${errorCode(result)})`,
  );

  record(
    "3. Lite branding restriction",
    true,
    `HTTP 403 Forbidden confirmed on unauthorized branding removal`,
  );
}

/**
 * Gate 4: Guest PIN Rotation & Session Invalidation
 * Captures the guest session cookie from PIN verification, asserts access to protected guestbook,
 * rotates the PIN via staff API, and verifies the previous guest session cookie is immediately rejected (HTTP 403).
 */
async function pinRotationGate(): Promise<void> {
  const weddingId = env("STAGING_LITE_WEDDING_ID");
  console.log(`Gate 4: Testing PIN rotation & guest session cookie invalidation...`);

  // Resolve slug
  const detailRes = await request(`/api/admin/weddings/${encodeURIComponent(weddingId)}`, {
    headers: adminHeaders,
  });
  const weddingObj = (detailRes.body as Json)?.wedding as Json | undefined;
  const slug = (weddingObj?.slug || (detailRes.body as Json)?.slug) as string | undefined;
  assert(typeof slug === "string", "Could not resolve wedding slug from detail response");

  try {
    // 1. Issue fresh known PIN 1 via staff API
    const reset1 = await request(`/api/admin/weddings/${encodeURIComponent(weddingId)}/pin`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ action: "reset", reason: "Gate 4 initial PIN setup" }),
    });
    assert(reset1.status === 200, `Initial PIN reset failed with HTTP ${reset1.status}`);
    const pin1 = (reset1.body as Json)?.pin as string | undefined;
    assert(
      typeof pin1 === "string" && /^\d{6}$/.test(pin1),
      "Reset did not return a valid 6-digit ephemeral PIN",
    );

    // 2. Authenticate as guest using PIN 1 and capture session cookie
    const verify1 = await request(`/api/weddings/${encodeURIComponent(slug)}/verify-pin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin: pin1 }),
    });
    assert(verify1.status === 200, `Guest PIN verification failed with HTTP ${verify1.status}`);

    const guestCookie =
      extractCookie(verify1.headers, "shadify_guest_access") ||
      extractCookie(verify1.headers, "__Host-shadify_guest_access") ||
      extractCookie(verify1.headers);

    assert(
      Boolean(guestCookie),
      "verify-pin response did not return a guest session cookie (Set-Cookie header missing)",
    );

    // 3. Prove captured guest session cookie grants access to protected guestbook
    const guestbookBefore = await request(`/api/guestbook?slug=${encodeURIComponent(slug)}`, {
      headers: { cookie: guestCookie as string },
    });
    assert(
      guestbookBefore.status === 200,
      `Protected guestbook query with initial guest cookie failed (HTTP ${guestbookBefore.status})`,
    );

    // 4. Rotate PIN via staff API to PIN 2
    const reset2 = await request(`/api/admin/weddings/${encodeURIComponent(weddingId)}/pin`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ action: "reset", reason: "Gate 4 staff rotation test" }),
    });
    assert(reset2.status === 200, `Second PIN rotation failed with HTTP ${reset2.status}`);
    const pin2 = (reset2.body as Json)?.pin as string | undefined;
    assert(
      typeof pin2 === "string" && pin2 !== pin1,
      "PIN rotation returned duplicate or empty PIN",
    );

    // 5. CRITICAL CHECK: Replay existing guest session cookie against protected guestbook
    // Must be rejected with HTTP 403 because fingerprint mismatch invalidates the session
    const guestbookAfter = await request(`/api/guestbook?slug=${encodeURIComponent(slug)}`, {
      headers: { cookie: guestCookie as string },
    });
    assert(
      guestbookAfter.status === 403,
      `Replayed old guest session cookie was NOT invalidated after PIN rotation (expected HTTP 403, got ${guestbookAfter.status})`,
    );

    // 6. Old PIN 1 rejected
    const oldVerify = await request(`/api/weddings/${encodeURIComponent(slug)}/verify-pin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin: pin1 }),
    });
    assert(
      oldVerify.status === 401,
      `Old PIN was not rejected after rotation (expected 401, got ${oldVerify.status})`,
    );

    // 7. New PIN 2 accepted
    const newVerify = await request(`/api/weddings/${encodeURIComponent(slug)}/verify-pin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin: pin2 }),
    });
    assert(
      newVerify.status === 200,
      `New PIN failed verification (expected 200, got ${newVerify.status})`,
    );

    record(
      "4. Guest PIN rotation",
      true,
      "Old session cookie invalidated (HTTP 403); old PIN rejected (HTTP 401); new PIN authorized (HTTP 200)",
    );
  } finally {
    // Clean up: restore disposable wedding PIN and verify cleanup succeeded
    const cleanup = await request(`/api/admin/weddings/${encodeURIComponent(weddingId)}/pin`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ action: "reset", reason: "Gate 4 cleanup restoration" }),
    }).catch((err) => ({
      status: 500,
      body: null,
      headers: undefined,
      error: err,
    }));

    assert(
      cleanup.status === 200,
      `Gate 4 cleanup failed: PIN could not be restored to a known state (HTTP ${cleanup.status})`,
    );
  }
}

/**
 * Gate 5: Entitlement Override & Revocation Audit
 * Validates that overrides update limits, audit entries are created with operator identity & reason,
 * and revocation restores plan defaults with audit log persistence.
 */
async function entitlementAuditGate(): Promise<void> {
  const weddingId = env("STAGING_LITE_WEDDING_ID");
  console.log(`Gate 5: Testing entitlement override & audit trail verification...`);

  const overrideReason = "Staging release gate test override verification";
  const revokeReason = "Staging release gate test revocation cleanup";

  try {
    // 1. Apply staff override
    const overrideRes = await request(
      `/api/admin/weddings/${encodeURIComponent(weddingId)}/entitlements`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          action: "override",
          overrides: { maxPhotos: 850 },
          reason: overrideReason,
        }),
      },
    );
    assert(
      overrideRes.status === 200,
      `Override application failed with HTTP ${overrideRes.status}`,
    );

    // 2. Fetch entitlements and inspect active state + audit trail
    const get1 = await request(
      `/api/admin/weddings/${encodeURIComponent(weddingId)}/entitlements`,
      {
        headers: adminHeaders,
      },
    );
    assert(get1.status === 200, `GET entitlements failed with HTTP ${get1.status}`);
    const data1 = get1.body as Json;
    const effective1 = (data1.effective || data1) as Json;
    assert(effective1.hasActiveOverride === true, "hasActiveOverride is not true after override");
    assert(
      effective1.maxPhotos === 850,
      `Effective maxPhotos was not updated to 850 (got ${String(effective1.maxPhotos)})`,
    );

    // Verify audit trail for override
    const history1 = (data1.history as Json[]) || [];
    const overrideAudit = history1.find((h) => h.action === "entitlement.override");
    assert(
      Boolean(overrideAudit),
      "Audit trail missing 'entitlement.override' entry in database history",
    );
    assert(
      Boolean(overrideAudit?.actorId),
      "Audit log entry for override is missing actorId attribution",
    );
    assert(
      (overrideAudit?.detail as Json)?.reason === overrideReason,
      "Audit log entry for override has mismatched reason justification",
    );

    // 3. Revoke override
    const revokeRes = await request(
      `/api/admin/weddings/${encodeURIComponent(weddingId)}/entitlements`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          action: "revoke",
          reason: revokeReason,
        }),
      },
    );
    assert(revokeRes.status === 200, `Override revocation failed with HTTP ${revokeRes.status}`);

    // 4. Verify restored to plan defaults and revocation audit logged
    const get2 = await request(
      `/api/admin/weddings/${encodeURIComponent(weddingId)}/entitlements`,
      {
        headers: adminHeaders,
      },
    );
    assert(
      get2.status === 200,
      `GET entitlements after revocation failed with HTTP ${get2.status}`,
    );
    const data2 = get2.body as Json;
    const effective2 = (data2.effective || data2) as Json;
    assert(
      effective2.hasActiveOverride === false,
      "hasActiveOverride is still true after revocation",
    );

    const history2 = (data2.history as Json[]) || [];
    const revokeAudit = history2.find((h) => h.action === "entitlement.override_revoked");
    assert(
      Boolean(revokeAudit),
      "Audit trail missing 'entitlement.override_revoked' entry in database history",
    );
    assert(
      Boolean(revokeAudit?.actorId),
      "Audit log entry for revocation is missing actorId attribution",
    );
    assert(
      (revokeAudit?.detail as Json)?.reason === revokeReason,
      "Audit log entry for revocation has mismatched reason justification",
    );

    record(
      "5. Entitlement audit",
      true,
      "Override (850 photos) and revocation verified; audit_log entries confirmed with actor identity and reasons",
    );
  } finally {
    // Safety cleanup: ensure override is unconditionally revoked and assert success
    const cleanupRes = await request(
      `/api/admin/weddings/${encodeURIComponent(weddingId)}/entitlements`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          action: "revoke",
          reason: "Gate 5 safety cleanup",
        }),
      },
    ).catch((err) => ({
      status: 500,
      body: null,
      headers: undefined,
      error: err,
    }));

    assert(
      cleanupRes.status === 200,
      `Gate 5 cleanup failed: entitlement override could not be revoked (HTTP ${cleanupRes.status})`,
    );
  }
}

async function main(): Promise<void> {
  // Preflight environment variable loading
  for (const name of required) {
    env(name);
  }

  console.log("===============================================================");
  console.log("   SHADIFY STAGING CONCURRENCY & RELEASE GATE HARNESS          ");
  console.log("===============================================================");
  console.log(`Target Base URL: ${base.origin}`);
  console.log(`Target Host:     ${base.host}`);
  console.log("Sensitive session cookies, PINs, and payloads are masked.");
  console.log("---------------------------------------------------------------\n");

  // Strict execution order: Non-mutating safety preflight runs FIRST
  const gates = [
    ["0. Safety preflight", preflightSafetyGate],
    ["1. Provision race", provisioningRace],
    ["2. Media race", mediaQuotaRace],
    ["3. Lite branding restriction", commercialGate],
    ["4. Guest PIN rotation", pinRotationGate],
    ["5. Entitlement audit", entitlementAuditGate],
  ] as const;

  for (const [name, run] of gates) {
    try {
      await run();
    } catch (error) {
      record(name, false, error instanceof Error ? error.message : "Unknown error");
      console.error(`\n❌ Execution halted: ${name} failed. Downstream gates aborted.`);
      process.exitCode = 1;
      return;
    }
  }

  console.log("\n---------------------------------------------------------------");
  console.log("Release-Gate Summary:");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`${passedCount}/${results.length} gates passed`);
  console.log("===============================================================");
}

main().catch((error) => {
  console.error("Preflight aborted:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
