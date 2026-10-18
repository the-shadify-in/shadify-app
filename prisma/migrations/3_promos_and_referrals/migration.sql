-- 3_promos_and_referrals: promo codes, redemptions & partner referral commissions

CREATE TYPE "PromoType" AS ENUM ('partner', 'guest_referral', 'campaign');
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'qualified', 'paid', 'void');

CREATE TABLE "promo_codes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "promo_type" "PromoType" NOT NULL DEFAULT 'campaign',
  "discount_paise" BIGINT NOT NULL DEFAULT 29900,
  "commission_paise" BIGINT NOT NULL DEFAULT 0,
  "partner_name" TEXT,
  "partner_phone" TEXT,
  "partner_upi" TEXT,
  "max_uses" INTEGER,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "min_order_paise" BIGINT NOT NULL DEFAULT 299900,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "expires_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "promo_codes_code_key" UNIQUE ("code")
);

CREATE TABLE "promo_redemptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "promo_code_id" UUID NOT NULL REFERENCES "promo_codes"("id") ON DELETE RESTRICT,
  "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "wedding_id" UUID REFERENCES "weddings"("id") ON DELETE SET NULL,
  "discount_paise" BIGINT NOT NULL,
  "redeemed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "promo_redemptions_order_id_key" UNIQUE ("order_id")
);

CREATE TABLE "referrals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "promo_code_id" UUID NOT NULL REFERENCES "promo_codes"("id") ON DELETE RESTRICT,
  "wedding_id" UUID NOT NULL REFERENCES "weddings"("id") ON DELETE CASCADE,
  "order_id" UUID REFERENCES "orders"("id") ON DELETE SET NULL,
  "commission_paise" BIGINT NOT NULL,
  "payout_upi" TEXT,
  "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
  "payout_txn_ref" TEXT,
  "paid_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "referrals_order_id_key" UNIQUE ("order_id")
);

CREATE INDEX "idx_promo_codes_code" ON "promo_codes"("code");
CREATE INDEX "idx_referrals_status" ON "referrals"("status");
CREATE INDEX "idx_referrals_wedding" ON "referrals"("wedding_id");
