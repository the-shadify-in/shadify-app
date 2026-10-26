# 🔐 Shadify Environment Variables Reference & Governance

> **Authoritative Specification**: Single source of truth for all environment variables in `the-shadify-in/shadify-app`.
> **Schema Definition**: [`src/lib/env.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/env.ts)
> **Eager Runtime Validation Hook**: [`src/instrumentation.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/instrumentation.ts)
> **Template**: [`.env.example`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/.env.example)

---

## 1. Architecture & Governance Principles

1. **Fail-Closed Startup Guarantee**:
   At server boot, Next.js executes `src/instrumentation.ts`, which eagerly runs `validateEnv()` and `validateRateLimitConfiguration()`. If any required production secret is missing, malformed, or fails pairwise independence, **the process immediately aborts (`process.exit(1)`)**. The server will never accept HTTP requests in an uninitialized or insecure state.
2. **Client vs. Server Isolation**:
   Only variables prefixed with `NEXT_PUBLIC_` are bundled into client-side JavaScript. All other variables are server-only. Never expose cryptographic secrets, database URLs, or API tokens with a `NEXT_PUBLIC_` prefix.
3. **Pairwise Secret Independence**:
   To prevent lateral privilege escalation if a single secret is compromised, cryptographic secrets (`ADMIN_SESSION_SECRET`, `GUEST_ACCESS_SECRET`, `ERASURE_HMAC_SECRET`, `RATE_LIMIT_HASH_SECRET`) must be **independently generated** (minimum 32 random characters). The schema validation strictly rejects startup if any two secrets share the same value.
4. **Build vs. Runtime Decoupling**:
   During Next.js static page generation (`NEXT_PHASE="phase-production-build"`), runtime database and Redis credentials are not required. Build-time leak prevention is enforced independently by `scripts/verify-post-build.mjs`.

---

## 2. Environment Variables Catalog

### A. Database (PostgreSQL 16 — Neon Serverless)

| Variable       | Type           | Required In Prod | Default / Example                                                    | Purpose & Operational Context                                                                                                    |
| :------------- | :------------- | :--------------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | `string (url)` | **YES**          | `postgresql://user:pass@ep-pooler.neon.tech/shadify?sslmode=require` | Pooled connection string used by Prisma ORM and `pg.Pool` at runtime. Connects via PgBouncer for serverless concurrency scaling. |
| `DIRECT_URL`   | `string (url)` | Recommended      | `postgresql://user:pass@ep.neon.tech/shadify?sslmode=require`        | Direct (unpooled) connection string used exclusively by Prisma CLI for migrations (`prisma migrate deploy`) and DDL triggers.    |

---

### B. Cryptographic Secrets & Authentication

| Variable                 | Type     | Required In Prod | Min Length   | Purpose & Security Guarantees                                                                                                                                                                     |
| :----------------------- | :------- | :--------------- | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ADMIN_SESSION_SECRET`   | `string` | **YES**          | 32 chars     | HMAC key used to sign and verify concierge staff administrative session cookies (`__Host-shadify-admin-token`).                                                                                   |
| `GUEST_ACCESS_SECRET`    | `string` | **YES**          | 32 chars     | HMAC key used to sign and verify guest PIN unlock cookies (`__Host-shadify-guest-pin`). Strictly separate from admin session cookies.                                                             |
| `ERASURE_HMAC_SECRET`    | `string` | **YES**          | 32 chars     | HMAC key used by the DPDP Act 2023 erasure engine to compute deterministic tombstone hashes (`erasure_hash`) without storing PII.                                                                 |
| `RATE_LIMIT_HASH_SECRET` | `string` | **YES**          | 32 chars     | Salt key used by `hashIpForStorage()` to hash client IP addresses into 16-character hex digests before transmitting to Upstash Redis. Ensures raw IPs are never stored in external memory caches. |
| `ADMIN_PASSWORD_HASH`    | `string` | **YES**          | Valid bcrypt | Bcrypt hash ($2b$10$...) of the concierge master administrative password. Required for staff login at `/admin/login`.                                                                             |

> [!IMPORTANT]
> **Secret Rotation Rule**: Rotating `ADMIN_SESSION_SECRET` or `GUEST_ACCESS_SECRET` logs out active sessions. Rotating `RATE_LIMIT_HASH_SECRET` resets active rate limit counters (harmless). Rotating `ERASURE_HMAC_SECRET` must only be done in accordance with the statutory erasure runbook ([`docs/operations/runbooks.md`](./runbooks.md)).

---

### C. Distributed Rate Limiting & Proxy Boundary

| Variable                          | Type                                          | Required In Prod                                   | Default    | Purpose & Failure Modes                                                                                                                                                                           |
| :-------------------------------- | :-------------------------------------------- | :------------------------------------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `UPSTASH_REDIS_REST_URL`          | `string (url)`                                | **YES**                                            | None       | REST endpoint URL for Upstash Redis (e.g. `https://xxx.upstash.io`). Powers atomic Lua sliding-window rate limit counters across serverless instances.                                            |
| `UPSTASH_REDIS_REST_TOKEN`        | `string`                                      | **YES**                                            | None       | Bearer authentication token for Upstash Redis REST API.                                                                                                                                           |
| `RATE_LIMIT_FAIL_CLOSED`          | `enum ("true" \| "false")`                    | **YES (`"true"`)**                                 | `"false"`  | Operational policy during Redis network outages. In production, this **must be `"true"`** so authentication and PIN routes fail closed (rejecting brute force) rather than failing open.          |
| `TRUSTED_PROXY_PROVIDER`          | `enum ("vercel" \| "cloudflare" \| "direct")` | **YES (`"vercel"` \| `"cloudflare"`)**             | `"vercel"` | Instructs `getClientIp()` how to resolve visitor IPs. `"vercel"` uses Vercel's sanitized `x-real-ip`. `"cloudflare"` uses `cf-connecting-ip`. `"direct"` is **strictly forbidden in production**. |
| `CLOUDFLARE_ORIGIN_VERIFY_SECRET` | `string`                                      | Mandatory if `TRUSTED_PROXY_PROVIDER="cloudflare"` | None       | Shared secret validated against `X-Origin-Verify-Secret` header to ensure incoming traffic genuinely traversed Cloudflare and is not spoofed directly against origin.                             |
| `RATE_LIMIT_TIMEOUT_MS`           | `number`                                      | Optional                                           | `1500`     | Timeout in milliseconds before distributed rate limiting aborts and triggers fail-closed / fallback logic.                                                                                        |

---

### D. Public Client Configuration

| Variable                                 | Type           | Required In Prod | Default / Constraint | Purpose & Operational Context                                                                                                                                                      |
| :--------------------------------------- | :------------- | :--------------- | :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                    | `string (url)` | **YES**          | `https://shadify.in` | Canonical base URL of the deployment. Used for OpenGraph metadata, QR code generation, and canonical invite links.                                                                 |
| `NEXT_PUBLIC_CONCIERGE_WHATSAPP`         | `string`       | **YES**          | 10+ digits           | Canonical business WhatsApp phone number (e.g. `919876543219`). **Production builds will reject test numbers like `918000000000` or `919876543210` to prevent user-facing leaks.** |
| `NEXT_PUBLIC_CONCIERGE_WHATSAPP_DISPLAY` | `string`       | Optional         | `+91 98765 43219`    | Human-readable presentation format displayed in UI headers and footers.                                                                                                            |

---

### E. Bot Defense (Cloudflare Turnstile)

| Variable                         | Type     | Required In Prod | Purpose                                                                                                        |
| :------------------------------- | :------- | :--------------- | :------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `string` | **YES**          | Public sitekey rendered in client-side forms (RSVP modal, guestbook blessings).                                |
| `TURNSTILE_SECRET_KEY`           | `string` | **YES**          | Server-side secret key used to verify Turnstile challenge response tokens with Cloudflare's `/siteverify` API. |

---

### F. Object Storage (Cloudflare R2 — S3 Compatible)

| Variable               | Type     | Required In Prod | Default                    | Purpose & Storage Architecture                                                                              |
| :--------------------- | :------- | :--------------- | :------------------------- | :---------------------------------------------------------------------------------------------------------- |
| `R2_ACCOUNT_ID`        | `string` | **YES**          | None                       | Cloudflare account ID for AWS S3 SDK endpoint generation (`https://<account_id>.r2.cloudflarestorage.com`). |
| `R2_ACCESS_KEY_ID`     | `string` | **YES**          | None                       | S3 API access key for signing presigned upload URLs.                                                        |
| `R2_SECRET_ACCESS_KEY` | `string` | **YES**          | None                       | S3 API secret key for signing presigned upload URLs.                                                        |
| `R2_BUCKET_NAME`       | `string` | Optional         | `shadify-media`            | Target bucket name storing original photos, WebP previews, and thumbnails.                                  |
| `R2_PUBLIC_DOMAIN`     | `string` | Optional         | `https://media.shadify.in` | Public CDN domain serving optimized wedding media.                                                          |

---

### G. Optional Features (Staff AI Intake)

| Variable             | Type                       | Required   | Default                     | Purpose                                                                          |
| :------------------- | :------------------------- | :--------- | :-------------------------- | :------------------------------------------------------------------------------- |
| `INTAKE_AI_ENABLED`  | `enum ("true" \| "false")` | Optional   | `"false"`                   | Feature flag enabling OpenAI/Anthropic intake parsing from client wedding cards. |
| `INTAKE_AI_API_KEY`  | `string`                   | If enabled | None                        | API key for LLM provider.                                                        |
| `INTAKE_AI_MODEL`    | `string`                   | If enabled | `gpt-4o-mini`               | Target model identifier.                                                         |
| `INTAKE_AI_ENDPOINT` | `string (url)`             | Optional   | `https://api.openai.com/v1` | LLM provider base URL.                                                           |

---

## 3. Environment Matrix & Requirements

| Environment               | Database                          | Redis / Throttling                                           | Secrets Requirement                                      | Proxy Boundary                                     |
| :------------------------ | :-------------------------------- | :----------------------------------------------------------- | :------------------------------------------------------- | :------------------------------------------------- |
| **Local Development**     | Local Postgres (port 5432/5433)   | In-memory sliding window fallback                            | Dev defaults automatically populated in `src/lib/env.ts` | `"direct"` or `"vercel"` (defaults to `127.0.0.1`) |
| **Automated CI (Vitest)** | Mock / Local Postgres (port 5433) | Mock fetch decisions / local fallback                        | Mock secrets in tests                                    | Tested across `"vercel"` and `"cloudflare"`        |
| **Vercel Preview**        | Neon branch database              | Shared Upstash Preview database                              | Real 32-char secrets required                            | `"vercel"`                                         |
| **Vercel Production**     | Neon production database          | Production Upstash cluster (`RATE_LIMIT_FAIL_CLOSED="true"`) | Pairwise-independent 32-char secrets mandatory           | `"vercel"`                                         |

---

## 4. Standard Operating Procedure (SOP): Adding a New Variable

Whenever a new environment variable is introduced into the codebase, follow this strict checklist to maintain architectural integrity:

1. **Declare in Schema**:
   Add the variable and its type validation into `envSchema` in [`src/lib/env.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/env.ts).
   - If it is a cryptographic secret, enforce `.min(32)`.
   - If it is required in production, add it to `superRefine`.
   - If it must be distinct from other secrets, add a pairwise check.
2. **Update Template**:
   Add the variable with descriptive comments and placeholder values into [`.env.example`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/.env.example).
3. **Add Validation Unit Tests**:
   Update [`src/__tests__/instrumentation.test.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/__tests__/instrumentation.test.ts) to verify that missing or malformed values reject server startup in production.
4. **Update This Reference Document**:
   Add the new variable, its type, requirement status, and security context into this table in [`docs/operations/environment-variables.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/docs/operations/environment-variables.md).
5. **Configure Cloud Providers Before Deploying**:
   Add the variable to Vercel (both **Preview** and **Production** scopes) before triggering any deployment to prevent deployment or startup crashes.
