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
│       └── 1_db_protections/      ← Reserved slug triggers, check constraints, partial indexes
│
├── src/
│   ├── app/
│   │   ├── w/[slug]/page.tsx      ← Guest wedding site (Envelope, itinerary, RSVP, Shagun)
│   │   ├── admin/
│   │   │   ├── login/page.tsx     ← Staff concierge authentication
│   │   │   └── page.tsx           ← Managed weddings overview & metrics
│   │   └── api/
│   │       ├── rsvp/route.ts      ← Rate-limited RSVP submission handler
│   │       └── media/presign/     ← Direct R2 S3 presigned PUT generator
│   │
│   ├── lib/
│   │   ├── db.ts                  ← PrismaClient singleton with serverless pooling
│   │   ├── r2.ts                  ← Cloudflare R2 S3 client & signed URL helpers
│   │   ├── auth.ts                ← HMAC session security helpers
│   │   └── ratelimit.ts           ← In-memory sliding window rate limiter
│   └── middleware.ts              ← Reserved slug guard and admin route protection
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
| **ORM**       | Prisma ORM 5.22                 | Declarative datamodel + migration runner                                  |
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

# Apply migrations to your database
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Visit:

- **Guest Site Demo**: [http://localhost:3000/priya-rahul](http://localhost:3000/priya-rahul)
- **Concierge Admin**: [http://localhost:3000/admin](http://localhost:3000/admin) (Login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login))

---

## 🗄️ Database & Migrations

The database setup uses a two-step migration architecture:

1. **`0_init/migration.sql`**: Generates all core tables, custom PostgreSQL enums, foreign keys, and standard indexes.
2. **`1_db_protections/migration.sql`**: Applies custom database protections:
   - `block_reserved_slug()` function and trigger preventing weddings from claiming reserved routes (`admin`, `api`, `w`, etc.).
   - `REVOKE` write privileges on `reserved_slugs` to ensure table immutability from the application role.
   - Partial unique indexes (`uq_rsvp_event_guest`, `uq_rsvp_event_phone_name`).
   - Strict `CHECK` constraints on party sizes, slugs, and amounts.

---

## 📚 Documentation Hub

For in-depth product, architectural, and financial specifications, refer to [`docs/`](./docs/):

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
