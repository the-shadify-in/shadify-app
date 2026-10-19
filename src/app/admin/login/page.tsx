import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminLoginClient from "./AdminLoginClient";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070304] px-4 text-[#FFF9F2]">
      <Suspense fallback={<div className="text-xs text-[#E2D5C7]/60">Loading...</div>}>
        <AdminLoginClient />
      </Suspense>
    </main>
  );
}
