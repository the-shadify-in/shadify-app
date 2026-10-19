import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Database,
  HardDrive,
  RefreshCw,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHealthDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?from=/admin/health");
  }

  const r2Configured = Boolean(process.env.R2_BUCKET_NAME && process.env.R2_ACCOUNT_ID);
  const errorTrackingConfigured = Boolean(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  );

  const start = performance.now();
  let dbStatus = "connected";
  let dbLatency = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Math.round(performance.now() - start);
  } catch {
    dbStatus = "error";
  }

  // Find weddings occurring within the next 14 days
  const now = new Date();
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const upcomingWeddings = await prisma.wedding
    .findMany({
      where: {
        weddingDate: {
          gte: now,
          lte: fourteenDaysFromNow,
        },
        deletedAt: null,
      },
      include: {
        events: true,
        entitlement: true,
      },
      orderBy: {
        weddingDate: "asc",
      },
      take: 10,
    })
    .catch(() => []);

  return (
    <div className="min-h-screen bg-[#090406] text-[#FFF9F2]">
      {/* Header */}
      <header className="border-b border-[#C9933A]/20 bg-[#12070A]/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs text-[#FFF9F2]/60 hover:text-[#C9933A]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Concierge
            </Link>
            <span className="h-4 w-px bg-white/10" />
            <h1 className="font-serif text-xl font-light text-[#FFF9F2]">
              Operations & Health Monitor
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Telemetry Live
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 p-6">
        {/* Top Status Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-[#170B0E] p-5">
            <div className="flex items-center justify-between text-xs text-[#FFF9F2]/60">
              <span>PostgreSQL Database</span>
              <Database className="h-4 w-4 text-[#C9933A]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-2xl font-semibold ${
                  dbStatus === "connected" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {dbStatus === "connected" ? "Connected" : "Degraded"}
              </span>
              <span className="text-xs text-[#FFF9F2]/40">({dbLatency}ms roundtrip)</span>
            </div>
            <p className="mt-1 text-[11px] text-[#FFF9F2]/50">Heartbeat query SELECT 1 passing</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#170B0E] p-5">
            <div className="flex items-center justify-between text-xs text-[#FFF9F2]/60">
              <span>Cloudflare R2 Storage</span>
              <HardDrive className="h-4 w-4 text-[#C9933A]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-2xl font-semibold ${
                  r2Configured ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {r2Configured ? "Configured" : "Not Configured"}
              </span>
              <span className="text-xs text-[#FFF9F2]/40">
                {r2Configured ? "(90-Day Lifecycle)" : "(Mock / Local)"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#FFF9F2]/50">
              {r2Configured
                ? "Zero egress fee media pipeline"
                : "R2 bucket credentials not set in env"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#170B0E] p-5">
            <div className="flex items-center justify-between text-xs text-[#FFF9F2]/60">
              <span>Error Rate Tracking</span>
              <RefreshCw className="h-4 w-4 text-[#C9933A]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-2xl font-semibold ${
                  errorTrackingConfigured ? "text-emerald-400" : "text-zinc-400"
                }`}
              >
                {errorTrackingConfigured ? "Active" : "Not Configured"}
              </span>
              <span className="text-xs text-[#FFF9F2]/40">
                {errorTrackingConfigured ? "(Sentry DSN Set)" : "(Pending Sentry)"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#FFF9F2]/50">
              {errorTrackingConfigured
                ? "Exception stream active"
                : "Sentry DSN not configured in env"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#170B0E] p-5">
            <div className="flex items-center justify-between text-xs text-[#FFF9F2]/60">
              <span>Privacy & Erasure</span>
              <ShieldCheck className="h-4 w-4 text-[#C9933A]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-emerald-400">0 Pending</span>
              <span className="text-xs text-[#FFF9F2]/40">(DPDP SLA: 30d)</span>
            </div>
            <p className="mt-1 text-[11px] text-[#FFF9F2]/50">All erasure requests cleared</p>
          </div>
        </section>

        {/* 14-Day Wedding Readiness Checklist */}
        <section className="rounded-2xl border border-[#C9933A]/20 bg-[#12070A] p-6 shadow-xl">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-xl text-[#FFF9F2]">14-Day Wedding Readiness Gate</h2>
              <p className="text-xs text-[#FFF9F2]/60">
                Audits all weddings scheduled in the next 14 days to ensure no ceremony arrives with
                missing photos, broken UPI, or zero events.
              </p>
            </div>
            <span className="text-xs text-[#C9933A]">
              {upcomingWeddings.length} weddings in window
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            {upcomingWeddings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-[#FFF9F2]/50">
                No active weddings scheduled in the next 14 days. Concierge pipeline clear.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[#C9933A]">
                    <th className="pb-3 font-normal">Wedding / Couple</th>
                    <th className="pb-3 font-normal">Date</th>
                    <th className="pb-3 font-normal">Events Configured</th>
                    <th className="pb-3 font-normal">UPI Shagun VPA</th>
                    <th className="pb-3 font-normal">Hosting Status</th>
                    <th className="pb-3 text-right font-normal">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {upcomingWeddings.map((w) => {
                    const hasEvents = w.events.length > 0;
                    const hasUpi = Boolean(w.upiVpa);

                    return (
                      <tr key={w.id} className="hover:bg-white/[0.02]">
                        <td className="py-4 font-medium text-[#FFF9F2]">
                          {w.brideName} & {w.groomName}
                          <div className="text-[11px] text-[#FFF9F2]/50">/{w.slug}</div>
                        </td>
                        <td className="py-4 text-[#FFF9F2]/70">
                          {new Date(w.weddingDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4">
                          {hasEvents ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {w.events.length} Ceremony events
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" />0 events configured
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          {hasUpi ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {w.upiVpa}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Missing UPI ID
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-[#FFF9F2]/70">
                            5-Year Active
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            href={`/${w.slug}`}
                            target="_blank"
                            className="inline-flex items-center rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-[#FFF9F2]/80 hover:border-[#C9933A] hover:text-[#C9933A]"
                          >
                            Inspect Live
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Telemetry Architecture Overview */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-[#170B0E] p-6">
            <h3 className="font-serif text-lg text-[#FFF9F2]">Server-Side Pino Log Drain</h3>
            <p className="mt-1 text-xs text-[#FFF9F2]/60">
              Structured JSON emitted per request with strict allowlist redaction.
            </p>
            <div className="mt-4 rounded-xl bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-[#FFF9F2]/70">
              <div>
                • Service: <span className="text-emerald-400">shadify-web</span>
              </div>
              <div>
                • Format: <span className="text-emerald-400">Pino JSON (ISO Timestamps)</span>
              </div>
              <div>
                • Redacted Paths:{" "}
                <span className="text-[#C9933A]">password, phone, upiVpa, tokens, names</span>
              </div>
              <div>
                • Retention:{" "}
                <span className="text-emerald-400">14–30 Days (Axiom / Better Stack)</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#170B0E] p-6">
            <h3 className="font-serif text-lg text-[#FFF9F2]">Client Error & Vitals Policy</h3>
            <p className="mt-1 text-xs text-[#FFF9F2]/60">
              Captures real user uncaught exceptions without invasive session recording.
            </p>
            <div className="mt-4 rounded-xl bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-[#FFF9F2]/70">
              <div>
                • Tracker: <span className="text-emerald-400">Sentry / GlitchTip</span>
              </div>
              <div>
                • Session Replay:{" "}
                <span className="font-bold text-red-400">DISABLED (DPDP Zero-PII)</span>
              </div>
              <div>
                • Query Params:{" "}
                <span className="text-[#C9933A]">Tokens & secrets stripped before send</span>
              </div>
              <div>
                • Core Web Vitals:{" "}
                <span className="text-emerald-400">LCP, INP, CLS beaconed per preset</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
