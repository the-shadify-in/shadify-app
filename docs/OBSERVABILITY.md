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
