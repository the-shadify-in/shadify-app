# 🌸 Shadify Documentation & Architecture Hub

> **Repository**: `github.com/the-shadify-in/shadify-app`  
> **Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, PostgreSQL 16 (Prisma ORM), Cloudflare R2  
> **Deployment Target**: Vercel (Edge CDN + Serverless Node.js Runtime)

---

## 1. Documentation Index

The `docs/` directory contains the authoritative specifications for the platform:

| Document                                                                                       | Title                               | Scope & Purpose                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`00-master-plan.md`](./product-specs/00-master-plan.md)                                       | **Master Plan & Architecture**      | High-level system principles, monorepo-to-monolith evolution, and coding standards.                                 |
| [`01-product-vision-and-mvp.md`](./product-specs/01-product-vision-and-mvp.md)                 | **Product Vision & Unit Economics** | Lean MVP-0 scope, pricing tiers (Lite/Premium/Platinum), GST & gateway margins, break-even matrix.                  |
| [`02-system-architecture.md`](./product-specs/02-system-architecture.md)                       | **System Architecture & Caching**   | Monolith topology, Cloudflare edge CDN, ISR caching, R2 presigned upload mechanics.                                 |
| [`03-data-models-and-security.md`](./product-specs/03-data-models-and-security.md)             | **Data Models & Security**          | PostgreSQL 16 schema, paise accounting, DPDP compliance audit tables, slug reservation triggers.                    |
| [`04-guest-experience-and-lifecycle.md`](./product-specs/04-guest-experience-and-lifecycle.md) | **Guest Experience & Lifecycle**    | CSS/Lottie envelope reveal, video bite invites, per-event itinerary, UPI Shagun deep link, VIP cards.               |
| [`05-photography-and-ai-pipeline.md`](./product-specs/05-photography-and-ai-pipeline.md)       | **Photography & Storage**           | 90-day RAW lifecycle rule, WebP renditions, audience privacy tiers (public/family/private), Phase 2 AI face search. |
| [`06-hospitality-and-roadmap.md`](./product-specs/06-hospitality-and-roadmap.md)               | **Hospitality & Expansion**         | Destination room and cab allocations, emergency contact cards, future mobile app roadmap.                           |
| [`adr/`](./adr/)                                                                               | **Architecture Decision Records**   | Accepted architectural decisions (monolith economics, dual token namespaces).                                       |
| [`archive/`](./archive/)                                                                       | **Archived SQL Reference**          | Raw SQL drafts (`shadify-schema-mvp0.sql`, `rls-policies.optional.sql`).                                            |

---

## 2. Project Directory Structure

```
shadify/
├── prisma/
│   ├── schema.prisma              ← Official datamodel (models, enums, relations)
│   └── migrations/
│       ├── 0_init/                ← Base tables, enums, standard indexes, FKs
│       └── 1_db_protections/      ← Reserved slug triggers, check constraints, partial indexes
│
├── docs/                          ← Authoritative architecture and product documentation
│
├── src/
│   ├── app/
│   │   ├── w/[slug]/              ← Guest wedding website (envelope reveal, schedule, RSVP, Shagun)
│   │   ├── admin/                 ← Concierge staff admin (wedding creation, R2 photo upload, RSVP export)
│   │   └── api/
│   │       ├── rsvp/              ← Rate-limited per-event RSVP submission handler
│   │       ├── shagun/            ← Self-declared UPI cash blessing recorder
│   │       └── media/presign/     ← S3-compatible Cloudflare R2 presigned PUT generator
│   │
│   ├── components/                ← Modular UI components (Envelope, Timeline, Lightbox, WhatsAppStudio)
│   ├── lib/                       ← Core singletons: db.ts (Prisma), r2.ts (S3), ratelimit.ts, auth.ts
│   └── middleware.ts              ← Top-level slug routing, reserved slug guard, admin session check
│
├── .env.example                   ← Environment variables template
├── package.json
└── tailwind.config.ts
```

---

## 3. Database Workflow

1. **Local Schema Validation**:
   ```bash
   npx prisma validate
   ```
2. **Generating Prisma Client**:
   ```bash
   npx prisma generate
   ```
3. **Deploying Migrations (Production/Staging)**:
   ```bash
   npx prisma migrate deploy
   ```

> [!IMPORTANT]
> Never use `prisma db push` in production. Always use `prisma migrate deploy` to ensure that custom triggers (`block_reserved_slug`), partial indexes, and check constraints in `1_db_protections/migration.sql` are applied properly.

---

## 4. Key Engineering Realities

- **No Meta WhatsApp Cloud API**: Wedding invitations are shared via client-side `wa.me/?text=...` deep links. Zero DB storage of family phonebooks, zero per-conversation Meta fees.
- **Direct UPI Shagun**: Uses raw `upi://pay` deep links directly to the couple's VPA. Payments are self-declared by guests and confirmed manually by the couple; no aggregator commissions or webhooks.
- **R2 Storage Retention**: Master RAW images are tagged to expire after 90 days (`originals_expire_at`). Web-optimized WebP previews (~200 KB) are retained for the 5-year hosting term.
- **Tenant Isolation**: Application database queries must always be explicitly scoped by `wedding_id` in `src/lib/db.ts` or route handlers.
