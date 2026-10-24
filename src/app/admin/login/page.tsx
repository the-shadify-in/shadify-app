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
    <main className="text-studio-primary selection:text-studio-primary flex min-h-screen items-center justify-center bg-studio-canvas px-4 selection:bg-studio-champagne/30">
      <Suspense fallback={<div className="text-studio-muted text-xs">Loading...</div>}>
        <AdminLoginClient />
      </Suspense>
    </main>
  );
}
