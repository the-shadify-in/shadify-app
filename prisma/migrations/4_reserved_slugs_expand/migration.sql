-- =====================================================================
-- Migration: 4_reserved_slugs_expand
-- Expand reserved slugs table to match application routes and system keywords
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reserved_slugs_immutable'
  ) THEN
    ALTER TABLE "reserved_slugs" DISABLE TRIGGER trg_reserved_slugs_immutable;
  END IF;
END $$;

INSERT INTO "reserved_slugs" ("slug") VALUES
  ('pricing'),('samples'),('sample'),('faq'),('legal'),('privacy'),('terms'),('refunds'),('refund'),
  ('contact'),('about'),('blog'),('careers'),('press'),('partners'),('partner'),('referral'),('referrals'),
  ('refer'),('logout'),('signin'),('register'),('account'),('settings'),('checkout'),('pay'),('payment'),
  ('payments'),('status'),('health'),('healthz'),('sitemap'),('robots'),('favicon'),('manifest'),
  ('assets'),('public'),('images'),('img'),('fonts'),('uploads'),('download'),('downloads'),
  ('staff'),('internal'),('email'),('ftp'),('shadify'),('official'),('team'),('security'),
  ('demo'),('test'),('templates'),('themes'),('new'),('edit'),('delete'),('null'),('undefined'),
  ('not-found'),('error'),('offline'),('events'),('rsvp'),('shagun'),('gallery'),
  ('auth'),('dev'),('docs'),('graphql'),('root'),('wp-admin'),('wp-login'),('xmlrpc'),('phpmyadmin'),('cgi-bin')
ON CONFLICT ("slug") DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reserved_slugs_immutable'
  ) THEN
    ALTER TABLE "reserved_slugs" ENABLE TRIGGER trg_reserved_slugs_immutable;
  END IF;
END $$;
