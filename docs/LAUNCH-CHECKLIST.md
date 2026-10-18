# Shadify — Production SaaS Launch Checklist

> Comprehensive operational, security, and quality gate checklist for taking Shadify from initial scaffold to real pilot weddings and production scale.
> Each item specifies an owner and an objective **Done When** testable completion criterion.

---

## Phase 1: Now (Scaffold, Quality Gates & Foundation)

### Code Quality & Pipeline

- [x] **Pinned Runtime** | `@lead-eng`
  - **Done When**: `.nvmrc` is pinned to `20.18.0`, `package.json` specifies `"engines": { "node": ">=20.0.0" }`, and lockfile is committed.
- [x] **Pre-Commit Quality Gate** | `@lead-eng`
  - **Done When**: Husky + `lint-staged` runs ESLint `--fix` and Prettier on staged files; commits fail if lint errors exist.
- [x] **Brand Isolation CI Check** | `@lead-eng`
  - **Done When**: `scripts/check-brand-isolation.mjs` runs in pre-commit and CI, failing with code `1` if `--brand-*` or `@/lib/brand` appears in `src/app/w` or `src/components/guest`.
- [x] **Environment Variable Validation** | `@lead-eng`
  - **Done When**: `src/lib/env.ts` parses `process.env` with Zod at startup, refusing to run if `DATABASE_URL` or `ADMIN_SESSION_SECRET` is missing. `.env.example` is fully in sync.
- [x] **Structured PII-Safe Logging** | `@lead-eng`
  - **Done When**: `src/lib/log.ts` uses `pino` with JSON output; guest phone numbers, names, RSVP payloads, tokens, and UPI VPAs are censored as `[REDACTED]`.
- [x] **GitHub Actions Quality Gate** | `@lead-eng`
  - **Done When**: `.github/workflows/ci.yml` runs on every push and PR to `main` executing format, lint, type-check, contrast tests, brand check, and `next build`.
- [x] **Automated Dependency Updates** | `@lead-eng`
  - **Done When**: `.github/dependabot.yml` is active for weekly npm and GitHub Actions updates with non-blocking `npm audit`.
- [x] **Architecture Decision Records (ADRs)** | `@lead-eng`
  - **Done When**: `docs/adr/` contains ADR 0001 (Monolith), ADR 0002 (Theme Engine), ADR 0003 (Prisma with Raw Migrations), and ADR 0004 (5-Year Hosting & 90-Day Retention).

### Core Security & Multi-Tenancy

- [x] **Unguessable IDs in Public Links** | `@security`
  - **Done When**: Public links use UUIDs and random invitation tokens; no sequential integer IDs or predictable enumeration paths exist.
- [ ] **Cross-Tenant Object-Level Authorization Tests** | `@security`
  - **Done When**: An automated integration test creates two distinct weddings and confirms Wedding A's session or token can never read or mutate Wedding B's RSVPs, guestbook, photos, or Shagun entries.
- [x] **Protected Admin Route & Session Hygiene** | `@security`
  - **Done When**: `/admin/login` sits outside auth middleware; sessions use HMAC-SHA256 with `crypto.timingSafeEqual` and `httpOnly`, `Secure`, `SameSite=Lax` cookies.

### Theme & Design Engine

- [x] **8-Point WCAG AA Contrast Matrix** | `@design-eng`
  - **Done When**: `npm run test:contrast` verifies all 5 curated presets (`royal-crimson`, `emerald-gold`, `ivory-minimal`, `sunset-day`, `sunset-dusk`) and flags low-contrast custom overrides.
- [x] **Cache Preservation on Guest Routes** | `@lead-eng`
  - **Done When**: `/w/[slug]/page.tsx` accesses zero `searchParams`, allowing Cloudflare edge CDN and Next.js ISR caching to function cleanly. Dynamic previews live on `/w/[slug]/preview`.

---

## Phase 2: Before the First Real Wedding (Pilot Hardening)

### Reliability & Infrastructure

- [ ] **Isolated Environments (Local, Staging, Production)** | `@devops`
  - **Done When**: Staging and Production have separate Cloudflare R2 buckets and dedicated Neon/Supabase PostgreSQL databases. Production credentials are never used in local development.
- [ ] **Database Migration Discipline** | `@devops`
  - **Done When**: Production deploys execute `prisma migrate deploy` exclusively; `prisma db push` is disabled.
- [ ] **Backup Restoration Drill** | `@devops`
  - **Done When**: An automated database backup is restored into a scratch database and verified against row counts and constraints to prove disaster recovery works.
- [ ] **Uptime & Health Check** | `@devops`
  - **Done When**: `/api/health` queries `SELECT 1` against Postgres and returns `200 OK`; external uptime pinger (e.g. BetterStack) alerts on downtime.
- [ ] **Spend Caps & Cost Alerts** | `@lead-eng`
  - **Done When**: Billing alerts and spending caps are configured on Vercel, Neon, and Cloudflare to prevent surprise runaway scraping bills.

### Security & Bot Defense

- [ ] **Cloudflare Turnstile on Public Forms** | `@security`
  - **Done When**: RSVP and Guestbook submissions verify Turnstile tokens server-side before persisting records to database.
- [ ] **Rate Limiting on Sensitive Endpoints** | `@security`
  - **Done When**: In-memory / Postgres-backed sliding window limiter caps `/admin/login` (5 req/min) and `/api/rsvp` (10 req/min per IP).
- [ ] **Upload Hardening & EXIF Sanitization** | `@security`
  - **Done When**: Media upload pipeline inspects magic bytes (content-type verification), enforces file size limits, and strips EXIF GPS location data using Sharp before public storage.
- [ ] **Cloudflare R2 CORS & Lifecycle Retention** | `@devops`
  - **Done When**: R2 CORS is restricted to `shadify.in` and preview domains; R2 bucket lifecycle rule deletes master original files under `originals/` after 90 days.
- [ ] **Security Headers & CSP Verification** | `@security`
  - **Done When**: `next.config.js` sets HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`. CSP tested with theme `<style>` tag nonce.

### Privacy & Operations (DPDP Alignment)

- [ ] **Legal Review of Terms & Privacy Notice** | `@legal`
  - **Done When**: Draft privacy notice, terms of service, and refund policy are reviewed by legal counsel; code and UI reference reviewed versions without premature "compliant" claims.
- [ ] **Data Inventory & Retention Schedule** | `@compliance`
  - **Done When**: Written schedule documents all stored personal data (names, phones, dietary preferences) linked to the 5-year hosting window and 90-day master archive deletion.
- [ ] **Couple & Guest Deletion Runbook** | `@compliance`
  - **Done When**: Written step-by-step SOP documents how to process an erasure request across PostgreSQL tables, R2 buckets, and backups.
- [ ] **Wedding-Day Support Runbook** | `@ops`
  - **Done When**: 1-page emergency checklist prepared for wedding morning (cache pre-warming, direct concierge WhatsApp hotline, rollback protocol).

---

## Phase 3: Later (After Pilots / Multi-Contributor Scaling)

- [ ] **Automated Payment Webhooks** | `@lead-eng`
  - **Done When**: Razorpay / Cashfree webhook signatures are verified, processed idempotently with distributed lock, and credit `entitlements` row.
- [ ] **End-to-End Playwright Smoke Tests** | `@qa`
  - **Done When**: Headless browser test creates a wedding in `/admin/weddings/new`, opens the guest site, opens the envelope, and submits an RSVP.
- [ ] **Visual Regression Screenshot Testing** | `@design-eng`
  - **Done When**: Playwright screenshot comparison tests catch unintentional CSS shifts across all 5 theme presets.
- [ ] **Cookieless Marketing Analytics** | `@product`
  - **Done When**: Plausible or Umami is configured on marketing routes (`/`) with 0 trackers embedded in guest pages (`/w/*`).
- [ ] **Multi-Language Localization (Hindi, Telugu, Tamil, Gujarati)** | `@product`
  - **Done When**: Guest invitation strings are extracted into translation dictionaries with verified font rendering for Indic scripts.
