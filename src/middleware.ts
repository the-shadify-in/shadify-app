import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { RESERVED_SLUGS } from "@/lib/config/reserved-slugs";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Redirect legacy /w/:slug to clean direct /:slug
  if (pathname.startsWith("/w/")) {
    const parts = pathname.replace(/^\/w\//, "").split("/");
    const slug = parts[0]?.toLowerCase();
    const rest = parts.slice(1).join("/");
    if (slug) {
      if (RESERVED_SLUGS.has(slug)) {
        return NextResponse.redirect(new URL("/404", request.url));
      }
      return NextResponse.redirect(new URL(`/${slug}${rest ? `/${rest}` : ""}`, request.url), 301);
    }
  }

  // 2. Protect /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionCookie = request.cookies.get("shadify_admin_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
