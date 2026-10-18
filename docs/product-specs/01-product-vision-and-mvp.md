# 🌸 Shadify — Product Vision, MVP Scope & Business Model

> **Shadify** is an all-in-one digital operating system for Indian weddings. It provides multi-tenant wedding websites with interactive luxury invitations, dynamic ceremony itineraries, direct UPI Shagun, and seamless client-side WhatsApp sharing with zero friction.

---

## 1. The Core Value Proposition
- **For Couples**: A luxury wedding website with a 3D animated wax-seal envelope reveal, 30s personal video bite, multi-event schedules with Google Maps, and an annual anniversary memory vault.
- **For Guests**: Zero-login instant access, 1-tap Google Maps directions, live ceremony photo stream, and clean RSVP submission.
- **For Family & Hosts**: Zero contact harvesting! Parents share beautiful, pre-formatted invite messages and dynamic QR posters directly from their personal WhatsApp with 1 tap.

-## 2. Definitive Lean MVP-0 Scope

To ship quickly as a solo developer and achieve profitability without over-engineering:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ✅ INCLUDED IN MVP-0                            │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Single Next.js 14 Monolith (App Router + Route Handlers)            │
│    • Path-based routing: `shadify.in/w/[slug]`                         │
│    • PostgreSQL 16 on Neon / Supabase with clean relational schema     │
│ 2. Luxury Guest Experience                                             │
│    • Smooth CSS/Lottie Royal Envelope Reveal (Fast, light, mobile-first)│
│    • 30-Second Personal "Video Bite" (Couple invite stream)            │
│    • Multi-Event Itinerary with 1-tap Google Maps directions          │
│    • Curated Photo Gallery with high-res lightbox                      │
│ 3. Interactive Guest Features                                          │
│    • Clean Online RSVP Form (Attending/Regret, headcount, veg/jain)    │
│    • Digital Shagun Envelope with direct UPI QR (₹0 commission)        │
│ 4. 1-Tap WhatsApp Invite Studio (Zero Meta API, Zero DB Overhead)      │
│    • Pre-formatted customizable templates (Elder/Traditional, Friends) │
│    • Direct 1-tap WhatsApp share (`https://wa.me/?text=...`)           │
│    • Client-side QR code poster generator for WhatsApp Status         │
│ 5. Concierge Admin Setup                                               │
│    • Internal admin panel for team to onboard weddings & upload content│
│    • Direct Cloudflare R2 presigned uploads with 90-day RAW lifecycle  │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        ⏳ PHASE 2 & BEYOND (EXPANSION)                  │
├────────────────────────────────────────────────────────────────────────┤
│ • Couple Self-Serve Dashboard                                          │
│ • Commercial AI Facial Recognition (Selfie-to-photo match in Mandap)  │
│ • Destination resort room allocation assistant                         │
│ • YouTube Unlisted Live Stream Mandap theater with floating petals     │
│ • Custom `.com` / `.in` domain automated SSL mapping                   │
│ • Dedicated React Native / Expo Mobile App                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Shadify — Unit Economics & Break-Even Model

> The model below reflects actual costs including **18% GST**, **2.36% Payment Gateway fees (Razorpay 2% + 18% GST on fee)**, labor time, and a sustainable Cloudflare R2 storage lifecycle.

### A. Core Assumptions

| Input | Value | Note |
|---|---|---|
| GST rate | 18% | Prices treated as GST-inclusive. |
| Payment gateway fee | 2.36% | 2% + 18% GST on fee = 2.36% of gross. |
| USD/INR | 90 | Currency conversion baseline. |
| R2 storage | ₹1.35/GB-mo | $0.015/GB-month on Cloudflare R2. |
| Hosting term for web photos | 5 years | Fixed, renewable term policy. |
| RAW originals retention | 90 days | Archived/deleted unless extended storage add-on bought. |
| Avg web photo | 0.2 MB | ~200 KB WebP. |
| Avg original photo | 25 MB | Upper bound; typical files 8–15 MB. |
| Labor cost | ₹300/hour | Setup and support concierge time. |

### B. Per-Plan Parameters

| Input | Lite (Shubh) | Premium (Vivah) | Platinum (Rajwada) |
|---|---|---|---|
| Price (as sold) | ₹2,999 | ₹7,999 | ₹19,999 |
| Photos stored | 150 | 1,500 | 3,000 (cap for "unlimited") |
| Setup/support hours | 1 | 2 | 6 |
| Other variable cost (video, SMS/email, misc) | ₹20 | ₹60 | ₹500 |
| Sales mix | 50% | 40% | 10% |

### C. Fixed Monthly Operational Costs

| Item | ₹ / month |
|---|---|
| Hosting (Vercel Pro or similar) | 1,800 |
| Managed Postgres (Neon / Supabase) | 2,500 |
| Monitoring, email, developer tools | 1,500 |
| Domains and misc subscriptions | 500 |
| Marketing / ads | 10,000 |
| Contingency | 2,000 |
| **Total Fixed Monthly Burn** | **₹18,300** |

---

### D. Unit Economics (₹ per wedding)

| Line Item | Lite (Shubh) | Premium (Vivah) | Platinum (Rajwada) |
|---|---|---|---|
| Price as sold (Gross) | ₹2,999 | ₹7,999 | ₹19,999 |
| **Net revenue (ex-GST)** | **₹2,542** | **₹6,779** | **₹16,948** |
| Gateway fee (2.36%) | ₹71 | ₹189 | ₹472 |
| Web photo storage (5 yrs) | ₹2 | ₹24 | ₹47 |
| RAW originals storage (90 days) | ₹15 | ₹148 | ₹297 |
| Setup/support labor | ₹300 | ₹600 | ₹1,800 |
| Other variable costs | ₹20 | ₹60 | ₹500 |
| **Total variable cost** | **₹408** | **₹1,021** | **₹3,116** |
| **Contribution per wedding** | **₹2,134** | **₹5,758** | **₹13,832** |
| **Contribution margin (% of net revenue)** | **~84%** | **~85%** | **~82%** |

> [!NOTE]
> Labor, gateway fees, and GST dominate costs. With RAW originals expiring at 90 days, Cloudflare R2 storage is nearly negligible.

---

### E. Blended Economics & Break-Even Targets

At an assumed **50% Lite / 40% Premium / 10% Platinum** sales mix:

| Metric | Blended Value |
|---|---|
| Blended net revenue per wedding | **₹5,677** |
| Blended contribution per wedding | **₹4,753** |
| Fixed operational costs per month | **₹18,300** |
| **Break-even weddings per month** | **4 weddings** |

#### Monthly Profitability Scenarios

| Weddings sold / month | 2 | 5 | 10 | 20 | 40 |
|---|---|---|---|---|---|
| Net revenue | ₹11,354 | ₹28,386 | ₹56,771 | ₹113,542 | ₹227,085 |
| Total contribution | ₹9,506 | ₹23,766 | ₹47,532 | ₹95,064 | ₹190,128 |
| Fixed costs | ₹18,300 | ₹18,300 | ₹18,300 | ₹18,300 | ₹18,300 |
| **Monthly Profit / (Loss)** | **(₹8,794)** | **+₹5,466** | **+₹29,232** | **+₹76,764** | **+₹171,828** |

*Note: Setting paid marketing to ₹0 drops break-even to **2 weddings per month**, which is the pure operating technology break-even.*

---

### F. Storage Policy & High-Margin Add-Ons

1. **Storage Lifecycle Policy**:
   - Web-optimized photos (~200 KB WebP) kept for the 5-year hosting term (~₹10/yr per 600 MB).
   - High-resolution RAW originals (25 MB) retained for 90 days (`originals_expire_at`), then deleted or archived.
2. **Paid High-Margin Upsells**:
   - Extended RAW storage (1–3 years add-on).
   - Extra photo capacity packs.
   - Dedicated videographer highlight reel embedding.
   - Custom `.com` / `.in` domain mapping.

---

## 4. Delivery Channels for Couple Websites

```
shadify.in/w/priya-rahul          ← Path-based (MVP default, zero domain overhead)
priya-rahul.shadify.in             ← Subdomain (Phase 2 wildcard DNS)
www.priyarahulwedding.com          ← Custom Domain (Platinum CNAME add-on)
shadify.in/w/priya-rahul#invite    ← Direct WhatsApp Link & QR Code Poster
```

