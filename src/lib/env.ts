import { z } from "zod";

const isDevOrBuild =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build";

/**
 * Validated Environment Variables Schema
 * Refuses startup if critical keys are missing, preventing late runtime failures.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required to connect to Postgres")
      .default(isDevOrBuild ? "postgresql://postgres:postgres@localhost:5432/shadify" : ""),
    DIRECT_URL: z.string().optional(),
    ADMIN_SESSION_SECRET: z
      .string()
      .min(32, "ADMIN_SESSION_SECRET must be at least 32 characters long for secure HMAC signing")
      .default(isDevOrBuild ? "dev-insecure-admin-session-secret-at-least-32-chars-long" : ""),
    GUEST_ACCESS_SECRET: z
      .string()
      .min(32, "GUEST_ACCESS_SECRET must be at least 32 characters long for secure HMAC signing")
      .default(isDevOrBuild ? "dev-insecure-guest-access-secret-at-least-32-chars-long" : ""),
    ERASURE_HMAC_SECRET: z
      .string()
      .min(32, "ERASURE_HMAC_SECRET must be at least 32 characters long for secure HMAC signing")
      .default(isDevOrBuild ? "dev-insecure-erasure-hmac-secret-at-least-32-chars-long" : ""),
    ADMIN_PASSWORD_HASH: z.string().optional(),

    // Cloudflare R2 Media Storage
    R2_ACCOUNT_ID: z
      .string()
      .optional()
      .default(isDevOrBuild ? "mock_r2_account" : ""),
    R2_ACCESS_KEY_ID: z
      .string()
      .optional()
      .default(isDevOrBuild ? "mock_r2_key" : ""),
    R2_SECRET_ACCESS_KEY: z
      .string()
      .optional()
      .default(isDevOrBuild ? "mock_r2_secret" : ""),
    R2_BUCKET_NAME: z.string().default("shadify-media"),
    R2_PUBLIC_DOMAIN: z.string().default("https://media.shadify.in"),

    // Public Client Variables
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_CONCIERGE_WHATSAPP: z
      .string()
      .min(10, "NEXT_PUBLIC_CONCIERGE_WHATSAPP must be a valid 10+ digit phone number")
      .refine(
        (val) => val.replace(/\D/g, "") !== "918000000000",
        "NEXT_PUBLIC_CONCIERGE_WHATSAPP cannot be the placeholder 918000000000. Set a real business WhatsApp number.",
      )
      .default(isDevOrBuild ? "919876543210" : ""),
    NEXT_PUBLIC_CONCIERGE_WHATSAPP_DISPLAY: z.string().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
    TURNSTILE_SECRET_KEY: z.string().optional(),

    // Distributed Rate Limiting (Upstash Redis)
    UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL").optional(),
    UPSTASH_REDIS_REST_TOKEN: z
      .string()
      .min(1, "UPSTASH_REDIS_REST_TOKEN cannot be empty")
      .optional(),
    RATE_LIMIT_FAIL_CLOSED: z.enum(["true", "false"]).default("false"),

    // Trusted Edge Proxy Boundary
    TRUSTED_PROXY_PROVIDER: z.enum(["cloudflare", "vercel", "direct"]).default("vercel"),
    CLOUDFLARE_ORIGIN_VERIFY_SECRET: z.string().optional(),

    // Dedicated privacy-preserving IP hashing secret (never reused)
    RATE_LIMIT_HASH_SECRET: z
      .string()
      .min(32, "RATE_LIMIT_HASH_SECRET must be at least 32 characters long")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
      if (
        data.ADMIN_SESSION_SECRET &&
        data.GUEST_ACCESS_SECRET &&
        data.ADMIN_SESSION_SECRET === data.GUEST_ACCESS_SECRET
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["GUEST_ACCESS_SECRET"],
          message: "GUEST_ACCESS_SECRET must not share the same value as ADMIN_SESSION_SECRET.",
        });
      }
      if (
        data.ADMIN_SESSION_SECRET &&
        data.ERASURE_HMAC_SECRET &&
        data.ADMIN_SESSION_SECRET === data.ERASURE_HMAC_SECRET
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ERASURE_HMAC_SECRET"],
          message: "ERASURE_HMAC_SECRET must not share the same value as ADMIN_SESSION_SECRET.",
        });
      }
      if (
        data.GUEST_ACCESS_SECRET &&
        data.ERASURE_HMAC_SECRET &&
        data.GUEST_ACCESS_SECRET === data.ERASURE_HMAC_SECRET
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ERASURE_HMAC_SECRET"],
          message: "ERASURE_HMAC_SECRET must not share the same value as GUEST_ACCESS_SECRET.",
        });
      }

      // Pairwise independence check for RATE_LIMIT_HASH_SECRET
      if (!data.RATE_LIMIT_HASH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RATE_LIMIT_HASH_SECRET"],
          message:
            "RATE_LIMIT_HASH_SECRET (min 32 characters) is required in production for privacy-preserving IP hashing.",
        });
      } else {
        if (data.RATE_LIMIT_HASH_SECRET === data.ADMIN_SESSION_SECRET) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["RATE_LIMIT_HASH_SECRET"],
            message:
              "RATE_LIMIT_HASH_SECRET must not share the same value as ADMIN_SESSION_SECRET.",
          });
        }
        if (data.RATE_LIMIT_HASH_SECRET === data.GUEST_ACCESS_SECRET) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["RATE_LIMIT_HASH_SECRET"],
            message: "RATE_LIMIT_HASH_SECRET must not share the same value as GUEST_ACCESS_SECRET.",
          });
        }
        if (data.RATE_LIMIT_HASH_SECRET === data.ERASURE_HMAC_SECRET) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["RATE_LIMIT_HASH_SECRET"],
            message: "RATE_LIMIT_HASH_SECRET must not share the same value as ERASURE_HMAC_SECRET.",
          });
        }
      }

      // Operational Guarantee: Distributed rate limiting in production
      if (!data.UPSTASH_REDIS_REST_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["UPSTASH_REDIS_REST_URL"],
          message:
            "UPSTASH_REDIS_REST_URL is required in production for distributed rate limiting across serverless instances.",
        });
      }
      if (!data.UPSTASH_REDIS_REST_TOKEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["UPSTASH_REDIS_REST_TOKEN"],
          message:
            "UPSTASH_REDIS_REST_TOKEN is required in production for distributed rate limiting.",
        });
      }
      if (data.RATE_LIMIT_FAIL_CLOSED !== "true") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RATE_LIMIT_FAIL_CLOSED"],
          message:
            "RATE_LIMIT_FAIL_CLOSED must be set to 'true' in production to guarantee fail-closed enforcement under Redis outages.",
        });
      }

      if (data.TRUSTED_PROXY_PROVIDER === "direct") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["TRUSTED_PROXY_PROVIDER"],
          message:
            "TRUSTED_PROXY_PROVIDER cannot be 'direct' in production. Must be 'cloudflare' or 'vercel' behind a verified edge proxy.",
        });
      }

      if (
        data.TRUSTED_PROXY_PROVIDER === "cloudflare" &&
        (!data.CLOUDFLARE_ORIGIN_VERIFY_SECRET ||
          data.CLOUDFLARE_ORIGIN_VERIFY_SECRET.trim().length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CLOUDFLARE_ORIGIN_VERIFY_SECRET"],
          message:
            "CLOUDFLARE_ORIGIN_VERIFY_SECRET is required in production when TRUSTED_PROXY_PROVIDER is set to 'cloudflare' to prevent origin header spoofing.",
        });
      }
    }
  });

export { envSchema };

export function validateEnv(customEnv?: Record<string, string | undefined>) {
  const parsed = envSchema.safeParse(customEnv ?? process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables detected:");
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    console.error(issues.join("\n"));
    throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
  }

  return parsed.data ?? (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = validateEnv();
