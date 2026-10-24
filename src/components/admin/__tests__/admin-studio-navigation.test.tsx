import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminShell } from "@/components/admin/AdminShell";
import AdminDashboardClient, {
  type DashboardWeddingItem,
  type DashboardCounts,
} from "@/app/admin/AdminDashboardClient";

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
});
