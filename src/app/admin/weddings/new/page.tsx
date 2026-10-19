import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import NewWeddingClient from "./NewWeddingClient";

export const dynamic = "force-dynamic";

export default async function NewWeddingPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?from=/admin/weddings/new");
  }

  return <NewWeddingClient />;
}
