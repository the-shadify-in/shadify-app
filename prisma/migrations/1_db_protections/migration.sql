-- =====================================================================
-- Migration: 1_db_protections
-- Database protections, triggers, partial indexes, and check constraints
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Reserved Slugs Seed & Table Immutability
-- ---------------------------------------------------------------------
INSERT INTO "reserved_slugs" ("slug") VALUES
  ('admin'),('api'),('app'),('www'),('billing'),('login'),('signup'),('static'),
  ('media'),('cdn'),('mail'),('support'),('help'),('w'),('p'),('dashboard'),('preview')
ON CONFLICT ("slug") DO NOTHING;

-- Revoke write privileges so the application database role cannot tamper with reserved slugs
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON "reserved_slugs" FROM PUBLIC;

-- ---------------------------------------------------------------------
-- 2. Reserved Slug Trigger Function & Trigger on Weddings
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION block_reserved_slug() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "reserved_slugs" WHERE "slug" = NEW."slug") THEN
    RAISE EXCEPTION 'slug % is reserved', NEW."slug";
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_reserved_slug ON "weddings";
CREATE TRIGGER trg_block_reserved_slug
BEFORE INSERT OR UPDATE OF "slug" ON "weddings"
FOR EACH ROW EXECUTE FUNCTION block_reserved_slug();

-- ---------------------------------------------------------------------
-- 3. Check Constraints
-- ---------------------------------------------------------------------
ALTER TABLE "users" ADD CONSTRAINT "chk_user_contact" 
  CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL);

ALTER TABLE "weddings" ADD CONSTRAINT "chk_wedding_slug" 
  CHECK ("slug" ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$');

ALTER TABLE "guests" ADD CONSTRAINT "chk_guest_party_size" 
  CHECK ("max_party_size" BETWEEN 1 AND 20);

ALTER TABLE "event_rsvps" ADD CONSTRAINT "chk_rsvp_party_size" 
  CHECK ("party_size" BETWEEN 0 AND 20);

ALTER TABLE "shagun_entries" ADD CONSTRAINT "chk_shagun_amount" 
  CHECK ("amount_paise" > 0);

ALTER TABLE "guestbook_entries" ADD CONSTRAINT "chk_guestbook_len" 
  CHECK (char_length("message") <= 1000);

-- ---------------------------------------------------------------------
-- 4. Partial Unique Indexes
-- ---------------------------------------------------------------------
-- A: Single RSVP submission per personalized guest link
DROP INDEX IF EXISTS "uq_rsvp_event_guest";
CREATE UNIQUE INDEX "uq_rsvp_event_guest" ON "event_rsvps" ("event_id", "guest_id") 
  WHERE "guest_id" IS NOT NULL;

-- B: Soft dedupe for open-link RSVPs (permits multiple family members on one shared phone)
DROP INDEX IF EXISTS "uq_rsvp_event_phone_name";
CREATE UNIQUE INDEX "uq_rsvp_event_phone_name" ON "event_rsvps" ("event_id", "respondent_phone", "respondent_name") 
  WHERE "guest_id" IS NULL AND "respondent_phone" IS NOT NULL;
