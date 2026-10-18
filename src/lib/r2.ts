import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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
  expiresInSeconds: number = 300
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
  expiresInSeconds: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
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
