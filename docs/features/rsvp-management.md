# 💌 Feature: Multi-Event RSVP & Guest Attendance Pipeline

> **Feature Identifier**: `feat-rsvp-management`  
> **Layer**: Guest Interaction & Concierge Operations  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🔴 **BYPASSED (Option B: Client Existing WhatsApp RSVP Stays Official)**

---

## 1. Executive Summary

Shadify features a multi-ceremony digital RSVP pipeline. Guests can confirm attendance individually for each event (e.g. attending Muhurtham and Reception, but skipping Mehendi), specify headcounts (+1s and children), and log dietary requirements (Traditional South Indian Vegetarian, Jain, Non-Veg). Responses are recorded in the PostgreSQL guest ledger and exportable to CSV for catering.

---

## 2. Technical Implementation in Repository

- **Guest Components**:
  - Section: [`src/components/guest/RsvpSection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/RsvpSection.tsx)
  - Modal: [`src/components/guest/EventRsvpModal.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/EventRsvpModal.tsx)
- **Submission API**: [`src/app/api/rsvp/route.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/api/rsvp/route.ts)
- **Concierge Export API**: [`src/app/api/admin/weddings/[id]/export-rsvps/route.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/api/admin/weddings/[id]/export-rsvps/route.ts)
- **Database Models**: `Guest` and `RSVP` models with compound unique constraints preventing duplicate responses for identical name/phone pairings.

---

## 3. What is Done (Current Baseline)

- [x] Multi-event checkbox selection with dynamic guest headcount counters.
- [x] Dietary preference radio selection (Jain, South Indian Vegetarian, Non-Veg).
- [x] E.164 international phone number normalization via `libphonenumber-js`.
- [x] IP-based rate limiting via Upstash Redis to prevent automated form flooding.
- [x] Tenant-isolated CSV export generating catering spreadsheets by event and diet.
- [x] Automated test suite in `src/app/api/rsvp/__tests__/rsvp.test.ts` (9/9 passing).

---

## 4. What is Planned (Future Roadmap)

- [ ] **Automated WhatsApp Follow-Up Reminders**: Automated WhatsApp broadcast reminding unconfirmed guests 7 days prior to deadline.
- [ ] **Dietary Allergy Badges**: Freeform allergy text inputs (e.g. nut-free, gluten-free).

---

## 5. Status for November 12 Pilot Client

- **Operational Decision**: **Option B (Bypassed / Retaining Client Existing RSVP)**.
- **Why Bypassed**:
  - The client's own invitation website is already live with a **November 5 RSVP deadline** and an established WhatsApp response workflow.
  - Activating native Shadify RSVP would introduce two competing response channels, leading to guest confusion and duplicate reconciliation.
- **Pilot Implementation**:
  - Native RSVP form is disabled (`rsvp: { enabled: false }`).
  - Shadify may display an outbound link/button pointing directly to the client's official WhatsApp response contact.
  - **Pre-Flight Requirement**: The exact WhatsApp destination must be confirmed with the client in writing; concierge staff must never assume or repurpose placeholder numbers.
