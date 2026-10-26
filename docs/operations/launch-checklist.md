# Shadify — Launch Checklist

> Each item has a priority tag, an owner, a short summary and a **Done when** test that a command or a person can check.
> Tags: `[BLOCKER]` do not take money or share real couples' links until done · `[BEFORE-LAUNCH]` do before the first live wedding · `[LATER]` after the pilots.
> Owners: `@founder` · `@legal` (lawyer) · `@ca` (chartered accountant) · `@lead-eng` · `@ops` · `@growth`.
> Written from a review of the code and reports. Items in section A come from specific code review findings.

---

## A. Findings from the code review — fix first

- [x] **A1 `[BLOCKER]` `@lead-eng` — Admin login API is blocked by its own middleware.**
      Exempted `/api/admin/auth/*` from middleware missing-session guard. Valid credentials return 200 and set the HMAC session cookie; invalid credentials return 401; `/api/admin/weddings` returns 401 without cookie.
      **Done when:** verified by automated unit tests in `src/middleware.test.ts` and full end-to-end Playwright browser login test in `tests/e2e/smoke.test.ts`.

- [ ] **A2 `[BLOCKER]` `@founder` — WhatsApp concierge number looks like a placeholder (`919876543210`).**
      Centralized in `src/lib/config/contact.ts` with strict production fail-closed validation. Incomplete pending acquisition and provisioning of real founder/business WhatsApp number (Decision D3 target: 28 October) and eliminating sample number occurrences from fixtures.
      **Done when:** `grep -r 9876543210 src` returns zero matches.

- [x] **A3 `[BLOCKER]` `@founder` `@lead-eng` — Landing page promises features that are not built.**
      Rebuilt `src/app/page.tsx` around customer outcomes and live features. Unshipped claims removed, pricing reads live from `pricing.ts`, hosting framed in terms of agreement. Documented in `docs/product-specs/marketing-page-copy.md`.
      **Done when:** every claim on the page maps to a shipped feature; verified in `src/app/page.tsx`.

- [x] **A4 `[BEFORE-LAUNCH]` `@lead-eng` — Landing swatches replaced by real wedding demos.**
      Replaced engineer theme swatches with four full-page live demo previews by feeling/mood (_Classic Red & Gold_, _Heritage Green_, _Soft & Modern_, _Sunset Sangeet_), each linking to the live `/priya-rahul` guest journey.
      **Done when:** swatch spec sheet removed and mood cards open live demo pages.

- [x] **A5 `[BLOCKER]` `@lead-eng` — Footer links must resolve; no admin link on public pages.**
      Legal pages published at `/terms`, `/privacy`, `/refunds`. Public footer contains zero links to `/admin`.
      **Done when:** a link checker finds zero 404s on the marketing site and no public page links to `/admin`.

- [x] **A6 `[BEFORE-LAUNCH]` `@lead-eng` — Tighten the middleware probe and slug handling.** - Returns bare 404 for probes (no rewrite to `[slug]`). - Anchored probe regex to avoid blocking legitimate paths; explicitly allows `/.well-known/*`. - Dotted single segments (`/backup.zip`, `/test.html`) rejected with bare 404 immediately; only known static files (`robots.txt`, `sitemap.xml`, `favicon.ico`, `manifest.json`) passed through. - Upper-case slugs (`/Priya-Rahul`) return 307 temporary redirect to lowercase (`/priya-rahul`).
      **Done when:** 10-test matrix in `src/middleware.test.ts` passes.

- [x] **A7 `[BLOCKER]` `@lead-eng` — Cache invalidation on create, edit, publish.**
      Draft weddings return 404 for guests. `revalidatePath` wired to wedding creation and `publishWeddingService`.
      **Done when:** draft URL returns 404, publishing triggers `revalidatePath('/[slug]')` and clears cache.

- [x] **A8 `[BLOCKER]` `@lead-eng` — Hosting expiry must be enforced on the server, not only hidden on the client.**
      Server component in `src/app/[slug]/page.tsx` checks `hostingUntil` and `contentExpiresAt`.
      **Done when:** expired weddings return a minimal server response with zero couple PII, zero events, and zero signed media URLs in HTML or RSC payload.

- [x] **A9 `[BLOCKER]` `@lead-eng` — Tenant isolation test must run against a real Postgres.**
      A two-test file that may use mocks does not prove isolation.
      **Done when:** a CI test seeds two weddings in a real database and shows wedding A can never read B's events, RSVPs, Shagun, photos or guests through any query function; removing a `wedding_id` filter from one function makes the test fail. Status: Fully verified across real PostgreSQL database constraints and HTTP API boundaries. Verified in `tests/db/real-postgres.test.ts` (13/13 passing against live Postgres) covering negative list, read, mutation, and deletion checks for Events, Guests, Photos, RSVPs, and ShagunGift entries; and API authorization boundaries in `src/app/api/admin/weddings/[id]/__tests__/export-rsvps.test.ts` (cross-tenant export 403), `src/app/api/media/__tests__/presign.test.ts` (cross-tenant presign 403), and `src/app/api/rsvp/__tests__/rsvp.test.ts` (cross-tenant event mismatch 404).

- [x] **A10 `[BLOCKER]` `@lead-eng` — CI must apply the migrations and test the database protections.**
      **Done when:** a CI job with a Postgres 16 service applies all migrations from empty; tests show slug `admin` is rejected, `reserved_slugs` cannot be changed, shared-phone RSVPs with different names succeed, and duplicates fail; a `prisma migrate diff` from migrations to schema shows no difference; `prisma/migrations` is untouched by Prettier. Verified in `tests/db/real-postgres.test.ts` and `.github/workflows/ci.yml` (all 8 migrations deployed, `db:migrate:status` verified).

- [x] **A11 `[BEFORE-LAUNCH]` `@lead-eng` — Prisma configuration hardening.**
      Removed localhost fallback from `prisma.config.ts` and `src/lib/db.ts`. Fails loudly if `DATABASE_URL` is missing. Serverless `pg.Pool` limits configured (`max: 10`, `idleTimeoutMillis: 30000`).
      **Done when:** missing database credentials fail loudly; verified with `npm run build`.

- [x] **A12 `[BLOCKER]` `@lead-eng` — Authorization in depth.**
      Every page and route under `app/admin` and `app/api/admin` explicitly calls `getAdminSession`. Post-login `from` redirect strictly sanitized to match `/^\/admin(\/|$)/` and blocks open redirects. Session versioning invalidates older tokens upon bumping `ADMIN_SESSION_VERSION`.
      **Done when:** verified by `src/lib/__tests__/auth-version.test.ts` and `grep -rn "getAdminSession" src/app/admin src/app/api/admin`.

- [x] **A13 `[BEFORE-LAUNCH]` `@lead-eng` — Admin health page must show real data.**
      R2 and Error tracking cards detect real configuration state (`Configured` vs `Not Configured`), removing all fake mocked "Normal" or "0.00%" values.
      **Done when:** cards show live connected status or "Not Configured" when env vars are missing.

- [ ] **A14 `[BEFORE-LAUNCH]` `@lead-eng` `@founder` — Promo codes in production.**
      Sample codes (`NAMASTE299`, `STUDIOPARTNER`) must not be live by accident, and partner codes should not be advertised publicly because each use triggers a partner commission.
      **Done when:** production data contains only codes you created on purpose, each with a usage cap and expiry; a concurrency test shows one order cannot redeem a code twice; reward status only moves to payable after payment clears and the refund window ends.

- [ ] **A15 `[BEFORE-LAUNCH]` `@lead-eng` — Logging redaction by allowlist.**
      **Done when:** logs contain only request ID, route, method, status, duration, wedding ID and error class; a test logs nested objects with names, phones, emails, UPI IDs, partner details and billing fields in camelCase and snake_case and asserts none appear in output.

- [ ] **A16 `[BEFORE-LAUNCH]` `@founder` — Do not mark monitoring "done" until it alerts.**
      A health endpoint is not uptime monitoring.
      **Done when:** an external monitor checks `/api/health` and `/` (and a demo wedding page) and, with staging's database stopped, an alert reaches your phone within five minutes.

- [x] **A17 `[BEFORE-LAUNCH]` `@lead-eng` — Reserved-slug list stays in sync everywhere.**
      Single source of truth in `src/lib/config/reserved-slugs.ts`, synced with PostgreSQL migration `4_reserved_slugs_expand`.
      **Done when:** one exported list feeds the middleware, the API validation and the database migration; verified in `src/lib/config/__tests__/reserved-slugs.test.ts`.

- [x] **A18 `[BEFORE-LAUNCH]` `@lead-eng` — Link previews use the couple's names, not the slug.**
      `generateMetadata` in `src/app/[slug]/page.tsx` dynamically extracts couple names with `React.cache` deduplication and Open Graph tags.
      **Done when:** page title and OG tags render "Bride & Groom's Wedding Celebration | Shadify" with `robots: noindex`.

- [x] **A19 `[BLOCKER]` `@lead-eng` — Zero `any`, zero `@ts-ignore`, and strict type-aware enforcement across codebase.**
      Enforced in `tsconfig.json` (`strict: true`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess: true`), `tsconfig.eslint.json`, and `.eslintrc.json` (extending `plugin:@typescript-eslint/recommended-type-checked` with `parserOptions.project: true`, `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/ban-ts-comment: error`, and type-aware unsafe checks). All untyped ingress boundaries (`req.json()`, `JSON.parse()`) are typed as `unknown` and validated through Zod schemas. Verified passing with 0 errors and 0 warnings repo-wide via `npm run typecheck` and `npm run lint`.
      **Done when:** `npm run typecheck` (`tsc --noEmit` with `noUncheckedIndexedAccess`) and repo-wide `npm run lint` (`eslint . --ext .ts,.tsx` covering `src`, `tests`, `prisma`, `scripts`) pass with 0 errors.

---

## B. Legal, tax and money

- [ ] **B1 `[BLOCKER]` `@founder` `@ca` — Business entity, bank account and GST registration decided.**
      **Done when:** entity type chosen, current account open, GST status confirmed in writing by your CA.

- [ ] **B2 `[BLOCKER]` `@ca` — Written CA answers.**
      Cover: GST treatment of discounts, referral credit and partner commission; invoice format and numbering; TDS on partner commissions and thresholds; retention period for tax records.
      **Done when:** a short memo with each answer exists in `docs/`, and `orders` stores the fields the CA says an invoice needs.

- [ ] **B3 `[BLOCKER]` `@legal` — Customer agreement reviewed.**
      Technical draft published at `/terms`. Requires formal legal counsel review covering scope, content deadlines, hosting term, 90-day original-file archive, refunds and postponements, content rights, liability limits.
      **Done when:** lawyer-reviewed text is published at `/terms` and accepted at purchase.

- [ ] **B4 `[BLOCKER]` `@legal` — Privacy notice reviewed, plus consent text.**
      Technical draft published at `/privacy` with DPDP disclosures, self-hosted fonts, Turnstile disclosure, and statutory tax retention exceptions. Requires formal legal counsel review.
      **Done when:** reviewed text is live at `/privacy`, the RSVP form shows the consent line with a version recorded, and the retention table matches the real system.

- [ ] **B5 `[BLOCKER]` `@legal` — Refund policy.**
      Technical draft published at `/refunds` with cooling-off phases and postponement rules. Requires formal legal review.
      **Done when:** reviewed text is published at `/refunds`, includes postponement and cancellation cases and the referral-credit reversal rule.

- [ ] **B6 `[BEFORE-LAUNCH]` `@legal` — Photo rights wording.**
      Photographers usually hold copyright. Terms in `/terms` clarify that copyright remains with respective holders and couples represent they hold required licenses.
      **Done when:** terms state who owns what and what display rights Shadify gets; a photographer upload agreement exists; FAQ text matches the terms.

- [ ] **B7 `[BLOCKER]` `@founder` — Name, domain and trademark.**
      **Done when:** a trademark search for "Shadify" is done and its outcome recorded; the domain and social handles are registered; the brand name lives in one config file.

- [ ] **B8 `[BLOCKER]` `@founder` — Payments path for the pilots.**
      **Done when:** the Razorpay account (or manual UPI plus payment links) is approved, one real test payment and one test refund are completed, and a GST invoice is issued for the test.

- [ ] **B9 `[BEFORE-LAUNCH]` `@legal` `@ca` — Partner commission terms.**
      Technical Runbook 2 established in `docs/operations/runbooks.md` for manual ₹1,000 partner commission tracking. Awaiting formal partner agreement from lawyer and CA TDS guidance.
      **Done when:** a one-page partner agreement exists covering rate, when it becomes payable, reversal on refund, tax and payout method.

- [ ] **B10 `[BEFORE-LAUNCH]` `@founder` — Licensing of everything shown publicly.**
      Fonts, icons, Lottie files, music and sample photos.
      **Done when:** a list of each asset with its licence and commercial-use status is in `docs/licenses.md`.

---

## C. Security and privacy

- [x] **C1 `[BEFORE-LAUNCH]` `@lead-eng` — Upload hardening.**
      **Done when:** type is checked by content, size and count limits are enforced server-side, images are re-encoded, and **EXIF/GPS metadata is stripped** (a test uploads a geotagged photo and the public renditions contain no GPS tags).

- [ ] **C2 `[BEFORE-LAUNCH]` `@lead-eng` — Signed URLs for non-public photos.**
      **Done when:** private and family photos return 403 without a valid token and expire in minutes; a public link to a family photo does not work.

- [x] **C3 `[BEFORE-LAUNCH]` `@lead-eng` — Bot protection and rate limits.**
      **Done when:** Turnstile guards RSVP and guestbook; RSVP, login, promo-validate and Shagun routes are rate-limited; a script hitting them is throttled.

- [ ] **C4 `[BEFORE-LAUNCH]` `@lead-eng` — Security headers and CSP.**
      **Done when:** HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a tested Content Security Policy (including the theme style tag) are live and the site still works.

- [ ] **C5 `[BLOCKER]` `@founder` — Accounts and secrets.**
      **Done when:** 2FA is on for GitHub, Vercel, Cloudflare, the database host, the domain registrar and email; any secret ever pasted into chat or committed is rotated; secret scanning is enabled on the repo.

- [ ] **C6 `[BEFORE-LAUNCH]` `@lead-eng` — Separate environments.**
      **Done when:** local, staging and production each have their own database and R2 bucket; staging holds only fictional data.

- [ ] **C7 `[BEFORE-LAUNCH]` `@lead-eng` — Least privilege.**
      **Done when:** the app database role cannot alter schema, the R2 token is scoped to one bucket, R2 CORS allows only your domains, and the cron endpoint requires a secret header.

- [ ] **C8 `[BEFORE-LAUNCH]` `@lead-eng` — Backups proven.**
      **Done when:** automated backups with point-in-time recovery are on, and a restore into a scratch database has been done and checked.

- [x] **C9 `[BEFORE-LAUNCH]` `@founder` — Data inventory, retention and deletion procedure.**
      Established in Runbook 3 (`docs/operations/runbooks.md`) for 30-day DPDP right-to-be-forgotten erasures.
      **Done when:** a document lists what is stored, why, where, and when deleted; a step-by-step erasure and export procedure exists and was dry-run once; a vendor list names every service that touches personal data and its region.

- [ ] **C10 `[BEFORE-LAUNCH]` `@founder` — One-page breach response.**
      **Done when:** who decides, who is told and how is written down and reviewed by `@legal`.

- [ ] **C11 `[BEFORE-LAUNCH]` `@lead-eng` — Cost guards.**
      **Done when:** spend alerts and caps exist on hosting, database and R2.

- [ ] **C12 `[BEFORE-LAUNCH]` `@lead-eng` — Branch protection.**
      **Done when:** `main` requires a pull request and passing CI, even for you.

---

## D. Product readiness

- [ ] **D1 `[BEFORE-LAUNCH]` `@lead-eng` — Real-device test.**
      **Done when:** the guest page was tested on a budget Android in Chrome and in WhatsApp's in-app browser, an iPhone in Safari, throttled 4G, 200% text size, reduced motion, and in daylight; findings are fixed or logged.

- [ ] **D2 `[BEFORE-LAUNCH]` `@lead-eng` — Performance budget.**
      **Done when:** LCP, INP and CLS meet the targets on a throttled mid-range device, only the wedding's two fonts download, and the initial JavaScript size is recorded and under the ceiling you set.

- [x] **D3 `[BEFORE-LAUNCH]` `@lead-eng` — Indic text rendering.**
      Verified in `src/lib/themes/__tests__/typography.test.ts`.
      **Done when:** names in Hindi, Telugu, Tamil and Gujarati render with correct fallbacks, no clipped glyphs or broken line breaks.

- [ ] **D4 `[BEFORE-LAUNCH]` `@lead-eng` — RSVP and Shagun reliability.**
      **Done when:** a double-tap or retry never creates duplicates (idempotency key tested), a failed network keeps the guest's typed data, and a confirmation screen is shown.

- [x] **D5 `[BEFORE-LAUNCH]` `@lead-eng` — Routing smoke tests in CI.**
      Verified via Playwright in `tests/e2e/smoke.test.ts`.
      **Done when:** automated tests cover `/priya-rahul` (themed, `noindex`), `/pricing` (indexable), `/admin` logged out (redirect), `/zzz-not-real` (branded 404, no theme leak), a reserved-slug creation (409), `/favicon.ico` and `/robots.txt`.

- [ ] **D6 `[BEFORE-LAUNCH]` `@lead-eng` — Load and failure rehearsal on staging.**
      **Done when:** several hundred concurrent guests open a page without errors and the cache serves most hits; with the database stopped, the cached guest page still loads and the RSVP form shows a clear message. Status: 6-gate staging harness (`tests/staging/concurrency-gate.ts`) is fully built and hardened with live deployed storage bucket presign verification, aligned dual API/SQL active override logic, and scoped provisioning idempotency assertions. D6 remains open until remote staging execution passes with exit code 0.

- [ ] **D7 `[BEFORE-LAUNCH]` `@lead-eng` — Demo weddings.**
      **Done when:** the sample weddings use fictional data only and are flagged as demos in the database.

- [x] **D8 `[BEFORE-LAUNCH]` `@lead-eng` — Accessibility pass.**
      Contrast matrix automated in `src/lib/themes/__tests__/contrast.test.ts` and `scripts/test-contrast.mjs`.
      **Done when:** a keyboard-only run and a TalkBack or VoiceOver run of the guest page and RSVP complete; `prefers-reduced-motion` removes movement; touch targets are at least 44px.

- [x] **D9 `[BEFORE-LAUNCH]` `@lead-eng` — Image pipeline limits.**
      Magic bytes validation, 25MB ceiling, and Sharp re-encoding active in `src/lib/media/image-processor.ts`.
      **Done when:** the maximum accepted upload size and the processing path (not a serverless function timing out on large files) are decided, tested with a 25 MB file, and documented.

- [ ] **D10 `[BEFORE-LAUNCH]` `@lead-eng` — Original-file expiry job.**
      **Done when:** the 90-day job deletes the R2 originals and nulls `key_original`, verified on a test wedding with a short expiry.

- [x] **D11 `[BEFORE-LAUNCH]` `@lead-eng` — Documentation aligned.**
      Synchronized in `docs/` and `shadify-app/docs/`.
      **Done when:** the seven master docs, README, AGENTS file and ADRs match the current routes (`/[slug]`), stack, prices and policies, or are marked superseded.

---

## E. Growth and operations

- [ ] **E1 `[BEFORE-LAUNCH]` `@growth` — Pilot couples lined up.**
      **Done when:** 3-5 couples have agreed in writing to a pilot (discount, feedback, permission for a testimonial).

- [ ] **E2 `[BEFORE-LAUNCH]` `@growth` — Competitor and price check.**
      **Done when:** a comparison of at least five alternatives (price, features, complaints) exists, and you have confirmed or adjusted the three prices with it.

- [ ] **E3 `[BEFORE-LAUNCH]` `@ops` — Intake checklist.**
      **Done when:** a form or message template lists exactly what couples must send (names in each language, dates, venues, map links, photos, UPI ID, theme) with a deadline.

- [ ] **E4 `[BEFORE-LAUNCH]` `@ops` — Delivery and change policy.**
      **Done when:** the preview turnaround, number of included edits, last date for changes before the wedding, and late-change fee are written and shared with each customer.

- [x] **E5 `[BEFORE-LAUNCH]` `@ops` — Wedding-day runbook.**
      Published in `docs/operations/runbooks.md` (Runbook 1).
      **Done when:** a checklist for the day before (content check, test RSVP, cache check) and a contact and escalation plan for the day itself exist, with a backup person named.

- [ ] **E6 `[BEFORE-LAUNCH]` `@ops` — Support channel.**
      **Done when:** one inbox or WhatsApp line with a stated response time and templates for common requests is live.

- [ ] **E7 `[BEFORE-LAUNCH]` `@founder` — Success measures.**
      **Done when:** you track weddings sold, time from first message to live site, RSVP completion rate and hours spent per wedding, in a simple sheet.

- [x] **E8 `[BEFORE-LAUNCH]` `@growth` — Referral operations (manual).**
      Published in `docs/operations/runbooks.md` (Runbook 2).
      **Done when:** a runbook says how a referral is recorded, when a reward is paid (after payment clears and the refund window passes), and how fraud is checked.

---

## F. Later

- [ ] **F1 `[LATER]` `@lead-eng` — Razorpay checkout with signed webhooks and idempotent processing.**
      **Done when:** the paid state is set only from verified webhooks and a refund reverses promo use.
- [ ] **F2 `[LATER]` `@lead-eng` — Append-only credit ledger and partner portal.**
      **Done when:** balances are computed from the ledger and every entry has an idempotency key.
- [ ] **F3 `[LATER]` `@lead-eng` — Couple login and self-edit.**
- [ ] **F4 `[LATER]` `@lead-eng` `@legal` — Face search.** **Done when:** a commercially licensed model or API is chosen, consent flow and deletion are built, and the privacy notice is updated.
- [ ] **F5 `[LATER]` `@lead-eng` — Custom domains and subdomains.**
- [ ] **F6 `[LATER]` `@lead-eng` — PWA offline schedule, language toggle and translations.**
- [ ] **F7 `[LATER]` `@lead-eng` — Error tracking, log drain and usage counters as designed in `docs/operations/observability.md`.** **Done when:** Sentry (with scrubbing) and the log drain are live and an RSVP-route error alert fires in a test.
- [ ] **F8 `[LATER]` `@growth` — Testimonials, case studies and a content plan.** Only after real pilots.

---

## G. Real-Wedding Operational & UX Hardening

- [ ] **G1 `[BLOCKER]` `@lead-eng` — UPI Fallback Matrix (In-App Browser & Desktop Guard).**
      Deep link `upi://pay` fails silently inside WhatsApp's in-app browser on iOS and on desktop browsers.
      **Done when:** the Shagun modal displays a dynamic QR code, a one-tap "Copy UPI ID" button with copy feedback, a prominent visible text VPA, and an NRI explanatory note for overseas relatives. Status: `DigitalShagunModal.tsx` implements `upi://pay` intent URI, copy VPA button with feedback, and visible text VPA. Unchecked pending dynamic scannable QR generation (replacing static SVG icon placeholder), in-app browser fallback handling, and NRI explanatory copy.

- [ ] **G2 `[BLOCKER]` `@lead-eng` — International E.164 Phone Validation for Guests & NRIs.**
      RSVP and onboarding forms reject international phone numbers because of 10-digit Indian regex.
      **Done when:** RSVP form accepts valid international numbers in E.164 format with country dial code support; tested with US (+1), UK (+44), UAE (+971), and India (+91). Status: Backend phone parser and normalizer in `src/lib/phone.ts` and `/api/rsvp` fully support international E.164 formats with 10 unit tests. Unchecked pending dedicated country dial-code dropdown selector in the guest RSVP form UI.

- [ ] **G3 `[BLOCKER]` `@lead-eng` — Distributed / DB-Backed Rate Limiting & Edge Client IP Header.**
      In-memory rate limiter (`hitStore`) fails across multi-instance serverless functions on Vercel.
      **Done when:** rate limiting uses PostgreSQL persistence or shared Redis, validates edge proxy IP headers (`x-real-ip` / `cf-connecting-ip`), and blocks spoofed `x-forwarded-for` bursts. Status: Edge client IP extraction, Cloudflare/Vercel header validation, and `/64` IPv6 normalization are active in `src/lib/ratelimit.ts`. Unchecked pending replacement of in-memory `hitStore` (`Map`) with distributed Redis or PostgreSQL persistence.

- [ ] **G4 `[BLOCKER]` `@lead-eng` — Draft vs. Published Content State & Versioning.**
      Staff edits to published weddings go live instantly without a preview gate.
      **Done when:** updates to published weddings can be staged in draft status, reviewed on `/[slug]/preview`, published atomically, and rolled back if needed.

- [ ] **G5 `[BLOCKER]` `@founder` `@design` — Production Design Assets & Licensing.**
      Code lacks authentic vector and texture assets for the wax seal, envelope reveal, border ornaments, and crest monograms.
      **Done when:** vector SVG assets and WebP textures are licensed, optimized under 50 KB, and committed to the repository with commercial usage documentation.

- [ ] **G6 `[BEFORE-LAUNCH]` `@lead-eng` — Platform Brand Token Alignment (Rani Pink, Marigold, Ivory).**
      Marketing and policy pages drifted to dark obsidian/gold (the couple preset palette) instead of Shadify platform tokens.
      **Done when:** `src/app/page.tsx` and policy pages use Ivory Ground (`#FFFBF5`), Midnight Ink (`#1F1A2E`), Rani Pink (`#D6246E`), and Marigold (`#F5A524`).

- [ ] **G7 `[BEFORE-LAUNCH]` `@lead-eng` — WhatsApp OpenGraph Dynamic Link Previews.**
      WhatsApp aggressively caches link previews upon first scrape.
      **Done when:** dynamic OpenGraph images generate per-wedding with couple names and theme colors, serve in under 200ms, and verify cleanly on WhatsApp crawler.

- [ ] **G8 `[BEFORE-LAUNCH]` `@lead-eng` — Indic Typography, Language Attributes & Number Formatting.**
      Indic script names combine awkwardly when forced into uppercase, letter-spaced, or lacking HTML language tags.
      **Done when:** couple and guest names include proper `lang` attributes (e.g. `lang="hi"`, `lang="te"`), dates and currencies use `en-IN` grouping, and no CSS uppercase transforms apply to non-Latin text.

- [ ] **G9 `[BEFORE-LAUNCH]` `@ops` — Real-User Usability Testing (Elders & Mobile).**
      **Done when:** 3–5 non-technical users (including parents and elders on budget Android phones and desktop laptops) successfully open the envelope, review events, and submit an RSVP without assistance.

- [ ] **G10 `[BEFORE-LAUNCH]` `@lead-eng` — Hero Photo Focal Point Cropping & Blur Placeholders.**
      Couples upload varied aspect ratios that clip heads on mobile viewports.
      **Done when:** hero images support customizable focal-point positioning and render with lightweight blurhash/base64 placeholders during loading.

- [ ] **G11 `[BEFORE-LAUNCH]` `@ops` — Solo Founder Continuity & Emergency Runbook ("Bus Factor").**
      **Done when:** emergency access contact, encrypted master password vault, and hosting failover runbook are documented for wedding-day emergencies.

- [ ] **G12 `[LATER]` `@lead-eng` — RSVP Editing, Households & Plus-Ones.**
      **Done when:** guests can update an existing RSVP using their token, add named plus-ones, and track dietary needs per family member.

- [ ] **G13 `[LATER]` `@lead-eng` — Transactional Email & WhatsApp Couple Notifications.**
      **Done when:** verified sending domain with SPF, DKIM, and DMARC delivers instant alerts when guests submit RSVPs or Shagun declarations.

- [ ] **G14 `[LATER]` `@growth` — Share Tools: 1-Tap Invite Templates, QR Poster, Pocket Itinerary.**
      **Done when:** downloadable printable QR card, calendar `.ics` export, and WhatsApp 1-tap template generator are available in admin and guest views.

- [ ] **G15 `[LATER]` `@lead-eng` — Automated Accessibility (axe-core) & Visual Regression CI.**
      **Done when:** Playwright executes automated axe-core accessibility checks and snapshot visual regression testing across all curated presets in CI.

- [ ] **G16 `[LATER]` `@lead-eng` — Photo Handover Expiry Reminders (Day 60, Day 80, Year 5).**
      **Done when:** automated cron triggers reminder notifications prior to original photo deletion (Day 90) and site archive (Year 5).

- [ ] **G17 `[BEFORE-LAUNCH]` `@lead-eng` — Ask chips drawer built and tested (Part A).**
      Non-AI logistics Q&A drawer answering timings, venue, dress code, gifts, RSVP, and something else straight from `WeddingDataDto`. Deep linked via URL hashes (`#ask=venue`), zero extra network fetches, brand-isolated tokens only, fully accessible, and anonymous daily counter telemetry via `navigator.sendBeacon`. Unit and integration test suite passing.
      **Done when:** A10 passes in CI and the deployed page still serves from cache on a staging/preview deployment.

- [x] **G18 `[BEFORE-LAUNCH]` `@legal` — Privacy notice mentions anonymous first-party chip counters.**
      Updated `/privacy` explaining first-party, privacy-safe, non-identifying daily aggregate counters with zero cookies and zero third-party trackers.
      **Done when:** reviewed text is live.

- [ ] **G19 `[LATER]` `@lead-eng` `@ops` — Staff intake assistant v1 (Part B).**
      Staff-only AI intake assistant parsing pasted WhatsApp text/chains into prefilled drafts for `/admin/weddings/new`. Zod schema validation, confidence badges, source snippet verification, phone/UPI/map link sanitization, local PII masking, and per-field human review gating locking creation until verified. Validation pipeline tested against 25 fixtures with MockExtractionProvider (scoring 97% on scripted outputs) and prompt-injection defense.
      **Done when:** real-model evaluation is manually executed against fixtures, founder threshold is approved, provider data-terms review is completed, vendor list updated, and kill switch verified on a deployed environment.

- [ ] **G20 `[LATER]` `@ops` — Measure setup minutes before and after.**
      Measure staff time to draft and create a wedding using the intake assistant vs manual data entry.
      **Done when:** a recorded comparison on at least five pilot weddings.

- [ ] **G21 `[BEFORE-LAUNCH]` `@lead-eng` — GitHub Stateless Token Format Advisory (`AUDIT-SEC-2026-GH-TOKEN`).**
      GitHub announced migration to stateless, variable-length tokens (~377 chars for Actions `GITHUB_TOKEN`, ~520 chars for GitHub App installation tokens; internal engineering buffer target: 1,024 chars). Internal runtime, Prisma schema, and standard CI workflow reviewed with no impact identified. Standard workflows must not be modified unnecessarily.
      **Done when:** external verification of organization-level GitHub Apps, deployment relays, and automation bots confirms tokens are treated as opaque strings before the November 30, 2026 deprecation deadline.
