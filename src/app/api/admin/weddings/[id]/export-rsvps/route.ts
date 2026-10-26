import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getEffectiveEntitlements } from "@/features/entitlements";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = params;

  // 1. Strict Staff & Couple Authorization Guard
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }

  // Cross-tenant protection: staff/super_admin have platform scope; couple must be a member of this wedding
  if (session.role !== "super_admin" && session.role !== "staff") {
    if (session.role === "couple") {
      const membership = await prisma.weddingMember?.findUnique?.({
        where: {
          weddingId_userId: {
            weddingId: id,
            userId: session.userId,
          },
        },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "Forbidden. You do not have permission to export RSVPs for this wedding." },
          { status: 403 },
        );
      }
    } else {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }
  }

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id },
      include: {
        events: true,
        rsvps: {
          include: {
            event: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Wedding celebration not found" }, { status: 404 });
    }

    // 2. Entitlement Guard: Catering export is a Premium/Platinum capability
    const effective = await getEffectiveEntitlements(id);
    if (wedding.plan === "lite" && !effective.hasActiveOverride) {
      return NextResponse.json(
        { error: "RSVP catering export requires the Premium or Platinum plan." },
        { status: 403 },
      );
    }

    // 2. Build RFC 4180 Compliant CSV
    const headers = [
      "Respondent Name",
      "Phone",
      "Ceremony / Event",
      "Attending",
      "Party Size",
      "Meal Preference",
      "Requires Stay",
      "Arrival & Dietary Notes",
      "Blessing Message",
      "Submission Date (IST)",
    ];

    const sanitizeCsvFormula = (val: string): string => {
      // Prevent CSV / Excel Formula Injection (OWASP standard: prefix dangerous leading characters with a single quote)
      if (/^[\s]*[=+\-@\t\r]/.test(val)) {
        return `'${val}`;
      }
      return val;
    };

    const escapeCsv = (str: string | number | null | undefined): string => {
      if (str === null || str === undefined) return '""';
      const sanitized = sanitizeCsvFormula(String(str));
      const clean = sanitized.replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = wedding.rsvps.map((r) => [
      escapeCsv(r.respondentName),
      escapeCsv(r.respondentPhone || "Not provided"),
      escapeCsv(r.event?.title || "General Celebration"),
      escapeCsv(r.attending ? "Yes" : "No"),
      escapeCsv(r.partySize),
      escapeCsv(r.mealPreference || "No Preference"),
      escapeCsv(r.needsStay ? "Yes" : "No"),
      escapeCsv(r.arrivalNotes || ""),
      escapeCsv(r.blessingMessage || ""),
      escapeCsv(new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const filename = `caterer-rsvps-${wedding.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

    // 3. Audit Logging: Record export action without logging sensitive guest PII
    await prisma.auditLog.create({
      data: {
        weddingId: id,
        actorId: session.userId,
        action: "wedding.export_rsvps",
        detail: {
          format: "csv",
          rowCount: wedding.rsvps.length,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: unknown) {
    console.error(`[GET /api/admin/weddings/${id}/export-rsvps] Error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
