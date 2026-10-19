"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { GalleryPhotoDto } from "@/features/weddings";

interface GallerySectionProps {
  gallery: GalleryPhotoDto[];
}

export function GallerySection({ gallery }: GallerySectionProps) {
  const [activePhoto, setActivePhoto] = useState<GalleryPhotoDto | null>(null);

  if (!gallery || gallery.length === 0) return null;

  return (
    <section id="gallery" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center sm:mb-20">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-theme-accent">
            Captured Memories
          </span>
          <h2 className="mt-2 font-serif text-3xl font-normal text-theme-text-primary sm:text-4xl md:text-5xl">
            Our Moments <em>&amp; Milestones</em>
          </h2>
          <p className="mx-auto mt-3 max-w-md font-serif text-base text-theme-text-muted sm:text-lg">
            From stolen glances by the lake to sacred vows under the mandap.
          </p>
        </div>

        {/* Masonry Photo Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((photo, idx) => (
            <div
              key={idx}
              onClick={() => setActivePhoto(photo)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-theme-surface shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-2xl"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={photo.url}
                  alt={photo.caption || "Wedding gallery photo"}
                  fill
                  className="group-hover:scale-108 object-cover transition-transform duration-700"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                />
              </div>

              {/* Hover Luxury Veil & Caption */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex w-full items-center justify-between text-white">
                  <span className="font-serif text-sm tracking-wide text-[#E8B96B]">
                    {photo.caption}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                    <Eye className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal using Shadcn Radix Dialog */}
      <Dialog open={!!activePhoto} onOpenChange={(open) => !open && setActivePhoto(null)}>
        <DialogContent className="max-w-4xl border border-[#D4AF37]/50 bg-black/95 p-2 text-white shadow-2xl backdrop-blur-2xl sm:p-4">
          <DialogHeader className="sr-only">
            <DialogTitle>{activePhoto?.caption || "Wedding Photograph"}</DialogTitle>
            <DialogDescription>Full-resolution wedding gallery preview</DialogDescription>
          </DialogHeader>

          {activePhoto && (
            <div className="flex flex-col items-center">
              <div className="relative aspect-[4/3] max-h-[75vh] w-full overflow-hidden rounded-lg">
                <Image
                  src={activePhoto.url}
                  alt={activePhoto.caption || "Wedding photo"}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
              <p className="mt-4 text-center font-serif text-base tracking-wider text-[#E8B96B] sm:text-lg">
                {activePhoto.caption}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
