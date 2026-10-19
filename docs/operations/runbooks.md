# Shadify — Concierge Operations Runbooks

> Authoritative Standard Operating Procedures (SOPs) for wedding-day high-traffic monitoring, B2B partner commission payouts, and statutory DPDP data privacy erasures.
> Every runbook provides explicit trigger conditions, pre-flight checklists, copy-pasteable SQL/CLI commands verified against the production PostgreSQL schema, and customer communication scripts.

---

## General Rules for All Operations

1. **Transactional Safety**: Run all manual emergency updates inside an explicit transaction block:
   ```sql
   BEGIN;
   -- execute query
   -- verify affected row count matches expectations exactly
   COMMIT; -- or ROLLBACK;
   ```
2. **Role Separation**: Emergency queries must be executed from a limited-privilege role or via vetted admin dashboard actions. Never use the database superuser for operational tasks.
3. **No Direct Production Data Mutation for Testing**: Never insert test rows or simulate synthetic writes into a live couple's wedding. Always run write-path tests against the seeded demo wedding (`priya-rahul`) or staging environment.
4. **Deploy Freeze**: A strict code and migration freeze is enforced starting **48 hours before any scheduled live wedding** and remains in effect until the end of the wedding weekend.

---

## Runbook 1: Wedding-Day Concierge Emergency & High-Traffic Triage SOP

### Overview

- **Owner**: `@ops` (Concierge On-Call Lead)
- **Applicability**: Any live wedding occurring today or within the next 48 hours.
- **Goal**: Guarantee zero downtime, fast edge page loads (< 1.5s on mobile networks), resilient RSVP writes, and instant response to live venue emergencies.

---

### Timeline & Checklist

#### Phase A: T-48 Hours (Pre-Flight Audit & Freeze)

1. **Activate Deploy Freeze**: Lock production deployments. Ensure no schema migrations or non-critical code releases occur.
2. **Inspect Readiness via Admin Dashboard** (`/admin/health`):
   - At least 1 published ceremony with title, start time, venue address, and valid Google Maps URL.
   - Verified couple portrait image loaded from Cloudflare R2.
   - Valid UPI Shagun VPA (e.g. `priya.rahul@okhdfcbank`) configured.
   - Active Theme contrast test status: `ok: true`.
3. **Edge CDN Pre-Warming**:
   Send a full `GET` request (not `HEAD`, as many CDNs do not populate cache on `HEAD`):
   ```bash
   curl -s -o /dev/null -D - "https://shadify.in/<slug>"
   # Inspect response headers:
   # cf-cache-status: MISS (1st hit) -> HIT (subsequent hits)
   # x-vercel-cache: HIT
   # cache-control: s-maxage=3600, stale-while-revalidate
   ```
   _Note: Edge caches are regional (per-PoP). Pre-warming from your local machine warms your nearest regional edge server._

#### Phase B: Morning of the Wedding (08:00 AM)

1. **Check System & Database Health**:
   ```bash
   curl -s "https://shadify.in/api/health" | jq .
   # Expected: status == "healthy", database.status == "healthy"
   ```
   _Latency Note_: Due to serverless pool allocation or Neon cold starts, first-hit latency can be 500–800ms. Subsequent warm queries should be < 150ms. For peak wedding season, ensure Neon compute auto-suspend is disabled or keep minimum compute active during event hours.
2. **Verify RSVP Write Path**:
   Verify the write path using the test wedding (`/priya-rahul`):
   ```bash
   curl -s -X POST "https://shadify.in/api/rsvp" \
     -H "content-type: application/json" \
     -d '{"weddingSlug":"priya-rahul","eventId":"<demo-event-id>","guestName":"Concierge Test","attending":true}' | jq .
   ```
3. **Staffing Check**: Confirm on-call engineer and WhatsApp concierge line (`+91 98765 43210`) are active.

---

### Emergency Scenarios & Triage Protocols

#### Incident 1: Typo on Physical Cards / Misprinted Wedding URL

- **Symptom**: The couple printed `priya-rahul-2026` on physical cards, but created slug `priya-rahul` in the system.
- **Root Danger**: Inserting a second `weddings` row divides the wedding into two separate databases (splitting RSVPs, photos, and guestbook entries).
- **Correct Architecture**: Use the `wedding_aliases` table to redirect the misprinted URL to the canonical wedding slug.

```sql
-- DDL for Alias Support (if not already applied)
CREATE TABLE IF NOT EXISTS "wedding_aliases" (
  "alias"      TEXT PRIMARY KEY CHECK (alias ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'),
  "wedding_id" UUID NOT NULL REFERENCES "weddings"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_wedding_aliases_wedding" ON "wedding_aliases"("wedding_id");

-- Operational Step: Add alias pointing to canonical wedding
BEGIN;

-- 1. Verify target wedding exists
SELECT id, slug, bride_name, groom_name FROM "weddings" WHERE slug = 'priya-rahul';

-- 2. Verify proposed alias is not already in reserved_slugs or existing weddings
SELECT slug FROM "reserved_slugs" WHERE slug = 'priya-rahul-2026'
UNION ALL
SELECT slug FROM "weddings" WHERE slug = 'priya-rahul-2026';

-- 3. Insert alias
INSERT INTO "wedding_aliases" ("alias", "wedding_id")
SELECT 'priya-rahul-2026', id
FROM "weddings"
WHERE slug = 'priya-rahul';

COMMIT;
```

_The application middleware detects the alias and issues a 301/307 redirect to `https://shadify.in/priya-rahul`._

---

#### Incident 2: Caterer / Family Demands Emergency RSVP Counts

- **Symptom**: Venue caterer urgently asks for dietary requirements (Jain vs Vegetarian vs Non-Veg headcounts) at the banquet entrance.
- **Triage Action**: Run meal totals aggregation and CSV export.

**1. Caterer Aggregation Query (Run in Read-Only Session):**

```sql
SELECT
  e.title AS "Ceremony",
  COALESCE(r.meal_preference::text, 'no_preference') AS "Meal Preference",
  COUNT(*) AS "Submissions",
  SUM(r.party_size) AS "Total Guests"
FROM "event_rsvps" r
JOIN "events" e ON r.event_id = e.id
JOIN "weddings" w ON r.wedding_id = w.id
WHERE w.slug = '<wedding-slug>'
  AND r.attending = true
GROUP BY e.title, r.meal_preference
ORDER BY e.title, "Total Guests" DESC;
```

**2. Export Full List to CSV (via psql):**

```bash
psql "$DATABASE_URL" -c "\copy (
  SELECT
    r.respondent_name AS \"Guest Name\",
    r.respondent_phone AS \"Phone\",
    r.party_size AS \"Party Size\",
    r.meal_preference AS \"Meal Preference\",
    r.needs_stay AS \"Accommodation\",
    r.arrival_notes AS \"Arrival Details\",
    r.blessing_message AS \"Blessing\",
    e.title AS \"Ceremony\",
    r.created_at AS \"RSVP Time\"
  FROM event_rsvps r
  JOIN events e ON r.event_id = e.id
  JOIN weddings w ON r.wedding_id = w.id
  WHERE w.slug = '<wedding-slug>' AND r.attending = true
  ORDER BY e.starts_at ASC, r.respondent_name ASC
) TO 'caterer_rsvps.csv' WITH CSV HEADER"
```

_Security Note: This file contains phone numbers and guest details. Send it directly to the verified couple or wedding planner over secure WhatsApp, and immediately delete the local CSV copy._

---

#### Incident 3: Cloudflare Turnstile Blocked on Venue Wi-Fi

- **Symptom**: Venue Wi-Fi has strict DNS filtering or guests report Turnstile fails to load, blocking RSVPs.
- **Triage Action**:
  1. The RSVP route accepts submissions with fallback handling when Turnstile service is degraded.
  2. For completely blocked guests, the wedding page displays a visible WhatsApp Concierge button:
     _"Trouble with the form? Click here to RSVP directly via WhatsApp."_
  3. Concierge records the guest response directly via the Admin Dashboard.

---

#### Incident 4: Urgent Content Change by Couple on Wedding Morning

- **Symptom**: Ceremony time or venue hall changes at the last minute (e.g. rain forces outdoor mandap inside).
- **Triage Protocol**:
  1. Update event details in Admin Dashboard (`/admin`).
  2. Invalidate cache instantly:
     ```bash
     curl -i -X POST "https://shadify.in/api/admin/revalidate" \
       -H "Authorization: Bearer $ADMIN_REVALIDATE_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"slug":"<wedding-slug>"}'
     ```
  3. Verify the updated timing renders on a fresh curl GET:
     ```bash
     curl -s "https://shadify.in/<slug>" | grep -C 2 "<new-venue-or-time>"
     ```

---

#### Incident 5: Production Deployment Incident / Rollback

- **Symptom**: A deployment causes client errors during live wedding hours.
- **Host**: **Vercel** (Production Host).
- **Action**:
  1. Open Vercel Project Dashboard -> **Deployments**.
  2. Locate the previous deployment tagged as stable.
  3. Click `...` -> **"Instant Rollback"** (promotes previous immutable bundle to production alias in < 30 seconds).
  4. Note: Migrations must always be backward-compatible (expand before contract), as rolling back frontend code does not roll back PostgreSQL schema.

---

## Runbook 2: B2B Partner Commission & Referral Payout SOP

### Overview

- **Owner**: `@finance` / `@ops`
- **Applicability**: Commission payouts to studio photographers, wedding planners, and venues who bring paid couples via partner codes (e.g. `STUDIOPARTNER`).
- **Standard Payout Amount**: Configured in `promo_codes.commission_paise` (typically ₹1,000 for Vivah/Rajwada plans).

---

### The 5-Step Payout Workflow

```
[Couple Onboards with Code]
         │
         ▼
[Step 1: Referral Recorded & Linked to Order]
         │
         ▼
[Step 2: Order Settles & 7-Day Refund Window Passes]
         │
         ▼
[Step 3: CA Review (TDS / PAN / GST Compliance)]
         │
         ▼
[Step 4: Execute Business UPI Payout]
         │
         ▼
[Step 5: Send WhatsApp Receipt to Partner]
```

#### Step 1: Verification of Settlement & Cooling-Off

Commissions are **never paid on coupon entry**. Payouts require:

1. Customer's order status is `'paid'`.
2. At least 7 calendar days have elapsed since `paid_at` with no cancellation or chargeback.

Query eligible referrals:

```sql
SELECT
  r.id AS "referral_id",
  p.partner_name,
  p.partner_phone,
  r.payout_upi,
  r.commission_paise / 100 AS "commission_inr",
  o.id AS "order_id",
  o.amount_paise / 100 AS "order_total_inr",
  o.paid_at,
  w.bride_name || ' & ' || w.groom_name AS "wedding_couple"
FROM "referrals" r
JOIN "promo_codes" p ON r.promo_code_id = p.id
JOIN "orders" o ON r.order_id = o.id
JOIN "weddings" w ON r.wedding_id = w.id
WHERE r.status = 'pending'
  AND o.status = 'paid'
  AND o.paid_at <= NOW() - INTERVAL '7 days'
ORDER BY o.paid_at ASC;
```

#### Step 2: Tax (TDS) Compliance Verification

- **Action**: Check cumulative payouts to this partner across the current financial year.
- **Rule**: _(Confirm current thresholds and Section 194H / 194R rates with Chartered Accountant)_:
  - If cumulative payouts exceed statutory threshold (confirm whether ₹15,000/year applies), obtain partner PAN and deduct applicable TDS before disbursement.
  - If below threshold, issue gross payout.

#### Step 3: Execute Bank Transfer & Update Ledger

1. Execute UPI/IMPS transfer from Business Bank account (HDFC / RazorpayX) to `r.payout_upi`.
2. Record bank UTR / transaction reference number.
3. Update database inside a transaction:
   ```sql
   BEGIN;
   UPDATE "referrals"
   SET
     "status" = 'paid',
     "payout_txn_ref" = '<Bank_UTR_Number>',
     "paid_at" = NOW()
   WHERE "id" = '<referral_id>'
     AND "status" = 'pending';
   -- Ensure exactly 1 row updated
   COMMIT;
   ```

#### Step 4: WhatsApp Notification to Partner

Send the confirmed payout receipt:

> Namaste **[Partner Name]**! 🌸
>
> Thank you for referring **[Bride & Groom Name]**'s wedding to Shadify. Their celebration site is live!
>
> We have processed your referral commission:
> • **Amount**: ₹[Commission Amount]
> • **UPI VPA**: [Partner UPI VPA]
> • **Bank Reference (UTR)**: [Transaction Reference]
>
> We look forward to partnering on your upcoming weddings. Your code **[PARTNERCODE]** remains active.

---

## Runbook 3: DPDP Data Privacy Erasure ("Right to be Forgotten") SOP

### Overview

- **Owner**: `@compliance` / `@lead-eng`
- **Applicability**: Formal erasure requests received at `privacy@shadify.in` or via WhatsApp concierge from guests or couples asking to delete personal records.
- **Target Resolution SLA**: **30 calendar days** target resolution _(confirm formal statutory DPDP rules timeline with legal counsel)_.

---

### Procedure A: Guest-Level Erasure (Scrubbing Single Person's Records)

_Trigger: A guest requests: "Please delete my phone number, RSVP response, and photo from the site."_

1. **Verify Identity**:
   - Send a verification OTP or confirmation code to the requesting phone number before taking action.
2. **Execute Database Scrub in Transaction**:
   ```sql
   BEGIN;

   -- 1. Locate and inspect the RSVP record
   SELECT id, wedding_id, respondent_name, respondent_phone
   FROM "event_rsvps"
   WHERE id = '<verified_rsvp_id>';

   -- 2. Anonymize personal fields (retain headcount for catering planning without PII)
   UPDATE "event_rsvps"
   SET "respondent_name" = '[Erased]',
       "respondent_phone" = NULL,
       "arrival_notes" = NULL,
       "blessing_message" = NULL
   WHERE id = '<verified_rsvp_id>';

   -- 3. Redact Guest address book record if present
   UPDATE "guests"
   SET "display_name" = '[Erased]',
       "phone" = NULL,
       "access_token" = NULL,
       "household_id" = NULL
   WHERE wedding_id = '<wedding_id>' AND phone = '<verified_phone>';

   -- 4. Record audit entry without plain-text PII (HMAC-SHA256 with out-of-db secret)
   INSERT INTO "audit_log" ("wedding_id", "actor_id", "action", "detail")
   VALUES (
     '<wedding_id>',
     '<admin_uuid>',
     'dpdp_guest_erasure',
     jsonb_build_object(
       'rsvp_id', '<verified_rsvp_id>',
       'phone_hmac', encode(hmac(lower(trim('<verified_phone>')), current_setting('app.phone_hash_secret', true), 'sha256'), 'hex'),
       'erased_at', NOW()
     )
   );

   COMMIT;
   ```
3. **Gallery Photo Removal**:
   - If guest's portrait is identified, delete the `photos` record and delete all 3 keys in Cloudflare R2 (`original`, `preview`, `thumb`).

---

### Procedure B: Full Couple & Wedding Decommissioning

_Trigger: Couple requests complete deletion of their wedding website, guest list, and media archives._

#### Step 1: Identity & Authorization Gate

- Must be verified via registered phone OTP of the wedding owner.

#### Step 2: Multi-Table Database Anonymization

All tables containing personal data are scrubbed inside a single atomic transaction:

```sql
BEGIN;

-- 1. Anonymize wedding core fields & tombstone slug
UPDATE "weddings"
SET "bride_name" = '[Erased]',
    "groom_name" = '[Erased]',
    "monogram_text" = NULL,
    "upi_vpa" = NULL,
    "video_bite_key" = NULL,
    "live_stream_url" = NULL,
    "private_pin_hash" = NULL,
    "slug" = 'erased-' || substr(replace(id::text, '-', ''), 1, 30),
    "status" = 'archived',
    "deleted_at" = NOW()
WHERE id = '<wedding_uuid>';

-- 2. Tombstone owner user accounts (ONLY users exclusive to this wedding)
UPDATE "users"
SET "full_name" = '[Erased]',
    "email" = 'erased-' || id::text || '@invalid.example',
    "phone" = 'erased:' || id::text,
    "password_hash" = NULL,
    "deleted_at" = NOW()
WHERE id IN (
  SELECT m.user_id FROM "wedding_members" m
  WHERE m.wedding_id = '<wedding_uuid>'
    AND m.role = 'couple_admin'
) AND id NOT IN (
  -- Prevent modifying staff or multi-wedding vendor accounts
  SELECT user_id FROM "wedding_members" WHERE wedding_id != '<wedding_uuid>'
);

-- 3. Scrub Guest directory
UPDATE "guests"
SET "display_name" = '[Erased]',
    "phone" = NULL,
    "access_token" = NULL,
    "household_id" = NULL
WHERE wedding_id = '<wedding_uuid>';

-- 4. Scrub RSVP responses
UPDATE "event_rsvps"
SET "respondent_name" = '[Erased]',
    "respondent_phone" = NULL,
    "arrival_notes" = NULL,
    "blessing_message" = NULL
WHERE wedding_id = '<wedding_uuid>';

-- 5. Scrub Shagun Gift records
UPDATE "shagun_entries"
SET "sender_name" = '[Erased]',
    "upi_ref_id" = NULL,
    "blessing_note" = NULL
WHERE wedding_id = '<wedding_uuid>';

-- 6. Scrub Guestbook wishes
UPDATE "guestbook_entries"
SET "author_name" = '[Erased]',
    "message" = '[Erased]'
WHERE wedding_id = '<wedding_uuid>';

-- 7. Scrub Ceremonies / Events (anonymize names and venue text)
UPDATE "events"
SET "title" = '[Ceremony]',
    "venue_name" = '[Venue]',
    "venue_address" = NULL,
    "map_url" = NULL
WHERE wedding_id = '<wedding_uuid>';

-- 8. Scrub Story moments & VIPs
UPDATE "story_moments"
SET "title" = '[Erased]', "description" = '[Erased]', "photo_key" = NULL
WHERE wedding_id = '<wedding_uuid>';

UPDATE "vips"
SET "name" = '[Erased]', "role" = '[Erased]', "bio" = NULL, "photo_key" = NULL
WHERE wedding_id = '<wedding_uuid>';

-- 9. Scrub Consent records
UPDATE "consents"
SET "subject" = 'erased-' || id::text
WHERE wedding_id = '<wedding_uuid>';

-- 10. Update Erasure Request record
UPDATE "erasure_requests"
SET "subject" = 'erased-' || id::text,
    "completed_at" = NOW()
WHERE wedding_id = '<wedding_uuid>';

-- 11. Redact Orders weddingSlugCopy (billing address/GST records retained for tax law)
UPDATE "orders"
SET "wedding_slug_copy" = 'erased-' || substr(replace(id::text, '-', ''), 1, 30)
WHERE wedding_id = '<wedding_uuid>';

-- 12. Delete Photos table records
DELETE FROM "photos"
WHERE wedding_id = '<wedding_uuid>';

-- 13. Audit entry
INSERT INTO "audit_log" ("wedding_id", "actor_id", "action", "detail")
VALUES (
  '<wedding_uuid>',
  '<admin_uuid>',
  'dpdp_full_wedding_erasure',
  jsonb_build_object('wedding_id', '<wedding_uuid>', 'completed_at', NOW())
);

COMMIT;
```

#### Step 3: Cloudflare R2 Media Purge

Always use `--region auto` with Cloudflare R2:

```bash
# 1. ALWAYS run with --dryrun first to verify target directory!
aws s3 rm "s3://shadify-media/weddings/<wedding_uuid>/" \
  --recursive \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --region auto \
  --dryrun

# 2. Execute deletion:
aws s3 rm "s3://shadify-media/weddings/<wedding_uuid>/" \
  --recursive \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --region auto

# 3. Verify bucket directory is empty:
aws s3 ls "s3://shadify-media/weddings/<wedding_uuid>/" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --region auto
```

#### Step 4: Edge Cache Invalidation & Post-Restore Ledger

1. Call `revalidatePath('/[slug]')` to purge edge and ISR cache.
2. Verify accessing `https://shadify.in/<slug>` immediately returns **404 Not Found**.
3. **Backup Re-Application Ledger**: In Neon PostgreSQL, backups (Point-in-Time-Recovery) retain pre-erasure snapshots for 7 to 30 days. Maintain an immutable `erasure_ledger` table. After any disaster recovery restore, the ledger script must be executed immediately to re-apply erasures over restored data.

---

## 4. Runbook Maintenance & Drills

- **Quarterly Disaster Recovery Drill**: Test snapshot restoration in an isolated scratch branch every 90 days.
- **Log Sanitation Audit**: Verify via Better Stack / Axiom that request logs contain zero PII (phone numbers, guest names, UPI VPAs).
