# Shadify — Modular Monolith & Component Engineering Guidelines

> Architecture specification for component layering, domain boundaries, one-way dependency rules, and pluggable section registries in Shadify.

---

## 1. The Four Component Layers

To ensure reusability without premature abstraction or spaghetti dependencies, every UI element belongs to exactly one of four layers. **Dependencies point downward only.**

```
┌────────────────────────────────────────────────────────┐
│  4. Sections & Pages (`app/**`)                        │
│     Thin layout composition, route wiring, metadata   │
└──────────────────────────┬─────────────────────────────┘
                           │ calls down
┌──────────────────────────▼─────────────────────────────┐
│  3. Feature Components (`features/<domain>/components`)│
│     Domain-aware UI (EventCard, RsvpForm, ShagunPanel) │
└──────────────────────────┬─────────────────────────────┘
                           │ calls down
┌──────────────────────────▼─────────────────────────────┐
│  2. Generic Patterns (`components/patterns`)           │
│     Domain-agnostic UX compositions (FormField, Empty) │
└──────────────────────────┬─────────────────────────────┘
                           │ calls down
┌──────────────────────────▼─────────────────────────────┐
│  1. Headless Primitives (`components/ui`)              │
│     Pure tokens: Button, Input, Card, Dialog, Badge    │
└────────────────────────────────────────────────────────┘
```

### Layer Rules

| Layer             | Path                                | Allowed Dependencies                                   | Forbidden                                                          |
| ----------------- | ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| **1. Primitives** | `src/components/ui/`                | Only `--ui-*` tokens, Radix headless primitives, `cva` | Zero domain knowledge, no data fetching, no wedding terminology    |
| **2. Patterns**   | `src/components/patterns/`          | Primitives (`components/ui`)                           | No domain business logic, no Prisma queries                        |
| **3. Features**   | `src/features/<domain>/components/` | Primitives, Patterns, feature schemas/types            | Must not import internals of other sibling features                |
| **4. App Pages**  | `src/app/**`                        | Feature services, queries, public exports              | Thin orchestrators; no inline Prisma queries or raw business rules |

---

## 2. Modular Monolith Directory Structure

Features are organized strictly by **business domain**, not by technical file type:

```
src/
├── app/                        # Routing only: pages, layouts, route handlers (thin)
│   ├── [slug]/                 # Direct guest wedding website
│   │   ├── page.tsx            # Thin server component: queries & renders sections
│   │   └── preview/            # Staff dynamic preview route
│   ├── admin/                  # Staff concierge operations
│   └── api/                    # Route handlers (delegates to feature services)
├── components/
│   ├── ui/                     # Layer 1: Headless primitives (Button, Input, Dialog)
│   └── patterns/               # Layer 2: Compositions (FormField, EmptyState, ConfirmDialog)
├── features/                   # Layer 3: Domain modules (Modular Monolith)
│   ├── weddings/               # Weddings domain
│   │   ├── components/         # Wedding-specific UI (MonogramBadge, WeddingDetailsForm)
│   │   ├── schemas.ts          # Zod input schemas (shared by client forms & API)
│   │   ├── queries.ts          # Pure Prisma read operations
│   │   ├── service.ts          # Transactional business logic & domain validations
│   │   └── index.ts            # Public boundary export for other modules
│   ├── events/                 # Event scheduling & ceremony itineraries
│   ├── rsvp/                   # Guest headcount, meal preferences, dietary tracking
│   ├── shagun/                 # Zero-commission UPI cash gifting & ledger
│   ├── media/                  # Cloudflare R2 uploads, presigning, EXIF stripping
│   └── guest/                  # Guest page section registry & envelope reveal
├── lib/                        # Cross-cutting infrastructure: db, r2, log, env, auth
├── config/                     # Single source of truth: pricing, plans, presets, limits
└── types/                      # Ambient and shared TypeScript definitions
```

### Module Boundary Rules

1. **Public Exports Only:** When Feature A needs functionality from Feature B, it must import exclusively from `@/features/B` (`index.ts`). Never reach into private internals like `@/features/B/queries.ts`.
2. **Thin Route Handlers:** API routes (`src/app/api/...`) and Server Actions must never run raw Prisma queries or heavy validation logic directly. They parse the request, invoke the feature's `service.ts` or `queries.ts`, and return a structured JSON response.
3. **Pure Infrastructure:** `src/lib/` knows nothing about features. It provides utility primitives (`logger`, `prisma`, `env`, `r2Client`).

---

## 3. Pluggable Guest Section Registry Pattern

Instead of hardcoding a rigid page layout in `[slug]/page.tsx`, guest sections are dynamically orchestrated through a registry based on `theme_config.sections`:

```tsx
// src/features/guest/section-registry.tsx
import React from "react";
import type { WeddingData } from "@/features/weddings";
import type { ThemeConfig } from "@/lib/themes/tokens";

export type SectionId = "hero" | "story" | "events" | "rsvp" | "shagun" | "vips";

export interface SectionProps {
  wedding: WeddingData;
  theme: ThemeConfig;
}

export const SECTION_REGISTRY: Record<SectionId, React.ComponentType<SectionProps>> = {
  hero: HeroSection,
  story: StorySection,
  events: ItinerarySection,
  rsvp: RsvpSection,
  shagun: ShagunSection,
  vips: VipsSection,
};

export function RenderSections({ wedding, theme }: SectionProps) {
  const sectionToggles = theme.sections;
  const orderedSectionIds: SectionId[] = ["hero", "story", "events", "vips", "rsvp", "shagun"];

  return (
    <>
      {orderedSectionIds.map((id) => {
        // Skip disabled sections
        if (id === "story" && !sectionToggles.showLoveStory) return null;
        if (id === "vips" && !sectionToggles.showVips) return null;
        if (id === "shagun" && !sectionToggles.showShagun) return null;

        const Component = SECTION_REGISTRY[id];
        return Component ? <Component key={id} wedding={wedding} theme={theme} /> : null;
      })}
    </>
  );
}
```

---

## 4. Shared Contracts & Single Source of Truth

- **One Zod Schema Per Input:**
  - Every mutation defines its Zod schema once in `features/<domain>/schemas.ts`.
  - Client forms and server route handlers import the exact same schema.
  - TypeScript types are derived automatically via `z.infer<typeof Schema>`.
- **Prisma Decoupling via DTOs:**
  - Database rows are mapped into clean Data Transfer Objects (DTOs) before reaching UI components.
  - UI components never accept raw `@prisma/client` models, preventing database schema changes from rippling across frontend templates.
- **Centralized Configuration:**
  - Tiers, pricing, limits, and retention periods live in `src/lib/config/pricing.ts`.
  - Presets and contrast rules live in `src/lib/themes/presets.ts`.
  - Zero magic numbers or hardcoded pricing scattered across files.

---

## 5. Component Implementation Best Practices

1. **Composition Over Configuration:** Avoid monolithic components with 10+ boolean props. Decompose into compound pieces: `<Card><CardHeader /><CardContent /></Card>`.
2. **`class-variance-authority` (cva):** Use `cva` for all variant and size styling to maintain typed, predictable class combinations.
3. **Server Components by Default:** Keep components as React Server Components (RSC) unless user event listeners (`onClick`, `onChange`), browser APIs (`localStorage`, `window`), or React hooks (`useState`, `useEffect`) are strictly required.
4. **The Rule of Three:** Tolerate minor duplication twice. Extract into a shared `components/patterns` utility only on the **third** concrete use case.
5. **No Barrel Sprawl:** Maintain `index.ts` exclusively at domain boundaries (`src/features/<domain>/index.ts`). Do not create nested barrel files for every subfolder.
