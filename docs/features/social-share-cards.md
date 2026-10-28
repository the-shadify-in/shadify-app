# 🖼️ Feature: Dynamic Social Share Cards & Open Graph Previews

> **Feature Identifier**: `feat-social-share-cards`  
> **Layer**: Edge Metadata & Viral Distribution  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🟡 **PENDING TAMIL SCRIPT SHAPING TEST**

---

## 1. Executive Summary

When a couple or guest shares their wedding link on WhatsApp, iMessage, Instagram, or Twitter, social platforms render an Open Graph (OG) visual preview card. Shadify supports dynamic 1200×630 share card generation rendered at the edge via `@vercel/og`, producing high-resolution, branded preview cards reflecting the couple's names, wedding date, and cultural theme.

---

## 2. Technical Implementation in Repository

- **Dynamic Edge Route**: `src/app/api/og/route.tsx` (Edge Runtime)
- **Pre-Rendered Defaults**: [`public/og/`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/public/og) (`og-default.jpg`, `og-temple-mandap.jpg`, `og-palace-mandap.jpg`, `og-coastal-mandap.jpg`, `og-starlit-reception.jpg`)
- **Metadata Integration**: Configured in root [`layout.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/layout.tsx) and dynamic `[slug]/page.tsx` via Next.js `generateMetadata`.

---

## 3. What is Done (Current Baseline)

- [x] Dynamic Edge canvas rendering couple names, monogram, and celebration date.
- [x] Pre-rendered fallback templates for instant WhatsApp link unfurling.
- [x] High-contrast 16:9 aspect ratio (1200×630px) formatted for retina mobile messaging previews.

---

## 4. What is Planned & Gate Verification

- [ ] **Indic / Tamil Text Shaping Test (Mandatory Gate)**:
  - Render the share card with authentic Tamil Unicode text using production web fonts.
  - Complex Indic scripts require specialized text shaping engines; verify whether diacritics, vowel signs, and ligatures render correctly or break into corrupted boxes.
  - **Fallback Rule**: If Tamil text breaks on the edge canvas, fallback immediately to English-only text on the share card.

---

## 5. Status for November 12 Pilot Client

- **State**: 🟡 **PENDING TAMIL SCRIPT TEST**.
- **Action Required**: Conduct test rendering before the November 10 deploy freeze.
