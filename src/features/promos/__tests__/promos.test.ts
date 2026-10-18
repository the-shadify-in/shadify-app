import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validatePromoService,
  PromoNotFoundError,
  PromoExpiredError,
  PromoExhaustedError,
  PromoMinOrderError,
} from "../service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    promoCode: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Promo Validation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates guest discount code (₹299 off on Lite plan) with exact paise calculation", async () => {
    vi.mocked(prisma.promoCode.findUnique).mockResolvedValueOnce({
      id: "promo-1",
      code: "NAMASTE299",
      promoType: "guest_referral",
      discountPaise: BigInt(29900),
      commissionPaise: BigInt(0),
      partnerName: null,
      partnerPhone: null,
      partnerUpi: null,
      maxUses: 100,
      usedCount: 5,
      minOrderPaise: BigInt(299900),
      expiresAt: new Date(Date.now() + 86400000),
      isActive: true,
      createdAt: new Date(),
    });

    const result = await validatePromoService("namaste299", "lite");

    expect(result.valid).toBe(true);
    expect(result.code).toBe("NAMASTE299");
    expect(result.originalPaise).toBe(299900); // ₹2,999
    expect(result.discountPaise).toBe(29900); // ₹299
    expect(result.finalPaise).toBe(270000); // ₹2,700
    expect(result.savingsRupees).toBe(299);
    expect(result.finalRupees).toBe(2700);
  });

  it("validates partner promo code with partner name attachment", async () => {
    vi.mocked(prisma.promoCode.findUnique).mockResolvedValueOnce({
      id: "promo-2",
      code: "STUDIOPARTNER",
      promoType: "partner",
      discountPaise: BigInt(29900),
      commissionPaise: BigInt(100000),
      partnerName: "Lens & Lights Studio",
      partnerPhone: null,
      partnerUpi: "lenslights@upi",
      maxUses: null,
      usedCount: 12,
      minOrderPaise: BigInt(799900),
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
    });

    const result = await validatePromoService("STUDIOPARTNER", "premium");

    expect(result.valid).toBe(true);
    expect(result.code).toBe("STUDIOPARTNER");
    expect(result.originalPaise).toBe(799900); // ₹7,999
    expect(result.discountPaise).toBe(29900); // ₹299
    expect(result.finalPaise).toBe(770000); // ₹7,700
    expect(result.partnerName).toBe("Lens & Lights Studio");
  });

  it("throws PromoNotFoundError if code does not exist or is inactive", async () => {
    vi.mocked(prisma.promoCode.findUnique).mockResolvedValueOnce(null);

    await expect(validatePromoService("UNKNOWN10", "lite")).rejects.toThrow(PromoNotFoundError);

    vi.mocked(prisma.promoCode.findUnique).mockResolvedValueOnce({
      id: "promo-3",
      code: "INACTIVE50",
      promoType: "guest_referral",
      discountPaise: BigInt(5000),
      commissionPaise: BigInt(0),
      partnerName: null,
      partnerPhone: null,
      partnerUpi: null,
      maxUses: null,
      usedCount: 0,
      minOrderPaise: BigInt(0),
      expiresAt: null,
      isActive: false,
      createdAt: new Date(),
    });

    await expect(validatePromoService("INACTIVE50", "lite")).rejects.toThrow(PromoNotFoundError);
  });

  it("throws PromoExpiredError if code has expired", async () => {
    vi.mocked(prisma.promoCode.findUnique).mockResolvedValueOnce({
      id: "promo-4",
      code: "EXPIREDCODE",
      promoType: "guest_referral",
      discountPaise: BigInt(29900),
      commissionPaise: BigInt(0),
      partnerName: null,
      partnerPhone: null,
      partnerUpi: null,
      maxUses: 10,
      usedCount: 1,
      minOrderPaise: BigInt(0),
      expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      isActive: true,
      createdAt: new Date(),
    });

    await expect(validatePromoService("EXPIREDCODE", "lite")).rejects.toThrow(PromoExpiredError);
  });

  it("throws PromoExhaustedError if code has reached max uses", async () => {
    vi.mocked(prisma.promoCode.findUnique).mockResolvedValueOnce({
      id: "promo-5",
      code: "LIMITED5",
      promoType: "guest_referral",
      discountPaise: BigInt(29900),
      commissionPaise: BigInt(0),
      partnerName: null,
      partnerPhone: null,
      partnerUpi: null,
      maxUses: 5,
      usedCount: 5,
      minOrderPaise: BigInt(0),
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
    });

    await expect(validatePromoService("LIMITED5", "lite")).rejects.toThrow(PromoExhaustedError);
  });

  it("throws PromoMinOrderError if plan price is below minOrderPaise", async () => {
    vi.mocked(prisma.promoCode.findUnique).mockResolvedValueOnce({
      id: "promo-6",
      code: "PREMIUMONLY",
      promoType: "partner",
      discountPaise: BigInt(29900),
      commissionPaise: BigInt(100000),
      partnerName: null,
      partnerPhone: null,
      partnerUpi: null,
      maxUses: null,
      usedCount: 0,
      minOrderPaise: BigInt(799900), // Requires minimum ₹7,999 (Premium)
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
    });

    // Lite is ₹2,999 (299900 paise) which is less than minOrderPaise (799900)
    await expect(validatePromoService("PREMIUMONLY", "lite")).rejects.toThrow(PromoMinOrderError);
  });
});
