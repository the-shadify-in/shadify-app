"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Layers,
  Palette,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { QuickProvisionModal } from "@/components/admin/QuickProvisionModal";

export interface AdminStaffProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface AdminShellProps {
  children: React.ReactNode;
  staff: AdminStaffProfile;
}

export function AdminShell({ children, staff }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Desktop sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Mobile drawer open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Quick provision modal state
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  // Logout pending state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await fetch("/api/admin/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    } finally {
      setIsLoggingOut(false);
    }
  }

  const isWeddingDetail = pathname.startsWith("/admin/weddings/") && !pathname.endsWith("/new");

  // Breadcrumbs computation
  const breadcrumbs = [{ label: "Shadify Concierge", href: "/admin" }];
  if (pathname === "/admin") {
    breadcrumbs.push({ label: "Celebrations", href: "/admin" });
  } else if (pathname === "/admin/health") {
    breadcrumbs.push({ label: "Operations & Health", href: "/admin/health" });
  } else if (pathname === "/admin/theme-preview") {
    breadcrumbs.push({ label: "Theme Studio", href: "/admin/theme-preview" });
  } else if (pathname === "/admin/weddings/new") {
    breadcrumbs.push({ label: "Celebrations", href: "/admin" });
    breadcrumbs.push({ label: "New Celebration", href: "/admin/weddings/new" });
  } else if (isWeddingDetail) {
    breadcrumbs.push({ label: "Celebrations", href: "/admin" });
    breadcrumbs.push({ label: "Wedding Studio", href: pathname });
  }

  const navItems = [
    {
      label: "Celebrations",
      href: "/admin",
      icon: Layers,
      isActive: pathname === "/admin" || pathname.startsWith("/admin/weddings"),
    },
    {
      label: "Theme Studio",
      href: "/admin/theme-preview",
      icon: Palette,
      isActive: pathname === "/admin/theme-preview",
    },
    {
      label: "Operations & Health",
      href: "/admin/health",
      icon: Activity,
      isActive: pathname === "/admin/health",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090406] text-[#FFF9F2]">
      {/* Quick Provision Modal available globally in the shell */}
      <QuickProvisionModal
        open={isProvisionOpen}
        onOpenChange={setIsProvisionOpen}
        onSuccess={(w) => {
          setIsProvisionOpen(false);
          router.push(`/admin/weddings/${w.id}`);
        }}
      />

      {/* Desktop Persistent Sidebar */}
      <aside
        aria-label="Admin Navigation"
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[#C9933A]/20 bg-[#12070A] transition-all duration-200 md:flex ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#C9933A]/15 px-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 overflow-hidden text-left"
            title="Shadify Concierge"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#C9933A]/40 bg-[#C9933A]/10 text-[#C9933A] shadow-inner">
              <Sparkles className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="block font-serif text-sm font-semibold tracking-wider text-[#FFF9F2]">
                  SHADIFY
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-[#C9933A]/80">
                  Concierge Studio
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-md p-1.5 text-[#E2D5C7]/60 hover:bg-[#C9933A]/10 hover:text-[#FFF9F2] focus:outline-none focus:ring-1 focus:ring-[#C9933A]"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Action Button: Quick Provision */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => setIsProvisionOpen(true)}
            title="Quick Provision Celebration"
            className={`flex w-full items-center justify-center gap-2 rounded-lg border border-[#C9933A]/40 bg-gradient-to-r from-[#C9933A]/25 to-[#C9933A]/10 px-3 py-2 text-xs font-medium text-[#E8B96B] transition hover:border-[#C9933A] hover:from-[#C9933A]/35 hover:to-[#C9933A]/20 focus:outline-none focus:ring-1 focus:ring-[#C9933A] ${
              isCollapsed ? "px-0" : ""
            }`}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Quick Provision</span>}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  item.isActive
                    ? "border border-[#C9933A]/40 bg-[#C9933A]/15 text-[#E8B96B] shadow-sm"
                    : "text-[#E2D5C7]/70 hover:bg-[#C9933A]/10 hover:text-[#FFF9F2]"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Contextual link when inside a wedding */}
          {isWeddingDetail && !isCollapsed && (
            <div className="pt-4">
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#C9933A]/60">
                Active Celebration
              </div>
              <div className="rounded-lg border border-[#C9933A]/25 bg-[#090406]/60 p-2.5 text-xs">
                <div className="font-medium text-[#FFF9F2]">Wedding Studio</div>
                <div className="mt-0.5 text-[10px] text-[#E2D5C7]/60">
                  Inspecting live operational state
                </div>
                <Link
                  href="/admin"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#C9933A] hover:underline"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span>All Celebrations</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Staff Profile & Sign Out Footer */}
        <div className="border-t border-[#C9933A]/15 bg-[#090406]/40 p-3">
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9933A]/40 bg-[#C9933A]/20 text-xs font-semibold text-[#E8B96B]"
              title={staff.fullName || staff.email}
            >
              {(staff.fullName || staff.email || "S").charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-[#FFF9F2]">
                  {staff.fullName || "Concierge Staff"}
                </div>
                <div className="flex items-center gap-1.5 truncate text-[10px] text-[#E2D5C7]/60">
                  <span className="capitalize text-[#C9933A]">{staff.role.replace("_", " ")}</span>
                  <span>•</span>
                  <span className="truncate">{staff.email}</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Sign out"
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-white/5 bg-white/5 px-2.5 py-1.5 text-xs text-[#E2D5C7]/80 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus:ring-1 focus:ring-red-400 ${
              isCollapsed ? "px-0" : ""
            }`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!isCollapsed && <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Left Slide-in) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          <div className="relative flex w-full max-w-xs flex-1 flex-col border-r border-[#C9933A]/20 bg-[#12070A] p-4 text-[#FFF9F2]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#C9933A]/15 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9933A]/40 bg-[#C9933A]/15 text-[#C9933A]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-serif text-sm font-semibold tracking-wider text-[#FFF9F2]">
                    SHADIFY
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-[#C9933A]/80">
                    Concierge Studio
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-[#E2D5C7]/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Provision button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsMobileOpen(false);
                  setIsProvisionOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C9933A]/40 bg-gradient-to-r from-[#C9933A]/25 to-[#C9933A]/10 px-3 py-2.5 text-xs font-medium text-[#E8B96B]"
              >
                <Plus className="h-4 w-4" />
                <span>Quick Provision Celebration</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1.5 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      item.isActive
                        ? "border border-[#C9933A]/40 bg-[#C9933A]/15 text-[#E8B96B]"
                        : "text-[#E2D5C7]/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Staff profile & sign out */}
            <div className="border-t border-[#C9933A]/15 pt-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C9933A]/40 bg-[#C9933A]/20 text-xs font-semibold text-[#E8B96B]">
                  {(staff.fullName || staff.email || "S").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-[#FFF9F2]">
                    {staff.fullName || "Concierge Staff"}
                  </div>
                  <div className="truncate text-[10px] text-[#E2D5C7]/60">{staff.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 py-2 text-xs text-[#E2D5C7] hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-200 ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Global Top Bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#C9933A]/15 bg-[#12070A]/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-md p-1.5 text-[#E2D5C7]/80 hover:bg-white/10 hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.label + idx}>
                    {idx > 0 && <span className="text-[#C9933A]/40">/</span>}
                    {isLast ? (
                      <span className="font-medium text-[#E8B96B]">{crumb.label}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-[#E2D5C7]/70 transition hover:text-[#FFF9F2]"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsProvisionOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#C9933A]/40 bg-[#C9933A]/10 px-2.5 py-1 text-xs font-medium text-[#E8B96B] transition hover:bg-[#C9933A]/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Provision</span>
            </button>
            <div className="hidden items-center gap-2 text-xs text-[#E2D5C7]/60 sm:flex">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span>Workspace Connected</span>
            </div>
          </div>
        </header>

        {/* Page Children */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
