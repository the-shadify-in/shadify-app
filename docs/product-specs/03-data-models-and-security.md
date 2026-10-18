# 🗄️ Shadify — Production PostgreSQL Schema & Security (MVP-0)

> **Database**: PostgreSQL 16  
> **Conventions**: UUID PKs via `pgcrypto`, `citext` for case-insensitive slugs/emails, money in paise (`BIGINT amount_paise`), tenant scoping via `wedding_id`, soft-deletes via `deleted_at`.

---

```sql
-- =====================================================================
-- Shadify MVP-0 schema (PostgreSQL 16)
-- Single Next.js monolith, concierge onboarding, path-based URLs.
-- Conventions: UUID PKs, TIMESTAMPTZ, money in paise (INT/BIGINT),
-- every tenant table carries wedding_id, soft delete via deleted_at.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive slug/email
-- Phase 2 only (face search): CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------
-- 1. Users, ownership, tenancy
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          CITEXT UNIQUE,
  phone          TEXT UNIQUE,
  password_hash  TEXT,                       -- NULL allowed: OTP/magic-link/crew users
  full_name      TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('super_admin','staff','couple','photographer')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ,
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Slugs that can never be claimed by a wedding
CREATE TABLE reserved_slugs (
  slug CITEXT PRIMARY KEY
);
INSERT INTO reserved_slugs (slug) VALUES
  ('admin'),('api'),('app'),('www'),('billing'),('login'),('signup'),('static'),
  ('media'),('cdn'),('mail'),('support'),('help'),('w'),('p'),('dashboard'),('preview');

-- Enforce reserved slugs via trigger
CREATE OR REPLACE FUNCTION block_reserved_slug() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM reserved_slugs WHERE slug = NEW.slug) THEN
    RAISE EXCEPTION 'slug % is reserved', NEW.slug;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TABLE weddings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              CITEXT UNIQUE NOT NULL
                    CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'),
  custom_domain     CITEXT UNIQUE,
  plan              TEXT NOT NULL DEFAULT 'lite' CHECK (plan IN ('lite','premium','platinum')),
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','preview','published','archived','expired')),
  default_locale    TEXT NOT NULL DEFAULT 'en',        -- en, hi, te, ta, gu, ...
  bride_name        TEXT NOT NULL,
  groom_name        TEXT NOT NULL,                     -- rename to partner_1/2 if inclusive naming wanted
  wedding_date      DATE NOT NULL,
  timezone          TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  -- lifecycle phase is DERIVED from event times, not stored; override only for manual control
  phase_override    TEXT CHECK (phase_override IN ('pre_wedding','live','post_wedding')),
  theme_id          TEXT NOT NULL DEFAULT 'royal-crimson',
  primary_color     TEXT DEFAULT '#8B0000',
  accent_color      TEXT DEFAULT '#C9933A',
  monogram_text     TEXT,
  hero_photo_id     UUID,                              -- FK added after photos table
  video_bite_key    TEXT,                              -- R2 object key, not a public URL
  live_stream_url   TEXT,
  private_pin_hash  TEXT,                              -- optional family PIN (argon2/bcrypt)
  upi_vpa           TEXT,                              -- couple's UPI ID for Shagun deep link
  show_branding     BOOLEAN NOT NULL DEFAULT true,     -- "Made with Shadify" footer (false on higher tiers)
  published_at      TIMESTAMPTZ,
  content_expires_at TIMESTAMPTZ,                      -- hosting term end (renewal model)
  originals_expire_at TIMESTAMPTZ,                     -- e.g. wedding_date + 90 days
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_weddings_date ON weddings (wedding_date);

CREATE TRIGGER trg_block_reserved_slug
BEFORE INSERT OR UPDATE OF slug ON weddings
FOR EACH ROW EXECUTE FUNCTION block_reserved_slug();

-- Who may edit a wedding (couple, parents, planner, staff doing concierge setup)
CREATE TABLE wedding_members (
  wedding_id  UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL CHECK (member_role IN ('owner','editor','viewer','photographer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wedding_id, user_id)
);
CREATE INDEX idx_members_user ON wedding_members (user_id);

-- ---------------------------------------------------------------------
-- 2. Events (multi-faith, per-event audiences)
-- ---------------------------------------------------------------------
CREATE TABLE events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id     UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_type     TEXT NOT NULL,                -- free tag: haldi, mehendi, sangeet, pheras, nikah, walima,
                                               -- anand_karaj, holy_matrimony, reception, cocktail, custom
  title          TEXT NOT NULL,
  description    TEXT,
  starts_at      TIMESTAMPTZ NOT NULL,
  ends_at        TIMESTAMPTZ,
  venue_name     TEXT NOT NULL,
  venue_address  TEXT,
  venue_map_url  TEXT,
  dress_code     TEXT,
  visibility     TEXT NOT NULL DEFAULT 'invited'
                 CHECK (visibility IN ('public','invited')),   -- 'invited' = only guests on its list see it
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);
CREATE INDEX idx_events_wedding ON events (wedding_id, starts_at);

-- ---------------------------------------------------------------------
-- 3. Guests, invitations, per-event RSVP
-- ---------------------------------------------------------------------
-- A guest/household row exists only if the couple (or staff) adds one or the guest RSVPs.
-- No phonebook harvesting: phone is optional and comes from the guest themself.
CREATE TABLE guests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,                  -- "Sharma Family"
  phone         TEXT,
  side          TEXT CHECK (side IN ('bride','groom','both')),
  access_token  TEXT UNIQUE,                    -- random 22+ char token for personalized link
  max_party_size INT NOT NULL DEFAULT 1 CHECK (max_party_size BETWEEN 1 AND 20),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_guests_wedding ON guests (wedding_id);

-- Which guests are invited to which events (drives what each guest sees)
CREATE TABLE event_invites (
  event_id  UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id  UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, guest_id)
);

-- One row per (event, respondent). Open-link guests have guest_id NULL and supply name/phone.
CREATE TABLE event_rsvps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id       UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_id         UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id         UUID REFERENCES guests(id) ON DELETE SET NULL,
  respondent_name  TEXT NOT NULL,
  respondent_phone TEXT,
  attending        BOOLEAN NOT NULL,
  party_size       INT NOT NULL DEFAULT 1 CHECK (party_size BETWEEN 0 AND 20),
  meal_preference  TEXT CHECK (meal_preference IN ('pure_veg','jain','non_veg','no_preference')),
  needs_stay       BOOLEAN NOT NULL DEFAULT false,
  arrival_notes    TEXT,
  blessing_message TEXT,
  consent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),   -- notice shown for phone storage (DPDP)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Prevent duplicate submissions for the same person+event:
-- For personalized links: one per guest_id
CREATE UNIQUE INDEX uq_rsvp_event_guest ON event_rsvps (event_id, guest_id) WHERE guest_id IS NOT NULL;
-- For open-link RSVPs: dedupe on (event_id, phone, name) so Indian family members
-- sharing a single smartphone can each submit their individual RSVP
CREATE UNIQUE INDEX uq_rsvp_event_phone_name ON event_rsvps (event_id, respondent_phone, respondent_name)
  WHERE guest_id IS NULL AND respondent_phone IS NOT NULL;
CREATE INDEX idx_rsvp_wedding_event ON event_rsvps (wedding_id, event_id);

-- ---------------------------------------------------------------------
-- 4. Digital Shagun (self-reported unless reconciled)
-- ---------------------------------------------------------------------
-- A UPI deep link does NOT have automated webhooks (avoids aggregator fees).
-- Entries are guest-declared; the couple marks 'confirmed' manually in their admin
-- after checking their bank/GPay/PhonePe account.
CREATE TABLE shagun_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  sender_name   TEXT NOT NULL,
  amount_paise  BIGINT NOT NULL CHECK (amount_paise > 0),
  upi_ref_id    TEXT,
  blessing_note TEXT,
  status        TEXT NOT NULL DEFAULT 'declared' CHECK (status IN ('declared','confirmed','disputed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at  TIMESTAMPTZ
);
CREATE INDEX idx_shagun_wedding ON shagun_entries (wedding_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 5. Photos (private by default, no public URLs stored)
-- ---------------------------------------------------------------------
-- Note: SQL stores R2 object keys. Photo privacy is enforced in application code
-- via signed URLs, PIN verification, and session checks.
CREATE TABLE photos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id       UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_id         UUID REFERENCES events(id) ON DELETE SET NULL,
  uploaded_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  key_original     TEXT,                         -- nulled out after originals_expire_at purge
  key_preview      TEXT NOT NULL,                -- ~1600-2000px WebP
  key_thumb        TEXT NOT NULL,                -- ~400px WebP
  width            INT NOT NULL,
  height           INT NOT NULL,
  bytes_original   BIGINT,
  sha256           CHAR(64) NOT NULL,            -- dedupe hash
  status           TEXT NOT NULL DEFAULT 'pending_review'
                   CHECK (status IN ('processing','pending_review','approved','rejected')),
  visibility       TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','family','private')),
  is_highlight     BOOLEAN NOT NULL DEFAULT false,
  sort_order       INT NOT NULL DEFAULT 0,
  taken_at         TIMESTAMPTZ,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  rejected_purge_at TIMESTAMPTZ,                 -- soft-archive window for rejects
  UNIQUE (wedding_id, sha256)
  -- App upload handler MUST catch duplicate sha256 (Postgres 23505) and treat as idempotent skip!
);
CREATE INDEX idx_photos_feed ON photos (wedding_id, status, visibility, uploaded_at DESC);
ALTER TABLE weddings ADD CONSTRAINT fk_hero_photo
  FOREIGN KEY (hero_photo_id) REFERENCES photos(id) ON DELETE SET NULL;

-- Crew passes for photographers (QR / PIN), scoped and expiring
CREATE TABLE crew_passes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,                  -- "Rahul Studio - Candid"
  token_hash    TEXT NOT NULL UNIQUE,           -- store hash of the QR token
  pin_hash      TEXT,
  allowed_event_ids UUID[],
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 6. Content blocks (kept simple for MVP-0)
-- ---------------------------------------------------------------------
CREATE TABLE story_moments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  moment_date DATE,
  title       TEXT NOT NULL,
  body        TEXT,
  photo_id    UUID REFERENCES photos(id) ON DELETE SET NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE vips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  group_label TEXT NOT NULL,                    -- 'pillars','brides_tribe','grooms_squad','performers','priest'
  name        TEXT NOT NULL,
  tagline     TEXT,
  photo_id    UUID REFERENCES photos(id) ON DELETE SET NULL,
  link_url    TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE guestbook_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message     TEXT NOT NULL CHECK (char_length(message) <= 1000),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invite Studio templates (per-wedding overrides of system templates)
CREATE TABLE invite_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID REFERENCES weddings(id) ON DELETE CASCADE,   -- NULL = system template
  audience    TEXT NOT NULL CHECK (audience IN ('elders','friends','family','custom')),
  locale      TEXT NOT NULL DEFAULT 'en',
  body        TEXT NOT NULL                    -- supports {guest}, {couple}, {link}, {date}
);

-- ---------------------------------------------------------------------
-- 7. Billing & entitlements
-- ---------------------------------------------------------------------
-- Statutory tax and company rules mandate retaining invoice data (verify exact term with CA).
-- Storing buyer details directly on the order row preserves a complete, self-contained tax record
-- even if wedding data is erased or anonymised under DPDP. ON DELETE SET NULL prevents erasure lock.
CREATE TABLE orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id         UUID REFERENCES weddings(id) ON DELETE SET NULL,
  wedding_slug_copy  TEXT NOT NULL,            -- preserved snapshot for tax invoices
  billing_name       TEXT NOT NULL,            -- legal buyer/taxpayer name
  billing_email      TEXT,
  billing_phone      TEXT NOT NULL,
  billing_address    TEXT,
  billing_gstin      TEXT,                     -- optional GSTIN if B2B / planner purchase
  item               TEXT NOT NULL,            -- 'plan_lite','plan_premium','addon_storage','addon_domain'
  amount_paise       BIGINT NOT NULL,          -- gross incl. GST
  gst_paise          BIGINT NOT NULL DEFAULT 0,
  gateway            TEXT NOT NULL DEFAULT 'razorpay',
  gateway_order_id   TEXT UNIQUE,
  gateway_payment_id TEXT UNIQUE,
  status             TEXT NOT NULL DEFAULT 'created'
                     CHECK (status IN ('created','paid','failed','refunded','partially_refunded')),
  invoice_no         TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at            TIMESTAMPTZ
);

-- Per-wedding limits derived from plan + add-ons (checked in app code)
CREATE TABLE entitlements (
  wedding_id        UUID PRIMARY KEY REFERENCES weddings(id) ON DELETE CASCADE,
  max_guests        INT,                       -- NULL = unlimited
  max_photos        INT,
  max_originals_gb  NUMERIC(6,1),
  video_bite        BOOLEAN NOT NULL DEFAULT false,
  custom_domain     BOOLEAN NOT NULL DEFAULT false,
  face_search       BOOLEAN NOT NULL DEFAULT false,
  hosting_until     TIMESTAMPTZ NOT NULL
);

-- ---------------------------------------------------------------------
-- 8. Privacy, consent, audit (Record-Keeping Layer)
-- ---------------------------------------------------------------------
-- Note: These tables provide an audit trail for DPDP, but legal compliance
-- requires privacy notices, breach processes, and deletion crons.
CREATE TABLE consents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,                   -- phone/guest id/token fingerprint
  purpose     TEXT NOT NULL CHECK (purpose IN ('rsvp_contact','photo_display','face_search')),
  notice_version TEXT NOT NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ
);

CREATE TABLE erasure_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  wedding_id  UUID REFERENCES weddings(id) ON DELETE SET NULL,
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,                   -- 'photo.reject','site.publish','shagun.confirm'
  detail      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_wedding ON audit_log (wedding_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 9. Tenant Isolation
-- ---------------------------------------------------------------------
-- IMPORTANT: Until RLS is enabled in production, every application database
-- query MUST be strictly scoped by wedding_id in the query helper / ORM.
-- Row Level Security (RLS) template:
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_events ON events
--   USING (wedding_id = current_setting('app.current_wedding_id', true)::uuid);
```
