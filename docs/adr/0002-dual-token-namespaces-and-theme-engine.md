# ADR 0002: Dual Token Namespaces & Data-Driven Theme Engine

- **Status**: Accepted
- **Date**: 2026-10-18
- **Deciders**: Technical Lead & Product Owner
- **Context**: 
  Indian weddings feature diverse, high-intensity color palettes (Crimson & Gold, Emerald, Blush Pastel, Ivory Silk). If platform brand colors (such as Rani Pink or Marigold) bleed into guest wedding sites, they clash with the couple's aesthetic and feel like unwanted advertisements. Furthermore, allowing raw CSS overrides from couples introduces layout breakage and XSS risks.

---

## Decisions

1. **Strict Namespace Separation**:
   - **`--brand-*`**: Strictly restricted to the Shadify marketing site, staff concierge admin, and 404/error pages.
     - Primary: Rani Pink (`#D6246E`)
     - Accents: Marigold (`#F5A524`), Peacock Teal (`#0E9F8E`), Royal Indigo (`#3D3BC4`)
     - Ground & Ink: Ivory Ground (`#FFFBF5`), Midnight Ink (`#1F1A2E`)
   - **`--theme-*`**: Dynamically injected into guest pages (`/w/[slug]`) via server-rendered CSS variables in `<head>`, consumed by Tailwind.
     - Never references brand colors.

2. **Theme as Data (Not Code)**:
   - Each wedding references a `preset_id` and an optional validated JSON configuration `theme_config` matching the `ThemeConfigSchema` in `src/lib/themes/tokens.ts`.
   - Strict validation:
     - Hex colors enforced via regex.
     - Whitelisted display & body fonts (including Indic scripts).
     - Monogram capped at 8 characters.
     - Zero raw CSS injection permitted on self-serve tiers.

3. **Four Launch Presets (Quality Floor)**:
   - **`royal-crimson`**: Deep Crimson (`#941C2F`), Rajasthani Gold (`#C9933A`), Night Wine (`#0E0709`). (North Indian / Classical Vedic).
   - **`emerald-gold`**: Imperial Emerald (`#0D4D33`), Metallic Gold (`#D4AF37`), Midnight Forest (`#051811`). (Royal Palace & Destination).
   - **`ivory-minimal`**: Warm Sand (`#B8977E`), Champagne Gold (`#DFB15B`), Soft Alabaster (`#FAF7F2`). (Contemporary / South Indian Silk).
   - **`sunset-pastel`**: Gulabi Blush (`#D46A7E`), Warm Peach (`#E29578`), Twilight Plum (`#12080D`). (Sangeet / Sundowner).

4. **Neutral Brand Presence on Guest Pages**:
   - The "Made with Shadify" footer mark is strictly rendered in the couple's own `--theme-text-muted` color at **30–40% opacity** (monochrome). It never renders in Rani Pink.
   - Higher tiers (Premium & Platinum) can toggle `show_branding = false` to remove the mark completely (built-in upsell).

5. **Automated Accessibility / Contrast Auditing**:
   - All themes are verified via `validateContrast()` to satisfy the WCAG AA minimum contrast ratio (>= 4.5:1) for text on background, ensuring legibility on mobile screens in harsh Indian outdoor sunlight.

---

## Consequences

- **Positive**: Zero color clashes on couple wedding pages; brand maintains a loud, festive presence in admin and marketing; safe, performant theme rendering with instant tag revalidation.
- **Negative**: Bespoke custom CSS is restricted to Platinum tiers and implemented directly by staff in code.
