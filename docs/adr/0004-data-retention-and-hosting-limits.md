# ADR 0004: 5-Year Web Hosting and 90-Day Master Archive Retention

## Status

Accepted (2026-10-18)

## Context

High-resolution camera RAW files and multi-gigabyte photo dumps can quickly erode profitability if retained indefinitely. Conversely, couples and family members expect digital invitation websites and optimized photo albums to remain accessible well past the wedding weekend for anniversaries and memories.

Furthermore, privacy commitments under India's Digital Personal Data Protection (DPDP) Act necessitate clear data retention schedules rather than indefinite storage of identifiable personal media.

## Decision

1. **Web Gallery & Invitation Hosting**:
   - All pricing tiers (Lite ₹2,999, Premium ₹7,999, Platinum ₹19,999) include **5 years of active web hosting** from the wedding creation date (`hosting_until` on `entitlements`, `content_expires_at` on `weddings`).
   - After 5 years, wedding websites gracefully transition to a deliberate "Celebration Concluded" state.
2. **Master RAW & Uncompressed Original Photo Retention**:
   - Master original camera files (`.CR3`, `.ARW`, `.NEF`, uncompressed TIFFs) are stored in Cloudflare R2 with an automated 90-day lifecycle expiration rule (`originals_expire_at`).
   - Photographers and couples are informed in plain terms to download and back up their master archive within 90 days.
   - Web-optimized renditions (WebP/AVIF compressed previews) remain available for the entire 5-year hosting window.

## Consequences

- **Positive**: Locks unit storage costs to predictable, capped bounds, securing >70% gross margins on every tier.
- **Positive**: Provides clear, unambiguous terms aligned between sales marketing, terms of service, and database enforcement.
- **Positive**: Satisfies privacy audit requirements by establishing deterministic data retention schedules.
