# 🏛️ Shadify — System Architecture, Monorepo & Caching Strategy

> **Core Technical Rule**: We NEVER spin up a separate Next.js app per couple.  
> **ONE** single Next.js web application deployed on Vercel serves all weddings dynamically via multi-tenancy.

---

## 1. High-Level Architecture Topology (MVP-0)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENTS & GUEST ACCESS                          │
│   Guest Web App (`/w/[slug]`)    |    Concierge Admin (`/admin`)       │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE CDN                             │
│   • DNS (*.shadify.in)  |  SSL Wildcard  |  Edge HTML & Asset Caching  │
│   • Cloudflare R2 Bucket (Media Storage - ZERO Egress Fees!)           │
│     - Web-optimized previews (5-year retention)                        │
│     - RAW masters (90-day retention via lifecycle rule)                │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS 14 MONOLITH (APP ROUTER)                     │
│                                                                        │
│   apps/web/src/app                                                     │
│   ├── /w/[slug]               (Dynamic multi-tenant wedding guest view)│
│   ├── /admin                  (Concierge admin: onboard & manage)      │
│   └── /api                                                             │
│       ├── /rsvp               (Per-event RSVP submissions)             │
│       ├── /shagun             (UPI intent QR code generation)          │
│       └── /media/presign      (Direct R2 S3-compatible PUT presign)   │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   MANAGED POSTGRESQL 16 (Neon / Supabase)              │
│   • Relational schema with UUID PKs & wedding_id tenant isolation      │
│   • Built-in serverless connection pooling                             │
│   • Prepared for Phase 2 pgvector (face search)                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
shadify/
├── apps/
│   └── web/                    ← Single Next.js 14 Monolith (App Router)
│       ├── src/
│       │   ├── app/
│       │   │   ├── w/[slug]/   ← Guest-facing wedding site (Envelope reveal, itinerary, gallery)
│       │   │   ├── admin/      ← Concierge Admin portal (wedding creation, R2 uploads)
│       │   │   └── api/        ← Route handlers (RSVP, Shagun, R2 presigning)
│       │   ├── components/     ← Envelope, timeline, lightbox, WhatsApp invite studio
│       │   └── lib/            ← Database client, R2 S3 client, auth utils
│       └── docs/               ← Web app implementation details
│
├── packages/
│   ├── database/               ← PostgreSQL 16 schema, Drizzle/Prisma models, migrations
│   │   └── docs/
│   └── ui/                     ← Reusable design tokens, Royal theme tokens, icons
│       └── docs/
│
├── docs/                       ← Root architectural & product blueprints
└── package.json
```

---

## 3. The Caching & Performance Engine

During peak ceremonial moments (Varmala / Sangeet), 500+ guests open the site simultaneously on venue 4G/5G connections:

1. **Browser Cache**: Hashed CSS/JS bundles, fonts, and monograms cached with `max-age=31536000, immutable`.
2. **Cloudflare Edge CDN**: HTML pages and WebP images cached at Indian edge nodes (Mumbai, Delhi, Bangalore, Chennai) via `stale-while-revalidate`.
3. **Next.js 14 Tag-Based Revalidation**: Dynamic wedding pages cached via `fetch(..., { next: { tags: ['wedding-[slug]'] } })`. When the concierge admin edits details or uploads photos, `revalidateTag('wedding-[slug]')` purges cache instantly.
4. **Managed Postgres Pooling**: Serverless pooler handles concurrent guest RSVP bursts without socket exhaustion.
5. **R2 Direct Presigned Uploads**: High-resolution photos upload directly from client browser to Cloudflare R2 via presigned URLs — bypassing Next.js server memory and bandwidth entirely.
6. **Sharp 3-Tier Image Renditions**: Raw 25MB photos converted into `thumb_400.webp` (~25 KB) and `preview_1600.webp` (~180 KB), with master originals expiring at 90 days.

