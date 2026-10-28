# 📸 Feature: Photo Lightbox Gallery & WebP Optimization

> **Feature Identifier**: `feat-photo-gallery`  
> **Layer**: Media Pipeline & Guest Display  
> **Status in Code**: 🟢 **DONE** (Implemented & Tested)  
> **Status for Nov 12 Pilot**: 🔴 **EXCLUDED (Disabled per Client Request)**

---

## 1. Executive Summary

Shadify includes a high-performance, responsive photo lightbox gallery supporting up to 100 photos (Lite), 300 photos (Premium), or 1,000 photos (Platinum). Uploads are processed server-side via Sharp into responsive WebP thumbnails and preview sizes with EXIF stripping, and served via private Cloudflare R2 object storage.

---

## 2. Technical Implementation in Repository

- **Component**: [`src/components/guest/GallerySection.tsx`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/components/guest/GallerySection.tsx)
- **Image Processing Engine**: [`src/lib/media/image-processor.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/media/image-processor.ts)
- **Object Storage Service**: [`src/lib/media/storage.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/lib/media/storage.ts) (Cloudflare R2)
- **Presigned Upload Route**: [`src/app/api/media/presign/route.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/app/api/media/presign/route.ts)
- **Database Model**: `Photo` model in [`prisma/schema.prisma`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/prisma/schema.prisma) with tenant foreign keys.

---

## 3. What is Done (Current Baseline)

- [x] Sharp server-side image pipeline: generates thumbnails (400px), previews (1200px), and full-size WebP images.
- [x] Strict EXIF metadata stripping (eliminates GPS coordinates, device serials, and camera timestamps).
- [x] Responsive CSS grid layout with lightbox zoom, keyboard navigation, and swipe gesture support.
- [x] Tenant-isolated R2 keys (`weddings/[weddingId]/photos/[photoId].webp`).
- [x] Verified cross-tenant presigning denial tests in `src/app/api/media/__tests__/presign.test.ts`.

---

## 4. What is Planned (Future Roadmap)

- [ ] **Phase 2 AI Face Tagging / Guest Search**: Allowing guests to take a selfie and instantly find all wedding photos containing their face.
- [ ] **Multi-Photographer Live Upload Pass (Platinum Tier)**: QR-code pass allowing official wedding photographers to stream live edits into the gallery.

---

## 5. Status for November 12 Pilot Client

- **State**: 🔴 **EXCLUDED (`gallery: { enabled: false }`)**.
- **Pilot Rationale**:
  - The pilot client explicitly requested **no personal photos** to be published or viewable online.
  - The gallery module is toggled completely off in the wedding settings JSON.
