import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createWeddingService,
  DuplicateSlugError,
  ReservedSlugError,
  DuplicatePhoneError,
} from "../service";
import type { CreateWeddingInput } from "../schemas";

const { mockTx, mockPrisma } = vi.hoisted(() => {
  const tx = {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    wedding: {
      create: vi.fn(),
    },
    weddingMember: {
      create: vi.fn(),
    },
    weddingAlias: {
      create: vi.fn(),
    },
    entitlement: {
      create: vi.fn(),
    },
    event: {
      createMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockPrisma: {
      ...tx,
      reservedSlug: {
        findUnique: vi.fn(),
      },
      weddingAlias: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((cb: (client: typeof tx) => unknown) => Promise.resolve(cb(tx))),
    },
  };
});

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

describe("Transactional Wedding Creation Service", () => {
  const baseInput: CreateWeddingInput = {
    brideName: "Ananya",
    groomName: "Kabir",
    weddingDate: "2026-12-14",
    venueCity: "Udaipur",
    slug: "ananya-kabir-2026",
    plan: "premium",
    themeId: "royal-crimson",
    couplePhone: "+919876543210",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provisions wedding, plan-derived entitlements, draft events, and audit log atomically", async () => {
    mockTx.user.findFirst.mockResolvedValue(null);
    mockTx.user.create.mockResolvedValue({ id: "usr-cpl-1" });
    mockTx.wedding.create.mockResolvedValue({
      id: "wed-tx-1",
      slug: "ananya-kabir-2026",
      plan: "premium",
      status: "draft",
    });
    mockTx.weddingMember.create.mockResolvedValue({});
    mockTx.weddingAlias.create.mockResolvedValue({});
    mockTx.entitlement.create.mockResolvedValue({});
    mockTx.event.createMany.mockResolvedValue({ count: 2 });
    mockTx.auditLog.create.mockResolvedValue({});

    const result = await createWeddingService(baseInput, "staff-actor-1");

    expect(result.id).toBe("wed-tx-1");

    // 1. Transaction called
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

    // 2. Entitlement matches Premium plan limits (NOT hardcoded 500!)
    expect(mockTx.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weddingId: "wed-tx-1",
        maxPhotos: 300, // Premium = 300
        videoBite: true, // Premium = true
        customDomain: false, // Premium = false
        faceSearch: false,
      }),
    });

    // 3. Draft itinerary seeded with incomplete draft markers
    expect(mockTx.event.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          weddingId: "wed-tx-1",
          title: "Muhurtham & Vivah (Draft)",
          venueName: "Udaipur Mandap (TBD)",
        }),
        expect.objectContaining({
          weddingId: "wed-tx-1",
          title: "Sangeet & Celebration (Draft)",
          venueName: "Udaipur Celebration Hall (TBD)",
        }),
      ]),
    });

    // 4. Canonical alias created
    expect(mockTx.weddingAlias.create).toHaveBeenCalledWith({
      data: {
        alias: "ananya-kabir-2026",
        weddingId: "wed-tx-1",
        kind: "vanity",
      },
    });

    // 5. Audit log recorded
    expect(mockTx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weddingId: "wed-tx-1",
        actorId: "staff-actor-1",
        action: "wedding.create",
        detail: expect.objectContaining({
          slug: "ananya-kabir-2026",
          plan: "premium",
          maxPhotos: 300,
        }),
      }),
    });
  });

  it("applies Lite plan entitlements accurately", async () => {
    mockTx.user.findFirst.mockResolvedValue(null);
    mockTx.user.create.mockResolvedValue({ id: "usr-cpl-lite" });
    mockTx.wedding.create.mockResolvedValue({
      id: "wed-lite-1",
      slug: "lite-wedding-2026",
      plan: "lite",
    });

    const liteInput: CreateWeddingInput = {
      ...baseInput,
      slug: "lite-wedding-2026",
      plan: "lite",
    };

    await createWeddingService(liteInput, "staff-actor-1");

    expect(mockTx.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weddingId: "wed-lite-1",
        maxPhotos: 100, // Lite = 100
        videoBite: false, // Lite = false
        customDomain: false, // Lite = false
      }),
    });
  });

  it("applies Platinum plan entitlements accurately", async () => {
    mockTx.user.findFirst.mockResolvedValue(null);
    mockTx.user.create.mockResolvedValue({ id: "usr-cpl-plat" });
    mockTx.wedding.create.mockResolvedValue({
      id: "wed-plat-1",
      slug: "plat-wedding-2026",
      plan: "platinum",
    });

    const platInput: CreateWeddingInput = {
      ...baseInput,
      slug: "plat-wedding-2026",
      plan: "platinum",
    };

    await createWeddingService(platInput, "staff-actor-1");

    expect(mockTx.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weddingId: "wed-plat-1",
        maxPhotos: 1000, // Platinum = 1000
        videoBite: true, // Platinum = true
        customDomain: true, // Platinum = true
      }),
    });
  });

  it("throws ReservedSlugError when trying to provision a reserved slug", async () => {
    const reservedInput: CreateWeddingInput = {
      ...baseInput,
      slug: "admin",
    };

    await expect(createWeddingService(reservedInput, "staff-1")).rejects.toThrow(ReservedSlugError);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("translates PostgreSQL unique constraint collision into DuplicateSlugError", async () => {
    mockTx.user.findFirst.mockResolvedValue(null);
    mockTx.user.create.mockResolvedValue({ id: "usr-1" });
    mockTx.wedding.create.mockRejectedValue({
      code: "P2002",
      meta: { target: ["slug"] },
    });

    await expect(createWeddingService(baseInput, "staff-1")).rejects.toThrow(DuplicateSlugError);
  });

  it("translates phone duplicate constraint into DuplicatePhoneError", async () => {
    mockTx.user.findFirst.mockResolvedValue(null);
    mockTx.user.create.mockRejectedValue({
      code: "P2002",
      meta: { target: ["phone"] },
    });

    await expect(createWeddingService(baseInput, "staff-1")).rejects.toThrow(DuplicatePhoneError);
  });

  it("rolls back the entire transaction if any inner operation fails", async () => {
    mockTx.user.findFirst.mockResolvedValue(null);
    mockTx.user.create.mockResolvedValue({ id: "usr-1" });
    mockTx.wedding.create.mockResolvedValue({ id: "wed-fail-1", slug: baseInput.slug });
    mockTx.weddingMember.create.mockResolvedValue({});
    mockTx.weddingAlias.create.mockResolvedValue({});

    // Entitlement creation explodes
    mockTx.entitlement.create.mockRejectedValue(
      new Error("Database connection dropped during entitlement insert"),
    );

    await expect(createWeddingService(baseInput, "staff-1")).rejects.toThrow(
      "Database connection dropped during entitlement insert",
    );
  });
});
