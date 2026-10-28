# 🛡️ Feature: Cross-Tenant Data Isolation, Privacy & Security Architecture

> **Feature Identifier**: `feat-security-isolation`  
> **Layer**: Database Security, Middleware & Statutory Compliance  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🟢 **ACTIVE**

---

## 1. Executive Summary

Shadify enforces strict multi-tenant isolation across all data layers. Wedding A cannot view, mutate, presign media for, or export the guests, RSVPs, or photos of Wedding B. This architectural isolation is backed by database foreign keys, application-level authorization guards, and automated integration tests running against real PostgreSQL instances.

---

## 2. Technical Implementation in Repository

- **Database Schemas & Relations**: [`prisma/schema.prisma`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/prisma/schema.prisma)
- **Tenant Isolation Integration Tests**: [`tests/db/real-postgres.test.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/tests/db/real-postgres.test.ts) (13 tests proving cross-tenant query separation)
- **API Boundary Tests**:
  - Media presigning isolation: [`src/app/api/media/__tests__/presign.test.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/api/media/__tests__/presign.test.ts) (cross-tenant 403)
  - RSVP export isolation: [`src/app/api/admin/weddings/[id]/__tests__/export-rsvps.test.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/api/admin/weddings/[id]/__tests__/export-rsvps.test.ts) (cross-tenant 403)
- **Rate Limiting**: Sliding-window rate limiter via Upstash Redis guarding API routes from abuse.
- **DPDP 2023 Statutory Compliance**: Standard Operating Procedure documented in [`docs/operations/runbooks.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/docs/operations/runbooks.md) (Runbook 3) for executing data erasure within 48 hours.

---

## 3. What is Done (Current Baseline)

- [x] Strict tenant key scoping across all Prisma queries (`where: { weddingId }`).
- [x] Verified negative test cases: Tenant A accessing Tenant B's data fails with 403/404.
- [x] Edge probe blocking: middleware rejects malicious directory traversal and script probes (`/backup.zip`, `/test.html`) with instant 404s.
- [x] Cache-Control privacy: all draft weddings and dynamic API endpoints return `Cache-Control: private, no-store`.

---

## 4. What is Planned & Mandatory Production Gates

- [ ] **Production Upstash Redis Provisioning**: Provisioning live production Redis cluster on Upstash.
- [ ] **Next.js 14 Production Advisory Resolution (Nov 1 Cutoff)**: Deciding between upgrading to Next.js 16 (`feat/next-16-migration`) or applying framework backports for production dependencies.
- [ ] **2FA Enforcement**: Enforcing hardware/app 2FA across GitHub, Vercel, Upstash, and domain registrar accounts.

---

## 5. Status for November 12 Pilot Client

- **State**: 🟢 **ACTIVE**.
- **Pilot Application**: Protects the pilot client's draft data, prevents cross-tenant leaks, and ensures zero unauthenticated access to guest records.
