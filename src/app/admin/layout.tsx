import React from "react";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminShell, type AdminStaffProfile } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // If unauthenticated (e.g. /admin/login), render children without shell
  if (!session) {
    return <>{children}</>;
  }

  // Retrieve authenticated staff profile
  let staffProfile: AdminStaffProfile = {
    id: session.userId,
    fullName: "Concierge Staff",
    email: "concierge@shadify.in",
    role: session.role || "staff",
  };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, fullName: true, email: true, role: true },
    });
    if (user) {
      staffProfile = {
        id: user.id,
        fullName: user.fullName,
        email: user.email || "concierge@shadify.in",
        role: user.role,
      };
    }
  } catch {
    // Fall back to session profile on transient db read issues
  }

  return <AdminShell staff={staffProfile}>{children}</AdminShell>;
}
