-- 2_theme_config: per-wedding theme overrides + preset version pin
ALTER TABLE "weddings"
  ADD COLUMN "theme_config"  JSONB,
  ADD COLUMN "theme_version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "weddings" ADD CONSTRAINT chk_theme_config_object
  CHECK ("theme_config" IS NULL OR jsonb_typeof("theme_config") = 'object');

ALTER TABLE "weddings" ADD CONSTRAINT chk_theme_version_positive
  CHECK ("theme_version" >= 1);
