# 📖 Feature: Couple Love Story & Milestone Narrative

> **Feature Identifier**: `feat-love-story`  
> **Layer**: Guest Front-of-House Narrative  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🔴 **EXCLUDED (Turned Off for Pilot)**

---

## 1. Executive Summary

The Love Story section presents the couple's relationship journey in an elegant, vertical timeline narrative. Each milestone card features a milestone date, milestone title (e.g. "How We Met", "The First Trip", "The Proposal"), descriptive story prose, and an optional visual anchor.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/LoveStorySection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/LoveStorySection.tsx)
- **Data Model**: Embedded structured JSON or database milestones linked to the wedding record.
- **Styling**: Alternating left/right desktop cards on a center-spine timeline; stacked single-column layout on mobile devices.

---

## 3. What is Done (Current Baseline)

- [x] Alternating timeline design with delicate gold node markers.
- [x] Serif typography tailored for emotional readability.
- [x] Responsive layout with smooth scroll animation triggers.
- [x] Component test coverage in `src/components/guest/__tests__/demo-readiness.test.tsx`.

---

## 4. What is Planned (Future Roadmap)

- [ ] **Interactive Dual-Perspective Mode**: Showing "His Perspective" vs "Her Perspective" tabs for each relationship milestone.
- [ ] **Interactive Audio Voice Bite**: Couple recording a 30-second spoken voice snippet introducing how they met.

---

## 5. Status for November 12 Pilot Client

- **State**: 🔴 **EXCLUDED (`loveStory: { enabled: false }`)**.
- **Pilot Rationale**:
  - The pilot client requested a focused, functional companion site emphasizing ceremony timings, Muhurtham blessings, and venue directions.
  - Personal dating milestones are omitted to maintain the couple's desired privacy level.
