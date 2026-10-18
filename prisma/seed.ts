import { prisma } from "../src/lib/db";

async function main() {
  console.log("Seeding Shadify sample wedding...");

  // 1. Create Couple User
  const coupleUser = await prisma.user.upsert({
    where: { phone: "+919876543210" },
    update: {},
    create: {
      fullName: "Priya Sharma & Rahul Verma",
      phone: "+919876543210",
      email: "priya.rahul@example.com",
      role: "couple",
    },
  });

  // 2. Create Wedding
  const wedding = await prisma.wedding.upsert({
    where: { slug: "priya-rahul" },
    update: {},
    create: {
      slug: "priya-rahul",
      brideName: "Priya",
      groomName: "Rahul",
      weddingDate: new Date("2026-12-18"),
      plan: "premium",
      status: "published",
      themeId: "royal-crimson",
      monogramText: "P & R",
      primaryColor: "#8B0000",
      accentColor: "#C9933A",
      upiVpa: "priyarahul@upi",
      showBranding: false,
      contentExpiresAt: new Date(Date.now() + 5 * 365.25 * 24 * 60 * 60 * 1000),
      originalsExpireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      members: {
        create: {
          userId: coupleUser.id,
          memberRole: "owner",
        },
      },
      entitlement: {
        create: {
          hostingUntil: new Date(Date.now() + 5 * 365.25 * 24 * 60 * 60 * 1000),
          customDomain: false,
          maxPhotos: 500,
        },
      },
    },
  });

  console.log(`✅ Seeded wedding: ${wedding.brideName} & ${wedding.groomName} (/${wedding.slug})`);

  // 3. Seed Hybrid Promo Codes
  const guestPromo = await prisma.promoCode.upsert({
    where: { code: "NAMASTE299" },
    update: {},
    create: {
      code: "NAMASTE299",
      promoType: "guest_referral",
      discountPaise: BigInt(29900), // ₹299 discount
      commissionPaise: BigInt(0),
      minOrderPaise: BigInt(299900),
      isActive: true,
    },
  });

  const partnerPromo = await prisma.promoCode.upsert({
    where: { code: "STUDIOPARTNER" },
    update: {},
    create: {
      code: "STUDIOPARTNER",
      promoType: "partner",
      discountPaise: BigInt(29900), // ₹299 discount for couple
      commissionPaise: BigInt(100000), // ₹1,000 commission for studio partner
      partnerName: "Royal Heritage Photography Studio",
      partnerPhone: "+919876500001",
      partnerUpi: "royalstudio@upi",
      minOrderPaise: BigInt(299900),
      isActive: true,
    },
  });

  console.log(
    `✅ Seeded promo codes: ${guestPromo.code} (Guest) and ${partnerPromo.code} (Partner)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
