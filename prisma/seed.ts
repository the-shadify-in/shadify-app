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

  // 2. Create Sample Weddings for each of the 4 visual moods
  const demoWeddings = [
    {
      slug: "priya-rahul",
      brideName: "Priya",
      groomName: "Rahul",
      weddingDate: new Date("2026-12-18"),
      themeId: "royal-crimson",
      monogramText: "P & R",
      primaryColor: "#8B0000",
      accentColor: "#C9933A",
      upiVpa: "priyarahul@upi",
    },
    {
      slug: "ananya-kabir",
      brideName: "Ananya",
      groomName: "Kabir",
      weddingDate: new Date("2027-01-22"),
      themeId: "emerald-gold",
      monogramText: "A & K",
      primaryColor: "#0D4D33",
      accentColor: "#D4AF37",
      upiVpa: "ananyakabir@upi",
    },
    {
      slug: "diya-arjun",
      brideName: "Diya",
      groomName: "Arjun",
      weddingDate: new Date("2027-02-14"),
      themeId: "ivory-minimal",
      monogramText: "D & A",
      primaryColor: "#7A5A40",
      accentColor: "#8F6418",
      upiVpa: "diyaarjun@upi",
    },
    {
      slug: "zoya-farhan",
      brideName: "Zoya",
      groomName: "Farhan",
      weddingDate: new Date("2027-03-05"),
      themeId: "sunset-dusk",
      monogramText: "Z & F",
      primaryColor: "#D46A7E",
      accentColor: "#E29578",
      upiVpa: "zoyafarhan@upi",
    },
  ];

  for (const w of demoWeddings) {
    const wedding = await prisma.wedding.upsert({
      where: { slug: w.slug },
      update: {
        themeId: w.themeId,
        primaryColor: w.primaryColor,
        accentColor: w.accentColor,
      },
      create: {
        slug: w.slug,
        brideName: w.brideName,
        groomName: w.groomName,
        weddingDate: w.weddingDate,
        plan: "premium",
        status: "published",
        themeId: w.themeId,
        monogramText: w.monogramText,
        primaryColor: w.primaryColor,
        accentColor: w.accentColor,
        upiVpa: w.upiVpa,
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
        events: {
          create: [
            {
              eventType: "sangeet",
              title: `${w.brideName} & ${w.groomName}'s Sangeet Celebration`,
              venueName: "Palatial Heritage Pavilion",
              startsAt: new Date(w.weddingDate.getTime() - 24 * 60 * 60 * 1000),
            },
            {
              eventType: "wedding",
              title: `${w.brideName} & ${w.groomName}'s Auspicious Vivah`,
              venueName: "Royal Courtyard Mandap",
              startsAt: w.weddingDate,
            },
          ],
        },
      },
    });
    console.log(
      `✅ Seeded wedding: ${wedding.brideName} & ${wedding.groomName} (/${wedding.slug}) [${w.themeId}]`,
    );
  }

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
