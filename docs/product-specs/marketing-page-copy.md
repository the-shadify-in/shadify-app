# Shadify — Product Marketing Page Copy Specification

> **Document Status:** Approved Copy Specification  
> **Target Audience:** Brides, Grooms, and Wedding Parents in India & Diaspora  
> **Brand Design Tokens:** Ivory Ground (`#FFFBF5`), Midnight Ink (`#1F1A2E`), Rani Pink (`#D6246E`), Marigold (`#F5A524`), Soft Border (`#EADDCF`), Lotus Tint (`#FFF1F6`)  
> **Authoritative Pricing Source:** `src/lib/config/pricing.ts` (`PRICING_PLANS`)

---

## 1. Customer Mindset & Strategic Positioning

### Who We Are Selling To

- **The Primary Buyer:** A bride, groom, or organizing parent managing 8–15 distinct vendors simultaneously while juggling full-time jobs or family obligations under intense time pressure and high emotional stakes.
- **The Core Problem:** Crucial wedding information is fragmented across dozen-message WhatsApp forwards, uncompressed multi-megabyte PDFs, screenshot maps, and voice notes. Relatives repeatedly call or message: _"What time is the Sangeet?"_, _"Where do we park?"_, and _"What should we wear?"_. The host family is left manually chasing headcounts for the caterer.
- **What They Pay For:** **Relief and a premium aesthetic presentation that honors their family.** They will not pay for "a website," "a SaaS subscription," or "a row of theme color swatches."
- **Their Biggest Objections & Fears:**
  1. _"Is it complicated to set up?"_ (They have no time to learn a dashboard).
  2. _"Will our grandparents and elder relatives be able to use it?"_ (Zero app downloads, zero logins).
  3. _"Is our wedding and guest data private?"_ (No public search engine indexing, zero contact scraping).
  4. _"What happens if a ceremony venue or muhurat time shifts?"_ (Instant WhatsApp-initiated updates without reprinting).
  5. _"Why shouldn't we just forward a Canva PDF?"_ (PDFs cannot count RSVPs, provide interactive GPS directions, or update when timings change).

---

## 2. Messaging Hierarchy (Priority Order)

1. **Outcome:** One elegant link with the entire celebration; RSVPs and meal preferences automatically tallied.
2. **Effortless Ease:** Zero DIY dashboard work. The couple texts their details on WhatsApp; Shadify concierge configures and polishes the page.
3. **Family Inclusivity:** Opens immediately on any phone (iOS/Android/desktop); high-contrast, legible typography; zero logins or app installations for elders.
4. **Radical Trust:** Unlisted, privacy-first links; gifts sent directly to the couple’s own UPI VPA with zero platform deductions; clear one-time pricing with 5-year hosting.

---

## 3. Revised 10-Section Architecture

| #      | Section                          | Primary Purpose / Job It Does                                                                                            |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **1**  | **Hero**                         | Establish the transformative outcome immediately; show real interactive product mockup with royal envelope hook.         |
| **2**  | **"Sound Familiar?"**            | Name specific, visceral wedding friction points so the family immediately feels understood.                              |
| **3**  | **How It Works**                 | Prove friction-free onboarding in 3 simple steps (We do the heavy lifting via WhatsApp).                                 |
| **4**  | **Real Sample Weddings**         | Prove high luxury craftsmanship with live interactive wedding pages categorized by mood, not technical presets.          |
| **5**  | **What Your Guests Get**         | Outline tangible benefits for relatives and elder guests (no logins, 1-tap Google Maps, elder-legible text).             |
| **6**  | **What You Get**                 | Concrete host benefits: real-time headcount dashboard, caterer spreadsheet export, instant WhatsApp updates, direct UPI. |
| **7**  | **Questions Couples Ask**        | Directly neutralize the top 6 buying objections with honest, lawyer-approved answers.                                    |
| **8**  | **Transparent Pricing**          | One-time transparent pricing tiers from `pricing.ts`; no monthly fees, 5-year web hosting.                               |
| **9**  | **For Photographers & Planners** | Secondary audience onboarding: partner commission incentives, co-branded agency portal.                                  |
| **10** | **Final Call to Action**         | Low-friction conversion to WhatsApp Concierge line.                                                                      |

---

## 4. Section-by-Section Approved Copy & Asset Needs

### Section 1: Hero

- **Badge:** `✨ Luxury Digital Invitations for Modern Indian Weddings`
- **Headline:** **Stop answering "what time is the mehendi?" Send one link instead.**
- **Alternative Headline:** _Your whole wedding, in one link your family can open._
- **Subline:** Schedule, directions, RSVPs and gifts in one beautiful page. We set it up from your WhatsApp message. Your family opens it in one tap, with no app and no login.
- **Primary CTA:** `Start on WhatsApp` (Links to `getConciergeWhatsAppUrl()`)
- **Secondary CTA:** `See a Sample Wedding` (Opens `/priya-rahul`)
- **Trust Chips:** `No app required` · `Opens in 1 tap` · `Direct UPI gifting` · `Zero spam`
- **Visual Asset:**
  - `[NEEDS REAL ASSET]` **Phone Loop Video / Finished Mockup:** High-resolution 3D device mockup of iPhone running `/priya-rahul` showing the gold-wax royal envelope unfolding into the wedding itinerary.
  - _Current Fallback:_ Interactive CSS phone frame with real sample wedding preview card and link to live demo.

---

### Section 2: "Sound Familiar?" (The Pain Points)

- **Section Eyebrow:** `The Reality of Indian Wedding Planning`
- **Headline:** **Wedding planning is hard enough. Chasing information shouldn't be.**
- **Pain Points:**
  1. _"Twelve forwards and three PDFs, and nobody knows the venue address."_
  2. _"Chasing 300 replies on WhatsApp for the caterer's headcount."_
  3. _"An uncle calling at 7 AM because he can't find the muhurat time."_
- **Resolution:** **One elegant link replaces all of it.**

---

### Section 3: How It Works (The 3-Step Concierge)

- **Headline:** **You share the details. We do the work.**
- **Subline:** You don't need to learn a website builder or design tool. Our wedding concierge formats everything for you.
- **Step 1:**
  - **Title:** `1. Send details on WhatsApp`
  - **Description:** Forward your invitation card, schedule, venue addresses, and couple photo directly to our concierge on WhatsApp. Voice notes welcome.
- **Step 2:**
  - **Title:** `2. We build and polish your page`
  - **Description:** We curate your page with your custom colors, names in your native script (Hindi, Gujarati, Tamil, etc.), and personalized monogram within 24 hours.
- **Step 3:**
  - **Title:** `3. Share one link with your family`
  - **Description:** Send your private link in family WhatsApp groups. Guests open it in one tap, browse ceremonies, get directions, and RSVP instantly.

---

### Section 4: Real Sample Weddings (Replaces Swatches)

- **Heading:** **See real weddings, not templates.**
- **Subline:** Every celebration has its own character. Explore finished celebrations as your guests would see them.
- **Featured Mood Cards:**
  1. **Classic Red & Gold:** _A North Indian wedding with a grand Sangeet and palatial Vivah._
  2. **Heritage Green:** _A serene destination weekend surrounded by nature and candlelight._
  3. **Soft & Modern:** _A small, intimate ivory ceremony with minimalist elegance._
  4. **Sunset Sangeet:** _A vibrant beach-side celebration with festive terracotta and warm dusk tones._
- **Interactive Action:** Each card opens `/priya-rahul` to experience the full responsive guest flow.
- **Customization Promise:** _"Your colours, your names in your own script, and your family monogram. Tell us the feeling and we'll match it."_
- **Asset Needs:**
  - `[NEEDS REAL ASSET]` **4x Finished Wedding Hero Screenshots / Device Mockups:** Full-length mobile renders of distinct weddings to display on mood cards.

---

### Section 5: What Your Guests Get (Outcomes, Not Features)

- **Headline:** **Designed with your elders in mind.**
- **Subline:** Technology should bring families closer, not create tech support calls on your wedding morning.
- **Benefits:**
  - **Open from WhatsApp:** No App Store, no Google Play, no passwords to remember.
  - **Every ceremony & dress code:** Sangeet, Mehendi, Haldi, and Reception timings in chronological order.
  - **1-Tap Google Maps:** Direct navigation to parking and entry gates without copy-pasting addresses.
  - **1-Minute RSVP:** Guests confirm attendance and meal preference (Jain, Vegetarian, Non-Veg) in under 60 seconds.
  - **Grandparent-friendly typography:** High-contrast text, large legible fonts, and clear navigation buttons.

---

### Section 6: What You Get (Peace of Mind for Hosts)

- **Headline:** **The peace of mind every wedding family deserves.**
- **Subline:** Keep complete control over your guest list without endless follow-ups.
- **Capabilities:**
  - **RSVPs counted automatically:** Instant counts split by ceremony and meal preference.
  - **One clean file for your caterer:** Download or view guest tallies formatted for your banquet team.
  - **Changes via WhatsApp:** Changed a muhurat time or venue hall? Just message us; your link updates immediately.
  - **100% Direct UPI Shagun:** Gifts arrive straight into your personal UPI bank account with 0% commission.

---

### Section 7: Questions Couples Ask (Objection Handlers)

- **FAQ 1: Do my elder relatives need to install an app or register?**
  - _Answer:_ No. Anyone who clicks your link opens your wedding immediately in their phone browser. There is no app to download, no account to create, and no password to remember.
- **FAQ 2: Why not just forward a PDF invitation on WhatsApp?**
  - _Answer:_ A PDF is static. It cannot count RSVPs, cannot launch Google Maps navigation, cannot accept direct UPI shagun, and cannot update if a ceremony timing or hall changes. Shadify gives your guests an interactive luxury experience that stays current.
- **FAQ 3: Is our wedding information private?**
  - _Answer:_ Yes. Your wedding page is unindexed by search engines (Google, Bing). Only guests who receive your private link can view it. We never ask for, harvest, or sell your family contact lists.
- **FAQ 4: What if our date or venue changes?**
  - _Answer:_ Simply message our WhatsApp concierge. We update your schedule immediately, so all your guests see the latest details without you needing to re-send or reprint anything.
- **FAQ 5: How long does setup take?**
  - _Answer:_ Once you send us your ceremony details, couple photos, and schedule on WhatsApp, our team creates your finished page preview within 24 to 48 hours.
- **FAQ 6: How does Shagun gifting work?**
  - _Answer:_ Your page displays a direct UPI link, QR code, and your verified VPA. When guests send blessings, 100% of the funds go straight from their bank to yours. Shadify never touches or holds your money.

---

### Section 8: Pricing (Authoritative from `pricing.ts`)

- **Tiers:**
  - **Lite (₹2,999):** Up to 3 ceremonies, 100 photos, RSVP with dietary preferences, direct UPI Shagun, 5-year hosting.
  - **Premium (₹7,999):** Complete luxury experience, all 5 mood presets, up to 8 ceremonies, 300 photos, dedicated WhatsApp concierge onboarding, caterer export, 5-year hosting. _(Most Popular)_
  - **Platinum (₹19,999):** Bespoke designer theme tailored to physical invitation card, custom wedding domain, up to 15 events, 1000 photos, priority concierge line.
- **Guarantee:** One-time investment. No subscriptions. No ads. 5-year guaranteed hosting.

---

### Section 9: For Photographers & Planners

- **Headline:** **Partner with Shadify for your wedding clients.**
- **Subline:** Deliver an end-to-end luxury digital presence for your couples while unlocking referral earnings.
- **Key Offerings:**
  - Co-branded wedding invitations with your studio credits.
  - Dedicated concierge support for your client roster.
  - Attractive partner margins on every couple onboarded.
- **CTA:** `Join Partner Network` (Pre-fills WhatsApp partner inquiry).

---

### Section 10: Final Call to Action

- **Headline:** **Stop chasing RSVPs and answering venue questions.**
- **Subline:** Message us on WhatsApp with your wedding date and let our concierge prepare your first preview.
- **Primary CTA:** `Message Concierge on WhatsApp`
- **Secondary CTA:** `Explore Priya & Rahul's Live Wedding`

---

## 5. Summary of Assets Still Needed (`[NEEDS REAL ASSET]`)

1. `[NEEDS REAL ASSET]` **Hero Phone Video Loop:** 15–30 second WebP / MP4 video loop showing an envelope opening on mobile and scrolling through the itinerary.
2. `[NEEDS REAL ASSET]` **4x High-Fidelity Mood Previews:** Clean mobile mockup screenshots for:
   - Classic Red & Gold
   - Heritage Green
   - Soft & Modern
   - Sunset Sangeet
3. `[NEEDS REAL ASSET]` **Pilot Couple Testimonials:** 2–3 authentic quotes from real couples or parents once first pilot weddings go live (intentionally omitted until verified).
4. `[NEEDS REAL ASSET]` **Caterer Export Sample View:** Visual graphic showing the clean headcount spreadsheet download (Jain, Veg, Non-Veg) for the "What you get" section.
