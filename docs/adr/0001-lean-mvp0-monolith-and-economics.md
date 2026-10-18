# ADR 0001: Lean Next.js Monolith, Direct UPI Shagun & 90-Day R2 Retention

- **Status**: Accepted
- **Date**: 2026-10-18
- **Deciders**: Technical Lead & Product Owner
- **Context**:
  The initial architecture proposed 9 separate microservices, Redis caching, PgBouncer, a separate Vite React admin dashboard, Meta WhatsApp Cloud API integration, Three.js 3D wax seals, and indefinite RAW photo storage. For a solo developer launching the first 20–50 weddings, this represented massive premature optimization, high operational burn, and risk of delayed launch.

---

## Decisions

1. **Architecture: Single Next.js 14 Monolith**:
   - Single codebase housing guest website routes (`/[slug]`), concierge admin (`/admin`), and API route handlers (`/api/rsvp`, `/api/shagun`, `/api/media/presign`).
   - Managed PostgreSQL 16 (Neon / Supabase) with built-in connection pooling.
   - Cloudflare Edge CDN with tag-based on-demand revalidation (`revalidateTag`).

2. **Storage: Cloudflare R2 90-Day Retention Policy**:
   - Web-optimized WebP previews (~200 KB) are retained for the 5-year hosting term (~₹10/yr per wedding).
   - High-resolution master RAW originals (25 MB) expire at 90 days (`originals_expire_at`). Scheduled cleanup nulls `key_original` and deletes R2 objects unless the couple purchases an extended storage add-on.

3. **WhatsApp Sharing: Client-Side Deep Links**:
   - Zero contact harvesting. Replaced Meta WhatsApp Cloud API with client-side `wa.me/?text=...` invite templates.
   - Eliminates Meta verification hurdles, per-conversation charges, and database phonebook overhead.

4. **Digital Shagun: Direct UPI Deep Links**:
   - Uses native `upi://pay?pa=...` links directly into the couple's bank account (₹0 commission).
   - No payment aggregator webhooks; entries are self-declared by guests and confirmed manually by the couple.

5. **Financial Target**:
   - Unit economics modeled with 18% GST, 2.36% payment gateway fees, and ₹300/hr concierge setup labor.
   - Fixed monthly burn capped at ₹18,300 (including ₹10,000 marketing/ads).
   - Blended break-even achieved at 4 weddings/month (or 2 weddings/month with zero ad spend).

---

## Consequences

- **Positive**: Launch velocity accelerated to 3–4 weeks for a solo developer; operational infrastructure costs kept under ₹8,000/mo without ads; zero multi-service deployment friction.
- **Negative**: Couple self-serve dashboard and AI facial recognition deferred to Phase 2; staff concierge handles initial wedding on-boarding manually.
