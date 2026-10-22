import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminDashboardClient from "./AdminDashboardClient";
import { getAllWeddingsChipStats, getPerWeddingChipStats } from "@/features/analytics/chip-counts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?from=/admin");
  }

  const [allWeddingsChipStats, perWeddingChipStats] = await Promise.all([
    getAllWeddingsChipStats(),
    getPerWeddingChipStats(),
  ]);

  return (
    <AdminDashboardClient
      allChipStats={allWeddingsChipStats}
      perWeddingChips={perWeddingChipStats}
    />
  );
}
