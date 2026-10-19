-- Migration: 5_schema_constraints_alignment
-- 1. Immutable trigger on reserved_slugs to reject INSERT, UPDATE, DELETE, TRUNCATE even for table owner/superuser
CREATE OR REPLACE FUNCTION protect_reserved_slugs() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'table reserved_slugs is immutable and read-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reserved_slugs_immutable ON "reserved_slugs";
CREATE TRIGGER trg_reserved_slugs_immutable
BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "reserved_slugs"
FOR EACH STATEMENT EXECUTE FUNCTION protect_reserved_slugs();

-- 2. Normalize RSVP unique index on (event_id, respondent_phone, lower(btrim(respondent_name)))
DROP INDEX IF EXISTS "uq_rsvp_event_phone_name";
CREATE UNIQUE INDEX "uq_rsvp_event_phone_name" 
ON "event_rsvps" ("event_id", "respondent_phone", lower(btrim("respondent_name")))
WHERE "respondent_phone" IS NOT NULL;

-- 3. Add order amounts check constraint: gst_paise must not exceed amount_paise
ALTER TABLE "orders" ADD CONSTRAINT "chk_order_amounts"
CHECK ("gst_paise" <= "amount_paise");
