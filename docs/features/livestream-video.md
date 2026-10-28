# 📹 Feature: Live Stream Video Embed for Remote Guests

> **Feature Identifier**: `feat-livestream-video`  
> **Layer**: Virtual Attendance & Video Delivery  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🔴 **EXCLUDED (Turned Off for Pilot)**

---

## 1. Executive Summary

The Live Stream modal enables remote relatives, elderly family members, and international guests who cannot travel to attend wedding ceremonies virtually in real-time. It embeds sandboxed live video streams from YouTube Live, Vimeo, or private custom HLS video endpoints directly inside the branded wedding interface.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/LiveStreamModal.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/LiveStreamModal.tsx)
- **Security Sandboxing**: Embeds run inside strict `iframe` sandbox containers with `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"` and zero top-level navigation privileges.
- **Provider Normalization**: Automatically converts standard YouTube watch links, shortened `youtu.be` URLs, and Vimeo URLs into responsive embedded players.

---

## 3. What is Done (Current Baseline)

- [x] Responsive 16:9 aspect ratio video container with full-screen toggle.
- [x] Sandboxed iframe embedding preventing third-party cookie leaks and clickjacking.
- [x] Tested against modal open/close interaction states and external video URLs.

---

## 4. What is Planned (Future Roadmap)

- [ ] **Live Guest Virtual Reactions**: Real-time floating flower petals and auspicious blessing emojis appearing over the stream.
- [ ] **Automated Stream Countdown**: Automatic banner counting down to the exact scheduled Muhurtham broadcast start time.

---

## 5. Status for November 12 Pilot Client

- **State**: 🔴 **EXCLUDED (`liveStream: { enabled: false }`)**.
- **Pilot Rationale**:
  - The pilot client has not contracted an official live-streaming crew or provided an authenticated stream URL.
  - The modal trigger button remains hidden on the guest website.
