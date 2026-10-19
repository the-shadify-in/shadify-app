import sharp from "sharp";

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export const ALLOWED_MEDIA_MIMES = [...ALLOWED_IMAGE_MIMES, "video/mp4"] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];
export type AllowedMediaMime = (typeof ALLOWED_MEDIA_MIMES)[number];

export const MAX_PHOTO_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export interface MagicByteValidationResult {
  valid: boolean;
  detectedMime?: string;
  error?: string;
}

/**
 * Validates the true binary file header (magic numbers) of an uploaded buffer
 * to protect against spoofed file extensions and polyglot payloads.
 */
export function validateImageMagicBytes(buffer: Buffer): MagicByteValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "File buffer is too small to determine format." };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: "image/png" };
  }

  // 3. WebP: RIFF .... WEBP
  const isRiff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  const isWebp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (isRiff && isWebp) {
    return { valid: true, detectedMime: "image/webp" };
  }

  // 4. ISO Base Media File Format (AVIF, MP4): offset 4 is 'ftyp'
  const isFtyp = buffer.subarray(4, 8).toString("ascii") === "ftyp";
  if (isFtyp) {
    const brand = buffer.subarray(8, 12).toString("ascii").trim();
    if (brand.startsWith("avif") || brand.startsWith("avis")) {
      return { valid: true, detectedMime: "image/avif" };
    }
    if (
      brand.startsWith("isom") ||
      brand.startsWith("mp4") ||
      brand.startsWith("M4V") ||
      brand.startsWith("MSNV")
    ) {
      return { valid: true, detectedMime: "video/mp4" };
    }
  }

  return {
    valid: false,
    error: "File content does not match any allowed media format (JPEG, PNG, WebP, AVIF, MP4).",
  };
}

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg";
}

export interface ProcessedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

/**
 * Strips all EXIF metadata (specifically GPS coordinates and camera serial numbers)
 * while auto-orienting the image so vertical photos do not render sideways.
 * Re-encodes as clean, web-optimized WebP or JPEG.
 */
export async function stripExifAndOptimize(
  input: Buffer,
  options: ProcessImageOptions = {},
): Promise<ProcessedImageResult> {
  const { maxWidth = 2048, maxHeight = 2048, quality = 85, format = "webp" } = options;

  let pipeline = sharp(input)
    .rotate() // Auto-orient based on EXIF orientation before stripping tags
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });

  // Note: sharp strips ALL EXIF by default unless .withMetadata() is explicitly invoked.
  // We do NOT call .withMetadata(), which ensures all GPS and tracking tags are stripped.

  if (format === "webp") {
    pipeline = pipeline.webp({ quality, effort: 4 });
  } else {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    format: info.format,
    sizeBytes: info.size,
  };
}

/**
 * Generates a lightweight preview (max 1600px) and a square or responsive thumbnail (max 400px)
 * with complete EXIF and location stripping.
 */
export async function generatePreviewAndThumb(input: Buffer): Promise<{
  preview: ProcessedImageResult;
  thumb: ProcessedImageResult;
}> {
  const [preview, thumb] = await Promise.all([
    stripExifAndOptimize(input, { maxWidth: 1600, maxHeight: 1600, quality: 82, format: "webp" }),
    stripExifAndOptimize(input, { maxWidth: 400, maxHeight: 400, quality: 75, format: "webp" }),
  ]);

  return { preview, thumb };
}

/**
 * Strips all EXIF and GPS location metadata from an original image buffer
 * without downscaling resolution, preventing location leakage in downloadable originals.
 */
export async function stripExifFromOriginal(
  input: Buffer,
  detectedMime?: string,
): Promise<{ buffer: Buffer; sizeBytes: number }> {
  let pipeline = sharp(input).rotate();

  if (detectedMime === "image/png") {
    pipeline = pipeline.png({ compressionLevel: 9 });
  } else if (detectedMime === "image/webp") {
    pipeline = pipeline.webp({ quality: 95 });
  } else if (detectedMime === "image/avif") {
    pipeline = pipeline.avif({ quality: 90 });
  } else {
    // Default to high-quality JPEG
    pipeline = pipeline.jpeg({ quality: 95, mozjpeg: true });
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, sizeBytes: info.size };
}
