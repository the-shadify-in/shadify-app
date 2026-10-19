import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import ThemePreviewClient from "./ThemePreviewClient";

export const dynamic = "force-dynamic";

export default async function ThemePreviewPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?from=/admin/theme-preview");
  }

  return <ThemePreviewClient />;
}
