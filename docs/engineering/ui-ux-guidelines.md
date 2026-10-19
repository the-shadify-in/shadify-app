# Shadify — UI, UX & Design System Guidelines

> Authoritative specification for typography, motion, responsiveness, accessibility, and component architecture across Shadify's three product zones: **Guest Wedding Sites**, **Concierge Admin**, and **Marketing**.

---

## 1. Typography & Script-Aware Font Engine

### Principles

- **At most two font families per wedding** (one display, one body). Native Indic scripts pair with the Latin display font when multilingual content is present.
- **Never apply `letter-spacing` (tracking) or `text-transform: uppercase` to Indic scripts** (Devanagari, Telugu, Tamil, Gujarati) as it destroys syllable conjuncts and half-letters.
- **Minimum body size:** 16px (`1rem`) to prevent automatic iOS Safari viewport zooming on input focus.
- **Line height:** 1.5 for Latin; 1.6–1.8 for Indic scripts to accommodate ascenders and matras.

### Script & Font Matrix

| Script / Language               | Display Font (Headings & Names)                    | Body Font                              | Notes & Constraints                                                                        |
| ------------------------------- | -------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Latin (English)**             | `Playfair Display`, `Cinzel`, `Cormorant Garamond` | `Inter`, `Plus Jakarta Sans`, `Outfit` | `Cinzel` uppercase only; `Cormorant` minimum 24px (thin strokes vanish on low-res screens) |
| **Devanagari (Hindi, Marathi)** | `Rozha One`, `Noto Serif Devanagari`               | `Noto Sans Devanagari`                 | Generous line-height (1.7); preserves complex matras and shirorekha                        |
| **Telugu**                      | `Suranna`                                          | `Noto Sans Telugu`                     | Elegant traditional serif flourishes; pairs with Royal Crimson                             |
| **Tamil**                       | `Arima Madurai`                                    | `Noto Sans Tamil`                      | Soft calligraphy curves; pairs with Sunset and Ivory themes                                |
| **Gujarati**                    | `Noto Serif Gujarati`                              | `Noto Sans Gujarati`                   | Optimized for wedding invitations and ceremony titles                                      |

### Self-Hosting & Preload Budget

- Do **not** import all fonts globally.
- Emit `@font-face` definitions and `<link rel="preload">` tags strictly for the **two fonts assigned to that specific wedding**.
- All fonts must declare `font-display: swap` with size-adjusted system fallback metrics to eliminate Cumulative Layout Shift (CLS).

---

## 2. Guest-Site UX & Mobile-First Principles

Most wedding guests arrive via WhatsApp links on mid-range Android smartphones (often inside WhatsApp's in-app webview).

### Interaction Standards

- **Baseline Viewport:** Design for **360px width** first, scaling fluidly with CSS `clamp()`.
- **Touch Targets for Elders:** All buttons, toggles, and interactive elements must maintain a minimum bounding box of **44px × 44px** (preferred 48px).
- **Sticky Mobile Action Bar:**
  - Docked to the bottom of the viewport on mobile devices.
  - Contains the top 3 guest actions: **Directions** (maps app), **RSVP**, and **WhatsApp Share**.
  - Padded with `padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))` for notched displays.
- **Envelope Reveal Flow:**
  - **Skip Option:** Prominently display a visible "Skip Reveal" button.
  - **Memory:** Persist `localStorage.setItem('envelope_revealed_${slug}', 'true')` so returning guests jump straight to the celebration content.
  - **Duration:** Animation completes in under **2.5 seconds** from tap to hero reveal.
  - **Audio & Haptics:** Audio effects only play after an explicit guest tap. `navigator.vibrate` is treated as progressive enhancement (ignored on iOS).
- **RSVP Form Resilience:**
  - Use semantic keyboards: `inputmode="tel"` for phone, `inputmode="numeric"` for guest count.
  - Persist draft entries in `sessionStorage` so network drops at remote wedding venues do not wipe guest input.

---

## 3. Motion & Animation Tokens

All UI animations must execute exclusively on GPU-accelerated properties: `transform` and `opacity`. Never animate `width`, `height`, `top`, `bottom`, or `left`.

### Motion Token Values

```css
:root {
  --motion-fast: 150ms; /* Button presses, toggle switches, hover feedback */
  --motion-base: 300ms; /* Dialog openings, accordions, toast reveals */
  --motion-slow: 600ms; /* Envelope unsealing, hero section transitions */
  --ease-out-luxury: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-smooth: cubic-bezier(0.65, 0, 0.35, 1);
}
```

### Accessibility & Reduced Motion

Every animation must be wrapped in `prefers-reduced-motion` media queries:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- When reduced motion is active, the envelope reveals immediately with a clean opacity fade.
- Floating petals, shimmer effects, and parallax scrolls are completely disabled.

---

## 4. Design System Architecture & shadcn/ui Integration

### Three-Zone Component Matrix

| Component Area                     | Implementation                                                             | Permitted Tokens                                             | Isolation Rule                      |
| ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| **Guest Wedding Site (`/[slug]`)** | Custom luxury templates + accessible headless primitives (Dialog, Stepper) | `--theme-*` (couple palette) + `--ui-*` (neutral primitives) | **STRICTLY NO `--brand-*`**         |
| **Concierge Admin (`/admin/*`)**   | shadcn/ui component suite (Radix + Tailwind)                               | `--ui-*` (neutral) + `--brand-*` (platform)                  | Speed & high-density desktop tables |
| **Marketing Site (`/`)**           | shadcn/ui primitives + bespoke hero/preset showcases                       | `--brand-*` + `--ui-*`                                       | High conversion, luxury branding    |

### shadcn/ui `--ui-*` Token Bridge

Components installed under `src/components/ui/` use `--ui-*` classes directly to guarantee brand-isolation compliance:

- Backgrounds: `bg-ui-surface`, `bg-ui-canvas`
- Text: `text-ui-text-primary`, `text-ui-text-muted`
- Borders: `border-ui-border`
- Rings: `ring-ui-accent`

---

## 5. Viewport & Responsiveness Rules

- **Viewport Units:** Use `dvh` (dynamic viewport height) or `svh` (small viewport height) instead of `100vh` to avoid layout jumps caused by address bar expansion in mobile Chrome and WhatsApp in-app browser.
- **Safe Areas:** Declare `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` in root layouts.
- **Logical Properties:** Use `margin-inline`, `padding-inline`, `border-inline-start` to ensure seamless layout reflow for right-to-left (RTL) scripts (e.g. Urdu wedding invites).
- **Text Zooming:** Layouts must remain legible and unclipped when browser or operating system font scale is set to **200%**.

---

## 6. Core Web Vitals & Performance Budget

| Metric                              | Target (Mid-range Android over 4G) | Enforcement Mechanism                                            |
| ----------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| **Largest Contentful Paint (LCP)**  | ≤ 2.5 seconds                      | Preloaded hero image, size-adjusted fonts                        |
| **Interaction to Next Paint (INP)** | ≤ 200 milliseconds                 | Zero heavy JS on main thread, GPU-only CSS transitions           |
| **Cumulative Layout Shift (CLS)**   | ≤ 0.1                              | Explicit `aspect-ratio` on images, fallback font metric override |
| **Guest Initial JS Bundle**         | ≤ 100 KB gzipped                   | Headless Radix trees, no heavy icon libraries or CSS-in-JS       |
| **Envelope Asset Budget**           | ≤ 60 KB total                      | Pure CSS/SVG flap and wax seal; no uncompressed Lottie           |
