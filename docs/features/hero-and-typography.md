# 👑 Feature: Hero Section & Auspicious Typography

> **Feature Identifier**: `feat-hero-typography`  
> **Layer**: Guest Front-of-House Experience  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🟢 **ACTIVE (Typographic Mode)**

---

## 1. Executive Summary

The Hero Section is the primary visual anchor of a couple's wedding site. It supports two distinct visual modes:

1. **Editorial Photographic Mode**: High-resolution couple portrait with a dark editorial gradient veil.
2. **Pure Typographic Mode (Active for Pilot)**: No personal photos; uses high-contrast South Indian traditional typography, couple monograms, auspicious blessing overlines, and ceremony date/city pills.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/HeroSection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/HeroSection.tsx)
- **Typography Engine**: [`src/lib/themes/typography.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/themes/typography.ts)
- **Dynamic Elements**:
  - Gold filigree monogram crest container with dashed inner border.
  - Auspicious blessing overline ribbon (e.g. `॥ शुभ विवाह • TOGETHER FOREVER ॥` or Tamil equivalent).
  - Prominent couple names with serif ampersand styling.
  - Date & City pill (`✦ Date • City ✦`).
  - Real-time countdown timer (Days, Hours, Minutes, Seconds) leading to Muhurtham time.
  - Dynamic Post-Wedding View (`isAfterWedding`): Automatically swaps countdown for a heartfelt gratitude message from the newlyweds.

---

## 3. What is Done (Current Baseline)

- [x] Responsive layout scaling from 320px mobile viewports up to 4K displays.
- [x] Tested fallback behavior when no background image URL is provided.
- [x] Automated unit and rendering test coverage in [`demo-readiness.test.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/__tests__/demo-readiness.test.tsx).
- [x] Timezone-safe countdown calculation anchored in `Asia/Kolkata` (IST).

---

## 4. What is Planned (Future Roadmap)

- [ ] **Dynamic Background Video Loops**: Short 5-second ambient looping video backgrounds for Premium/Platinum packages.
- [ ] **Bespoke Calligraphy SVG Ingestion**: Concierge upload pipeline for custom handwritten couple calligraphy names.

---

## 5. Status for November 12 Pilot Client

- **State**: **ACTIVE (Typographic Hero Mode)**.
- **Pilot Rationale**:
  - The client explicitly requested **no personal photos** online.
  - The hero section will display verified bilingual English/Tamil typography, auspicious Muhurtham dates, and couple names, with zero photo dependencies.
