# AGENTS.md — Shadify Engineering Rules & Instructions

> Single Source of Truth for all AI coding agents working on the Shadify codebase.

---

## 1. Project Overview & Architecture

**Shadify** is a luxury digital operating system and wedding invitation platform tailored for Indian weddings.
The system is divided into three strictly isolated product zones:

| Zone                    | Route Prefix               | Theme Source                           | Audience & SEO                                                    |
| ----------------------- | -------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| **Marketing**           | `/` (apex)                 | Shadify brand theme (`--brand-*`)      | Prospects, couples. SEO indexed.                                  |
| **Admin Concierge**     | `/admin/*`, `/api/admin/*` | Shadify brand theme (`--brand-*`)      | Staff only. Password/HMAC session guarded.                        |
| **Guest Wedding Sites** | `/[slug]`                  | Couple's selected preset (`--theme-*`) | Invited wedding guests. `noindex`, statically cached via CDN/ISR. |

- **Stack**: Next.js 14 (App Router), TypeScript (Strict), Prisma 7 (`@prisma/adapter-pg` with `pg.Pool`), Tailwind CSS, Radix UI.
- **Detailed Docs**: Refer to [`docs/ENGINEERING-GUIDELINES.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/docs/ENGINEERING-GUIDELINES.md), [`docs/UI-UX-GUIDELINES.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/docs/UI-UX-GUIDELINES.md), and [`docs/LAUNCH-CHECKLIST.md`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/docs/LAUNCH-CHECKLIST.md).

---

## 2. Standard Commands

| Command                     | Purpose                                                            | Safety / Environment                                        |
| --------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `npm run check`             | Runs format check, lint, brand isolation audit, typecheck, & tests | **Mandatory before committing or finishing any task**       |
| `npm run dev`               | Starts local Next.js development server                            | Safe (Local)                                                |
| `npm run build`             | Generates Prisma client & builds production Next.js bundle         | Safe (Local & CI)                                           |
| `npm run test`              | Runs Vitest unit & integration test suites                         | Safe (Local & CI)                                           |
| `npm run test:e2e`          | Runs Playwright end-to-end smoke tests                             | Safe (Local & CI)                                           |
| `npm run format`            | Prettier write on codebase                                         | Safe (Local)                                                |
| `npm run lint:brand`        | Scans guest code for prohibited brand token references             | Safe (Local & CI)                                           |
| `npm run db:generate`       | Generates Prisma 7 client from schema                              | Safe (All envs)                                             |
| `npm run db:migrate:status` | Checks database migration synchronization                          | Safe (All envs)                                             |
| `npm run db:migrate:deploy` | Applies pending migrations in release workflow                     | **Production release step only. Never run inside `build`.** |
| `npm run db:migrate:dev`    | Creates new migration from schema diff                             | **Local development only with live Postgres**               |
| `npm run db:seed`           | Seeds sample wedding and demo data                                 | **Local development only**                                  |
| `npm run db:reset`          | Drops and recreates database                                       | **DANGEROUS: Local development only**                       |

---

## 3. Component Hierarchy & Dependency Rules

Code is organized in 4 layers with **strict downward dependencies only**:

1. **Primitives (`src/components/ui/`)**: `Button`, `Input`, `Card`, `Badge`, `Dialog`.
   - Depend only on `--ui-*` tokens and Radix UI.
   - Zero wedding business logic, zero data fetching.
2. **Patterns (`src/components/patterns/`)**: `EmptyState`, `PageHeader`.
   - Depend only on primitives. Generic, reusable combinations.
3. **Domain Features (`src/features/<domain>/`)**: `weddings`, `guest`, `photos`, `shagun`.
   - Encapsulate schemas (`schemas.ts`), DTOs (`types.ts`), queries (`queries.ts`), and services (`service.ts`).
   - Components only import DTOs; never import raw Prisma models into UI components.
4. **App Routes (`src/app/`)**: Thin orchestrators.
   - Fetch data via feature queries/services and pass DTOs into section components.

---

## 4. Hard Rules (Never Do)

1. **Tenant Data Isolation**:
   - Never query, mutate, or display tenant data without scoping by `wedding_id` or verified `slug`.
   - Never rely solely on middleware for authorization. Every admin API route and server action must call `requireAdminSession()` or verify session in-handler.
2. **Brand Isolation**:
   - Never use `--brand-*` CSS tokens, Tailwind brand utility classes (`bg-brand`, `text-brand`), or imports from `@/lib/brand` inside guest code (`src/app/[slug]` or `src/components/guest`).
   - Guest UI must use only `--theme-*` tokens and `--ui-*` neutral tokens.
3. **Guest Route Caching & Direct URLs**:
   - Wedding URLs are direct `/[slug]` (never `/w/[slug]`).
   - Never read `searchParams` in `src/app/[slug]/page.tsx` (it destroys Next.js static / CDN edge caching).
   - Previews live strictly on `/[slug]/preview` guarded by staff session or HMAC token.
4. **Time & Lifecycle Decoupling**:
   - Never compute expired status or event phases solely server-side on cached routes.
   - Embed ISO timestamps in DTOs and verify expiration / active event phases client-side.
5. **Database Integrity**:
   - Never run `prisma db push` on production or staging databases.
   - Never modify an already-applied migration SQL file. Always create a new numbered migration.
   - Connection URLs belong in `prisma.config.ts`, not `schema.prisma` (Prisma 7 requirement).
6. **Authoritative Pricing**:
   - Never hardcode prices, limits, or hosting periods in UI strings.
   - Always read from [`src/lib/config/pricing.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/config/pricing.ts):
     - Lite: ₹2,999 (299,900 paise)
     - Premium: ₹7,999 (799,900 paise)
     - Platinum: ₹19,999 (1,999,900 paise)
7. **Privacy & PII Protection**:
   - Never log couple names, phone numbers, email addresses, UPI VPAs, guest phone numbers, or tokens in server logs. Use structured logger [`src/lib/log.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/log.ts).
8. **Secrets & Environment**:
   - Never commit `.env` or `.env.local` files.
   - Never print raw secrets or environment variables in chat output.
9. **Legal & Marketing Claims**:
   - Never write unverified claims such as "DPDP compliant", "100% legal guarantee", or "you own your photos" in customer UI copy without legal clearance.

---

## 5. Coding Conventions

- **TypeScript**: Strict mode enabled. Never use `any`, `@ts-ignore`, or `@ts-nocheck`. Parse unknown input with Zod (`const raw: unknown = await request.json(); const input = Schema.parse(raw)`). Use `unknown` and type guards, not `any`. Always report the exact lint and typecheck commands executed.
- **Zod Schema First**: Every API route and mutation must parse input through a Zod schema before hitting domain services.
- **Server Components Default**: Default to React Server Components; use `"use client"` only when interactive state, browser APIs, or client-side lifecycle calculations are necessary.
- **Granular Database Errors**: When catching Prisma `P2002`, inspect `meta.target` to return specific typed errors (`DuplicateSlugError`, `DuplicatePhoneError`, `DuplicateEmailError`, `DuplicateDomainError`).
- **Rule of Three**: Extract shared utilities or abstractions only after the pattern has appeared in 3 distinct places.

---

## 6. Definition of Done & Quality Gate

Before marking any task complete:

1. Run `npm run check` and ensure all 5 gates pass:
   - `format:check`: Zero Prettier formatting violations.
   - `lint`: Zero ESLint warnings or errors.
   - `lint:brand`: Zero brand isolation leaks in guest routes.
   - `typecheck`: Zero TypeScript compiler errors.
   - `test`: All Vitest unit and integration suites pass.
2. If domain logic or data models were modified, add or update tests in `src/**/__tests__/`.
3. If structural or architectural decisions were made, document them in `docs/adr/`.

---

## 7. Honest Reporting Policy

- Report the **exact commands executed** and their actual output.
- Explicitly state **"not run"** for any test, build, or check that was not executed.
- Never state that a feature is "verified" or "production-ready" unless proven by automated test suites or command execution.
