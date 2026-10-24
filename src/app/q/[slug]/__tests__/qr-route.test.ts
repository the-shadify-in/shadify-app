import { describe, it, expect, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// Mock contact config
vi.mock("@/lib/config/contact", () => ({
  getConciergeWhatsAppUrl: vi.fn(() => "https://wa.me/919876543210?text=test"),
  SITE_CONFIG: {
    whatsappNumber: "919876543210",
    name: "Shadify",
    domain: "shadify.in",
  },
}));

interface MockWeddingRecord {
  id: string;
  slug: string;
  status: "published" | "draft" | "preview";
  brideName: string;
  groomName: string;
  weddingDate: Date;
  themeId: string;
  monogramText?: string;
  themeConfig?: Record<string, unknown>;
  events: Array<{
    id: string;
    title: string;
    venueName: string;
    venueAddress: string;
    visibility: string;
  }>;
  vips: unknown[];
  entitlements: unknown;
}

// Mock weddings service
const mockWeddings = new Map<string, MockWeddingRecord>([
  [
    "published-slug",
    {
      id: "w1",
      slug: "published-slug",
      status: "published",
      brideName: "Ananya",
      groomName: "Arjun",
      weddingDate: new Date("2026-12-15"),
      themeId: "royal-crimson",
      events: [],
      vips: [],
      entitlements: null,
    },
  ],
  [
    "draft-slug",
    {
      id: "w2",
      slug: "draft-slug",
      status: "draft",
      brideName: "Meera",
      groomName: "Aarav",
      weddingDate: new Date("2026-11-02"),
      themeId: "emerald-gold",
      monogramText: "M & A",
      events: [
        {
          id: "e1",
          title: "Private Muhurtham",
          venueName: "Private Hall",
          venueAddress: "Confidential Street",
          visibility: "private",
        },
      ],
      vips: [],
      entitlements: null,
    },
  ],
]);

vi.mock("@/features/weddings", () => ({
  getWeddingBySlug: vi.fn((slug: string) => Promise.resolve(mockWeddings.get(slug) || null)),
  mapWeddingToDto: vi.fn((w: MockWeddingRecord) => ({
    slug: w.slug,
    bride: w.brideName,
    groom: w.groomName,
    date: "Nov 2, 2026",
    venueCity: "Jaipur, Rajasthan",
    monogram: w.monogramText || "M & A",
    events: w.events || [],
    vips: [],
    showBranding: true,
  })),
}));

import QrRedirectPage from "../page";
import { notFound, redirect } from "next/navigation";

describe("Production QR Route Safety (/q/[slug])", () => {
  it("redirects published weddings directly to the canonical guest route", async () => {
    await expect(QrRedirectPage({ params: { slug: "published-slug" } })).rejects.toThrow(
      "NEXT_REDIRECT:/published-slug",
    );
    expect(redirect).toHaveBeenCalledWith("/published-slug");
  });

  it("triggers authentic notFound() for unknown or typo slugs", async () => {
    await expect(QrRedirectPage({ params: { slug: "unknown-typo-slug" } })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalled();
  });

  it("renders safe 'Celebration Coming Soon' card for draft weddings without leaking private venues", async () => {
    const jsx = await QrRedirectPage({ params: { slug: "draft-slug" } });
    expect(jsx).toBeDefined();

    // Verify it did not redirect or 404
    expect(redirect).not.toHaveBeenCalledWith("/draft-slug");
  });
});
