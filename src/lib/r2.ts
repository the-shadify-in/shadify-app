import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 is fully S3-compatible with zero egress fees
const accountId = process.env.R2_ACCOUNT_ID ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
const bucketName = process.env.R2_BUCKET_NAME ?? "shadify-media";
const publicDomain = process.env.R2_PUBLIC_DOMAIN ?? "";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Generate a presigned PUT URL for direct browser-to-R2 upload
 * Bypasses Next.js server bandwidth and memory limits
 */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 300,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generate a time-limited signed GET URL for private/family photos
 */
export async function createSignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Check real object metadata and byte size in R2
 */
export async function headMediaObject(
  key: string,
): Promise<{ contentLength: number; contentType?: string } | null> {
  try {
    const res = await r2Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
    return {
      contentLength: res.ContentLength ?? 0,
      contentType: res.ContentType,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch raw media buffer from R2 for Sharp post-upload EXIF stripping and thumbnail generation
 */
export async function getMediaBuffer(key: string): Promise<Buffer | null> {
  try {
    const res = await r2Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
    if (!res.Body) return null;
    const byteArray = await res.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch {
    return null;
  }
}

/**
 * Save processed and optimized media buffer back to R2
 */
export async function putMediaBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

/**
 * Delete a media object from R2 (e.g. on quota violation, corrupt file, or erasure)
 */
export async function deleteMediaObject(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Get public CDN URL for public photos
 */
export function getPublicMediaUrl(key: string): string {
  if (publicDomain) {
    return `${publicDomain.replace(/\/$/, "")}/${key}`;
  }
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
}
