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
 */
const BLOCKED_PROBE_REGEX =
  /(\.(php|asp|aspx|jsp|cgi|env|git|yml|yaml|ini|config|bak|sql|sh)|wp-|xmlrpc|\/\.)/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Drop obvious bot and vulnerability scans with 404 immediately
  if (BLOCKED_PROBE_REGEX.test(pathname)) {
    return NextResponse.rewrite(new URL("/not-found", request.url), {
      status: 404,
    });
  }

  // 2. Temporary redirect (307) legacy /w/:slug to clean direct /:slug
  if (pathname.startsWith("/w/")) {
    const parts = pathname.replace(/^\/w\//, "").split("/");
    const slug = parts[0]?.toLowerCase();
    const rest = parts.slice(1).join("/");
    if (slug) {
      if (RESERVED_SLUGS.has(slug)) {
        return NextResponse.rewrite(new URL("/not-found", request.url), {
          status: 404,
        });
      }
      return NextResponse.redirect(new URL(`/${slug}${rest ? `/${rest}` : ""}`, request.url), 307);
    }
  }

  // 3. Protect /api/admin routes (return 401 JSON)
  if (pathname.startsWith("/api/admin")) {
    const sessionCookie = request.cookies.get("shadify_admin_session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized: admin session required" }, { status: 401 });
    }
  }

  // 4. Protect /admin routes (except /admin/login, redirect to login page)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionCookie = request.cookies.get("shadify_admin_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Root-level slug candidate verification
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 1) {
    const candidate = segments[0];

    // Static assets or root files with extensions (e.g. robots.txt, sitemap.xml)
    if (candidate.includes(".")) {
      return NextResponse.next();
    }

    const lowerCandidate = candidate.toLowerCase();

    // If candidate is a registered reserved route, allow Next.js to route to marketing/system page
    if (RESERVED_SLUGS.has(lowerCandidate)) {
      return NextResponse.next();
    }

    // If candidate does NOT match the strict wedding slug format, reject with 404
    // This stops malformed bot scans from touching the database
    if (!SLUG_FORMAT_REGEX.test(lowerCandidate)) {
      return NextResponse.rewrite(new URL("/not-found", request.url), {
        status: 404,
      });
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
