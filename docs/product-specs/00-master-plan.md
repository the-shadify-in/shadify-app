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

## 3. Sub-Repository Documentation Strategy

As we scaffold the codebase, each app/package maintains its own specialized `docs/`:

- **`apps/web/docs/`**: Next.js 14 App Router layout, guest routes (`/[slug]`), concierge admin (`/admin`), and API route handlers.
- **`packages/database/docs/`**: PostgreSQL 16 schema, Drizzle/Prisma migrations, and seed scripts.
- **`packages/ui/docs/`**: Shared design tokens, Indian wedding themes, and CSS envelope animations.
