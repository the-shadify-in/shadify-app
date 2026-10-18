# Shadify — Production SaaS Launch Checklist

> Comprehensive operational, legal, financial, security, and engineering gate checklist for taking Shadify from initial scaffold through pilot weddings to production scale.
> Every item is assigned an explicit priority tag (`[BLOCKER]`, `[BEFORE-LAUNCH]`, `[LATER]`), an owner, and a testable **Done When** completion criterion.

---

## 1. Business, Legal & Tax Foundations

- [ ] **[BLOCKER]** **Legal Entity & Dedicated Bank Account** | `@founder`
  - **Done When**: Entity structure (Proprietorship / LLP / Pvt Ltd) is formally registered, a dedicated business current bank account is operational, and UPI QR / VPA is mapped to the business account.
- [ ] **[BLOCKER]** **GST Determination & Invoicing Protocol** | `@founder` / `@ca`
  - **Done When**: Written confirmation received from Chartered Accountant (CA) on GST registration threshold applicability, treatment of discounts/promos on invoices, and statutory tax-inclusive line-item structure.
- [ ] **[BLOCKER]** **Partner TDS & Commission Payout Rules** | `@founder` / `@ca`
  - **Done When**: CA confirms whether Section 194H TDS applies to vendor/photographer referral commissions (e.g. ₹1,000 per Premium wedding) and provides the payout invoicing template.
- [x] **[BLOCKER]** **Customer Service Agreement & Refund Policy** | `@legal` / `@founder`
  - **Done When**: Standard agreements and policy pages published at `/terms`, `/privacy`, and `/refunds` detailing the 5-year hosting window, 90-day master archive retention, free postponements, and cooling-off terms.
- [ ] **[BEFORE-LAUNCH]** **Photographer & Media Release Terms** | `@legal`
  - **Done When**: Short vendor terms drafted covering copyright ownership, client display rights, and DMCA/takedown mechanisms for user-uploaded photography.
- [ ] **[BEFORE-LAUNCH]** **Trademark & Domain Clearance** | `@founder`
  - **Done When**: Trademark search for "Shadify" in Class 42 and Class 45 completed on IP India portal; primary domain (`shadify.in`) and social handles secured.

---

## 2. GTM, Economics & Referral Engine

- [x] **[BLOCKER]** **Authoritative Tier Pricing & Margin Protection** | `@lead-eng`
  - **Done When**: Plans strictly locked in `src/lib/config/pricing.ts` to ₹2,999 (Lite), ₹7,999 (Premium), and ₹19,999 (Platinum) in integer paise (`pricePaise`), with unit contribution margins verified >70%.
- [x] **[BLOCKER]** **Server-Side Promo Code & Referral Engine** | `@lead-eng`
  - **Done When**: Database models (`promo_codes`, `promo_redemptions`, `referrals`) deployed via Prisma migration `3_promos_and_referrals`; promo validation API (`POST /api/promos/validate`) recalculates discounts strictly server-side with rate limiting.
- [x] **[BEFORE-LAUNCH]** **Pilot Promo Codes Seeded** | `@growth`
  - **Done When**: `NAMASTE299` (₹299 consumer discount for wedding guests) and `STUDIOPARTNER` (₹299 discount + ₹1,000 partner commission on Premium/Platinum) seeded and tested via unit tests.
- [x] **[BEFORE-LAUNCH]** **Manual Referral Tracking Runbook** | `@ops`
  - **Done When**: Standard operating procedure (SOP) established in `docs/RUNBOOKS.md` (Runbook 2) detailing referral logging, 7-day cooling-off verification, Section 194H checks, and manual UPI payouts.
- [x] **[BEFORE-LAUNCH]** **Direct WhatsApp Concierge Intake Flow** | `@product`
  - **Done When**: Marketing CTAs trigger verified WhatsApp links via `getConciergeWhatsAppUrl()` with pre-filled plan selection messages without contact book harvesting.

---

## 3. Core Security, Privacy & Multi-Tenancy

- [x] **[BLOCKER]** **Direct Clean Routing (`/[slug]`)** | `@lead-eng`
  - **Done When**: Guest wedding route served directly at `/[slug]` (never `/w/[slug]`), with reserved namespace collisions (`admin`, `api`, etc.) blocked in `reserved-slugs.ts`.
- [x] **[BLOCKER]** **Multi-Tenant Object Isolation Tests** | `@security`
  - **Done When**: Automated test suite (`src/features/weddings/__tests__/isolation.test.ts`) verifies Wedding A's payload can never leak into Wedding B's DTO, events, or VIPs.
- [x] **[BLOCKER]** **Admin Route Protection & Session Hygiene** | `@security`
  - **Done When**: Middleware enforces session verification on `/admin/*` and `/api/admin/*`; HMAC-SHA256 sessions use constant-time `crypto.timingSafeEqual`, 7-day expiration, and `httpOnly`, `Secure`, `SameSite=Lax` cookies.
- [x] **[BLOCKER]** **Sliding-Window Rate Limiting** | `@security`
  - **Done When**: In-memory rate limiting active on `/api/admin/auth/login` (5 attempts / 15 min) and `/api/promos/validate` (10 attempts / min) returning `429 Too Many Requests`.
- [x] **[BLOCKER]** **Brand Token Isolation CI Gate** | `@lead-eng`
  - **Done When**: `scripts/check-brand-isolation.mjs` runs on pre-commit and CI, blocking any `--brand-*` tokens or marketing imports in guest wedding code (`src/app/[slug]`).
- [x] **[BEFORE-LAUNCH]** **Cloudflare Turnstile on Public Guest Forms** | `@security`
  - **Done When**: RSVP and guestbook endpoints require and verify Turnstile CAPTCHA tokens server-side before persisting records.
- [x] **[BEFORE-LAUNCH]** **Upload Hardening & EXIF Stripping** | `@security`
  - **Done When**: Media presign endpoint verifies MIME magic bytes, enforces plan photo limits, and Sharp pipeline strips GPS EXIF data before public R2 storage.

---

## 4. Theme Engine & Performance

- [x] **[BLOCKER]** **Cache-Decoupled Real-Time Lifecycle Engine** | `@design-eng` / `@lead-eng`
  - **Done When**: `WeddingGuestClient` executes client-side real-time checks on ISO timestamps (`hostingUntil`, ceremony times), allowing edge CDN caching without freezing countdowns or expiration gates.
- [x] **[BLOCKER]** **WCAG AA Contrast Matrix Automation** | `@design-eng`
  - **Done When**: Automated contrast tests (`src/lib/themes/__tests__/contrast.test.ts` and `scripts/test-contrast.mjs`) verify all 5 presets (`royal-crimson`, `emerald-gold`, `ivory-minimal`, `sunset-day`, `sunset-dusk`) meet 4.5:1 text and 3:1 UI ratios.
- [x] **[BEFORE-LAUNCH]** **Dynamic Typography Script Verification** | `@design-eng`
  - **Done When**: Indic font fallbacks (Noto Serif Devanagari, Rozha One, Suranna, Arima Madurai) tested for Devanagari, Telugu, Tamil, and Gujarati wedding names without FOIT/layout shifts.

---

## 5. Reliability, Operations & Disaster Recovery

- [ ] **[BEFORE-LAUNCH]** **Environment Isolation (Staging vs Production)** | `@devops`
  - **Done When**: Production and staging have isolated Cloudflare R2 buckets, Neon PostgreSQL instances, and distinct HMAC session secrets.
- [x] **[BEFORE-LAUNCH]** **Prisma Migration Discipline** | `@devops`
  - **Done When**: Production CI/CD executes `prisma migrate deploy` exclusively against direct unpooled URL; `prisma db push` is blocked. All 5 migrations verified on live Neon PostgreSQL.
- [ ] **[BEFORE-LAUNCH]** **Disaster Recovery Backup Drill** | `@devops`
  - **Done When**: An automated database snapshot is restored into a scratch instance and verified against row counts and constraint integrity.
- [x] **[BEFORE-LAUNCH]** **Health Check & Uptime Monitoring** | `@devops` / `@lead-eng`
  - **Done When**: `/api/health` executes PostgreSQL heartbeat query `SELECT 1`, returning 200 with roundtrip latency or 503 on database disruption. Documented in `docs/OBSERVABILITY.md` with P0/P1 alert matrix.
- [x] **[BEFORE-LAUNCH]** **Wedding-Day Concierge Emergency Runbook** | `@ops`
  - **Done When**: Operational SOP published in `docs/RUNBOOKS.md` (Runbook 1) detailing edge cache pre-warming, emergency 30s misprinted slug alias, caterer RSVP CSV export, and 60-second rollback protocol.

---

## 6. Scaling & Automation (Post-Pilot / Phase 3)

- [ ] **[LATER]** **Razorpay Automated Checkout & Webhooks** | `@lead-eng`
  - **Done When**: Server generates Razorpay orders with server-calculated paise, frontend invokes Checkout modal, and webhook signatures verify payment idempotently.
- [ ] **[LATER]** **Automated Credit & Partner Payout Ledger** | `@lead-eng`
  - **Done When**: Append-only credit ledger table computes balances dynamically, and RazorpayX automates partner payouts after the 7-day cooling-off period.
- [ ] **[LATER]** **Partner Dashboard Portal** | `@product`
  - **Done When**: Dedicated portal for registered photographers and wedding planners to view referral link clicks, qualified weddings, and commission payouts.
- [x] **[BEFORE-LAUNCH]** **Playwright End-to-End Test Suite** | `@qa` / `@lead-eng`
  - **Done When**: Headless browser test suite (`tests/e2e/smoke.test.ts`) verifies full public & guest flows: marketing landing page, legal policy pages, seeded guest envelope opening, admin login redirect, middleware probe blocking, health check, and live Neon promo code validation.
- [ ] **[LATER]** **Indic Multi-Language Guest Interface** | `@product`
  - **Done When**: Guest UI strings localized into Hindi, Telugu, Tamil, and Gujarati with in-place language toggle.
