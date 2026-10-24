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
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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
          <h1 className="text-studio-primary font-serif text-3xl font-light tracking-tight sm:text-4xl">
            Celebrations Directory
          </h1>
          <p className="text-studio-muted mt-1 text-xs sm:text-sm">
            Database-backed registry of all managed client weddings, lifecycle states, and
            entitlements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/theme-preview"
            className="text-studio-primary shadow-xs inline-flex items-center gap-1.5 rounded-lg border border-studio-border bg-studio-surface px-3.5 py-2 text-xs font-medium transition hover:bg-studio-surfaceElevated"
          >
            <Eye className="h-3.5 w-3.5 text-studio-champagne" />
            <span>Theme Studio</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsQuickProvisionOpen(true)}
            className="shadow-xs inline-flex items-center gap-2 rounded-lg bg-studio-text-primary px-4 py-2 text-xs font-medium text-white transition hover:bg-black active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 text-studio-champagneLight" />
            <span>Spin Up Client (60s)</span>
          </button>
        </div>
      </div>

      {/* Executive Metrics Ribbon (Calm, Unified Overview) */}
      <div className="shadow-xs rounded-2xl border border-studio-border bg-studio-surface p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:divide-x sm:divide-studio-border">
          {/* Total Celebrations */}
          <div className="space-y-1 sm:pr-4">
            <div className="text-studio-muted text-[11px] font-semibold uppercase tracking-wider">
              Total Celebrations
            </div>
            <div className="text-studio-primary font-serif text-3xl font-normal sm:text-4xl">
              {counts.total}
            </div>
            <div className="text-studio-subtle text-[11px]">Managed across all tiers</div>
          </div>

          {/* Published (Live) */}
          <div className="space-y-1 sm:px-6">
            <div className="text-studio-muted flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
              <span className="inline-block h-2 w-2 rounded-full bg-[#2D5442]" />
              <span>Published (Live)</span>
            </div>
            <div className="font-serif text-3xl font-normal text-[#1E4D34] sm:text-4xl">
              {counts.published}
            </div>
            <div className="text-[11px] text-[#2D5442]">Accessible by guests</div>
          </div>

          {/* In Preparation */}
          <div className="space-y-1 sm:px-6">
            <div className="text-studio-muted flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
              <span className="inline-block h-2 w-2 rounded-full bg-[#92400E]" />
              <span>In Preparation</span>
            </div>
            <div className="font-serif text-3xl font-normal text-[#804207] sm:text-4xl">
              {inPrepCount}
            </div>
            <div className="text-[11px] text-[#92400E]">
              {counts.draft} draft • {counts.preview} preview
            </div>
          </div>

          {/* Concluded / Archived */}
          <div className="space-y-1 sm:pl-6">
            <div className="text-studio-muted flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
              <span className="inline-block h-2 w-2 rounded-full bg-stone-400" />
              <span>Concluded / Archived</span>
            </div>
            <div className="text-studio-muted font-serif text-3xl font-normal sm:text-4xl">
              {archivedCount}
            </div>
            <div className="text-studio-subtle text-[11px]">Protected retention</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="shadow-xs flex flex-col gap-3 rounded-xl border border-studio-border bg-studio-surface p-4 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Plan Filter */}
          <div className="text-studio-muted flex items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-studio-champagne" />
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-studio-primary rounded-lg border border-studio-border bg-studio-canvas px-3 py-1.5 text-xs focus:border-studio-champagne focus:outline-none"
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
              className="text-studio-primary rounded-lg border border-studio-border bg-studio-canvas px-3 py-1.5 text-xs focus:border-studio-champagne focus:outline-none"
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
              className="text-studio-muted hover:text-studio-primary rounded-lg border border-studio-border bg-studio-surfaceElevated px-3 py-1.5 text-xs font-medium hover:bg-studio-surfaceHighlight"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Celebrations Directory */}
      <div className="shadow-xs overflow-hidden rounded-2xl border border-studio-border bg-studio-surface">
        {/* Desktop Table View (≥ 768px) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-xs">
            <thead className="text-studio-muted sticky top-0 z-10 border-b border-studio-border bg-studio-surfaceElevated">
              <tr>
                <th className="px-5 py-3.5 font-medium">Couple &amp; Slug</th>
                <th className="px-5 py-3.5 font-medium">Wedding Date</th>
                <th className="px-5 py-3.5 font-medium">Plan Tier</th>
                <th className="px-5 py-3.5 font-medium">Lifecycle</th>
                <th className="px-5 py-3.5 font-medium">RSVPs</th>
                <th className="px-5 py-3.5 font-medium">Photos</th>
                <th className="px-5 py-3.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border">
              {paginatedWeddings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <AlertCircle className="text-studio-subtle mx-auto h-8 w-8" />
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
                        className="text-studio-primary mt-3 inline-flex items-center gap-1.5 rounded-lg border border-studio-border bg-studio-surfaceElevated px-3 py-1.5 text-xs font-medium hover:bg-studio-surfaceHighlight"
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
                      className="hover:bg-studio-surfaceElevated/50 group transition-colors"
                    >
                      {/* Couple & Slug */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="text-studio-primary shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-studio-border bg-studio-surfaceElevated font-serif text-sm font-semibold">
                            {w.brideName.charAt(0)}
                            {w.groomName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/weddings/${w.id}`}
                              className="text-studio-primary font-serif text-base font-semibold hover:text-studio-champagne hover:underline"
                            >
                              {w.couple}
                            </Link>
                            <div className="text-studio-muted mt-0.5 flex items-center gap-2 text-xs">
                              <span className="rounded border border-studio-borderSubtle bg-studio-surfaceElevated px-1.5 py-0.5 font-mono text-[11px]">
                                /{w.slug}
                              </span>
                              {w.hasCustomDomain && (
                                <span className="rounded border border-studio-champagneBorder bg-studio-champagneSoft px-1.5 py-0.5 text-[9px] font-medium text-studio-champagne">
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
                          <Calendar className="text-studio-subtle h-3.5 w-3.5" />
                          <span>{w.weddingDate}</span>
                        </div>
                      </td>

                      {/* Plan Tier & Overrides */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-studio-primary font-medium">
                            {planLabels[w.plan] || w.plan}
                          </span>
                          {w.hasOverride && (
                            <span
                              title="Active staff entitlement override"
                              className="rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-700"
                            >
                              OVERRIDE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lifecycle Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                            w.status === "published"
                              ? "border border-[#C2DEC9] bg-[#E8F2EC] text-[#1E4D34]"
                              : w.status === "draft"
                                ? "border border-[#EBD5B9] bg-[#FAF1E6] text-[#804207]"
                                : w.status === "preview"
                                  ? "border border-[#CBD5E1] bg-[#EDF2F7] text-[#1E3A5F]"
                                  : "border border-[#DED9D0] bg-[#F2EFE9] text-[#57534E]"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>

                      {/* RSVPs */}
                      <td className="px-5 py-4">
                        <div className="text-studio-muted flex items-center gap-1.5">
                          <Users className="text-studio-subtle h-3.5 w-3.5" />
                          <span className="text-studio-primary font-mono">{w.rsvpCount}</span>
                        </div>
                      </td>

                      {/* Photos */}
                      <td className="px-5 py-4">
                        <div className="text-studio-muted flex items-center gap-1.5">
                          <ImageIcon className="text-studio-subtle h-3.5 w-3.5" />
                          <span className="text-studio-primary font-mono">{w.photoCount}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/weddings/${w.id}`}
                            className="text-studio-primary shadow-xs inline-flex items-center gap-1.5 rounded-lg border border-studio-border bg-studio-surfaceElevated px-3 py-1.5 text-xs font-medium transition hover:border-studio-borderStrong hover:bg-studio-surfaceHighlight"
                          >
                            <Sliders className="h-3 w-3 text-studio-champagne" />
                            <span>Studio</span>
                          </Link>
                          <Link
                            href={w.status === "draft" ? `/${w.slug}/preview` : `/${w.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-studio-muted hover:text-studio-primary inline-flex items-center gap-1 rounded-lg border border-studio-border bg-studio-surface px-2 py-1.5 text-xs transition hover:bg-studio-surfaceElevated"
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

        {/* Mobile Stacked Cards View (< 768px) */}
        <div className="block divide-y divide-studio-border md:hidden">
          {paginatedWeddings.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="text-studio-subtle mx-auto h-8 w-8" />
              <div className="text-studio-primary mt-3 font-serif text-base">
                No celebrations found
              </div>
              <p className="text-studio-muted mt-1 text-xs">
                {searchQuery || planFilter !== "all" || statusFilter !== "all"
                  ? "No results matched your search criteria."
                  : "There are currently no active celebrations in the database."}
              </p>
            </div>
          ) : (
            paginatedWeddings.map((w) => {
              const planLabels: Record<string, string> = {
                lite: "Shubh (Lite)",
                premium: "Vivah (Premium)",
                platinum: "Rajwada (Platinum)",
              };

              return (
                <div key={w.id} className="space-y-3.5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-studio-primary shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-studio-border bg-studio-surfaceElevated font-serif text-sm font-semibold">
                        {w.brideName.charAt(0)}
                        {w.groomName.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/admin/weddings/${w.id}`}
                          className="text-studio-primary font-serif text-base font-semibold hover:text-studio-champagne hover:underline"
                        >
                          {w.couple}
                        </Link>
                        <div className="text-studio-muted mt-0.5 text-xs">
                          <span className="font-mono">/{w.slug}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${
                        w.status === "published"
                          ? "border border-[#C2DEC9] bg-[#E8F2EC] text-[#1E4D34]"
                          : w.status === "draft"
                            ? "border border-[#EBD5B9] bg-[#FAF1E6] text-[#804207]"
                            : w.status === "preview"
                              ? "border border-[#CBD5E1] bg-[#EDF2F7] text-[#1E3A5F]"
                              : "border border-[#DED9D0] bg-[#F2EFE9] text-[#57534E]"
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>

                  <div className="text-studio-muted grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="text-studio-subtle h-3.5 w-3.5" />
                      <span>{w.weddingDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-studio-primary font-medium">
                        {planLabels[w.plan] || w.plan}
                      </span>
                      {w.hasOverride && (
                        <span className="py-0.2 rounded-full border border-stone-300 bg-stone-100 px-1.5 text-[9px] font-semibold text-stone-700">
                          OVERRIDE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="text-studio-subtle h-3.5 w-3.5" />
                      <span>{w.rsvpCount} RSVPs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="text-studio-subtle h-3.5 w-3.5" />
                      <span>{w.photoCount} Photos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/admin/weddings/${w.id}`}
                      className="text-studio-primary shadow-xs flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-studio-border bg-studio-surfaceElevated py-2 text-xs font-medium hover:bg-studio-surfaceHighlight"
                    >
                      <Sliders className="h-3.5 w-3.5 text-studio-champagne" />
                      <span>Open Studio</span>
                    </Link>
                    <Link
                      href={w.status === "draft" ? `/${w.slug}/preview` : `/${w.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-studio-muted hover:text-studio-primary flex items-center justify-center gap-1 rounded-lg border border-studio-border bg-studio-surface px-3 py-2 text-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        {filteredWeddings.length > PAGE_SIZE && (
          <div className="bg-studio-surfaceElevated/40 text-studio-muted flex items-center justify-between border-t border-studio-border px-5 py-3.5 text-xs">
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
                className="text-studio-muted hover:text-studio-primary rounded-md border border-studio-border bg-studio-surface p-1.5 hover:bg-studio-surfaceElevated disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-studio-primary font-mono text-xs">
                {activePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages}
                className="text-studio-muted hover:text-studio-primary rounded-md border border-studio-border bg-studio-surface p-1.5 hover:bg-studio-surfaceElevated disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guest "Ask" Chips Intelligence (Collapsible Telemetry) */}
      <div className="shadow-xs overflow-hidden rounded-2xl border border-studio-border bg-studio-surface">
        <button
          type="button"
          onClick={() => setIsChipsExpanded(!isChipsExpanded)}
          className="hover:bg-studio-surfaceElevated/50 flex w-full items-center justify-between p-5 text-left transition sm:p-6"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-studio-primary font-serif text-lg font-normal">
                Guest &quot;Ask&quot; Chips Intelligence (Zero AI Telemetry)
              </h2>
              <span className="rounded-full border border-studio-champagneBorder bg-studio-champagneSoft px-2.5 py-0.5 font-mono text-[11px] font-medium text-studio-champagne">
                {allChipStats.totalTaps} Taps
              </span>
            </div>
            <p className="text-studio-muted mt-1 text-xs">
              Anonymous first-party daily counters measuring logistics questions guests ask most
            </p>
          </div>
          <span className="text-xs font-medium text-studio-champagne">
            {isChipsExpanded ? "Collapse" : "Expand"}
          </span>
        </button>

        {isChipsExpanded && (
          <div className="bg-studio-surfaceElevated/20 space-y-4 border-t border-studio-border p-5 pt-4 sm:p-6">
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
                    className={`rounded-xl border p-3.5 ${
                      isTop
                        ? "shadow-xs border-studio-champagne bg-studio-champagneSoft"
                        : "border-studio-border bg-studio-surface"
                    }`}
                  >
                    <p className="text-studio-muted truncate text-xs">{label}</p>
                    <p className="text-studio-primary mt-1 font-serif text-2xl font-normal">
                      {count}
                    </p>
                    {isTop && (
                      <span className="mt-1 inline-block text-[9px] font-semibold uppercase tracking-wider text-studio-champagne">
                        Most Asked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {perWeddingChips.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface">
                <table className="w-full text-left text-xs">
                  <thead className="text-studio-muted border-b border-studio-border bg-studio-surfaceElevated">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Wedding</th>
                      <th className="px-4 py-2.5 font-medium">Total Inquiries</th>
                      <th className="px-4 py-2.5 font-medium">Top Question</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-studio-border">
                    {perWeddingChips.slice(0, 5).map((w) => (
                      <tr key={w.id} className="hover:bg-studio-surfaceElevated/50">
                        <td className="text-studio-primary px-4 py-2.5">
                          {w.couple} <span className="text-studio-muted font-mono">({w.slug})</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-studio-champagne">
                          {w.totalTaps}
                        </td>
                        <td className="text-studio-muted px-4 py-2.5 capitalize">
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
