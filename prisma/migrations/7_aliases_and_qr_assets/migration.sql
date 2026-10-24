-- 7_aliases_and_qr_assets
-- Addresses never die: aliases are kept (RESTRICT), immutable except retire/erasure.

CREATE TYPE "AliasKind" AS ENUM ('slug_history', 'vanity', 'partner_run');
CREATE TYPE "QrStatus"  AS ENUM ('draft', 'proofed', 'approved_for_print', 'printed', 'superseded');

CREATE TABLE "wedding_aliases" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "alias"         TEXT NOT NULL UNIQUE
                  CHECK ("alias" ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'),
  "wedding_id"    UUID NOT NULL REFERENCES "weddings"("id") ON DELETE RESTRICT,
  "kind"          "AliasKind" NOT NULL,
  "partner_label" TEXT,
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "retired_at"    TIMESTAMPTZ(6)
);
CREATE INDEX "idx_aliases_wedding" ON "wedding_aliases" ("wedding_id");

-- An alias may not be reserved or equal an existing wedding slug
CREATE OR REPLACE FUNCTION guard_alias() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "reserved_slugs" WHERE "slug" = lower(NEW."alias")) THEN
    RAISE EXCEPTION 'alias % is reserved', NEW."alias" USING ERRCODE = '23514'; END IF;
  IF EXISTS (SELECT 1 FROM "weddings" WHERE "slug" = NEW."alias") THEN
    RAISE EXCEPTION 'alias % equals an existing wedding slug', NEW."alias" USING ERRCODE = '23505'; END IF;
  -- text is immutable unless the erasure transaction opts in with SET LOCAL
  IF TG_OP = 'UPDATE' AND NEW."alias" <> OLD."alias"
     AND coalesce(current_setting('app.allow_alias_erase', true), '') <> 'on' THEN
    RAISE EXCEPTION 'alias text is immutable' USING ERRCODE = '42501'; END IF;
  IF TG_OP = 'UPDATE' AND NEW."wedding_id" <> OLD."wedding_id" THEN
    RAISE EXCEPTION 'alias cannot move between weddings' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guard_alias
BEFORE INSERT OR UPDATE ON "wedding_aliases"
FOR EACH ROW EXECUTE FUNCTION guard_alias();

CREATE OR REPLACE FUNCTION reject_alias_delete() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'aliases are never deleted; retire them' USING ERRCODE = '42501'; END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_no_alias_delete BEFORE DELETE ON "wedding_aliases"
FOR EACH ROW EXECUTE FUNCTION reject_alias_delete();

-- A wedding slug may not equal an existing alias (extends the reserved-slug guard)
CREATE OR REPLACE FUNCTION block_reserved_slug() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "reserved_slugs" WHERE "slug" = lower(NEW."slug")) THEN
    RAISE EXCEPTION 'slug % is reserved', NEW."slug" USING ERRCODE = '23514'; END IF;
  IF EXISTS (SELECT 1 FROM "wedding_aliases" WHERE "alias" = NEW."slug"
             AND "wedding_id" <> NEW."id") THEN
    RAISE EXCEPTION 'slug % is already an alias of another wedding', NEW."slug" USING ERRCODE = '23505'; END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- QR assets: the saved print file is the source of truth
CREATE TABLE "qr_assets" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "wedding_id"       UUID NOT NULL REFERENCES "weddings"("id") ON DELETE CASCADE,
  "alias_id"         UUID REFERENCES "wedding_aliases"("id") ON DELETE RESTRICT,
  "encoded_url"      TEXT NOT NULL CHECK ("encoded_url" ~ '^https://[a-z0-9.-]+/[a-z0-9-]+$'),
  "format"           TEXT NOT NULL CHECK ("format" IN ('svg', 'png', 'pdf')),
  "size_mm"          INTEGER NOT NULL CHECK ("size_mm" BETWEEN 15 AND 200),
  "error_correction" CHAR(1) NOT NULL DEFAULT 'M' CHECK ("error_correction" IN ('L', 'M', 'Q', 'H')),
  "generator"        TEXT NOT NULL,                 -- library and version
  "file_hash"        CHAR(64) NOT NULL CHECK ("file_hash" ~ '^[0-9a-f]{64}$'),
  "storage_key"      TEXT NOT NULL,
  "status"           "QrStatus" NOT NULL DEFAULT 'draft',
  "approved_by"      UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "approved_at"      TIMESTAMPTZ(6),
  "printer_label"    TEXT,
  "quantity"         INTEGER CHECK ("quantity" IS NULL OR "quantity" > 0),
  "printed_at"       TIMESTAMPTZ(6),
  "superseded_by"    UUID REFERENCES "qr_assets"("id") ON DELETE SET NULL,
  "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  UNIQUE ("wedding_id", "file_hash"),
  CONSTRAINT chk_qr_approved CHECK
    ("status" NOT IN ('approved_for_print', 'printed') OR ("approved_by" IS NOT NULL AND "approved_at" IS NOT NULL))
);
CREATE INDEX "idx_qr_wedding" ON "qr_assets" ("wedding_id");

CREATE TABLE "qr_scan_tests" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "asset_id"  UUID NOT NULL REFERENCES "qr_assets"("id") ON DELETE CASCADE,
  "device"    TEXT NOT NULL,
  "scanner"   TEXT NOT NULL,       -- camera, WhatsApp, Google Lens ...
  "lighting"  TEXT NOT NULL CHECK ("lighting" IN ('daylight', 'indoor', 'dim')),
  "passed"    BOOLEAN NOT NULL,
  "tested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "tester_id" UUID REFERENCES "users"("id") ON DELETE SET NULL
);

-- Once approved, the print-defining fields are frozen and status only moves forward
CREATE OR REPLACE FUNCTION guard_qr_asset() RETURNS trigger AS $$
DECLARE rank_old INT; rank_new INT;
BEGIN
  IF OLD."status" IN ('approved_for_print', 'printed') THEN
    IF NEW."encoded_url" <> OLD."encoded_url" OR NEW."file_hash" <> OLD."file_hash"
       OR NEW."storage_key" <> OLD."storage_key" OR NEW."format" <> OLD."format"
       OR NEW."size_mm" <> OLD."size_mm" OR NEW."error_correction" <> OLD."error_correction"
       OR NEW."wedding_id" <> OLD."wedding_id" THEN
      RAISE EXCEPTION 'approved QR asset is locked' USING ERRCODE = '42501'; END IF;
  END IF;
  rank_old := CASE OLD."status" WHEN 'draft' THEN 1 WHEN 'proofed' THEN 2
              WHEN 'approved_for_print' THEN 3 WHEN 'printed' THEN 4 ELSE 5 END;
  rank_new := CASE NEW."status" WHEN 'draft' THEN 1 WHEN 'proofed' THEN 2
              WHEN 'approved_for_print' THEN 3 WHEN 'printed' THEN 4 ELSE 5 END;
  IF NEW."status" <> 'superseded' AND rank_new < rank_old THEN
    RAISE EXCEPTION 'QR status cannot move backwards (% -> %)', OLD."status", NEW."status" USING ERRCODE = '42501'; END IF;
  IF OLD."status" = 'superseded' AND NEW."status" <> 'superseded' THEN
    RAISE EXCEPTION 'superseded asset cannot be revived' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_guard_qr_asset BEFORE UPDATE ON "qr_assets"
FOR EACH ROW EXECUTE FUNCTION guard_qr_asset();
