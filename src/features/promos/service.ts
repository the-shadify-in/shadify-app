import { prisma } from "@/lib/db";
import { PRICING_PLANS } from "@/lib/config/pricing";

export class PromoNotFoundError extends Error {
  constructor(code: string) {
    super(`Promo code '${code}' is invalid or does not exist.`);
    this.name = "PromoNotFoundError";
  }
}

export class PromoExpiredError extends Error {
  constructor(code: string) {
    super(`Promo code '${code}' has expired.`);
    this.name = "PromoExpiredError";
  }
}

export class PromoExhaustedError extends Error {
  constructor(code: string) {
    super(`Promo code '${code}' has reached its maximum number of uses.`);
    this.name = "PromoExhaustedError";
  }
}

export class PromoMinOrderError extends Error {
  constructor(minRupees: number) {
    super(`This promo code requires a minimum plan value of ₹${minRupees}.`);
    this.name = "PromoMinOrderError";
  }
}

export interface PromoValidationResult {
  valid: boolean;
  code: string;
  promoType: string;
  originalPaise: number;
  discountPaise: number;
  finalPaise: number;
  savingsRupees: number;
  finalRupees: number;
  partnerName?: string | null;
}

/**
 * Validates a promo code strictly server-side and computes integer paise pricing.
 */
export async function validatePromoService(
  rawCode: string,
  planId: "lite" | "premium" | "platinum",
): Promise<PromoValidationResult> {
  const code = rawCode.trim().toUpperCase();
  const plan = PRICING_PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code },
  });

  if (!promo || !promo.isActive) {
    throw new PromoNotFoundError(code);
  }

  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
    throw new PromoExpiredError(code);
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    throw new PromoExhaustedError(code);
  }

  const originalPaise = plan.pricePaise;
  const minOrderPaise = Number(promo.minOrderPaise);

  if (originalPaise < minOrderPaise) {
    throw new PromoMinOrderError(minOrderPaise / 100);
  }

  const discountPaise = Number(promo.discountPaise);
  // Guarantee final amount never drops below 0
  const finalPaise = Math.max(0, originalPaise - discountPaise);

  return {
    valid: true,
    code: promo.code,
    promoType: promo.promoType,
    originalPaise,
    discountPaise,
    finalPaise,
    savingsRupees: Math.floor(discountPaise / 100),
    finalRupees: Math.floor(finalPaise / 100),
    partnerName: promo.partnerName,
  };
}
