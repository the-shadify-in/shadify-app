# 📱 Feature: Mobile Bottom Navigation Dock & Quick Actions

> **Feature Identifier**: `feat-mobile-dock`  
> **Layer**: Mobile Ergonomics & Navigation  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🟢 **ACTIVE**

---

## 1. Executive Summary

Over 90% of Indian wedding guests access wedding websites on mobile smartphones via WhatsApp links. The Mobile Dock is a fixed bottom navigation bar adhering to modern mobile ergonomics (thumb-zone reachability), providing one-tap jump links to Itinerary, Venue Directions, and Host Contact.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/MobileDock.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/MobileDock.tsx)
- **Viewport Optimization**: Fixed `bottom-0` layout with safe-area padding for modern notch/pill devices (`padding-bottom: env(safe-area-inset-bottom)`).
- **Glassmorphic Aesthetic**: Translucent backdrop blur with luxury gold border styling matching the active theme preset.
- **Scroll Spy**: Automatically highlights the active section icon as the guest scrolls down the page.

---

## 3. What is Done (Current Baseline)

- [x] Responsive breakpoint behavior: renders on mobile/tablet viewports; hides cleanly on desktop displays.
- [x] Safe-area insets avoiding home indicator clipping on iOS Safari.
- [x] High-contrast SVG icons with clear text labels (Schedule, Map, Contact, RSVP).
- [x] Tested in automated component test suite (`demo-readiness.test.tsx`).

---

## 4. What is Planned (Future Roadmap)

- [ ] **Dynamic Live Event Badge**: Real-time indicator highlighting the ceremony happening right now based on canonical IST clocks.
- [ ] **Emergency Contact Pill**: Slide-up sheet with venue manager and driver contact numbers for destination weddings.

---

## 5. Status for November 12 Pilot Client

- **State**: 🟢 **ACTIVE**.
- **Pilot Configuration**:
  - Dock enabled with 3 primary mobile jump links: **Timeline**, **Directions**, and **WhatsApp**.
  - The RSVP button is linked outbound to the client's verified WhatsApp RSVP contact under Option B.
