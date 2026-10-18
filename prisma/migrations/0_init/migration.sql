-- =====================================================================
-- Migration: 0_init
-- Base tables, enums, standard indexes, and foreign keys
-- Generated to match schema.prisma datamodel
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Create Enums
-- ---------------------------------------------------------------------
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'staff', 'couple', 'photographer');
CREATE TYPE "WeddingPlan" AS ENUM ('lite', 'premium', 'platinum');
CREATE TYPE "WeddingStatus" AS ENUM ('draft', 'preview', 'published', 'archived', 'expired');
CREATE TYPE "PhaseOverride" AS ENUM ('pre_wedding', 'live', 'post_wedding');
CREATE TYPE "MemberRole" AS ENUM ('owner', 'editor', 'viewer', 'photographer');
CREATE TYPE "EventVisibility" AS ENUM ('public', 'invited');
CREATE TYPE "GuestSide" AS ENUM ('bride', 'groom', 'both');
CREATE TYPE "MealPreference" AS ENUM ('pure_veg', 'jain', 'non_veg', 'no_preference');
CREATE TYPE "ShagunStatus" AS ENUM ('declared', 'confirmed', 'disputed');
CREATE TYPE "PhotoStatus" AS ENUM ('processing', 'pending_review', 'approved', 'rejected');
CREATE TYPE "PhotoVisibility" AS ENUM ('public', 'family', 'private');
CREATE TYPE "GuestbookStatus" AS ENUM ('pending', 'approved', 'hidden');
CREATE TYPE "TemplateAudience" AS ENUM ('elders', 'friends', 'family', 'custom');
CREATE TYPE "VipGroup" AS ENUM ('pillars', 'brides_tribe', 'grooms_squad', 'performers', 'priest');
CREATE TYPE "OrderStatus" AS ENUM ('created', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE "ConsentPurpose" AS ENUM ('rsvp_contact', 'photo_display', 'face_search');

-- ---------------------------------------------------------------------
-- Create Tables
-- ---------------------------------------------------------------------

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'couple',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reserved_slugs" (
    "slug" TEXT NOT NULL,

    CONSTRAINT "reserved_slugs_pkey" PRIMARY KEY ("slug")
);

CREATE TABLE "weddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "custom_domain" TEXT,
    "plan" "WeddingPlan" NOT NULL DEFAULT 'lite',
    "status" "WeddingStatus" NOT NULL DEFAULT 'draft',
    "default_locale" TEXT NOT NULL DEFAULT 'en',
    "bride_name" TEXT NOT NULL,
    "groom_name" TEXT NOT NULL,
    "wedding_date" DATE NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "phase_override" "PhaseOverride",
    "theme_id" TEXT NOT NULL DEFAULT 'royal-crimson',
    "primary_color" TEXT DEFAULT '#8B0000',
    "accent_color" TEXT DEFAULT '#C9933A',
    "monogram_text" TEXT,
    "hero_photo_id" UUID,
    "video_bite_key" TEXT,
    "live_stream_url" TEXT,
    "private_pin_hash" TEXT,
    "upi_vpa" TEXT,
    "show_branding" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "content_expires_at" TIMESTAMPTZ(6),
    "originals_expire_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wedding_members" (
    "wedding_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "member_role" "MemberRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wedding_members_pkey" PRIMARY KEY ("wedding_id","user_id")
);

CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "venue_name" TEXT NOT NULL,
    "venue_address" TEXT,
    "venue_map_url" TEXT,
    "dress_code" TEXT,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'invited',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "phone" TEXT,
    "side" "GuestSide",
    "access_token" TEXT,
    "max_party_size" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_invites" (
    "event_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,

    CONSTRAINT "event_invites_pkey" PRIMARY KEY ("event_id","guest_id")
);

CREATE TABLE "event_rsvps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "guest_id" UUID,
    "respondent_name" TEXT NOT NULL,
    "respondent_phone" TEXT,
    "attending" BOOLEAN NOT NULL,
    "party_size" INTEGER NOT NULL DEFAULT 1,
    "meal_preference" "MealPreference",
    "needs_stay" BOOLEAN NOT NULL DEFAULT false,
    "arrival_notes" TEXT,
    "blessing_message" TEXT,
    "consent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shagun_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "sender_name" TEXT NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "upi_ref_id" TEXT,
    "blessing_note" TEXT,
    "status" "ShagunStatus" NOT NULL DEFAULT 'declared',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMPTZ(6),

    CONSTRAINT "shagun_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "event_id" UUID,
    "uploaded_by" UUID,
    "key_original" TEXT,
    "key_preview" TEXT NOT NULL,
    "key_thumb" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes_original" BIGINT,
    "sha256" CHAR(64) NOT NULL,
    "status" "PhotoStatus" NOT NULL DEFAULT 'pending_review',
    "visibility" "PhotoVisibility" NOT NULL DEFAULT 'public',
    "is_highlight" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "taken_at" TIMESTAMPTZ(6),
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejected_purge_at" TIMESTAMPTZ(6),

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crew_passes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "pin_hash" TEXT,
    "allowed_event_ids" UUID[],
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crew_passes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "story_moments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "moment_date" DATE,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "photo_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "story_moments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "group_label" "VipGroup" NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "photo_id" UUID,
    "link_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guestbook_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "author_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "GuestbookStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guestbook_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invite_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID,
    "audience" "TemplateAudience" NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "body" TEXT NOT NULL,

    CONSTRAINT "invite_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID,
    "wedding_slug_copy" TEXT NOT NULL,
    "billing_name" TEXT NOT NULL,
    "billing_email" TEXT,
    "billing_phone" TEXT NOT NULL,
    "billing_address" TEXT,
    "billing_gstin" TEXT,
    "item" TEXT NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "gst_paise" BIGINT NOT NULL DEFAULT 0,
    "gateway" TEXT NOT NULL DEFAULT 'razorpay',
    "gateway_order_id" TEXT,
    "gateway_payment_id" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'created',
    "invoice_no" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "entitlements" (
    "wedding_id" UUID NOT NULL,
    "max_guests" INTEGER,
    "max_photos" INTEGER,
    "max_originals_gb" DECIMAL(6,1),
    "video_bite" BOOLEAN NOT NULL DEFAULT false,
    "custom_domain" BOOLEAN NOT NULL DEFAULT false,
    "face_search" BOOLEAN NOT NULL DEFAULT false,
    "hosting_until" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("wedding_id")
);

CREATE TABLE "consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "notice_version" TEXT NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "erasure_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "erasure_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "wedding_id" UUID,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------
-- Unique Constraints & Indexes
-- ---------------------------------------------------------------------

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "weddings_slug_key" ON "weddings"("slug");
CREATE UNIQUE INDEX "weddings_custom_domain_key" ON "weddings"("custom_domain");
CREATE INDEX "idx_weddings_date" ON "weddings"("wedding_date");
CREATE INDEX "idx_members_user" ON "wedding_members"("user_id");
CREATE INDEX "idx_events_wedding" ON "events"("wedding_id", "starts_at");
CREATE UNIQUE INDEX "guests_access_token_key" ON "guests"("access_token");
CREATE INDEX "idx_guests_wedding" ON "guests"("wedding_id");
CREATE INDEX "idx_rsvp_wedding_event" ON "event_rsvps"("wedding_id", "event_id");
CREATE INDEX "idx_shagun_wedding" ON "shagun_entries"("wedding_id", "created_at" DESC);
CREATE UNIQUE INDEX "photos_wedding_id_sha256_key" ON "photos"("wedding_id", "sha256");
CREATE INDEX "idx_photos_feed" ON "photos"("wedding_id", "status", "visibility", "uploaded_at" DESC);
CREATE UNIQUE INDEX "crew_passes_token_hash_key" ON "crew_passes"("token_hash");
CREATE UNIQUE INDEX "orders_gateway_order_id_key" ON "orders"("gateway_order_id");
CREATE UNIQUE INDEX "orders_gateway_payment_id_key" ON "orders"("gateway_payment_id");
CREATE UNIQUE INDEX "orders_invoice_no_key" ON "orders"("invoice_no");
CREATE INDEX "idx_audit_wedding" ON "audit_log"("wedding_id", "created_at" DESC);

-- ---------------------------------------------------------------------
-- Foreign Key Constraints
-- ---------------------------------------------------------------------

ALTER TABLE "weddings" ADD CONSTRAINT "weddings_hero_photo_id_fkey" FOREIGN KEY ("hero_photo_id") REFERENCES "photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wedding_members" ADD CONSTRAINT "wedding_members_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wedding_members" ADD CONSTRAINT "wedding_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guests" ADD CONSTRAINT "guests_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shagun_entries" ADD CONSTRAINT "shagun_entries_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crew_passes" ADD CONSTRAINT "crew_passes_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "story_moments" ADD CONSTRAINT "story_moments_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "story_moments" ADD CONSTRAINT "story_moments_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vips" ADD CONSTRAINT "vips_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vips" ADD CONSTRAINT "vips_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invite_templates" ADD CONSTRAINT "invite_templates_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consents" ADD CONSTRAINT "consents_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "erasure_requests" ADD CONSTRAINT "erasure_requests_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
