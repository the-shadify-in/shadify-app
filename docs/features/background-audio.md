# 🎵 Feature: Background Audio Player & Instrumental Library

> **Feature Identifier**: `feat-background-audio`  
> **Layer**: Audio Engine & Cultural Ambient Playback  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🔴 **EXCLUDED (Disabled for Pilot)**

---

## 1. Executive Summary

Shadify includes a floating background audio player designed to deliver ambient instrumental music. To respect user autonomy and mobile browser battery/data policies, playback is **strictly user-controlled with zero autoplay**. The player includes a floating mute/unmute action button, smooth volume cross-fades, and persistent mute memory in `localStorage`.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/MusicToggle.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/MusicToggle.tsx)
- **Preset Catalog**: [`src/lib/audio/presets.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/audio/presets.ts) (8 traditional instrumental tracks defined)
- **Validation Engine**: [`src/lib/audio/validation.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/audio/validation.ts) (bitrate, duration, file size limits)
- **Browser Autoplay Safeguard**: Audio initialization delayed until explicit guest user gesture (click/tap); volume ramps smoothly from 0.0 to 1.0 over 800ms.

---

## 3. What is Done (Current Baseline)

- [x] Floating, unobtrusive audio toggle button displaying live play/pause soundwave status.
- [x] Smooth HTML5 Audio volume fade-in and fade-out to prevent abrupt audio cuts.
- [x] User mute preference persisted in browser `localStorage` (`shadify_audio_muted`).
- [x] Automated unit and playback tests in `src/lib/audio/__tests__/audio.test.ts` (18/18 passing).

---

## 4. What is Planned (Future Roadmap)

- [ ] **Verified Studio Master Acquisitions**: Acquiring fully cleared, studio-recorded acoustic master recordings with signed commercial broadcast releases.
- [ ] **Custom Couple Track Uploads (Platinum Tier)**: Uploading the couple's personal first-dance song or custom-commissioned wedding track with copyright indemnification waivers.

---

## 5. Status for November 12 Pilot Client

- **State**: 🔴 **EXCLUDED (`audio: { enabled: false }`)**.
- **Pilot Rationale**:
  - **Licensing Gate**: No verified, studio-recorded audio files with filed attribution waivers currently exist in `public/audio/`.
  - **Cultural Mismatch**: The synthetic sitar and flute loops defined in earlier prototypes do not fit a traditional Tamil Muhurtham, where auspicious Mangala Vathiyam (live Nadaswaram & Thavil) is expected.
  - Audio remains strictly off until a certified, culturally authentic recording with a signed license receipt is acquired.
