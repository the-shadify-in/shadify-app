# 💌 Feature: Interactive Wax Seal Envelope Reveal

> **Feature Identifier**: `feat-envelope-reveal`  
> **Layer**: Guest Front-of-House Experience  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🟢 **ACTIVE**

---

## 1. Executive Summary

The Envelope Reveal is the signature first-touch guest experience in Shadify. When a guest opens a wedding link (`/[slug]`), they are greeted by an ornate digital envelope sealed with a bespoke gold wax seal embossed with the couple's monogram. Tapping the wax seal triggers an authentic 3D flap unsealing animation, followed by a smooth cross-fade reveal into the wedding celebration.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/EnvelopeReveal.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/EnvelopeReveal.tsx)
- **CSS Animations**: Hardware-accelerated CSS 3D transforms (`rotateX`, `perspective`, `backdrop-filter`).
- **Accessibility & Ergonomics**:
  - Full support for `prefers-reduced-motion` media queries (bypasses flap animation and provides a clean instant fade).
  - Explicit keyboard focus states (`Enter` / `Space` trigger).
  - Screen reader announcements (`aria-label="Open wedding invitation for [Couple]"`).
- **Test Coverage**: [`src/components/guest/__tests__/demo-readiness.test.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/__tests__/demo-readiness.test.tsx) validates lifecycle states, tap interactions, and reduced-motion fallbacks.

---

## 3. What is Done (Current Baseline)

- [x] Luxury envelope container with textured border and subtle shadow drop.
- [x] Gold wax seal with metallic sheen gradient and couple's initials.
- [x] Smooth click/tap reveal transition revealing the main wedding invitation container.
- [x] Mobile touch responsiveness across iOS Safari and Android Chrome.

---

## 4. What is Planned (Future Roadmap)

- [ ] **Custom Physical Seal Matching (Platinum Tier)**: Allowing couples to upload an image of their bespoke physical brass wax seal stamp for exact 1:1 digital embossing.
- [ ] **Sound Effect Toggle**: Optional soft wax crackle sound on unseal (opt-in only, respecting audio preferences).

---

## 5. Status for November 12 Pilot Client

- **State**: **ACTIVE**.
- **Pilot Configuration**:
  - Enabled with bilingual overline and the couple's monogram.
  - Styled using the selected luxury palette (`ivory-minimal` / `royal-crimson`).
