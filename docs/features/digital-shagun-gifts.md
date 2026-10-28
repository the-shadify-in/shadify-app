# 🪙 Feature: Digital Shagun & UPI Cash Gift Rail

> **Feature Identifier**: `feat-digital-shagun`  
> **Layer**: Guest Gifting & NPCI Deep Linking  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🔴 **EXCLUDED (Disabled per Client Request)**

---

## 1. Executive Summary

Digital Shagun allows wedding guests to send auspicious cash blessings directly to the couple's personal bank account via NPCI UPI rails. Shadify is **not a payment gateway or aggregator**; it holds zero custodial funds and touches zero banking settlements. The feature generates standard client-side `upi://pay` deep links and high-contrast QR codes for instant 1-tap transfer via Google Pay, PhonePe, Paytm, or BHIM.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/DigitalShagunModal.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/DigitalShagunModal.tsx)
- **Protocol**: Standard NPCI UPI URI specification (`upi://pay?pa={vpa}&pn={name}&cu=INR&am={amount}&tn=Wedding Shagun`).
- **Amount Presets**: Culturally auspicious amounts (₹501, ₹1,001, ₹2,100, ₹5,100, ₹11,000) with custom numeric input.
- **Copy-to-Clipboard**: 1-tap copy of the couple's UPI ID with visual toast confirmation.

---

## 3. What is Done (Current Baseline)

- [x] Client-side QR code generator rendering crisp SVG/canvas QR codes.
- [x] Mobile deep linking opening the user's default installed UPI app.
- [x] Strict non-custodial guarantee: zero platform commission, zero escrow, funds settle instantly P2P.
- [x] Component tests in `src/components/guest/__tests__/demo-readiness.test.tsx`.

---

## 4. What is Planned (Future Roadmap)

- [ ] **Multi-Currency International Gifting (Platinum Tier)**: Optional integration with Stripe/Wise for NRI wedding guests residing in the US/UK/Singapore.
- [ ] **Physical Shagun Registry**: Integration with curated wedding gift registries (home appliances, honeymoon funds).

---

## 5. Status for November 12 Pilot Client

- **State**: 🔴 **EXCLUDED (`shagun: { enabled: false }`)**.
- **Pilot Rationale**:
  - The pilot couple does not wish to display digital gifting or cash transfer requests on their wedding site.
  - Shadify does not verify bank VPAs with NPCI switches; disabled to ensure pristine client privacy and zero financial friction.
