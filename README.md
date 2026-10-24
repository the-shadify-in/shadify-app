<div align="center">

# 🌸 Shadify (`shadify-app`)

**The Luxury Digital Operating System for Indian Weddings**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-S3_Compatible-F38020?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/r2/)

<p align="center">
  <a href="#-core-features-mvp-0">Features</a> •
  <a href="#-architecture--tech-stack">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-documentation-hub">Documentation</a> •
  <a href="#-database--migrations">Database</a>
</p>

</div>

---

## 💍 What is Shadify?

**Shadify** is a multi-tenant wedding website and guest management platform crafted specifically for Indian weddings. It provides interactive luxury digital invitations, multi-event ceremony itineraries with Google Maps, zero-commission UPI cash gifts (Shagun), and frictionless client-side WhatsApp sharing.

---

## ✨ Core Features (MVP-0)

- **✉️ Royal Envelope Reveal**: Fast, mobile-first CSS envelope animation with personalized monogram wax seals (no heavy Three.js/WebGL bloat).
- **📅 Dynamic Ceremony Itinerary**: Multi-event schedules (Mehendi, Sangeet, Mandap, Reception) with 1-tap Google Maps directions and dress codes.
- **📝 Per-Event RSVP**: Open and guest-linked RSVP forms with headcount, dietary preferences (Jain/Veg), stay requests, and shared family smartphone deduplication (`event_id`, `phone`, `name`).
- **💰 Zero-Commission Digital Shagun**: Native `upi://pay` deep links directly into the couple's bank account with traditional ₹1 coin presets (₹501, ₹1,101, ₹2,101, ₹5,101).
- **📲 1-Tap WhatsApp Invite Studio**: Client-side `wa.me/?text=...` invite generator with pre-formatted greeting templates (Traditional, Friends, Family). Zero contact harvesting and ₹0 Meta API fees.
- **👑 Meet the VIPs**: Highlight cards for the wedding party: The Pillars (Parents), Bride's Tribe, Groom's Squad, and Emergency Hospitality Coordinators.
- **📸 90-Day R2 Storage Lifecycle**: High-res master RAW originals retained for 90 days (`originals_expire_at`); web-optimized WebP previews (~200 KB) hosted for the 5-year renewable term.
- **🛡️ Staff Concierge Admin (`/admin`)**: Internal management portal for staff to onboard couples, manage ceremonies, direct-upload media to R2, and review RSVPs.

---

## 🏛️ Architecture & Tech Stack

```
shadify-app/
├── docs/                          ← Authoritative architecture & product blueprints
│   ├── adr/                       ← Architecture Decision Records (ADR 0001)
│   └── README.md                  ← Documentation retrieval index
│
├── prisma/
│   ├── schema.prisma              ← Type-safe models, enums & relations
│   └── migrations/
│       ├── 0_init/                ← Base tables, enums, standard indexes, FKs
│       ├── 1_db_protections/      ← Reserved slug triggers, check constraints, partial indexes
│       ├── 2_theme_config/        ← Validated wedding theme palette & typography JSON
│       ├── 3_promos_and_referrals/← B2B partner and guest referral credit tables
│       ├── 4_reserved_slugs_expand/← Expanded reserved slugs list trigger
│       ├── 5_schema_constraints_alignment/ ← Unique indexes and constraints alignment
│       ├── 6_chip_counts/         ← Chip tap analytics aggregates
│       └── 7_aliases_and_qr_assets/← Vanity aliases, QR print assets, and audit logs
│
├── src/
│   ├── app/
│   │   ├── page.tsx               ← Luxury public marketing landing page
│   │   ├── terms/page.tsx         ← Customer agreement & 5-year hosting terms
│   │   ├── privacy/page.tsx       ← DPDP Act 2023 zero-harvesting privacy notice
│   │   ├── refunds/page.tsx       ← Cancellation, postponement & refund policy
│   │   ├── report/page.tsx        ← Public community & content reporting interface
│   │   ├── [slug]/page.tsx        ← Direct guest wedding site (Envelope, itinerary, RSVP, Shagun)
│   │   ├── admin/
│   │   │   ├── layout.tsx         ← Authenticated AdminShell wrapper with collapsible sidebar
│   │   │   ├── login/page.tsx     ← Staff concierge authentication
│   │   │   ├── health/page.tsx    ← 14-day pre-wedding readiness gate
│   │   │   ├── theme-preview/     ← Design system & theme inspector studio
│   │   │   ├── weddings/[id]/     ← Operational wedding studio (4-domain navigation, PIN, overrides)
│   │   │   ├── weddings/new/      ← New wedding concierge creation
│   │   │   └── page.tsx           ← Managed celebrations directory & metrics
│   │   └── api/
│   │       ├── rsvp/route.ts      ← Rate-limited RSVP submission with Turnstile
│   │       ├── guestbook/route.ts ← Moderated guest blessing submissions
│   │       ├── health/route.ts    ← Heartbeat database probe
│   │       ├── promos/validate/   ← Integer paise promo validation
│   │       ├── media/finalize/    ← Photo finalize with SELECT FOR UPDATE concurrency lock
│   │       ├── media/presign/     ← S3-compatible Cloudflare R2 presigned PUT generator
│   │       ├── privacy/data-request/ ← Statutory DPDP Act 2023 data export & erasure requests
│   │       ├── analytics/chip/    ← Anonymous daily aggregate chip tap telemetry
│   │       └── admin/             ← Staff APIs:
│   │           ├── weddings/provision/   ← Transactional provision with advisory lock & idempotency
│   │           ├── weddings/[id]/pin/    ← Masked PIN rotation, reset & cookie invalidation
│   │           ├── weddings/[id]/entitlements/ ← Central limit engine & staff override audits
│   │           ├── weddings/[id]/aliases/← Custom vanity domains & collision prevention
│   │           └── weddings/[id]/export-rsvps/ ← CSV attendee & dietary data export
│   │
│   ├── components/                ← Primitives (Button, Dialog, Turnstile) & AdminShell patterns
│   ├── features/                  ← Modular domain logic (weddings, entitlements, promos, guest)
│   ├── lib/                       ← Core singletons: db.ts, r2.ts, ratelimit.ts, auth.ts, themes
│   └── middleware.ts              ← Reserved slug guard, scanner bot filter, admin protection
│
├── tests/
│   ├── db/real-postgres.test.ts   ← Real Postgres 16 tenant isolation & constraint tests
│   └── staging/concurrency-gate.ts← 6-gate staging release gate (advisory lock & media quota race)
│
├── .env.example
├── package.json
└── tailwind.config.ts
```

| Layer         | Technology                      | Purpose                                                                   |
| ------------- | ------------------------------- | ------------------------------------------------------------------------- |
| **Framework** | Next.js 14 (App Router)         | Unified monolith serving guest sites, concierge admin, and route handlers |
| **Language**  | TypeScript 5                    | Strict end-to-end type safety                                             |
| **Styling**   | Tailwind CSS                    | Luxury Indian wedding design palette (Royal Crimson & Rajasthani Gold)    |
| **Database**  | PostgreSQL 16 (Neon / Supabase) | Relational multi-tenant schema with UUID PKs and paise accounting         |
| **ORM**       | Prisma ORM 7.10                 | Declarative datamodel + migration runner                                  |
| **Storage**   | Cloudflare R2                   | S3-compatible media storage with zero egress fees                         |
| **Edge CDN**  | Cloudflare / Vercel Edge        | Global HTML and asset caching with tag-based on-demand revalidation       |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (or `pnpm`)
- **PostgreSQL**: PostgreSQL 16 instance (local or managed via [Neon](https://neon.tech) / [Supabase](https://supabase.com))

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/the-shadify-in/shadify-app.git
cd shadify-app
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Required variables:

```ini
DATABASE_URL="postgresql://user:password@ep-sample-pooler.aws.neon.tech/shadify?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@ep-sample.aws.neon.tech/shadify?sslmode=require"
ADMIN_SESSION_SECRET="your-32-character-secret-key"
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="shadify-media"
```

### 3. Database Migration & Client Generation

```bash
# Generate the Prisma Client
npm run db:generate

# Apply migrations to your database (Neon unpooled/direct)
npm run db:migrate:deploy

# Seed initial celebration and partner promo codes
npm run db:seed

# Run automated test suites
# Run automated test suites
npm run test          # 41 test files, 259 Vitest unit & integration tests
npm run test:e2e      # Playwright headless browser E2E smoke suite
npm run check         # Prettier, ESLint, Brand isolation, TypeScript & Vitest
```

### 4. Run Development Server

```bash
npm run dev
```

Visit:

- **Marketing Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Guest Site Demo**: [http://localhost:3000/priya-rahul](http://localhost:3000/priya-rahul)
- **Concierge Admin**: [http://localhost:3000/admin](http://localhost:3000/admin) (Login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login))
- **System Health Heartbeat**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🗄️ Database & Migrations

Shadify enforces a strictly audited, eight-step declarative migration architecture in `prisma/migrations/`:

| Migration | Identifier                       | Scope & Applied Protections                                                                                                                                                                                                                                                                                |
| --------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0**     | `0_init`                         | Core relational schema: `weddings`, `events`, `guests`, `rsvps`, `photos`, custom PostgreSQL enums, foreign keys, and base indexes.                                                                                                                                                                        |
| **1**     | `1_db_protections`               | Database invariants: `block_reserved_slug()` trigger preventing reserved route claims (`admin`, `api`, `w`), `REVOKE` write privileges on `reserved_slugs`, partial unique indexes (`uq_rsvp_event_guest`, `uq_rsvp_event_phone_name`), and strict `CHECK` constraints on party sizes, slugs, and amounts. |
| **2**     | `2_theme_config`                 | Validated wedding theme palette & typography JSON schema (`themeConfig`).                                                                                                                                                                                                                                  |
| **3**     | `3_promos_and_referrals`         | B2B partner commission ledger, guest referral credits, and integer paise promo codes (`promos`, `referral_credits`, `partner_commissions`).                                                                                                                                                                |
| **4**     | `4_reserved_slugs_expand`        | Expanded reserved slug list trigger synchronized with application route boundaries.                                                                                                                                                                                                                        |
| **5**     | `5_schema_constraints_alignment` | Database constraint alignment for safe partial unique indexes and tenant isolation.                                                                                                                                                                                                                        |
| **6**     | `6_chip_counts`                  | First-party anonymous daily question analytics aggregates (`wedding_chip_counts`).                                                                                                                                                                                                                         |
| **7**     | `7_aliases_and_qr_assets`        | Vanity domain/URL aliases (`wedding_aliases`), high-resolution print QR assets (`wedding_qr_assets`), and entitlement override audit logs.                                                                                                                                                                 |

---

## 🛡️ Staging Release Gate (`tests/staging/concurrency-gate.ts`)

Before any release or production promotion, the automated staging concurrency gate verifies database isolation, transactional locking, and media quotas against a live staging deployment:

```bash
bun run tests/staging/concurrency-gate.ts
```

### Sequential Safety Gates

1. **Gate 0: Safety & Environment Preflight**: Non-mutating verification running first. Verifies target host boundaries, direct database connection to `STAGING_EXPECTED_DB_HOST`/`NAME`, queries the deployed `/api/media/presign` endpoint to prove deployed storage matches `STAGING_EXPECTED_STORAGE_BUCKET`, asserts disposable fixture keys, validates 0 active entitlement overrides via both API and SQL, and confirms exactly 1 remaining photo slot.
2. **Gate 1: Provisioning Idempotency Race (20 concurrent requests)**: Validates `pg_advisory_xact_lock` serialization. Asserts that 20 simultaneous requests with the same run-scoped idempotency key result in exactly 1 persisted wedding and 1 audit record.
3. **Gate 2: Concurrent Media Quota Enforcement (10 concurrent requests)**: Validates PostgreSQL `SELECT ... FOR UPDATE` row locking against the photo quota ceiling. Asserts exactly 1 photo is committed and 9 requests reject with HTTP 403 quota exceeded.
4. **Gate 3: Commercial Gate Enforcement**: Validates that Lite plan weddings cannot toggle branding removal without an authorized tier upgrade.
5. **Gate 4: Guest PIN Rotation & Session Invalidation**: Validates that rotating or resetting a wedding PIN instantly invalidates previous guest session cookies with fail-closed cleanup.
6. **Gate 5: Entitlement Override & Revocation Audit**: Validates that staff overrides apply cleanly with operator attribution, log immutable audit trails, and revocation restores plan defaults with fail-closed cleanup.

### Mandatory Environment Variables

```ini
STAGING_BASE_URL="https://staging.shadify.in"
STAGING_EXPECTED_HOST="staging.shadify.in"
STAGING_CONFIRM="I_UNDERSTAND_THIS_MUTATES_STAGING"
STAGING_ADMIN_COOKIE="<signed-staging-staff-cookie>"
STAGING_PROVISION_BODY_JSON='{"slug":"staging-test-wedding","brideName":"...","groomName":"..."}'
STAGING_IDEMPOTENCY_KEY="staging-gate-key"
STAGING_LITE_WEDDING_ID="<disposable-lite-wedding-uuid>"
STAGING_MEDIA_FINALIZE_BODIES_JSON='[{"weddingSlug":"...","key":"weddings/<uuid>/photos/disposable-..."}]'
STAGING_DATABASE_URL="postgresql://user:pass@staging-db.shadify.internal/shadify_staging"
STAGING_EXPECTED_DB_NAME="shadify_staging"
STAGING_EXPECTED_DB_HOST="staging-db.shadify.internal"
STAGING_EXPECTED_STORAGE_BUCKET="shadify-media-staging"
```

---

## 📚 Documentation Hub

For in-depth product, architectural, operational, and financial specifications, refer to [`docs/`](./docs/):

- **[engineering-guidelines.md](./docs/engineering/engineering-guidelines.md)**: 4 component layers, domain boundaries, brand token isolation CI gate.
- **[ui-ux-guidelines.md](./docs/engineering/ui-ux-guidelines.md)**: Luxury Indian wedding design tokens, 5 curated presets, envelope reveal, and mobile ergonomics.
- **[launch-checklist.md](./docs/operations/launch-checklist.md)**: Pre-launch verification matrix, blocker tracking, and quality gates.
- **[runbooks.md](./docs/operations/runbooks.md)**: Concierge operations runbooks (Emergency triage, B2B partner payouts, DPDP erasure).
- **[observability.md](./docs/operations/observability.md)**: Structured JSON logging, `/api/health` heartbeat, `/admin/health` gate, staging release gate, and P0/P1 alert matrix.
- **[00-master-plan.md](./docs/product-specs/00-master-plan.md)**: Architectural principles and development standards.
- **[01-product-vision-and-mvp.md](./docs/product-specs/01-product-vision-and-mvp.md)**: Product scope, unit economics table, and break-even targets.
- **[02-system-architecture.md](./docs/product-specs/02-system-architecture.md)**: Caching tiers, monolith layout, and R2 presigned upload mechanics.
- **[03-data-models-and-security.md](./docs/product-specs/03-data-models-and-security.md)**: PostgreSQL schema, paise accounting, and DPDP record-keeping.
- **[04-guest-experience-and-lifecycle.md](./docs/product-specs/04-guest-experience-and-lifecycle.md)**: Pre/Live/Post lifecycle views, CSS envelope reveal, and UPI Shagun.
- **[05-photography-and-ai-pipeline.md](./docs/product-specs/05-photography-and-ai-pipeline.md)**: 90-day retention rules, audience visibility tiers, and Phase 2 face search roadmap.
- **[06-hospitality-and-roadmap.md](./docs/product-specs/06-hospitality-and-roadmap.md)**: Resort room allocator, driver cards, and React Native mobile app roadmap.
- **[ADR 0001](./docs/adr/0001-lean-mvp0-monolith-and-economics.md)**: Lean Next.js Monolith, Direct UPI Shagun & 90-Day R2 Retention.
- **[ADR 0002](./docs/adr/0002-dual-token-namespaces-and-theme-engine.md)**: Dual Token Namespaces (`--brand-*` vs `--theme-*`) & Theme as Data.

---

## 📄 License

Private & Proprietary. All rights reserved by **The Shadify Team**.
