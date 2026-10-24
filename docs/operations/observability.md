# Shadify — Observability & Telemetry Architecture

> Authoritative specification for structured server logging, client-side error telemetry, uptime monitoring, first-party aggregate metrics, and admin health dashboards.
> Guiding Rule: **Zero PII in Telemetry**. Telemetry must never record guest names, phone numbers, UPI IDs, dietary preferences, or signed preview tokens.

---

## 1. Observability Philosophy & Privacy Gates

Wedding platforms handle intimate, time-sensitive personal events. Telemetry must be designed to diagnose system failures instantly while upholding strict privacy:

| Channel                   | Allowed Data                                                                                              | Strictly Forbidden (Redacted / Dropped)                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Server Logs**           | Request ID, HTTP method, route, status code, duration in ms, wedding UUID, error class, truncated message | Request/response bodies, guest names, phone numbers, email addresses, UPI VPAs, PINs, tokens         |
| **Client Error Reports**  | JS error stack, browser/OS version, device class (mobile/desktop), active preset ID                       | Form inputs (names, phones), URLs with signed tokens (`?token=...`), session replay video recordings |
| **Guest Usage Telemetry** | Anonymous aggregate counters per wedding per day (`views`, `rsvps`, `shagun_taps`)                        | Individual user IDs, tracking cookies, IP addresses, canvas fingerprinting, third-party ad pixels    |
| **Audit Logs**            | Actor UUID, action name, target wedding UUID, timestamp, delta of non-PII config                          | Passwords, raw credentials, decrypted payment secrets                                                |

---

## 2. Server-Side Structured Logging

### Logger Specification

- **Engine**: `pino` with JSON output.
- **Log Drain**: Forwarded via HTTPS syslog drain to Axiom or Better Stack.
- **Retention**: **14–30 days** maximum for application logs.
- **IP Address Policy**: Raw IP addresses are never persisted in log drains. Rate limiters utilize ephemeral keyed HMAC hashes.

### Standard Request Log Record Schema

```json
{
  "level": "info",
  "time": "2026-10-19T01:30:00.000Z",
  "env": "production",
  "service": "shadify-web",
  "requestId": "req_8f1a9c2b4d",
  "route": "/api/rsvp",
  "method": "POST",
  "status": 200,
  "durationMs": 42,
  "weddingId": "wed_b43f9a71",
  "msg": "API Request Completed: POST /api/rsvp (200)"
}
```

### Standard Error Log Record Schema

```json
{
  "level": "error",
  "time": "2026-10-19T01:30:05.120Z",
  "env": "production",
  "service": "shadify-web",
  "requestId": "req_5e3d7a8c",
  "route": "/api/media/presign",
  "method": "POST",
  "status": 500,
  "durationMs": 115,
  "weddingId": "wed_b43f9a71",
  "errorClass": "R2StorageError",
  "errorMessage": "S3 presign signature generation timed out",
  "msg": "API Request Failed: POST /api/media/presign (500)"
}
```

---

## 3. Client-Side Monitoring & Web Vitals

### Client Error Capture (Sentry / GlitchTip)

1. **Source Maps**: Generated at build time and uploaded directly to Sentry; never published publicly to `public/`.
2. **PII Scrubbing Rule**:
   - `beforeSend(event)` strips all query parameters matching `token`, `key`, `secret`, `signature`.
   - Strip all breadcrumbs containing `input`, `form`, `change` events on text fields.
3. **Session Replay**: **STRICTLY DISABLED**. In-browser screen recording captures guests typing private mobile numbers and personal祝福blessings.

### Real-User Web Vitals Beacon

Guest pages collect lightweight Core Web Vitals via `web-vitals` library and report to `/api/telemetry/vitals` with a beacon:

- **Metrics Collected**: LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift).
- **Dimensions**: Device tier (`low-end-mobile`, `high-end-mobile`, `desktop`), preset theme ID (`royal-crimson`, `emerald-gold`, etc.).
- **Thresholds**: LCP < 2.5s on mid-range 4G Android connections.

---

## 4. First-Party Guest Usage Metrics

Rather than embedding privacy-invasive third-party scripts, Shadify aggregates usage counters in PostgreSQL:

### Aggregate Model (`wedding_analytics_daily`)

```sql
CREATE TABLE "wedding_analytics_daily" (
  "wedding_id" UUID NOT NULL REFERENCES "weddings"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "page_views" INTEGER NOT NULL DEFAULT 0,
  "envelope_opens" INTEGER NOT NULL DEFAULT 0,
  "rsvp_submits" INTEGER NOT NULL DEFAULT 0,
  "shagun_clicks" INTEGER NOT NULL DEFAULT 0,
  "gallery_views" INTEGER NOT NULL DEFAULT 0,
  "map_clicks" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("wedding_id", "date")
);
```

Couples see clean, reassuring counters in their concierge summary ("142 guests visited your page, 87 RSVPs submitted, 43 Shagun QR scans") without anyone being tracked.

---

## 5. Admin Operations & Health Dashboard (`/admin/health`)

Concierge operators inspect `/admin/health` during morning rounds before wedding weekends:

### 1. 14-Day Wedding Readiness Gate

Flags any wedding occurring within the next 14 days with an incomplete operational checklist:

- [ ] Events & Itinerary defined (at least 1 ceremony with date, time, and address).
- [ ] Groom & Bride high-resolution portrait uploaded.
- [ ] Shagun UPI ID verified & active.
- [ ] RSVP form configured with valid deadline.
- [ ] Active Theme passes WCAG AA contrast (ok: true).

### 2. Operational System Health

- **Database Status**: Heartbeat roundtrip latency via `/api/health`.
- **R2 Storage Volume**: Active preview storage vs. 90-day RAW master files queued for lifecycle deletion.
- **Error Spikes (24h)**: Total error count grouped by route (`/api/rsvp`, `/api/media/presign`, `/[slug]`).

### 3. Business & Compliance Summary

- Active live weddings vs. pending drafts.
- Plan breakdown (Lite, Premium, Platinum) and coupon redemption totals.
- DPDP erasure requests pending action (SLA: 30 days).

---

## 6. Uptime, Alerting & Wedding-Week SLA

### Heartbeat Endpoint (`/api/health`)

- **Route**: `GET /api/health`
- **Behavior**: Executes `SELECT 1` on PostgreSQL and returns `200 OK` with DB roundtrip latency, or `503 Service Unavailable` if database pooling fails.
- **External Monitor**: UptimeRobot or Better Stack pinging every 60 seconds.

### Incident Severity & Escalation Matrix

| Severity          | Condition                                                                                                        | Notification Channel                                             | Target Response SLA |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------- |
| **P0 (Critical)** | `/api/health` failing, database connection pool exhausted, or `/api/rsvp` error rate > 5% on active wedding days | Automated WhatsApp Concierge + SMS to `@founder` and `@lead-eng` | < 15 minutes        |
| **P1 (High)**     | Media upload presign failure rate > 5%, CDN cache purge failure, or contrast violation reported                  | Email + Slack/WhatsApp alert                                     | < 1 hour            |
| **P2 (Normal)**   | Single wedding creation failure, duplicate slug attempt, rate limit trigger                                      | Dashboard log entry                                              | Next business day   |

### 1-Page Emergency Triage Checklist (Wedding Morning)

1. **Check `/api/health`**: Confirm DB latency < 50ms and connection pool is healthy.
2. **Verify Edge Cache**: Request `curl -I https://shadify.in/<slug>` and verify `x-nextjs-cache: HIT` or `MISS` transitioning to cached.
3. **Simulate Guest RSVP**: Submit a test RSVP via concierge test suite to verify write path.
4. **Inspect R2 Quotas**: Confirm no egress or bucket policy blocks.
5. **Rollback Command**: If bad deploy occurred, promote previous release artifact immediately in Vercel/Fly dashboard.

---

## 7. Staging Release-Gate Harness & Concurrency Verification

> **Harness Source**: `tests/staging/concurrency-gate.ts`  
> **Execution Command**: `bun run tests/staging/concurrency-gate.ts`

Prior to any production deployment or release sign-off, the automated staging harness verifies real database serialization, storage bucket isolation, dual API/SQL override synchronization, and concurrent race handling against the remote staging environment.

### 1. Required Environment Variables

All variables are mandatory; missing or invalid variables immediately abort execution before any requests are issued:

| Variable                             | Type / Example                      | Purpose & Validation Rules                                                                                                                                                              |
| ------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STAGING_BASE_URL`                   | `https://staging.shadify.in`        | Target base URL of the deployed staging service. Host must not contain `prod` or `production`.                                                                                          |
| `STAGING_EXPECTED_HOST`              | `staging.shadify.in`                | Exact host name assertion to prevent accidental DNS misdirection.                                                                                                                       |
| `STAGING_CONFIRM`                    | `I_UNDERSTAND_THIS_MUTATES_STAGING` | Strict explicit human acknowledgment; fails if omitted or altered.                                                                                                                      |
| `STAGING_ADMIN_COOKIE`               | String (min 32 chars)               | Valid signed staff session token for the staging environment. Masked in all logs.                                                                                                       |
| `STAGING_PROVISION_BODY_JSON`        | JSON String                         | Wedding payload for `POST /api/admin/weddings/provision`.                                                                                                                               |
| `STAGING_IDEMPOTENCY_KEY`            | String                              | Base idempotency key. Harness appends a fresh UUID run nonce (`${key}-${nonce}`) per execution.                                                                                         |
| `STAGING_LITE_WEDDING_ID`            | UUID                                | UUID of a disposable test wedding on the `lite` tier.                                                                                                                                   |
| `STAGING_MEDIA_FINALIZE_BODIES_JSON` | JSON Array (10 items)               | 10 distinct request payloads for `/api/media/finalize` targeting a wedding with exactly 1 remaining photo slot. Keys must contain a disposable marker (`/disposable-`, `/test-`, etc.). |
| `STAGING_DATABASE_URL`               | PostgreSQL URL                      | Direct connection string for independent database assertions. Host must not contain `prod` or `production`.                                                                             |
| `STAGING_EXPECTED_DB_NAME`           | `shadify_staging`                   | Exact database name checked against `SELECT current_database()`.                                                                                                                        |
| `STAGING_EXPECTED_DB_HOST`           | `staging-db.shadify.internal`       | Exact database host checked against parsed connection URL.                                                                                                                              |
| `STAGING_EXPECTED_STORAGE_BUCKET`    | `shadify-media-staging`             | Expected R2 bucket checked via deployed `/api/media/presign` probe.                                                                                                                     |

### 2. Sequential Gate Architecture

The harness executes 6 sequential gates in strict order:

```
┌─────────────────────────────────────────────────────────────┐
│ 0. Non-Mutating Safety & Environment Preflight              │
│    • Target deployment /api/health probe                    │
│    • Direct DB current_database() & host validation         │
│    • Deployed API presigned URL storage bucket probe        │
│    • Dual API & SQL zero active override verification       │
│    • Photo capacity check (exactly 1 slot remaining)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ PASS
┌──────────────────────────────▼──────────────────────────────┐
│ 1. Provisioning Idempotency Race (20 concurrent requests)    │
│    • pg_advisory_xact_lock transaction serialization        │
│    • Asserts all 20 return the exact same wedding ID        │
│    • Independent DB query: exactly 1 wedding created        │
│    • Independent DB query: exactly 1 audit record           │
└──────────────────────────────┬──────────────────────────────┘
                               │ PASS
┌──────────────────────────────▼──────────────────────────────┐
│ 2. Concurrent Media Quota Enforcement (10 requests)         │
│    • SELECT ... FOR UPDATE row locking against quota ceiling │
│    • Asserts exactly 1 commit succeeds (HTTP 200/201)       │
│    • Asserts exactly 9 reject with HTTP 403 quota exceeded  │
│    • Independent DB query: photo count increased by exactly +1│
└──────────────────────────────┬──────────────────────────────┘
                               │ PASS
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Commercial Gate Enforcement                               │
│    • Validates Lite tier weddings cannot remove branding    │
└──────────────────────────────┬──────────────────────────────┘
                               │ PASS
┌──────────────────────────────▼──────────────────────────────┐
│ 4. Guest PIN Rotation & Session Invalidation                │
│    • Rotates PIN and asserts old session cookies rejected   │
│    • Mandatory fail-closed cleanup in finally block         │
└──────────────────────────────┬──────────────────────────────┘
                               │ PASS
┌──────────────────────────────▼──────────────────────────────┐
│ 5. Entitlement Override & Revocation Audit                  │
│    • Applies 850-photo staff override with reason           │
│    • Validates audit_log records actor ID and justification │
│    • Revokes override and asserts restoration to plan defaults│
│    • Mandatory fail-closed cleanup in finally block         │
└─────────────────────────────────────────────────────────────┘
```

### 3. Failure Behavior & Isolation Guarantees

- **Fail-Closed Execution**: If any gate fails an assertion, downstream gates are aborted immediately.
- **Fail-Closed Cleanup**: Gates 4 and 5 wrap mutations in `try ... finally` blocks. If cleanup fails, the entire run fails and alerts operators.
- **Credential Masking**: All session cookies, bearer tokens, HMAC signatures, and PIN numbers are scrubbed via `sanitize()` before printing to stdout/stderr.
- **Non-Zero Exit Code**: Any preflight abort or gate failure sets `process.exitCode = 1`.

### 4. Evidence to Retain for Release Sign-Off

To approve a production release, the operator must capture and store:

1. **Console Run Log**: Full terminal output demonstrating all 6 gates passing (`6/6 gates passed`).
2. **Exit Code**: Confirmed exit code `0`.
3. **Database Snapshot**: Direct SQL query results showing:
   - Exactly 1 wedding created from Gate 1.
   - Exactly 1 `wedding.provision` audit record matching `${STAGING_IDEMPOTENCY_KEY}-${runNonce}`.
   - Exactly +1 photo recorded in `photos` table from Gate 2.
   - Zero active entitlement overrides remaining after Gate 5 cleanup.
