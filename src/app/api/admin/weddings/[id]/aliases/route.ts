import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { isReservedSlug } from "@/lib/config/reserved-slugs";

interface RouteParams {
  params: { id: string };
}

const CreateAliasSchema = z.object({
  alias: z.string().regex(/^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/, {
    message: "Alias must be 3-40 lowercase alphanumeric characters with hyphens only",
  }),
  kind: z.enum(["slug_history", "vanity", "partner_run"]),
  partnerLabel: z.string().max(100).optional().nullable(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  try {
    const body: unknown = await req.json();
    const data = CreateAliasSchema.parse(body);

    if (isReservedSlug(data.alias)) {
      return NextResponse.json({ error: "Alias is reserved for system use" }, { status: 400 });
    }

    const alias = await prisma.weddingAlias.create({
      data: {
        weddingId: id,
        alias: data.alias,
        kind: data.kind,
        partnerLabel: data.partnerLabel || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        weddingId: id,
        actorId: session.userId,
        action: "created_alias",
        detail: { alias: data.alias, kind: data.kind, partnerLabel: data.partnerLabel },
      },
    });

    return NextResponse.json({ success: true, alias });
  } catch (err: unknown) {
    console.error(`[POST /api/admin/weddings/${id}/aliases] Error:`, err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to create alias";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
