import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Reserved system paths that can never be claimed as a wedding slug
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "www",
  "billing",
  "login",
  "signup",
  "static",
  "media",
  "cdn",
  "mail",
  "support",
  "help",
  "w",
  "p",
  "dashboard",
  "preview",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Guard /w/[slug] against reserved slugs
  if (pathname.startsWith("/w/")) {
    const slug = pathname.split("/")[2]?.toLowerCase();
    if (slug && RESERVED_SLUGS.has(slug)) {
      return NextResponse.redirect(new URL("/404", request.url));
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
