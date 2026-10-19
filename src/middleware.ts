import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RESERVED_SLUGS } from "@/lib/config/reserved-slugs";

/**
 * Strict slug check matching PostgreSQL chk_wedding_slug constraint:
 * 3 to 40 characters, lowercase alphanumeric and internal hyphens.
 */
const SLUG_FORMAT_REGEX = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/;

/**
 * Common probe extensions and scanning patterns that should be dropped immediately.
 * Anchored to prevent false positives on legitimate paths.
 */
const BLOCKED_PROBE_REGEX =
  /(^\/(wp-|xmlrpc)|\.(php|asp|aspx|jsp|cgi|env|git|yml|yaml|ini|config|bak|sql|sh)(\/|$))/i;

/**
 * Known legitimate static files permitted at the root level.
 * Any other dotted single-segment file path is rejected before touching the database.
 */
const KNOWN_PUBLIC_FILES = new Set([
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "site.webmanifest",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Explicitly allow .well-known paths (e.g. /.well-known/security.txt)
  if (pathname.startsWith("/.well-known/")) {
    return NextResponse.next();
  }

  // 2. Drop obvious bot and vulnerability scans with bare 404 immediately
  if (BLOCKED_PROBE_REGEX.test(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // 3. Temporary redirect (307) legacy /w/:slug to clean direct /:slug
  if (pathname.startsWith("/w/")) {
    const parts = pathname.replace(/^\/w\//, "").split("/");
    const slug = parts[0]?.toLowerCase();
    const rest = parts.slice(1).join("/");
    if (slug) {
      if (RESERVED_SLUGS.has(slug)) {
        return new NextResponse(null, { status: 404 });
      }
      return NextResponse.redirect(new URL(`/${slug}${rest ? `/${rest}` : ""}`, request.url), 307);
    }
  }

  // 4. Protect /api/admin routes (EXEMPTING /api/admin/auth/* e.g. login & logout)
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/auth/")) {
    const sessionCookie = request.cookies.get("shadify_admin_session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized: admin session required" }, { status: 401 });
    }
  }

  // 5. Protect /admin routes (except /admin/login, redirect to login page)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionCookie = request.cookies.get("shadify_admin_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 6. Root-level slug candidate verification
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 1) {
    const candidate = segments[0];

    // Single-segment dotted file check (e.g. /backup.zip, /test.html)
    if (candidate.includes(".")) {
      if (KNOWN_PUBLIC_FILES.has(candidate.toLowerCase())) {
        return NextResponse.next();
      }
      // Unknown dotted files return bare 404 without reaching database
      return new NextResponse(null, { status: 404 });
    }

    const lowerCandidate = candidate.toLowerCase();

    // If candidate has uppercase characters, redirect to canonical lowercase
    if (candidate !== lowerCandidate) {
      return NextResponse.redirect(new URL(`/${lowerCandidate}`, request.url), 307);
    }

    // If candidate is a registered reserved route, allow Next.js to route to marketing/system page
    if (RESERVED_SLUGS.has(lowerCandidate)) {
      return NextResponse.next();
    }

    // If candidate does NOT match the strict wedding slug format, reject with bare 404
    // This stops malformed bot scans from touching the database
    if (!SLUG_FORMAT_REGEX.test(lowerCandidate)) {
      return new NextResponse(null, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
