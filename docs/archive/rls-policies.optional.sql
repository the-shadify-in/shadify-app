-- =====================================================================
-- Optional / Phase 2+: Row Level Security (RLS) Policies
-- NOTE: Do NOT run this as an automatic migration until you configure
-- a dedicated non-superuser / non-owner application role.
-- App sets: SET LOCAL app.current_wedding_id = '<uuid>'; per request.
-- =====================================================================

-- 1. Enable RLS on Tenant-Scoped Tables
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_rsvps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shagun_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crew_passes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "story_moments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guestbook_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invite_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erasure_requests" ENABLE ROW LEVEL SECURITY;

-- 2. Tenant Scoping Policies
CREATE POLICY tenant_events ON "events"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_guests ON "guests"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_rsvps ON "event_rsvps"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_shagun ON "shagun_entries"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_photos ON "photos"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_crew_passes ON "crew_passes"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_story ON "story_moments"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_vips ON "vips"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_guestbook ON "guestbook_entries"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_templates ON "invite_templates"
  USING ("wedding_id" IS NULL OR "wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_consents ON "consents"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);

CREATE POLICY tenant_erasure ON "erasure_requests"
  USING ("wedding_id" = NULLIF(current_setting('app.current_wedding_id', true), '')::uuid);
