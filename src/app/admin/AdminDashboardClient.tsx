"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Eye,
  Sparkles,
  Search,
  Filter,
  Sliders,
  Calendar,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { QuickProvisionModal } from "@/components/admin/QuickProvisionModal";
import type { AllWeddingsChipStats, WeddingChipSummary } from "@/features/analytics/chip-counts";

export interface DashboardWeddingItem {
  id: string;
  slug: string;
  brideName: string;
  groomName: string;
  couple: string;
  weddingDate: string;
  plan: "lite" | "premium" | "platinum";
  status: "draft" | "preview" | "published" | "archived" | "expired";
  createdAt: string;
  hasCustomDomain: boolean;
  hasOverride: boolean;
  rsvpCount: number;
  photoCount: number;
  shagunCount: number;
}

export interface DashboardCounts {
  total: number;
  published: number;
  draft: number;
  preview: number;
  archived: number;
  expired: number;
}

interface AdminDashboardClientProps {
  weddings: DashboardWeddingItem[];
  counts: DashboardCounts;
  allChipStats?: AllWeddingsChipStats;
  perWeddingChips?: WeddingChipSummary[];
}

const PAGE_SIZE = 10;

export default function AdminDashboardClient({
  weddings = [],
  counts = {
    total: 0,
    published: 0,
    draft: 0,
    preview: 0,
    archived: 0,
    expired: 0,
  },
  allChipStats = {
    totalTaps: 0,
    otherSharePercent: 0,
    topicBreakdown: {},
    topTopic: null,
  },
  perWeddingChips = [],
}: AdminDashboardClientProps) {
  const [isQuickProvisionOpen, setIsQuickProvisionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isChipsExpanded, setIsChipsExpanded] = useState(false);

  // Filter and search logic
  const filteredWeddings = useMemo(() => {
    return weddings.filter((w) => {
      // Search matching (couple names or slug)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = w.couple.toLowerCase().includes(q);
        const matchesSlug = w.slug.toLowerCase().includes(q);
        if (!matchesName && !matchesSlug) return false;
      }

      // Plan filter
      if (planFilter !== "all" && w.plan !== planFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && w.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [weddings, searchQuery, planFilter, statusFilter]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredWeddings.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedWeddings = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredWeddings.slice(start, start + PAGE_SIZE);
  }, [filteredWeddings, activePage]);

  function handleResetFilters() {
    setSearchQuery("");
    setPlanFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  }

  const inPrepCount = (counts.draft || 0) + (counts.preview || 0);
  const archivedCount = (counts.archived || 0) + (counts.expired || 0);

  return (
    <div className="space-y-8 p-6 sm:p-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-studio-primary font-serif text-2xl font-light sm:text-3xl">
            Celebrations Directory
          </h1>
          <p className="text-studio-muted mt-1 text-xs">
            Database-backed registry of all managed client weddings, lifecycle states, and
            entitlements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/theme-preview"
            className="text-studio-primary inline-flex items-center gap-1.5 rounded-lg border border-studio-border bg-studio-surface px-3.5 py-2 text-xs font-medium transition hover:border-studio-champagne/40 hover:bg-studio-surfaceElevated"
          >
            <Eye className="h-3.5 w-3.5 text-studio-champagne" />
            <span>Theme Studio</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsQuickProvisionOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-studio-champagne px-4 py-2 text-xs font-semibold text-black shadow-md transition-all hover:bg-studio-champagneLight active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Spin Up Client (60s)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards (Database-derived totals) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-studio-border bg-studio-surface p-5 shadow-sm">
          <div className="text-studio-muted flex items-center justify-between text-xs">
            <span>Total Celebrations</span>
            <Layers className="h-4 w-4 text-studio-champagne" />
          </div>
          <div className="text-studio-primary mt-2 font-serif text-3xl font-light">
            {counts.total}
          </div>
          <div className="text-studio-muted/70 mt-1 text-[11px]">Managed across all tiers</div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-studio-surface p-5 shadow-sm">
          <div className="text-studio-muted flex items-center justify-between text-xs">
            <span>Published (Live)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-serif text-3xl font-light text-emerald-400">
            {counts.published}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/70">Accessible by guests</div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-studio-surface p-5 shadow-sm">
          <div className="text-studio-muted flex items-center justify-between text-xs">
            <span>In Preparation</span>
            <Sliders className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-serif text-3xl font-light text-amber-400">{inPrepCount}</div>
          <div className="mt-1 text-[11px] text-amber-400/70">
            {counts.draft} draft • {counts.preview} preview
          </div>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-studio-surface p-5 shadow-sm">
          <div className="text-studio-muted flex items-center justify-between text-xs">
            <span>Concluded / Archived</span>
            <ShieldCheck className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 font-serif text-3xl font-light text-purple-300">{archivedCount}</div>
          <div className="mt-1 text-[11px] text-purple-400/70">Protected retention</div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-studio-border bg-studio-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="text-studio-subtle absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by couple names or slug (e.g. priya-rahul)..."
            className="text-studio-primary placeholder:text-studio-subtle w-full rounded-lg border border-studio-border bg-studio-canvas py-2 pl-9 pr-4 text-xs focus:border-studio-champagne focus:outline-none focus:ring-1 focus:ring-studio-champagne"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Plan Filter */}
          <div className="text-studio-muted flex items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-studio-champagne" />
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-studio-primary rounded-md border border-studio-border bg-studio-canvas px-2.5 py-1.5 text-xs focus:border-studio-champagne focus:outline-none"
            >
              <option value="all">All Plans</option>
              <option value="lite">Shubh (Lite)</option>
              <option value="premium">Vivah (Premium)</option>
              <option value="platinum">Rajwada (Platinum)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="text-studio-muted flex items-center gap-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-studio-primary rounded-md border border-studio-border bg-studio-canvas px-2.5 py-1.5 text-xs focus:border-studio-champagne focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="preview">Preview</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {(searchQuery || planFilter !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-studio-muted hover:text-studio-primary rounded-md border border-studio-border bg-studio-surfaceElevated px-2.5 py-1.5 text-xs hover:bg-studio-surfaceHighlight"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Celebrations Table */}
      <div className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-studio-muted border-b border-studio-border bg-studio-surfaceElevated/60">
              <tr>
                <th className="px-5 py-3 font-medium">Couple &amp; Slug</th>
                <th className="px-5 py-3 font-medium">Wedding Date</th>
                <th className="px-5 py-3 font-medium">Plan Tier</th>
                <th className="px-5 py-3 font-medium">Lifecycle</th>
                <th className="px-5 py-3 font-medium">RSVPs</th>
                <th className="px-5 py-3 font-medium">Photos</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border">
              {paginatedWeddings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-studio-champagne/50" />
                    <div className="text-studio-primary mt-3 font-serif text-base">
                      No celebrations found
                    </div>
                    <p className="text-studio-muted mt-1 text-xs">
                      {searchQuery || planFilter !== "all" || statusFilter !== "all"
                        ? "No results matched your search criteria."
                        : "There are currently no active celebrations in the database."}
                    </p>
                    {(searchQuery || planFilter !== "all" || statusFilter !== "all") && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-studio-champagne/40 bg-studio-champagne/10 px-3 py-1.5 text-xs text-studio-champagne hover:bg-studio-champagne/20"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Clear All Filters</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedWeddings.map((w) => {
                  const planLabels: Record<string, string> = {
                    lite: "Shubh (Lite)",
                    premium: "Vivah (Premium)",
                    platinum: "Rajwada (Platinum)",
                  };

                  return (
                    <tr
                      key={w.id}
                      className="group transition-colors hover:bg-studio-surfaceElevated/40"
                    >
                      {/* Couple & Slug */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-studio-champagne/30 bg-studio-champagne/10 font-serif text-sm font-semibold text-studio-champagne">
                            {w.brideName.charAt(0)}
                            {w.groomName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/weddings/${w.id}`}
                              className="text-studio-primary font-serif text-sm font-medium hover:text-studio-champagne hover:underline"
                            >
                              {w.couple}
                            </Link>
                            <div className="text-studio-muted flex items-center gap-2 text-[11px]">
                              <span className="font-mono">/{w.slug}</span>
                              {w.hasCustomDomain && (
                                <span className="rounded bg-studio-champagne/20 px-1 py-0.5 text-[9px] text-studio-champagne">
                                  Custom Domain
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Wedding Date */}
                      <td className="text-studio-muted px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-studio-champagne/60" />
                          <span>{w.weddingDate}</span>
                        </div>
                      </td>

                      {/* Plan Tier & Overrides */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-medium text-studio-champagne">
                            {planLabels[w.plan] || w.plan}
                          </span>
                          {w.hasOverride && (
                            <span
                              title="Active staff entitlement override"
                              className="py-0.2 rounded-full border border-studio-champagne/50 bg-studio-champagne/20 px-1.5 text-[9px] font-semibold text-studio-champagne"
                            >
                              OVERRIDE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lifecycle Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${
                            w.status === "published"
                              ? "border border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                              : w.status === "draft"
                                ? "border border-amber-500/40 bg-amber-950/60 text-amber-300"
                                : w.status === "preview"
                                  ? "border border-sky-500/40 bg-sky-950/60 text-sky-300"
                                  : "border border-purple-500/40 bg-purple-950/60 text-purple-300"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>

                      {/* RSVPs */}
                      <td className="px-5 py-4">
                        <div className="text-studio-muted flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-studio-champagne/50" />
                          <span>{w.rsvpCount}</span>
                        </div>
                      </td>

                      {/* Photos */}
                      <td className="px-5 py-4">
                        <div className="text-studio-muted flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-studio-champagne/50" />
                          <span>{w.photoCount}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/weddings/${w.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-studio-champagne/40 bg-studio-champagne/10 px-2.5 py-1 text-[11px] font-medium text-studio-champagne transition hover:bg-studio-champagne/20"
                          >
                            <Sliders className="h-3 w-3" />
                            <span>Studio</span>
                          </Link>
                          <Link
                            href={w.status === "draft" ? `/${w.slug}/preview` : `/${w.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-studio-muted hover:text-studio-primary inline-flex items-center gap-1 rounded-md border border-studio-border bg-studio-surfaceElevated px-2 py-1 text-[11px] transition hover:bg-studio-surfaceHighlight"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Preview</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredWeddings.length > PAGE_SIZE && (
          <div className="text-studio-muted flex items-center justify-between border-t border-studio-border bg-studio-surfaceElevated/40 px-5 py-3 text-xs">
            <div>
              Showing{" "}
              <span className="text-studio-primary font-medium">
                {(activePage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="text-studio-primary font-medium">
                {Math.min(activePage * PAGE_SIZE, filteredWeddings.length)}
              </span>{" "}
              of <span className="text-studio-primary font-medium">{filteredWeddings.length}</span>{" "}
              celebrations
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="text-studio-muted hover:text-studio-primary rounded-md border border-studio-border p-1 hover:bg-studio-surfaceHighlight disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-xs text-studio-champagne">
                {activePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages}
                className="text-studio-muted hover:text-studio-primary rounded-md border border-studio-border p-1 hover:bg-studio-surfaceHighlight disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guest "Ask" Chips Intelligence (Collapsible Telemetry) */}
      <div className="rounded-xl border border-studio-border bg-studio-surface shadow-sm">
        <button
          type="button"
          onClick={() => setIsChipsExpanded(!isChipsExpanded)}
          className="flex w-full items-center justify-between p-5 text-left transition hover:bg-studio-surfaceElevated/40"
        >
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-studio-primary font-serif text-lg font-light">
                Guest &quot;Ask&quot; Chips Intelligence (Zero AI Telemetry)
              </h2>
              <span className="rounded-full bg-studio-champagne/20 px-2.5 py-0.5 font-mono text-[10px] text-studio-champagne">
                {allChipStats.totalTaps} Taps
              </span>
            </div>
            <p className="text-studio-muted mt-1 text-xs">
              Anonymous first-party daily counters measuring logistics questions guests ask most
            </p>
          </div>
          <span className="text-xs text-studio-champagne">
            {isChipsExpanded ? "Collapse" : "Expand"}
          </span>
        </button>

        {isChipsExpanded && (
          <div className="space-y-4 border-t border-studio-border p-5 pt-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
              {[
                { key: "timings", label: "Timings" },
                { key: "venue", label: "Venue & Map" },
                { key: "dress_code", label: "Dress Code" },
                { key: "gifts", label: "Gifts" },
                { key: "rsvp", label: "RSVP" },
                { key: "other", label: "Something Else" },
              ].map(({ key, label }) => {
                const count = allChipStats.topicBreakdown[key] || 0;
                const isTop = allChipStats.topTopic === key && count > 0;
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-3 ${
                      isTop
                        ? "border-studio-champagne bg-studio-champagne/10"
                        : "border-studio-border bg-studio-surfaceElevated"
                    }`}
                  >
                    <p className="text-studio-muted truncate text-[11px]">{label}</p>
                    <p className="text-studio-primary mt-1 font-serif text-xl">{count}</p>
                    {isTop && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-studio-champagne">
                        Most Asked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {perWeddingChips.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-studio-border bg-studio-surfaceElevated/40">
                <table className="w-full text-left text-xs">
                  <thead className="text-studio-muted border-b border-studio-border bg-studio-surfaceElevated">
                    <tr>
                      <th className="px-4 py-2 font-medium">Wedding</th>
                      <th className="px-4 py-2 font-medium">Total Inquiries</th>
                      <th className="px-4 py-2 font-medium">Top Question</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-studio-border">
                    {perWeddingChips.slice(0, 5).map((w) => (
                      <tr key={w.id}>
                        <td className="text-studio-primary px-4 py-2">
                          {w.couple}{" "}
                          <span className="text-studio-muted/60 font-mono">({w.slug})</span>
                        </td>
                        <td className="px-4 py-2 font-mono text-studio-champagne">{w.totalTaps}</td>
                        <td className="text-studio-muted px-4 py-2 capitalize">
                          {w.topQuestion?.replace(/_/g, " ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <QuickProvisionModal
        open={isQuickProvisionOpen}
        onOpenChange={setIsQuickProvisionOpen}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
