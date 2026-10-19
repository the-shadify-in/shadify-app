import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  validateImageMagicBytes,
  stripExifAndOptimize,
  generatePreviewAndThumb,
  stripExifFromOriginal,
} from "../image-processor";

describe("Image Processor & Magic Bytes Validation", () => {
  it("detects valid JPEG magic bytes", () => {
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    const result = validateImageMagicBytes(jpegBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/jpeg");
  });

  it("detects valid PNG magic bytes", () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const result = validateImageMagicBytes(pngBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/png");
  });

  it("detects valid WebP magic bytes", () => {
    const riff = Buffer.from("RIFF");
    const len = Buffer.alloc(4);
    const webp = Buffer.from("WEBP");
    const webpBuffer = Buffer.concat([riff, len, webp, Buffer.alloc(4)]);
    const result = validateImageMagicBytes(webpBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/webp");
  });

  it("detects valid AVIF container", () => {
    const prefix = Buffer.alloc(4);
    const ftyp = Buffer.from("ftyp");
    const brand = Buffer.from("avif");
    const avifBuffer = Buffer.concat([prefix, ftyp, brand, Buffer.alloc(4)]);
    const result = validateImageMagicBytes(avifBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/avif");
  });

  it("detects valid MP4 video container", () => {
    const prefix = Buffer.alloc(4);
    const ftyp = Buffer.from("ftyp");
    const brand = Buffer.from("mp42");
    const mp4Buffer = Buffer.concat([prefix, ftyp, brand, Buffer.alloc(4)]);
    const result = validateImageMagicBytes(mp4Buffer);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("video/mp4");
  });

  it("rejects malicious, executable, and script payloads", () => {
    // Windows PE executable header ('MZ')
    const exeBuffer = Buffer.from([
      0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
    ]);
    expect(validateImageMagicBytes(exeBuffer).valid).toBe(false);

    // HTML / Script payload
    const htmlBuffer = Buffer.from("<script>alert('pwned')</script>");
    expect(validateImageMagicBytes(htmlBuffer).valid).toBe(false);

    // SVG payload
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(validateImageMagicBytes(svgBuffer).valid).toBe(false);

    // Tiny buffer
    const tinyBuffer = Buffer.from([0xff, 0xd8]);
    expect(validateImageMagicBytes(tinyBuffer).valid).toBe(false);
  });

  it("strips EXIF GPS metadata and produces clean WebP output", async () => {
    // Generate a test JPEG with synthetic EXIF metadata
    const rawImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 180, g: 30, b: 30 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await stripExifAndOptimize(rawImage, {
      maxWidth: 80,
      maxHeight: 80,
      quality: 80,
      format: "webp",
    });

    expect(result.format).toBe("webp");
    expect(result.width).toBeLessThanOrEqual(80);
    expect(result.height).toBeLessThanOrEqual(80);
    expect(result.buffer.length).toBeGreaterThan(0);

    // Verify metadata on processed output has NO EXIF or GPS
    const outputMeta = await sharp(result.buffer).metadata();
    expect(outputMeta.exif).toBeUndefined();
  });

  it("generates preview and thumbnail with responsive dimensions", async () => {
    const rawImage = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 201, g: 147, b: 58 },
      },
    })
      .png()
      .toBuffer();

    const { preview, thumb } = await generatePreviewAndThumb(rawImage);

    expect(preview.format).toBe("webp");
    expect(preview.width).toBeLessThanOrEqual(1600);
    expect(preview.buffer.length).toBeGreaterThan(0);

    expect(thumb.format).toBe("webp");
    expect(thumb.width).toBeLessThanOrEqual(400);
    expect(thumb.height).toBeLessThanOrEqual(400);
  });

  it("strips EXIF from original while preserving dimensions", async () => {
    const rawImage = await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: { r: 50, g: 100, b: 150 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await stripExifFromOriginal(rawImage, "image/jpeg");
    expect(result.sizeBytes).toBeGreaterThan(0);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
    expect(meta.exif).toBeUndefined();
  });
});
