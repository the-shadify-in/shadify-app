# 👥 Feature: VIP Family Cards & Wedding Party Host Directory

> **Feature Identifier**: `feat-vip-cards`  
> **Layer**: Hospitality & Family Introduction  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🔴 **EXCLUDED (Turned Off for Pilot)**

---

## 1. Executive Summary

VIP Cards introduce key family members, parents of the bride and groom, and the bridal party to arriving guests. In traditional Indian weddings where distant relatives and out-of-town guests may meet for the first time, this feature provides warm context, noting relationships, host roles, and contact points for wedding-day coordination.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/VipSection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/VipSection.tsx)
- **Data Model**: Structured host and family card schema within wedding settings.
- **Card Elements**: Full formal name, relationship badge (e.g. "Father of the Groom", "Sister of the Bride"), optional portrait, and a brief welcome note.

---

## 3. What is Done (Current Baseline)

- [x] Responsive grid card layout displaying family members with luxury gold framing.
- [x] Relationship badges and custom role text fields.
- [x] Component test validation in `src/components/guest/__tests__/demo-readiness.test.tsx`.

---

## 4. What is Planned (Future Roadmap)

- [ ] **1-Tap WhatsApp Concierge Call Button**: Optional direct WhatsApp chat link to the designated logistics coordinator or bridesmaid/groomsman for guest assistance.
- [ ] **Tabbed Family Grouping**: Categorizing into "Bride's Side" and "Groom's Side" tabs.

---

## 5. Status for November 12 Pilot Client

- **State**: 🔴 **EXCLUDED (`vips: { enabled: false }`)**.
- **Pilot Rationale**:
  - The pilot couple's onboarding intake does not include a separate VIP card list.
  - Parents' names will be respectfully presented in the formal wedding invitation typography rather than as standalone cards.
