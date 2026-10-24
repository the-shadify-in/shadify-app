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
    <div className="admin-studio text-studio-primary selection:text-studio-primary selection:bg-studio-champagne/30 min-h-screen bg-studio-canvas">
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
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-studio-border bg-studio-surface transition-all duration-200 md:flex ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-studio-border px-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 overflow-hidden text-left"
            title="Shadify Concierge"
          >
            <div className="shadow-xs flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-studio-border bg-studio-surfaceElevated text-studio-champagne">
              <Sparkles className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-studio-primary block font-serif text-sm font-semibold tracking-wider">
                  SHADIFY
                </span>
                <span className="text-studio-subtle block text-[10px] font-medium uppercase tracking-widest">
                  Concierge Studio
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-studio-muted hover:text-studio-primary rounded-md p-1.5 hover:bg-studio-surfaceElevated focus:outline-none focus:ring-1 focus:ring-studio-champagne"
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
            className={`shadow-xs flex w-full items-center justify-center gap-2 rounded-lg border border-studio-text-primary bg-studio-text-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-studio-focusRing ${
              isCollapsed ? "px-0" : ""
            }`}
          >
            <Plus className="h-4 w-4 shrink-0 text-studio-champagneLight" />
            {!isCollapsed && <span>Quick Provision</span>}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  item.isActive
                    ? "text-studio-primary shadow-xs border border-studio-champagneBorder bg-studio-champagneSoft font-semibold"
                    : "text-studio-muted hover:text-studio-primary hover:bg-studio-surfaceElevated"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    item.isActive ? "text-studio-champagne" : "text-studio-subtle"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Contextual link when inside a wedding */}
          {isWeddingDetail && !isCollapsed && (
            <div className="pt-4">
              <div className="text-studio-subtle mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider">
                Active Celebration
              </div>
              <div className="bg-studio-surfaceElevated/70 shadow-xs rounded-xl border border-studio-border p-3 text-xs">
                <div className="text-studio-primary font-medium">Wedding Studio</div>
                <div className="text-studio-muted mt-0.5 text-[11px]">
                  Inspecting live operational state
                </div>
                <Link
                  href="/admin"
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-studio-champagne hover:underline"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span>All Celebrations</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Staff Profile & Sign Out Footer */}
        <div className="bg-studio-surfaceElevated/50 border-t border-studio-border p-3">
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div
              className="text-studio-primary shadow-xs flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-studio-border bg-studio-surface font-serif text-xs font-semibold"
              title={staff.fullName || staff.email}
            >
              {(staff.fullName || staff.email || "S").charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-studio-primary truncate text-xs font-medium">
                  {staff.fullName || "Concierge Staff"}
                </div>
                <div className="text-studio-muted flex items-center gap-1.5 truncate text-[11px]">
                  <span className="font-medium capitalize text-studio-champagne">
                    {staff.role.replace("_", " ")}
                  </span>
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
            className={`text-studio-muted mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-studio-border bg-studio-surface px-2.5 py-1.5 text-xs font-medium transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-1 focus:ring-studio-ruby ${
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
            className="backdrop-blur-xs fixed inset-0 bg-stone-900/60 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          <div className="text-studio-primary relative flex w-full max-w-xs flex-1 flex-col border-r border-studio-border bg-studio-surface p-4 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-studio-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="shadow-xs flex h-8 w-8 items-center justify-center rounded-lg border border-studio-border bg-studio-surfaceElevated text-studio-champagne">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-studio-primary font-serif text-sm font-semibold tracking-wider">
                    SHADIFY
                  </div>
                  <div className="text-studio-subtle text-[10px] font-medium uppercase tracking-widest">
                    Concierge Studio
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close menu"
                className="text-studio-muted hover:text-studio-primary rounded-md p-1.5 hover:bg-studio-surfaceElevated"
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
                className="shadow-xs flex w-full items-center justify-center gap-2 rounded-lg border border-studio-text-primary bg-studio-text-primary px-3 py-2.5 text-xs font-medium text-white transition hover:bg-black"
              >
                <Plus className="h-4 w-4 text-studio-champagneLight" />
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
                        ? "text-studio-primary shadow-xs border border-studio-champagneBorder bg-studio-champagneSoft font-semibold"
                        : "text-studio-muted hover:text-studio-primary hover:bg-studio-surfaceElevated"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        item.isActive ? "text-studio-champagne" : "text-studio-subtle"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Staff profile & sign out */}
            <div className="border-t border-studio-border pt-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="text-studio-primary flex h-8 w-8 items-center justify-center rounded-full border border-studio-border bg-studio-surfaceElevated font-serif text-xs font-semibold">
                  {(staff.fullName || staff.email || "S").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-studio-primary truncate text-xs font-medium">
                    {staff.fullName || "Concierge Staff"}
                  </div>
                  <div className="text-studio-muted truncate text-[11px]">{staff.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-studio-muted flex w-full items-center justify-center gap-2 rounded-lg border border-studio-border bg-studio-surface py-2 text-xs font-medium hover:border-red-200 hover:bg-red-50 hover:text-red-700"
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
        <header className="bg-studio-surface/90 sticky top-0 z-20 flex h-14 items-center justify-between border-b border-studio-border px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
              className="text-studio-muted hover:text-studio-primary rounded-md p-1.5 hover:bg-studio-surfaceElevated md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.label + idx}>
                    {idx > 0 && <span className="text-studio-borderStrong">/</span>}
                    {isLast ? (
                      <span className="text-studio-primary font-serif font-medium">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-studio-muted hover:text-studio-primary transition"
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
              className="text-studio-primary shadow-xs inline-flex items-center gap-1.5 rounded-lg border border-studio-border bg-studio-surface px-3 py-1.5 text-xs font-medium transition hover:bg-studio-surfaceElevated"
            >
              <Plus className="h-3.5 w-3.5 text-studio-champagne" />
              <span className="hidden sm:inline">Provision</span>
            </button>
            <div className="text-studio-muted hidden items-center gap-2 text-xs sm:flex">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-emerald-600/20" />
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
