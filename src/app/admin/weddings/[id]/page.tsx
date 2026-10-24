import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getEffectiveEntitlements } from "@/features/entitlements";
import WeddingDetailClient from "./WeddingDetailClient";

export const dynamic = "force-dynamic";

interface WeddingDetailPageProps {
  params: { id: string };
}

export default async function WeddingDetailPage({ params }: WeddingDetailPageProps) {
  const { id } = params;

  // 1. Strict Server-Side Staff Authentication
  const session = await getAdminSession();
  if (!session) {
    redirect(`/admin/login?from=/admin/weddings/${id}`);
  }

  // 2. Fetch full operational wedding record from database
  const [wedding, effective, photoCount] = await Promise.all([
    prisma.wedding.findUnique({
      where: { id },
      include: {
        events: { orderBy: { sortOrder: "asc" } },
        vips: { orderBy: { sortOrder: "asc" } },
        aliases: { orderBy: { createdAt: "desc" } },
        qrAssets: {
          orderBy: { createdAt: "desc" },
          include: { scanTests: { orderBy: { testedAt: "desc" } } },
        },
        consents: { orderBy: { grantedAt: "desc" } },
        entitlement: true,
        rsvps: {
          include: { event: true },
          orderBy: { createdAt: "desc" },
        },
        auditLogs: {
          include: { actor: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    }),
    getEffectiveEntitlements(id).catch(() => null),
    prisma.photo.count({ where: { weddingId: id } }).catch(() => 0),
  ]);

  if (!wedding) {
    notFound();
  }

  // 3. Serialize BigInt or non-serializable fields for React Client Component
  const serialized = {
    ...wedding,
    weddingDate: wedding.weddingDate.toISOString().slice(0, 10),
    publishedAt: wedding.publishedAt ? wedding.publishedAt.toISOString() : null,
    createdAt: wedding.createdAt.toISOString(),
    contentExpiresAt: wedding.contentExpiresAt ? wedding.contentExpiresAt.toISOString() : null,
    hasPrivatePin: Boolean(wedding.privatePinHash),
    privatePinHash: undefined,
    entitlement: wedding.entitlement
      ? {
          ...wedding.entitlement,
          hostingUntil: wedding.entitlement.hostingUntil.toISOString(),
          maxOriginalsGb: wedding.entitlement.maxOriginalsGb
            ? Number(wedding.entitlement.maxOriginalsGb)
            : null,
        }
      : null,
    events: wedding.events.map((e) => ({
      ...e,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt ? e.endsAt.toISOString() : null,
      createdAt: e.createdAt.toISOString(),
    })),
    aliases: wedding.aliases.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      retiredAt: a.retiredAt ? a.retiredAt.toISOString() : null,
    })),
    qrAssets: wedding.qrAssets.map((q) => ({
      ...q,
      approvedAt: q.approvedAt ? q.approvedAt.toISOString() : null,
      printedAt: q.printedAt ? q.printedAt.toISOString() : null,
      createdAt: q.createdAt.toISOString(),
      scanTests: q.scanTests.map((st) => ({
        ...st,
        testedAt: st.testedAt.toISOString(),
      })),
    })),
    consents: wedding.consents.map((c) => ({
      ...c,
      grantedAt: c.grantedAt.toISOString(),
      withdrawnAt: c.withdrawnAt ? c.withdrawnAt.toISOString() : null,
    })),
    rsvps: wedding.rsvps.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      consentAt: r.consentAt.toISOString(),
    })),
    auditLogs: wedding.auditLogs.map((l) => ({
      ...l,
      id: l.id.toString(),
      createdAt: l.createdAt.toISOString(),
    })),
  };

  const serializedEffective = effective
    ? {
        ...effective,
        hostingUntil: effective.hostingUntil.toISOString(),
        originalsExpireAt: effective.originalsExpireAt.toISOString(),
      }
    : null;

  return (
    <WeddingDetailClient
      initialWedding={serialized}
      staffSession={session}
      initialEffectiveEntitlements={serializedEffective}
      initialPhotoCount={photoCount}
    />
  );
}
