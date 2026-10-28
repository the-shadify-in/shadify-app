# 📅 Feature: Ceremony Itinerary, Timelines & Map Navigation

> **Feature Identifier**: `feat-itinerary-events`  
> **Layer**: Guest Front-of-House Experience & Logistics  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🟢 **ACTIVE**

---

## 1. Executive Summary

The Events Section provides wedding guests with a clear, chronological breakdown of every celebration ceremony (e.g. Vratham, Muhurtham, Sangeet, Reception). Each ceremony card features precise start/end timings, auspicious window indicators, venue name, postal address, dress code theme, and a one-tap navigation link to Google Maps.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/EventsSection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/EventsSection.tsx)
- **Database Model**: `Event` model in [`prisma/schema.prisma`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/prisma/schema.prisma) with foreign key relation to `Wedding`.
- **Validation Schema**: Zod event validation in [`src/features/weddings/schemas.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/features/weddings/schemas.ts).
- **Navigation Sanitation**:
  - Enforces canonical HTTPS map URLs (`https://maps.google.com/?q=...` or `https://maps.app.goo.gl/...`).
  - Prohibits deprecated legacy `goo.gl/maps` short links.

---

## 3. What is Done (Current Baseline)

- [x] Multi-event chronological ordering by `startTime`.
- [x] Dress code badges with cultural advisory notes (e.g. "Traditional Madisar & Veshti / Formal Indian").
- [x] Venue address card with clear pin code and click-to-open map action.
- [x] Fully responsive multi-column layout on desktop, stacked timeline on mobile.
- [x] Tested against cross-tenant isolation in `tests/db/real-postgres.test.ts`.

---

## 4. What is Planned (Future Roadmap)

- [ ] **One-Tap Calendar Export (`.ics` / Google Calendar)**: Instant "Add to Calendar" buttons per ceremony with prefilled venue alarms.
- [ ] **Live Cab Ride Booking Deeplinks**: Uber / Ola ride integration with pre-filled destination coordinates for out-of-town guests.

---

## 5. Status for November 12 Pilot Client

- **State**: **ACTIVE**.
- **Pilot Rationale**:
  - Primary value driver: delivering exact Muhurtham timings and verified Google Maps navigation directly to guests' phones.
  - Number of events provisioned according to the agreed package tier.
