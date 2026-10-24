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
            <div className="border-studio-champagne/30 bg-studio-champagne/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-studio-champagne shadow-inner">
              <Sparkles className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-studio-primary block font-serif text-sm font-semibold tracking-wider">
                  SHADIFY
                </span>
                <span className="text-studio-champagne/80 block text-[10px] uppercase tracking-widest">
                  Concierge Studio
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-studio-muted hover:text-studio-primary rounded-md p-1.5 hover:bg-studio-surfaceHighlight focus:outline-none focus:ring-1 focus:ring-studio-champagne"
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
            className={`border-studio-champagne/30 bg-studio-champagne/10 hover:border-studio-champagne/60 hover:bg-studio-champagne/20 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-studio-champagne transition focus:outline-none focus:ring-1 focus:ring-studio-champagne ${
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
                    ? "border-studio-champagne/40 bg-studio-champagne/15 border text-studio-champagne shadow-sm"
                    : "text-studio-muted hover:text-studio-primary hover:bg-studio-surfaceHighlight"
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
              <div className="text-studio-champagne/80 mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider">
                Active Celebration
              </div>
              <div className="bg-studio-canvas/60 rounded-lg border border-studio-border p-2.5 text-xs">
                <div className="text-studio-primary font-medium">Wedding Studio</div>
                <div className="text-studio-muted mt-0.5 text-[10px]">
                  Inspecting live operational state
                </div>
                <Link
                  href="/admin"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-studio-champagne hover:underline"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span>All Celebrations</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Staff Profile & Sign Out Footer */}
        <div className="bg-studio-canvas/40 border-t border-studio-border p-3">
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div
              className="border-studio-champagne/30 bg-studio-champagne/15 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold text-studio-champagne"
              title={staff.fullName || staff.email}
            >
              {(staff.fullName || staff.email || "S").charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-studio-primary truncate text-xs font-medium">
                  {staff.fullName || "Concierge Staff"}
                </div>
                <div className="text-studio-muted flex items-center gap-1.5 truncate text-[10px]">
                  <span className="capitalize text-studio-champagne">
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
            className={`text-studio-muted hover:border-studio-ruby/50 hover:bg-studio-ruby/15 mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-studio-border bg-studio-surfaceElevated px-2.5 py-1.5 text-xs transition hover:text-red-300 focus:outline-none focus:ring-1 focus:ring-studio-ruby ${
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

          <div className="text-studio-primary relative flex w-full max-w-xs flex-1 flex-col border-r border-studio-border bg-studio-surface p-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-studio-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="border-studio-champagne/30 bg-studio-champagne/15 flex h-8 w-8 items-center justify-center rounded-lg border text-studio-champagne">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-studio-primary font-serif text-sm font-semibold tracking-wider">
                    SHADIFY
                  </div>
                  <div className="text-studio-champagne/80 text-[10px] uppercase tracking-widest">
                    Concierge Studio
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close menu"
                className="text-studio-muted hover:text-studio-primary rounded-md p-1.5 hover:bg-studio-surfaceHighlight"
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
                className="border-studio-champagne/30 bg-studio-champagne/10 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium text-studio-champagne"
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
                        ? "border-studio-champagne/40 bg-studio-champagne/15 border text-studio-champagne"
                        : "text-studio-muted hover:text-studio-primary hover:bg-studio-surfaceHighlight"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Staff profile & sign out */}
            <div className="border-t border-studio-border pt-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="border-studio-champagne/30 bg-studio-champagne/15 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold text-studio-champagne">
                  {(staff.fullName || staff.email || "S").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-studio-primary truncate text-xs font-medium">
                    {staff.fullName || "Concierge Staff"}
                  </div>
                  <div className="text-studio-muted truncate text-[10px]">{staff.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-studio-muted hover:border-studio-ruby/50 hover:bg-studio-ruby/15 flex w-full items-center justify-center gap-2 rounded-md border border-studio-border bg-studio-surfaceElevated py-2 text-xs hover:text-red-300"
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
              className="text-studio-muted hover:text-studio-primary rounded-md p-1.5 hover:bg-studio-surfaceHighlight md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.label + idx}>
                    {idx > 0 && <span className="text-studio-muted/40">/</span>}
                    {isLast ? (
                      <span className="font-medium text-studio-champagne">{crumb.label}</span>
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
              className="border-studio-champagne/40 bg-studio-champagne/10 hover:bg-studio-champagne/20 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-studio-champagne transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Provision</span>
            </button>
            <div className="text-studio-muted hidden items-center gap-2 text-xs sm:flex">
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
