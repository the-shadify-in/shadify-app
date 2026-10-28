# 🎨 Feature: Traditional In-House Vector Motifs

> **Feature Identifier**: `feat-vector-motifs`  
> **Layer**: Visual Asset Register & Cultural Graphics  
> **Status in Code**: 🟡 **PLANNED (Files Do Not Yet Exist in Repo)**  
> **Status for Nov 12 Pilot**: 🟡 **PLANNED (Pending Asset Creation)**

---

## 1. Executive Summary

For weddings where couples do not wish to publish personal photographs online—such as the November 12 Pilot—Shadify utilizes platform-owned, culturally authentic vector motifs and ornamental borders. These SVG assets provide rich visual framing while eliminating third-party copyright risks.

---

## 2. Planned Vector Inventory

| Asset Identifier      | Cultural Motif Description                     | Target Format   | Creation Tool & Terms                                          | Target Pilot Application               |
| :-------------------- | :--------------------------------------------- | :-------------- | :------------------------------------------------------------- | :------------------------------------- |
| `motif-kolam-mandala` | Auspicious geometric rice-flour Kolam mandala  | Vector (`.svg`) | Planned. Author, tool, and terms to be recorded upon creation. | Hero crest watermark & background veil |
| `motif-kuthu-vilakku` | Traditional South Indian brass deepam / lamp   | Vector (`.svg`) | Planned. Author, tool, and terms to be recorded upon creation. | Muhurtham ceremony timeline header     |
| `motif-temple-toran`  | Sacred mango leaf & marigold floral garland    | Vector (`.svg`) | Planned. Author, tool, and terms to be recorded upon creation. | Section divider & envelope reveal      |
| `motif-banana-leaf`   | Traditional South Indian festive plantain leaf | Vector (`.svg`) | Planned. Author, tool, and terms to be recorded upon creation. | Ceremony meal / lunch itinerary detail |

---

## 3. What is Done (Current Baseline)

- [x] Styling containers and SVG placement slots defined in component markup.
- [x] High-contrast CSS color token binding (`currentColor` inheritance from active theme palette).

---

## 4. What is Planned (Pre-Pilot Authoring Tasks)

- [ ] **Physical File Creation**: Authoring standalone SVG files in vector tooling and placing them in `public/motifs/`.
- [ ] **Asset Provenance Logging**: Documenting the author, tool, and creation date in [`pilot_onboarding_and_asset_rights.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/docs/operations/pilot_onboarding_and_asset_rights.md).
- [ ] **Legal Rights Verification**: If AI-assisted tools are used, exact terms must be recorded and ownership determinations deferred to legal counsel.

---

## 5. Status for November 12 Pilot Client

- **State**: 🟡 **PLANNED**.
- **Action Required**: Create the 4 vector files before the November 10 deploy freeze.
