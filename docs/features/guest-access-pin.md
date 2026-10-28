# 🔒 Feature: Guest Access PIN Protection

> **Feature Identifier**: `feat-guest-access-pin`  
> **Layer**: Edge Middleware & Access Security  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🔴 **DISABLED (Publicly Accessible via Slug)**

---

## 1. Executive Summary

For couples who require privacy and do not want their wedding details openly indexable or readable by unauthorized visitors, Shadify supports a 4-digit numeric Guest Entry PIN. When enabled, edge middleware intercepts requests to `/[slug]` and requires guests to enter the 4-digit code. Upon entry, a secure session cookie grants access to the wedding.

---

## 2. Technical Implementation in Repository

- **Edge Middleware Gate**: [`src/middleware.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/middleware.ts#L45-L75)
- **Verification API**: [`src/app/api/weddings/[slug]/verify-pin/route.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/api/weddings/[slug]/verify-pin/route.ts)
- **Concierge PIN Management API**: [`src/app/api/admin/weddings/[id]/pin/route.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/api/admin/weddings/[id]/pin/route.ts)
- **Hashing Security**: PINs are hashed using bcrypt before storage in PostgreSQL (`guestPin` field in `WeddingSettings`). Plaintext PINs are never stored or logged.
- **Session Cookie**: Verified guests receive an HTTP-only, SameSite=Lax signed cookie granting access for the contracted wedding duration.

---

## 3. What is Done (Current Baseline)

- [x] Edge middleware challenge gate intercepting non-authenticated guest requests.
- [x] Constant-time bcrypt hash comparison to prevent timing attacks.
- [x] Rate limiting: Upstash sliding window locks PIN attempts after 5 consecutive failures per IP.
- [x] Automated test suite in `src/app/api/weddings/[slug]/verify-pin/__tests__/verify-pin.test.ts` (11/11 passing) and `src/app/api/admin/weddings/[id]/pin/__tests__/pin-lifecycle.test.ts` (6/6 passing).

---

## 4. What is Planned (Future Roadmap)

- [ ] **VIP Passcode Tiers**: Different PINs granting access to restricted events (e.g. general PIN sees Reception; VIP PIN sees intimate Sangeet / Mehendi).
- [ ] **SMS 1-Tap Magic Link**: Direct personalized SMS link bypassing PIN challenge for immediate family.

---

## 5. Status for November 12 Pilot Client

- **State**: 🔴 **DISABLED (`guestPin: null`)**.
- **Pilot Rationale**:
  - The pilot couple requested a frictionless guest experience so elderly relatives and extended family can view ceremony timings and directions without entering passcodes.
  - The wedding URL will be directly accessible via its canonical slug (`https://shadify.in/<slug>`).
