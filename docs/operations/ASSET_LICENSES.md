# 🌸 Shadify Visual Asset Register & Provenance

This document tracks the provenance, generation metadata, and licensing for all platform visual assets, Open Graph (OG) social cards, and demo placeholders.

---

## 1. Open Graph (OG) Social Share Imagery (`public/og/`)

Designed for social previews on WhatsApp, iMessage, Instagram, and Twitter (16:9 aspect ratio, 1200×675+ resolution).

| Asset Path                           | Cultural Theme / Stage                                                                                                  | Generation Tool        | Creation Date | Status         |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :--------------------- | :------------ | :------------- |
| `public/og-image.jpg`                | **Royal Lake Palace Sunset** (Udaipur Lake Pichola lakeside mandap, marigolds & lanterns)                               | Google Imagen (in-IDE) | Oct 2026      | Active Default |
| `public/og/og-temple-mandap.jpg`     | **South Indian Traditional Temple** (Chettinad courtyard, jasmine mallipoo, lotus, brass kuthu vilakku)                 | Google Imagen (in-IDE) | Oct 2026      | Available      |
| `public/og/og-palace-mandap.jpg`     | **Rajasthan Heritage Courtyard** (Sandstone arches, reflecting pool, emerald & crimson velvet, candlelight)             | Google Imagen (in-IDE) | Oct 2026      | Available      |
| `public/og/og-coastal-mandap.jpg`    | **Coastal Ocean Sunset** (Goa/Alibaug minimalist beach mandap, ivory organza, orchids, pampas grass)                    | Google Imagen (in-IDE) | Oct 2026      | Available      |
| `public/og/og-starlit-reception.jpg` | **Enchanted Glasshouse Ballroom** (Sangeet/Reception stage, crystal chandeliers, cascading white wisteria, candlelight) | Google Imagen (in-IDE) | Oct 2026      | Available      |

---

## 2. Demo Couple & Ceremony Assets (`public/demo/`)

Used strictly for local development and anonymous demo couples (_Priya & Rahul_, _Ananya & Kabir_).

| Asset Path                | Context                          | Generation Tool | Terms & Licensing                                       |
| :------------------------ | :------------------------------- | :-------------- | :------------------------------------------------------ |
| `public/demo/hero.jpg`    | Heritage Palace Evening Backdrop | Google Imagen   | Synthesized demo asset. No third-party likeness claims. |
| `public/demo/couple.jpg`  | Editorial Couple Portrait        | Google Imagen   | Synthesized demo asset. Fictional model likeness.       |
| `public/demo/mandap.jpg`  | Sacred Mandap Under Sunset Skies | Google Imagen   | Synthesized demo asset.                                 |
| `public/demo/mehendi.jpg` | Marigold & Turmeric Courtyard    | Google Imagen   | Synthesized demo asset.                                 |
| `public/demo/sangeet.jpg` | Sangeet Stage with Fairy Lights  | Google Imagen   | Synthesized demo asset.                                 |

---

## 3. Client Asset Privacy Guarantee

- **Real Client Photos**: Actual wedding photographs from clients are never stored in `public/`. They are stored in private Cloudflare R2 object storage with wedding-scoped signed URLs or access-controlled tokens.
