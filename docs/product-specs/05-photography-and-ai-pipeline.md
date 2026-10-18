# 📸🤖 Shadify — Photography Ingestion, AI Facial Search & Proofing Pipeline

> **The Reality of Indian Weddings**: Photographers shoot thousands of photos across multiple events. Shadify provides streamlined venue ingest, client proofing (keep 70, reject 30), and self-hosted AI face recognition.

---

## 1. Multi-Photographer Venue Ingestion (Cloudflare R2)

1. **Zero-Friction Crew Passes**: Photographers authenticate on their phone or laptop with a **1-tap QR scan pass** or 4-digit crew PIN without complex email signups.
2. **Auto-Zone Tagging**: Photos uploaded inherit event tags (`Baraat - Groom`, `Mandap - Pheras`, `Stage Portraits`).
3. **Ingest Methods**:
   - *Direct Wireless Camera FTP*: From Sony/Canon/Nikon to mobile 5G hotspot for instant live shots.
   - *High-Speed Laptop Ingest*: Fast dual SD card reader batch dumps at the tech booth.
4. **Sharp Image Processing**: Automatically generates WebP thumbnails (`400px`), previews (`1600px`), and indexes original master HD files in Cloudflare R2 (**Zero egress fees**).

---

## 2. Photo Curation & Audience-Targeted Visibility

### The "Keep 70, Reject 30" Problem
Photographers inevitably dump test shots, blinks, and burst duplicates:
- **Couple Curation Portal**: Fast Tinder-style mobile swipe (Swipe Right = Keep, Swipe Left = Reject) or desktop grid multi-select.
- **The 30 Rejected Photos**: Marked as `status: 'rejected'`. **Completely excluded** from guest feeds and AI face indexing. Soft-archived for 60 days or permanently purged.

### The 3 Audience Visibility Tiers
- **Public**: Seen by all guests on the open wedding site (stage portraits, general ceremonies).
- **Family Only**: Intimate rituals, bridal dressing, Vidaai (unlocked via family 4-digit PIN or personalized guest link).
- **Private Vault**: Bride & Groom internal archive only.

> [!IMPORTANT]
> **Application-Level Privacy Enforcement**: SQL records R2 object keys rather than public URLs. For `family` and `private` tiers, the application route handler verifies the visitor's PIN or guest session token before issuing a time-limited signed URL. Public previews are served via Cloudflare CDN caching.

---

## 3. Cloudflare R2 Storage Lifecycle & Purge Rules

To protect margins and avoid runaway infinite storage costs:
1. **Web Previews (`key_preview`, `key_thumb`)**: Kept for the 5-year hosting term (~200 KB WebP per photo).
2. **Master RAW Originals (`key_original`)**: Retained for **90 days** (`originals_expire_at`), giving the couple ample time to download full-res ZIPs. A scheduled background worker or Cloudflare R2 bucket lifecycle rule purges expired original objects and sets `key_original = NULL` in Postgres.
3. **Rejected Photos**: Soft-archived for 30 days (`rejected_purge_at`) and then purged permanently from R2.

---

## 4. Phase 2 AI Facial Recognition Roadmap

AI facial recognition is deferred to Phase 2 after the core wedding guestbook and RSVP workflow is generating revenue:
- **Commercial Licensing Requirement**: Default academic InsightFace / ArcFace models carry non-commercial research licenses. Phase 2 will implement a commercially compliant embedding model or managed vision API.
- **pgvector Search**: In Phase 2, `CREATE EXTENSION IF NOT EXISTS vector;` will store 512-D face embeddings to enable selfie-to-photo matching in under 2 seconds.

