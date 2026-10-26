import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

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

  // 2. Create Sample Weddings for each of the 4 visual moods with real IST times and full postal addresses
  const demoWeddings = [
    {
      slug: "priya-rahul",
      brideName: "Priya",
      groomName: "Rahul",
      weddingDate: new Date("2027-02-15T10:30:00+05:30"),
      themeId: "royal-crimson",
      monogramText: "P & R",
      primaryColor: "#8B0000",
      accentColor: "#C9933A",
      upiVpa: "priya.rahul@okhdfcbank",
      events: [
        {
          eventType: "mehendi",
          title: "Mehendi Ceremony",
          venueName: "Laxmi Niwas Palace Courtyard",
          venueAddress: "Lake Pichola, Udaipur, Rajasthan 313001",
          startsAt: new Date("2027-02-13T16:00:00+05:30"),
          dressCode: "Sunshine Yellow & Festive Boho",
        },
        {
          eventType: "sangeet",
          title: "Sangeet Night Celebration",
          venueName: "Fateh Prakash Palace Ballroom",
          venueAddress: "City Palace Complex, Udaipur, Rajasthan 313001",
          startsAt: new Date("2027-02-14T19:30:00+05:30"),
          dressCode: "Indo-Western Glitz & Regal Banarasi",
        },
        {
          eventType: "wedding",
          title: "Auspicious Vivah & Sacred Pheras",
          venueName: "Jagmandir Island Palace",
          venueAddress: "Lake Pichola, Udaipur, Rajasthan 313001",
          startsAt: new Date("2027-02-15T10:30:00+05:30"),
          dressCode: "Royal Pastels & Traditional Silk",
        },
        {
          eventType: "reception",
          title: "The Grand Reception",
          venueName: "The Leela Palace Under The Stars",
          venueAddress: "Lake Pichola, Udaipur, Rajasthan 313001",
          startsAt: new Date("2027-02-15T19:00:00+05:30"),
          dressCode: "Black Tie & Velvet Royal",
        },
      ],
    },
    {
      slug: "ananya-kabir",
      brideName: "Ananya",
      groomName: "Kabir",
      weddingDate: new Date("2026-11-28T09:30:00+05:30"),
      themeId: "emerald-gold",
      monogramText: "A & K",
      primaryColor: "#0D4D33",
      accentColor: "#D4AF37",
      upiVpa: "ananya.kabir@icici",
      events: [
        {
          eventType: "mehendi",
          title: "Traditional Haldi & Mehendi",
          venueName: "Nahargarh Fort Courtyard",
          venueAddress: "Krishna Nagar, Brahampuri, Jaipur, Rajasthan 302002",
          startsAt: new Date("2026-11-27T10:00:00+05:30"),
          dressCode: "Turmeric Yellow & Traditional Gota Patti",
        },
        {
          eventType: "sangeet",
          title: "Classical Sangeet & Rasleela",
          venueName: "Rambagh Palace Heritage Pavilion",
          venueAddress: "Bhawani Singh Rd, Jaipur, Rajasthan 302005",
          startsAt: new Date("2026-11-27T18:30:00+05:30"),
          dressCode: "Deep Emerald & Temple Gold Zari",
        },
        {
          eventType: "wedding",
          title: "Sacred Temple Vivah & Muhurtham",
          venueName: "City Palace Mandap",
          venueAddress: "Tulsi Marg, Gangori Bazaar, Jaipur, Rajasthan 302002",
          startsAt: new Date("2026-11-28T09:30:00+05:30"),
          dressCode: "Kanjeevaram & Banarasi Silk",
        },
        {
          eventType: "reception",
          title: "Heritage Royal Feast",
          venueName: "Jai Mahal Palace Lawns",
          venueAddress: "Jacob Rd, Civil Lines, Jaipur, Rajasthan 302006",
          startsAt: new Date("2026-11-28T19:30:00+05:30"),
          dressCode: "Formal Heritage Attire",
        },
      ],
    },
    {
      slug: "diya-arjun",
      brideName: "Diya",
      groomName: "Arjun",
      weddingDate: new Date("2027-01-18T11:00:00+05:30"),
      themeId: "ivory-minimal",
      monogramText: "D & A",
      primaryColor: "#7A5A40",
      accentColor: "#8F6418",
      upiVpa: "diya.arjun@axisbank",
      events: [
        {
          eventType: "sangeet",
          title: "Welcome Sundowner & Acoustic Evening",
          venueName: "The Palm Grove Farmhouse",
          venueAddress: "Kihim Beach Road, Alibaug, Maharashtra 402201",
          startsAt: new Date("2027-01-17T16:30:00+05:30"),
          dressCode: "Ivory, Champagne & Natural Linen",
        },
        {
          eventType: "wedding",
          title: "Intimate Coastal Vivah & Vows",
          venueName: "Radisson Blu Coastal Lawn",
          venueAddress: "Gondhalpada, Veshvi, Alibaug, Maharashtra 402209",
          startsAt: new Date("2027-01-18T11:00:00+05:30"),
          dressCode: "Subtle Pastels & Raw Silk",
        },
        {
          eventType: "reception",
          title: "Starlit Farmhouse Dinner",
          venueName: "Bodhi Villa Courtyard",
          venueAddress: "Awas Beach Road, Alibaug, Maharashtra 402201",
          startsAt: new Date("2027-01-18T19:00:00+05:30"),
          dressCode: "Casual Chic & Editorial Neutrals",
        },
      ],
    },
    {
      slug: "zoya-farhan",
      brideName: "Zoya",
      groomName: "Farhan",
      weddingDate: new Date("2027-03-06T11:30:00+05:30"),
      themeId: "sunset-dusk",
      monogramText: "Z & F",
      primaryColor: "#D46A7E",
      accentColor: "#E29578",
      upiVpa: "zoya.farhan@kotak",
      events: [
        {
          eventType: "mehendi",
          title: "Sunset Beach Mehendi & Cocktails",
          venueName: "Rockpool Pavilion, W Goa",
          venueAddress: "Vagator Beach, Bardez, Goa 403509",
          startsAt: new Date("2027-03-05T15:30:00+05:30"),
          dressCode: "Sunset Coral & Tropical Florals",
        },
        {
          eventType: "sangeet",
          title: "Sundowner Sangeet & Beats",
          venueName: "Bayview Lawns",
          venueAddress: "Ozran Beach Road, Small Vagator, Anjuna, Goa 403509",
          startsAt: new Date("2027-03-05T18:30:00+05:30"),
          dressCode: "Festive Shimmer & Indo-Western",
        },
        {
          eventType: "wedding",
          title: "Oceanfront Nikah & Celebrations",
          venueName: "Grand Hyatt Bayview",
          venueAddress: "PO Goa University, Bambolim, Goa 403206",
          startsAt: new Date("2027-03-06T11:30:00+05:30"),
          dressCode: "Ivory, Rose Gold & Festive Pastels",
        },
      ],
    },
  ];

  for (const w of demoWeddings) {
    const wedding = await prisma.wedding.upsert({
      where: { slug: w.slug },
      update: {
        brideName: w.brideName,
        groomName: w.groomName,
        weddingDate: w.weddingDate,
        themeId: w.themeId,
        primaryColor: w.primaryColor,
        accentColor: w.accentColor,
        monogramText: w.monogramText,
        upiVpa: w.upiVpa,
        themeConfig: { isDemo: true },
      },
      create: {
        slug: w.slug,
        brideName: w.brideName,
        groomName: w.groomName,
        weddingDate: w.weddingDate,
        plan: "premium",
        status: "published",
        themeId: w.themeId,
        themeConfig: { isDemo: true },
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
      },
    });

    // Refresh events cleanly for each demo wedding
    await prisma.event.deleteMany({ where: { weddingId: wedding.id } });
    let idx = 0;
    for (const evt of w.events) {
      await prisma.event.create({
        data: {
          weddingId: wedding.id,
          eventType: evt.eventType,
          title: evt.title,
          venueName: evt.venueName,
          venueAddress: evt.venueAddress,
          startsAt: evt.startsAt,
          dressCode: evt.dressCode,
          sortOrder: idx++,
        },
      });
    }

    console.log(
      `✅ Seeded wedding with ${w.events.length} events: ${wedding.brideName} & ${wedding.groomName} (/${wedding.slug}) [${w.themeId}]`,
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

  const pilotPromo = await prisma.promoCode.upsert({
    where: { code: "PILOT100" },
    update: {},
    create: {
      code: "PILOT100",
      promoType: "campaign",
      discountPaise: BigInt(799900), // 100% discount on Platinum plan
      commissionPaise: BigInt(0),
      minOrderPaise: BigInt(0),
      isActive: true,
    },
  });

  console.log(
    `✅ Seeded promo codes: ${guestPromo.code} (Guest), ${partnerPromo.code} (Partner), ${pilotPromo.code} (Pilot 100%)`,
  );

  // 4. Seed Staff Concierge User for Testing and Development
  if (process.env.NODE_ENV !== "production" || process.env.SEED_STAFF === "true") {
    const staffEmail = process.env.TEST_STAFF_EMAIL || "concierge@shadify.in";
    const staffPassword =
      process.env.TEST_STAFF_PASSWORD || process.env.STAFF_PASSWORD || "TestStaffPass!2026";
    const staffPasswordHash = await hashPassword(staffPassword);

    await prisma.user.upsert({
      where: { email: staffEmail },
      update: { passwordHash: staffPasswordHash, role: "staff" },
      create: {
        fullName: "Shadify Concierge Staff",
        phone: "+919800000002",
        email: staffEmail,
        role: "staff",
        passwordHash: staffPasswordHash,
      },
    });
    console.log(`✅ Seeded staff concierge user: ${staffEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
