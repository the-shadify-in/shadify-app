import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminShell } from "@/components/admin/AdminShell";
import AdminDashboardClient, {
  type DashboardWeddingItem,
  type DashboardCounts,
} from "@/app/admin/AdminDashboardClient";
import type { AdminSession } from "@/lib/auth";
import type { SerializedEffectiveEntitlements } from "@/features/entitlements/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("Phase 4 Concierge Studio Redesign & Navigation", () => {
  const mockStaff = {
    id: "usr-staff-1",
    fullName: "Aarav Mehta",
    email: "aarav@shadify.in",
    role: "staff",
  };

  describe("Phase 4A: Global Admin Shell", () => {
    it("renders persistent navigation with brand, platform links, and staff identity", () => {
      const html = renderToStaticMarkup(
        <AdminShell staff={mockStaff}>
          <div data-testid="test-content">Dashboard Content</div>
        </AdminShell>,
      );

      // Brand
      expect(html).toContain("SHADIFY");
      expect(html).toContain("Concierge Studio");

      // Platform navigation links
      expect(html).toContain("Celebrations");
      expect(html).toContain("Theme Studio");
      expect(html).toContain("Operations &amp; Health");

      // Staff identity
      expect(html).toContain("Aarav Mehta");
      expect(html).toContain("aarav@shadify.in");
      expect(html).toContain("staff");

      // Sign out control
      expect(html).toContain("Sign Out");

      // Children content preserved
      expect(html).toContain("Dashboard Content");
    });
  });

  describe("Phase 4B: Live Celebrations Dashboard", () => {
    const mockWeddings: DashboardWeddingItem[] = [
      {
        id: "w-real-1",
        slug: "priya-rahul",
        brideName: "Priya",
        groomName: "Rahul",
        couple: "Priya & Rahul",
        weddingDate: "2026-12-14",
        plan: "premium",
        status: "published",
        createdAt: "2026-10-01T12:00:00Z",
        hasCustomDomain: true,
        hasOverride: false,
        rsvpCount: 184,
        photoCount: 42,
        shagunCount: 15,
      },
      {
        id: "w-real-2",
        slug: "ananya-kabir",
        brideName: "Ananya",
        groomName: "Kabir",
        couple: "Ananya & Kabir",
        weddingDate: "2027-01-22",
        plan: "platinum",
        status: "draft",
        createdAt: "2026-10-15T12:00:00Z",
        hasCustomDomain: false,
        hasOverride: true,
        rsvpCount: 0,
        photoCount: 5,
        shagunCount: 0,
      },
    ];

    const mockCounts: DashboardCounts = {
      total: 2,
      published: 1,
      draft: 1,
      preview: 0,
      archived: 0,
      expired: 0,
    };

    it("renders database-derived metric cards and live wedding records", () => {
      const html = renderToStaticMarkup(
        <AdminDashboardClient weddings={mockWeddings} counts={mockCounts} />,
      );

      // Metrics
      expect(html).toContain("Total Celebrations");
      expect(html).toContain("Published (Live)");
      expect(html).toContain("In Preparation");
      expect(html).toContain("Concluded / Archived");

      // Couples & Slugs
      expect(html).toContain("Priya &amp; Rahul");
      expect(html).toContain("/priya-rahul");
      expect(html).toContain("Ananya &amp; Kabir");
      expect(html).toContain("/ananya-kabir");

      // Plan tier & overrides badge
      expect(html).toContain("Vivah (Premium)");
      expect(html).toContain("Rajwada (Platinum)");
      expect(html).toContain("OVERRIDE");

      // Actions linking to wedding studio
      expect(html).toContain("/admin/weddings/w-real-1");
      expect(html).toContain("/admin/weddings/w-real-2");
    });

    it("renders empty state when no celebrations are present", () => {
      const emptyCounts: DashboardCounts = {
        total: 0,
        published: 0,
        draft: 0,
        preview: 0,
        archived: 0,
        expired: 0,
      };

      const html = renderToStaticMarkup(
        <AdminDashboardClient weddings={[]} counts={emptyCounts} />,
      );

      expect(html).toContain("No celebrations found");
      expect(html).toContain("There are currently no active celebrations in the database.");
    });
  });

  describe("Phase 3: Wedding Studio 4-Domain Architecture & Executive Hero", () => {
    // Dynamic import / component test
    it("renders compact executive hero with couple, masked PIN, and 4 operational domains", async () => {
      const WeddingDetailClient = (await import("@/app/admin/weddings/[id]/WeddingDetailClient"))
        .default;

      const mockWedding = {
        id: "w-detail-1",
        slug: "ananya-kabir",
        brideName: "Ananya",
        groomName: "Kabir",
        weddingDate: "2028-11-20", // Far future
        status: "published",
        plan: "platinum",
        defaultLocale: "en",
        themeId: "royal-crimson",
        primaryColor: "#8B0000",
        accentColor: "#C5A059",
        monogramText: "A & K",
        upiVpa: "ananya@upi",
        liveStreamUrl: "https://youtube.com/live/demo",
        showBranding: false,
        hasPrivatePin: true,
        events: [
          {
            id: "evt-1",
            eventType: "sangeet",
            title: "Sangeet & Cocktail Night",
            startsAt: "2028-11-19T18:00:00Z",
            endsAt: null,
            venueName: "Udaivilas Palace",
            venueAddress: "Haridas Ji Ki Magri",
            venueCity: "Udaipur",
            venueMapUrl: "https://maps.google.com",
            dressCode: "Festive Glamour",
            description: "Music and celebration",
            visibility: "public",
            sortOrder: 1,
          },
        ],
        vips: [
          {
            id: "vip-1",
            name: "Rajesh Sharma",
            relationship: "Father of the Bride",
            groupLabel: "Bride's Family",
            tagline: "Patriarch",
            sortOrder: 1,
          },
        ],
        aliases: [
          {
            id: "al-1",
            alias: "ak-celebration",
            kind: "vanity" as const,
            partnerLabel: null,
            createdAt: "2026-10-01T00:00:00Z",
            retiredAt: null,
          },
        ],
        qrAssets: [
          {
            id: "qr-1",
            encodedUrl: "https://shadify.in/ananya-kabir",
            format: "svg",
            sizeMm: 30,
            errorCorrection: "M",
            storageKey: "qrs/ak.svg",
            status: "approved",
            approvedAt: "2026-10-02T00:00:00Z",
            printedAt: null,
            createdAt: "2026-10-01T00:00:00Z",
          },
        ],
        consents: [
          {
            id: "c-1",
            subject: "Rajesh Sharma",
            purpose: "vip_display",
            noticeVersion: "1.0",
            grantedAt: "2026-10-01T00:00:00Z",
            withdrawnAt: null,
          },
        ],
        rsvps: [
          {
            id: "rsvp-1",
            respondentName: "Devendra Mehta",
            respondentPhone: "+919876543210",
            attending: true,
            partySize: 2,
            mealPreference: "pure_veg",
            needsStay: true,
            createdAt: "2026-10-05T00:00:00Z",
          },
        ],
        auditLogs: [
          {
            id: "aud-1",
            action: "wedding.status_change",
            createdAt: "2026-10-01T12:00:00Z",
            detail: { from: "draft", to: "published" },
            actor: { fullName: "Aarav Mehta", role: "staff" },
          },
        ],
      };

      const mockSession: AdminSession = {
        userId: "usr-staff-1",
        role: "staff",
        exp: 1770000000,
      };

      const mockEffective: SerializedEffectiveEntitlements = {
        weddingId: "w-detail-1",
        plan: "platinum",
        name: "Rajwada (Platinum)",
        hostingUntil: "2031-10-01T00:00:00Z",
        originalsExpireAt: "2027-01-01T00:00:00Z",
        hasActiveOverride: true,
        activeOverrideDetail: {
          reason: "VIP Partner Upgrade",
          actorId: "usr-staff-1",
          oldValues: {},
          newValues: { maxPhotos: 500 },
          createdAt: "2026-10-01T00:00:00Z",
        },
        maxPhotos: 500,
        maxEvents: 8,
        maxVideoBites: 10,
        videoBite: true,
        customDomain: true,
        canHideBranding: true,
        hostingDurationYears: 5,
        rawOriginalsRetentionDays: 90,
        faceSearch: true,
        maxGuests: 5000,
        maxOriginalsGb: 50,
        allowedPresets: ["royal-crimson"],
        features: ["custom-domain", "video-bites"],
      };

      const html = renderToStaticMarkup(
        <WeddingDetailClient
          initialWedding={mockWedding}
          staffSession={mockSession}
          initialEffectiveEntitlements={mockEffective}
          initialPhotoCount={12}
        />,
      );

      // Compact Executive Hero Assertions
      expect(html).toContain("Ananya &amp; Kabir");
      expect(html).toContain("shadify.in/ananya-kabir");
      expect(html).toContain("published");
      expect(html).toContain("platinum");
      expect(html).toContain("OVERRIDE ACTIVE");

      // Masked PIN & Countdown assertions
      expect(html).toContain("••••••");
      expect(html).toContain("T-");
      expect(html).toContain("Day");

      // 4 Operational Domains assertions
      expect(html).toContain("1. Core Identity &amp; Plan");
      expect(html).toContain("2. Guest Operations");
      expect(html).toContain("3. Experience &amp; Design");
      expect(html).toContain("4. Governance &amp; Quotas");

      // Sub-modules assertions
      expect(html).toContain("Identity &amp; Slugs");
      expect(html).toContain("RSVPs (1)");
      expect(html).toContain("VIPs (1)");
      expect(html).toContain("Print &amp; QR Proofs");
      expect(html).toContain("Events (1)");
      expect(html).toContain("Plan &amp; Overrides");
      expect(html).toContain("Audit Trail");
    });

    it("renders celebration concluded memories state for past weddings", async () => {
      const WeddingDetailClient = (await import("@/app/admin/weddings/[id]/WeddingDetailClient"))
        .default;

      const pastWedding = {
        id: "w-past-1",
        slug: "meera-aditya",
        brideName: "Meera",
        groomName: "Aditya",
        weddingDate: "2024-01-15", // Past date
        status: "archived",
        plan: "lite",
        defaultLocale: "en",
        themeId: "sunset-day",
        primaryColor: "#E07A5F",
        accentColor: "#F4A261",
        monogramText: "M & A",
        upiVpa: null,
        liveStreamUrl: null,
        showBranding: true,
        hasPrivatePin: false,
        events: [],
        vips: [],
        aliases: [],
        qrAssets: [],
        consents: [],
        rsvps: [],
        auditLogs: [],
      };

      const mockSession: AdminSession = {
        userId: "usr-staff-1",
        role: "staff",
        exp: 1770000000,
      };

      const html = renderToStaticMarkup(
        <WeddingDetailClient initialWedding={pastWedding} staffSession={mockSession} />,
      );

      expect(html).toContain("Celebration Concluded");
      expect(html).toContain("Archived memories");
      expect(html).toContain("Public (No PIN)");
    });
  });
});
