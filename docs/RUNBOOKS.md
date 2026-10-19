# Shadify — Concierge Operations Runbooks

> Authoritative Standard Operating Procedures (SOPs) for wedding-day high-traffic monitoring, B2B partner commission payouts, and statutory DPDP data privacy erasures.
> Every runbook provides explicit trigger conditions, pre-flight checklists, copy-pasteable SQL/CLI commands, and customer communication scripts.

---

## Runbook 1: Wedding-Day Concierge Emergency & High-Traffic Triage SOP

### Overview

- **Owner**: `@ops` (Concierge On-Call Lead)
- **Applicability**: Any live wedding occurring today or within the next 48 hours.
- **Goal**: Guarantee zero downtime, fast edge page loads (< 1.5s on 4G), working RSVP writes, and instant response to live venue emergencies.

### Timeline & Checklist

#### Phase A: T-48 Hours (Pre-Flight Audit)

1. **Inspect 14-Day Readiness**: Open `/admin/health` and verify the wedding has:
   - At least 1 published ceremony with title, start time, venue address, and Google Maps URL.
   - Verified couple portrait image.
   - Valid UPI Shagun VPA (e.g. `priya.rahul@okhdfcbank`).
   - Active Theme contrast test status: `ok: true`.
2. **Pre-Warm Edge CDN Cache**: Send requests across geographic regions to ensure Cloudflare caches the HTML before guests arrive:
   ```bash
   curl -I "https://shadify.in/<slug>"
   # Verify response header:
   # x-nextjs-cache: MISS (1st hit) -> HIT (subsequent hits)
   # cache-control: s-maxage=3600, stale-while-revalidate
   ```

#### Phase B: Morning of the Wedding (08:00 AM)

1. **Check Database Latency**:
   ```bash
   curl -s "https://shadify.in/api/health" | jq .
   # Verify: status == "healthy", database.latencyMs < 50
   ```
2. **Simulate Live RSVP Write Path**: Submit a test RSVP via concierge test suite to verify PostgreSQL write pooling.
3. **Emergency Contact Verification**: Confirm the concierge WhatsApp line is staffed and monitoring incoming alerts.

#### Phase C: Emergency Scenarios & Triage Protocols

##### Incident 1: Typo on Physical Cards / Misprinted Wedding URL

- **Symptom**: Couple printed `priya-rahul-2026` on physical cards, but created `priya-rahul` in the system.
- **Triage Action (30-second fix)**: Create an instant redirect or alias without touching code:
  ```sql
  -- Add wedding alias record or insert redirect mapping
  INSERT INTO "weddings" ("id", "slug", "bride_name", "groom_name", "wedding_date", "theme_id")
  SELECT gen_random_uuid(), 'priya-rahul-2026', bride_name, groom_name, wedding_date, theme_id
  FROM "weddings" WHERE "slug" = 'priya-rahul'
  ON CONFLICT ("slug") DO NOTHING;
  ```

##### Incident 2: Caterer / Family Demands Emergency RSVP Spreadsheet

- **Symptom**: Venue planner urgently asks for dietary requirements (Jain vs Vegetarian headcounts) at the door.
- **Triage Action**: Run the instant export query in PostgreSQL:
  ```sql
  -- Export all confirmed RSVPs with dietary counts for caterers
  SELECT
    r.respondent_name AS "Guest Name",
    r.respondent_phone AS "Phone",
    r.party_size AS "Headcount",
    r.meal_preference AS "Meal (Veg/Jain)",
    r.needs_stay AS "Accommodation Needed",
    r.blessing_message AS "Blessing",
    e.title AS "Ceremony"
  FROM "event_rsvps" r
  JOIN "events" e ON r.event_id = e.id
  JOIN "weddings" w ON r.wedding_id = w.id
  WHERE w.slug = '<wedding-slug>' AND r.attending = true
  ORDER BY e.starts_at ASC, r.created_at ASC;
  ```
- **Export to CSV**: Output directly to CSV and WhatsApp the clean spreadsheet to the couple or wedding planner within 5 minutes.

##### Incident 3: Bad Production Deploy During Wedding Hours

- **Symptom**: A new release causes client-side errors or failed form submissions.
- **Triage Action (Rollback in < 60s)**:
  1. Open Vercel / Fly Deployment Dashboard.
  2. Select previous stable deployment hash (e.g. `768a7c1`).
  3. Click **"Instant Rollback" / "Promote to Production"**.
  4. Verify `/api/health` returns 200 within 30 seconds.

---

## Runbook 2: B2B Partner Commission & Referral Payout SOP

### Overview

- **Owner**: `@finance` / `@ops`
- **Applicability**: Commission payouts to photographers, wedding planners, and decorators who bring paid weddings via partner codes (e.g. `STUDIOPARTNER`).
- **Standard Payout Amount**: **₹1,000** for each completed Vivah (Premium) or Rajwada (Platinum) wedding.

### The 5-Step Payout Workflow

```
[Couple Onboards with Code]
         │
         ▼
[Step 1: Referral Logged as 'pending']
         │
         ▼
[Step 2: 7-Day Cooling-Off Window Passes]
         │
         ▼
[Step 3: CA / TDS Section 194H Review]
         │
         ▼
[Step 4: Execute Business UPI Payout (₹1,000)]
         │
         ▼
[Step 5: Send WhatsApp Receipt to Partner]
```

#### Step 1: Intake & Logging

- When a couple onboards via WhatsApp concierge with code `STUDIOPARTNER`, the operator verifies the code in `/api/promos/validate`.
- The couple gets an instant **₹299 discount**.
- A record is created in the `referrals` table:
  ```sql
  INSERT INTO "referrals" (
    "id", "promo_code_id", "wedding_id", "commission_paise", "payout_upi", "status"
  )
  SELECT
    gen_random_uuid(), p.id, '<wedding-id>', p.commission_paise, p.partner_upi, 'pending'
  FROM "promo_codes" p
  WHERE p.code = 'STUDIOPARTNER';
  ```

#### Step 2: 7-Day Cooling-Off & Refund Window

- **Rule**: Commissions are **never paid on signup**.
- Payouts are eligible only after:
  1. Full customer payment has settled via Razorpay/bank transfer.
  2. The 7-day cooling-off window has elapsed without cancellation or refund.
- Query eligible referrals ready for payout:
  ```sql
  SELECT
    r.id AS "Referral ID",
    p.partner_name AS "Partner",
    r.payout_upi AS "UPI VPA",
    r.commission_paise / 100 AS "Payout Amount INR",
    w.bride_name || ' & ' || w.groom_name AS "Wedding",
    r.created_at AS "Referred Date"
  FROM "referrals" r
  JOIN "promo_codes" p ON r.promo_code_id = p.id
  JOIN "weddings" w ON r.wedding_id = w.id
  WHERE r.status = 'pending'
    AND r.created_at <= NOW() - INTERVAL '7 days';
  ```

#### Step 3: Tax (TDS) Compliance Verification

- Confirm with Chartered Accountant (CA) whether Section 194H TDS (5%) applies:
  - If cumulative payouts to an individual/vendor exceed **₹15,000 in a financial year**, TDS deduction and PAN collection are mandatory.
  - If below threshold, issue gross payout of ₹1,000.

#### Step 4: Execute UPI Transfer & Record Proof

1. Open Business Banking Portal (HDFC / ICICI / RazorpayX).
2. Execute UPI transfer of ₹1,000 to the partner's registered VPA.
3. Save the bank transaction reference number (`txn_...` / UTR).
4. Update database record:
   ```sql
   UPDATE "referrals"
   SET
     "status" = 'paid',
     "payout_txn_ref" = '<Bank_UTR_Reference_Number>',
     "paid_at" = NOW()
   WHERE "id" = '<referral-id>';
   ```

#### Step 5: WhatsApp Notification Script to Partner

Send the following celebratory WhatsApp receipt to the partner:

> _"Namaste [Partner Name]! 🌸_\n\n*Thank you for referring [Bride & Groom Name]'s wedding to Shadify. Their website is now live!*\n\n*We have processed your referral commission:*\n*• Amount: ₹1,000*\n*• Account/UPI: [Partner UPI VPA]_\n_• Bank Reference (UTR): [Transaction Reference]*\n\n*We look forward to creating magic for your next couple! Feel free to share your code [PARTNERCODE] anytime.*"

---

## Runbook 3: DPDP Data Privacy Erasure ("Right to be Forgotten") SOP

### Overview

- **Owner**: `@compliance` / `@security`
- **Applicability**: Formal requests received at `privacy@shadify.in` or via WhatsApp concierge from guests or couples asking to delete personal records.
- **Statutory Resolution SLA**: **Maximum 30 calendar days** under India's Digital Personal Data Protection (DPDP) Act, 2023.

---

### Procedure A: Guest-Level Erasure (Scrubbing Single Person's Data)

_Trigger: A guest requests: "Please delete my phone number, RSVP response, and photo from the site."_

1. **Verify Request Authenticity**:
   - Confirm request matches the mobile number or email listed in the RSVP record.
2. **Execute Database Scrub**:
   ```sql
   -- 1. Locate RSVP records
   SELECT id, wedding_id, respondent_name, respondent_phone
   FROM "event_rsvps"
   WHERE respondent_phone = '<phone_number>' OR respondent_name ILIKE '<guest_name>';

   -- 2. Anonymize personal fields (retaining headcount for event planning without PII)
   UPDATE "event_rsvps"
   SET "respondent_name" = '[Redacted]',
       "respondent_phone" = NULL,
       "respondent_email" = NULL,
       "dietary_notes" = NULL
   WHERE id = '<rsvp_id>';

   -- 3. Delete matching guest address entry if present
   DELETE FROM "guests"
   WHERE phone = '<phone_number>';
   ```
3. **Manual Photo Takedown**:
   - Locate the photo ID from the wedding gallery.
   - Delete via Admin Concierge Portal or run `DELETE FROM "photos" WHERE id = '<photo_id>'` and remove corresponding keys in Cloudflare R2.
4. **Audit Trail**: Record deletion event in `audit_logs` storing only a SHA-256 hash of the phone to verify future inquiries without storing plain-text PII:
   ```sql
   INSERT INTO "audit_logs" ("actor_user_id", "action", "resource_type", "resource_id", "metadata")
   VALUES ('<admin-id>', 'dpdp_guest_erasure', 'event_rsvp', '<rsvp_id>', '{"phone_hash": "<sha256_hash>", "status": "anonymized"}');
   ```

---

### Procedure B: Full Couple & Wedding Erasure (Complete Website Purge)

_Trigger: Couple requests permanent decommissioning of their website and media archives._

1. **Identity Gate**:
   - Must be verified via OTP / registered couple phone number.
2. **Anonymize and Redact Database Rows**:
   ```sql
   -- Anonymize wedding core fields
   UPDATE "weddings"
   SET "bride_name" = '[Redacted]',
       "groom_name" = '[Redacted]',
       "monogram_text" = NULL,
       "upi_vpa" = NULL,
       "video_bite_key" = NULL,
       "live_stream_url" = NULL,
       "private_pin_hash" = NULL,
       "status" = 'archived',
       "deleted_at" = NOW()
   WHERE "slug" = '<wedding_slug>';

   -- Anonymize associated user records
   UPDATE "users"
   SET "full_name" = '[Redacted]',
       "phone" = NULL,
       "email" = NULL,
       "deleted_at" = NOW()
   WHERE id IN (
     SELECT user_id FROM "wedding_members" WHERE wedding_id = (SELECT id FROM "weddings" WHERE slug = '<wedding_slug>')
   );
   ```
3. **Purge Cloudflare R2 Media Files Safely**:
   ```bash
   # STEP 1: ALWAYS run with --dryrun first to inspect targeted files!
   aws s3 rm s3://shadify-media/weddings/<wedding_slug>/ --recursive --endpoint-url https://<account_id>.r2.cloudflarestorage.com --dryrun

   # STEP 2: Execute actual deletion once dryrun list is verified:
   aws s3 rm s3://shadify-media/weddings/<wedding_slug>/ --recursive --endpoint-url https://<account_id>.r2.cloudflarestorage.com
   ```
4. **Purge Edge CDN Cache**:
   - Invalidate cache tag `wedding:<slug>` in Cloudflare Dashboard or call `revalidatePath('/<slug>')`.
5. **Send Formal Closure Confirmation**:
   Send email or WhatsApp receipt confirming all records, RSVP databases, and media archives have been permanently anonymized and purged (noting that statutory tax invoices are retained for mandatory audit periods under GST/Income Tax laws).

---

## 4. Runbook Maintenance & Drills

- **Quarterly Disaster Recovery Drill**: Restore an automated database snapshot into a scratch database every 90 days to verify schema, table triggers, and row counts.
- **Log Review**: Ensure no PII (phone numbers, passwords, UPI VPAs) appears in Axiom/Better Stack log drains.
