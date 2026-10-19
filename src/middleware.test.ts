import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { signSessionToken, SESSION_COOKIE_NAME } from "./lib/auth";

describe("Middleware Hardening & Route Protection (A1, A6)", () => {
  it("A1: allows /api/admin/auth/login through without a session cookie", () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
    });
    const res = middleware(req);
    // Should not return 401; passes through to route handler
    expect(res.status).not.toBe(401);
  });

  it("A1: allows /api/admin/auth/logout through without a session cookie", () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auth/logout", {
      method: "POST",
    });
    const res = middleware(req);
    expect(res.status).not.toBe(401);
  });

  it("A1: blocks /api/admin/weddings with 401 JSON when session cookie is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/weddings", {
      method: "GET",
    });
    const res = middleware(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/unauthorized/i);
  });

  it("A1: allows /api/admin/weddings when valid session cookie is provided", () => {
    const token = signSessionToken("staff-1", "staff");
    const req = new NextRequest("http://localhost:3000/api/admin/weddings", {
      method: "GET",
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });
    const res = middleware(req);
    // Passes through to Next.js handler
    expect(res.status).not.toBe(401);
  });

  it("A6: returns bare 404 immediately for bot probe paths without touching database", () => {
    const probePaths = [
      "http://localhost:3000/wp-admin",
      "http://localhost:3000/wp-login.php",
      "http://localhost:3000/xmlrpc.php",
      "http://localhost:3000/shell.php",
      "http://localhost:3000/.env",
      "http://localhost:3000/backup.sql",
    ];

    for (const url of probePaths) {
      const req = new NextRequest(url);
      const res = middleware(req);
      expect(res.status).toBe(404);
      // Bare 404 response (no rewrite to [slug])
      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    }
  });

  it("A6: permits /.well-known/ legitimate security and acme paths", () => {
    const req = new NextRequest("http://localhost:3000/.well-known/security.txt");
    const res = middleware(req);
    expect(res.status).toBe(200); // NextResponse.next() defaults to status 200 in NextRequest context
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("A6: rejects unknown dotted single-segment files (/backup.zip, /test.html) with 404", () => {
    const unknownFiles = [
      "http://localhost:3000/backup.zip",
      "http://localhost:3000/test.html",
      "http://localhost:3000/dump.tar.gz",
    ];

    for (const url of unknownFiles) {
      const req = new NextRequest(url);
      const res = middleware(req);
      expect(res.status).toBe(404);
    }
  });

  it("A6: allows known public root files (/favicon.ico, /robots.txt, /sitemap.xml)", () => {
    const knownFiles = [
      "http://localhost:3000/favicon.ico",
      "http://localhost:3000/robots.txt",
      "http://localhost:3000/sitemap.xml",
      "http://localhost:3000/manifest.json",
    ];

    for (const url of knownFiles) {
      const req = new NextRequest(url);
      const res = middleware(req);
      expect(res.status).not.toBe(404);
    }
  });

  it("A6: redirects upper-case wedding slug /Priya-Rahul with 307 to /priya-rahul", () => {
    const req = new NextRequest("http://localhost:3000/Priya-Rahul");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/priya-rahul");
  });

  it("A6: rejects invalid slug format /a or /--invalid with bare 404", () => {
    const req = new NextRequest("http://localhost:3000/a");
    const res = middleware(req);
    expect(res.status).toBe(404);
  });
});
