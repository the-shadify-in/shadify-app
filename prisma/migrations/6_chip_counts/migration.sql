-- Migration: 6_chip_counts
-- Anonymous, first-party aggregated daily counters for guest "Ask" chips
CREATE TABLE IF NOT EXISTS "wedding_chip_counts_daily" (
  "wedding_id" UUID NOT NULL,
  "day" DATE NOT NULL,
  "topic" VARCHAR(64) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT "wedding_chip_counts_daily_pkey" PRIMARY KEY ("wedding_id", "day", "topic"),
  CONSTRAINT "wedding_chip_counts_daily_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_chip_counts_wedding_day" ON "wedding_chip_counts_daily" ("wedding_id", "day");
