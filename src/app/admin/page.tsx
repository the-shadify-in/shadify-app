import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminDashboardClient, {
  type DashboardWeddingItem,
  type DashboardCounts,
} from "./AdminDashboardClient";
import { getAllWeddingsChipStats, getPerWeddingChipStats } from "@/features/analytics/chip-counts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?from=/admin");
  }

  // Fetch real database records, chip analytics, and lifecycle status aggregates
  const weddingsRaw = await prisma.wedding.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      entitlement: {
        select: {
          weddingId: true,
        },
      },
      _count: {
        select: {
          rsvps: true,
          photos: true,
          shagunEntries: true,
        },
      },
    },
    take: 150, // Bounded query for performance and security
  });

  const [allWeddingsChipStats, perWeddingChipStats, statusGroups] = await Promise.all([
    getAllWeddingsChipStats(),
    getPerWeddingChipStats(),
    prisma.wedding.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  // Aggregate database-derived lifecycle counts
  const counts: DashboardCounts = {
    total: 0,
    published: 0,
    draft: 0,
    preview: 0,
    archived: 0,
    expired: 0,
  };

  for (const group of statusGroups) {
    const status = group.status as keyof DashboardCounts;
    const count = group._count._all;
    if (status in counts && status !== "total") {
      counts[status] = count;
    }
    counts.total += count;
  }

  // Serialize records safely (excluding PIN hashes, session data, or sensitive tokens)
  const serializedWeddings: DashboardWeddingItem[] = weddingsRaw.map((w) => ({
    id: w.id,
    slug: w.slug,
    brideName: w.brideName,
    groomName: w.groomName,
    couple: `${w.brideName} & ${w.groomName}`,
    weddingDate: w.weddingDate.toISOString().slice(0, 10),
    plan: w.plan,
    status: w.status,
    createdAt: w.createdAt.toISOString(),
    hasCustomDomain: Boolean(w.customDomain),
    hasOverride: Boolean(w.entitlement),
    rsvpCount: w._count.rsvps,
    photoCount: w._count.photos,
    shagunCount: w._count.shagunEntries,
  }));

  return (
    <AdminDashboardClient
      weddings={serializedWeddings}
      counts={counts}
      allChipStats={allWeddingsChipStats}
      perWeddingChips={perWeddingChipStats}
    />
  );
}
