# 📦 Shadify — Feature Specifications & Delivery Status

> **Directory**: `docs/features/`  
> **Repository**: `github.com/the-shadify-in/shadify-app`  
> **Target Pilot Date**: November 12, 2026 (Deploy Freeze: November 10, 2026)

This directory contains standalone, dedicated status and architecture specifications for every individual feature in Shadify. Each document tracks what is coded and tested, what is planned on the roadmap, and what is active vs. excluded for the upcoming pilot.

---

## 1. Feature Specifications Index

| Feature Document                                                         | Scope / Domain                       | Code Status               | Nov 12 Pilot Status                 | Key Implementation Path                                                                                                                                        |
| :----------------------------------------------------------------------- | :----------------------------------- | :------------------------ | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[`envelope-reveal.md`](./envelope-reveal.md)**                         | Wax Seal 3D Unsealing Animation      | 🟢 **DONE**               | 🟢 **ACTIVE**                       | [`src/components/guest/EnvelopeReveal.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/EnvelopeReveal.tsx)         |
| **[`hero-and-typography.md`](./hero-and-typography.md)**                 | Hero Section & Auspicious Typography | 🟢 **DONE**               | 🟢 **ACTIVE (Typographic)**         | [`src/components/guest/HeroSection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/HeroSection.tsx)               |
| **[`itinerary-and-events.md`](./itinerary-and-events.md)**               | Ceremonies, Timelines & Google Maps  | 🟢 **DONE**               | 🟢 **ACTIVE**                       | [`src/components/guest/EventsSection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/EventsSection.tsx)           |
| **[`mobile-dock-navigation.md`](./mobile-dock-navigation.md)**           | Fixed Mobile Navigation Dock         | 🟢 **DONE**               | 🟢 **ACTIVE**                       | [`src/components/guest/MobileDock.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/MobileDock.tsx)                 |
| **[`theme-system-and-contrast.md`](./theme-system-and-contrast.md)**     | 5 Luxury Themes & WCAG AA Audit      | 🟢 **DONE**               | 🟢 **ACTIVE (`ivory-minimal`)**     | [`src/lib/themes/tokens.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/themes/tokens.ts)                                       |
| **[`admin-concierge-studio.md`](./admin-concierge-studio.md)**           | Admin Studio & Entitlements Engine   | 🟢 **DONE**               | 🟢 **ACTIVE**                       | [`src/app/admin/`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/admin/)                                                           |
| **[`data-isolation-and-security.md`](./data-isolation-and-security.md)** | Cross-Tenant Isolation & DPDP 2023   | 🟢 **DONE**               | 🟢 **ACTIVE**                       | [`tests/db/real-postgres.test.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/tests/db/real-postgres.test.ts)                           |
| **[`social-share-cards.md`](./social-share-cards.md)**                   | Edge Open Graph WhatsApp Cards       | 🟢 **DONE**               | 🟡 **PENDING TAMIL TEST**           | [`src/app/api/og/route.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/api/og/route.tsx)                                       |
| **[`vector-motifs.md`](./vector-motifs.md)**                             | Traditional Kolam/Lamp SVG Motifs    | 🟡 **PLANNED**            | 🟡 **PENDING CREATION**             | `public/motifs/*.svg`                                                                                                                                          |
| **[`photo-gallery.md`](./photo-gallery.md)**                             | Photo Lightbox & WebP Processing     | 🟢 **DONE**               | 🔴 **EXCLUDED (No-Photo Client)**   | [`src/components/guest/GallerySection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/GallerySection.tsx)         |
| **[`rsvp-management.md`](./rsvp-management.md)**                         | Native RSVP & Dietary Counters       | 🟢 **DONE**               | 🔴 **BYPASSED (Option B)**          | [`src/components/guest/RsvpSection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/RsvpSection.tsx)               |
| **[`digital-shagun-gifts.md`](./digital-shagun-gifts.md)**               | Digital Shagun & UPI Cash Gifts      | 🟢 **DONE**               | 🔴 **EXCLUDED (Client Request)**    | [`src/components/guest/DigitalShagunModal.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/DigitalShagunModal.tsx) |
| **[`background-audio.md`](./background-audio.md)**                       | Background Audio Player              | 🟢 **DONE**               | 🔴 **EXCLUDED (No Master License)** | [`src/components/guest/MusicToggle.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/MusicToggle.tsx)               |
| **[`guest-access-pin.md`](./guest-access-pin.md)**                       | 4-Digit Guest Access PIN Gate        | 🟢 **DONE**               | 🔴 **DISABLED (Frictionless)**      | [`src/middleware.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/middleware.ts)                                                     |
| **[`love-story.md`](./love-story.md)**                                   | Couple Relationship Milestones       | 🟢 **DONE**               | 🔴 **EXCLUDED (Turned Off)**        | [`src/components/guest/LoveStorySection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/LoveStorySection.tsx)     |
| **[`vip-family-cards.md`](./vip-family-cards.md)**                       | VIP Family & Bridal Party Cards      | 🟢 **DONE**               | 🔴 **EXCLUDED (Turned Off)**        | [`src/components/guest/VipSection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/VipSection.tsx)                 |
| **[`livestream-video.md`](./livestream-video.md)**                       | Live Stream Embed Modal              | 🟢 **DONE**               | 🔴 **EXCLUDED (No Stream URL)**     | [`src/components/guest/LiveStreamModal.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/LiveStreamModal.tsx)       |
| **[`ai-intake-assistant.md`](./ai-intake-assistant.md)**                 | Staff WhatsApp Intake Assistant      | 🟢 **DONE (Mock Engine)** | 🔴 **DEFERRED (`[LATER]`)**         | [`src/features/intake/`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/features/intake/)                                               |

---

## 2. Master Capability Matrix & Release Checklist

- For the consolidated side-by-side comparison across all features, refer to the master matrix:  
  👉 **[`feature-status.md`](./feature-status.md)** (includes the 6-Gate Release Checklist tracking pilot readiness).
