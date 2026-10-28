# 🛠️ Feature: Concierge Admin Studio & Provisioning Engine

> **Feature Identifier**: `feat-admin-studio`  
> **Layer**: Concierge Operations & Tenant Management  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🟢 **ACTIVE**

---

## 1. Executive Summary

The Concierge Admin Studio (`/admin`) is the back-of-house operational tool used by Shadify staff to draft, provision, configure, and publish wedding celebrations. It enforces package tier entitlements, validates reserved URL slugs, provides live theme contrast audits, manages guest PINs, and displays real-time infrastructure diagnostics.

---

## 2. Technical Implementation in Repository

- **Admin Shell & Directory**:
  - UI Shell: [`src/components/admin/AdminShell.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/admin/AdminShell.tsx)
  - Weddings Directory: [`src/app/admin/weddings/page.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/admin/weddings/page.tsx)
  - Studio Detail: [`src/app/admin/weddings/[id]/page.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/admin/weddings/[id]/page.tsx)
- **Provisioning API**: [`src/app/api/admin/weddings/provision/route.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/api/admin/weddings/provision/route.ts)
- **Entitlements Service**: [`src/features/entitlements/service.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/features/entitlements/service.ts) bound strictly to [`pricing.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/config/pricing.ts).
- **Diagnostics Dashboard**: [`src/app/admin/health/page.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/admin/health/page.tsx)
- **Session Security**: HMAC-signed session cookies with `ADMIN_SESSION_VERSION` revocation and anti-open-redirect sanitization.

---

## 3. What is Done (Current Baseline)

- [x] Atomic transactional wedding creation provisioning settings and theme defaults.
- [x] Package tier validation: enforces `maxEvents` (3/8/15), `maxPhotos` (100/300/1000), `canHideBranding`, and `canCustomDomain`.
- [x] Dynamic guest PIN setter and clearer (`/api/admin/weddings/[id]/pin`).
- [x] Live diagnostics inspecting PostgreSQL latency, Cloudflare R2 bucket connection, and Upstash Redis ping.
- [x] Automated test coverage: `provision.test.ts` (12/12 passing), `entitlements.test.ts` (13/13 passing), `auth-version.test.ts` (4/4 passing).

---

## 4. What is Planned (Future Roadmap)

- [ ] **Multi-Role Staff RBAC**: Granular permissions distinguishing Concierge Writers, Senior Editors, and Platform Administrators.
- [ ] **Audit Trail Activity Log**: Full timeline recording who modified wedding details with timestamps.

---

## 5. Status for November 12 Pilot Client

- **State**: 🟢 **ACTIVE**.
- **Pilot Application**: Used exclusively by concierge staff to provision the pilot wedding record, verify theme contrast, and trigger ISR publishing.
