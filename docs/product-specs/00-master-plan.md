# 🌸 Shadify — Master Architecture & Product Blueprint

> **Shadify** is an all-in-one digital operating system for Indian weddings — multi-tenant SaaS powering dynamic wedding websites with **pre/live/post-wedding lifecycle views**, **3D wax seal reveals**, **personal video bites**, **1-tap WhatsApp Invite Studio**, **digital UPI Shagun**, and **real-time photo galleries**.

---

## 1. Core Principles

1. **Multi-Tenancy (ONE App Serves All)**: A single Next.js 14 deployment handles all 1,000+ weddings via path routing (`shadify.in/[slug]`) and wildcard subdomains (`[slug].shadify.in`).
2. **Zero-Friction WhatsApp Invite Studio**: No contact harvesting or pre-storing phonebooks. Couples share directly from their personal WhatsApp with 1 tap (₹0 Meta API fees).
3. **Lean Next.js Monolith for MVP-0**: A single Next.js 14 app (App Router) serves both guest websites (`/[slug]`), concierge admin (`/admin`), and route handlers (`/api/*`), eliminating separate microservices and devops overhead on Day 1.
4. **Realistic ~82%–85% Contribution Margins**: Factoring in 18% GST, 2.36% payment gateway fees, and concierge labor (₹300/hr) with Cloudflare R2 90-day RAW lifecycle, achieving operating break-even at just 2 to 4 weddings per month.

---

## 2. Master Documentation Suite

The root `docs/` folder is organized into **7 authoritative master documents**:

| #      | Document                                                                                                                                  | Scope & Focus                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **00** | [`00-MASTER-PLAN.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/docs/00-MASTER-PLAN.md)                                       | High-level architectural principles, document index, and monorepo guidelines.        |
| **01** | [`01-PRODUCT-VISION-AND-MVP.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/docs/01-PRODUCT-VISION-AND-MVP.md)                 | Product vision, lean MVP-0 scope, unit economics table, and break-even model.        |
| **02** | [`02-SYSTEM-ARCHITECTURE.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/docs/02-SYSTEM-ARCHITECTURE.md)                       | Next.js 14 monolith topology, Cloudflare R2 storage lifecycle, and edge caching.     |
| **03** | [`03-DATA-MODELS-AND-SECURITY.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/docs/03-DATA-MODELS-AND-SECURITY.md)             | PostgreSQL 16 schema (UUIDs, paise accounting, DPDP compliance, R2 keys).            |
| **04** | [`04-GUEST-EXPERIENCE-AND-LIFECYCLE.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/docs/04-GUEST-EXPERIENCE-AND-LIFECYCLE.md) | Pre/Live/Post lifecycle views, CSS/Lottie envelope reveal, video bites, UPI Shagun.  |
| **05** | [`05-PHOTOGRAPHY-AND-AI-PIPELINE.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/docs/05-PHOTOGRAPHY-AND-AI-PIPELINE.md)       | Venue ingest, client proofing (70/30), audience visibility, and Phase 2 AI search.   |
| **06** | [`06-HOSPITALITY-AND-ROADMAP.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/docs/06-HOSPITALITY-AND-ROADMAP.md)               | Resort room allocator, driver details, emergency contacts, and React Native roadmap. |

---

## 3. Implementation Repository Structure

The implementation is unified inside the `shadify-app` monolith:

- **`shadify-app/docs/`**: Engineering guidelines, launch checklist, observability guide, and concierge runbooks.
- **`shadify-app/prisma/`**: PostgreSQL 16 schema, Prisma ORM, seed scripts, and eight versioned declarative migrations:
  1. `0_init`: Core tables, enums, FKs, base indexes.
  2. `1_db_protections`: Reserved slug trigger, slug check constraints, partial unique indexes, `reserved_slugs` write revocation.
  3. `2_theme_config`: Validated theme palette & typography JSON schema.
  4. `3_promos_and_referrals`: Partner commission ledger and promo codes in paise.
  5. `4_reserved_slugs_expand`: Expanded reserved slug triggers.
  6. `5_schema_constraints_alignment`: Unique constraints alignment.
  7. `6_chip_counts`: Anonymous daily aggregate chip tap analytics.
  8. `7_aliases_and_qr_assets`: Custom vanity aliases, high-res QR print assets, and entitlement override audit logs.
- **`shadify-app/src/app/`**: Next.js 14 App Router guest experiences (`/[slug]`), concierge admin studio (`/admin`), and API route handlers including Phase 4 transactional provisioning (`/api/admin/weddings/provision`), PIN lifecycle (`/api/admin/weddings/[id]/pin`), central entitlements (`/api/admin/weddings/[id]/entitlements`), vanity aliases (`/api/admin/weddings/[id]/aliases`), CSV attendee export (`/api/admin/weddings/[id]/export-rsvps`), DPDP privacy requests (`/api/privacy/data-request`), and chip telemetry (`/api/analytics/chip`).
- **`shadify-app/tests/staging/concurrency-gate.ts`**: 6-gate staging release gate validating database isolation, `pg_advisory_xact_lock` provisioning race, and `SELECT ... FOR UPDATE` media quota race.
- **`shadify-app/src/lib/themes/`**: Dual design token system (`--brand-*` vs `--theme-*`), 5 curated Indian wedding presets, and contrast validation matrix.
