import { z } from "zod";

const isDevOrBuild =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build";

/**
 * Validated Environment Variables Schema
 * Refuses startup if critical keys are missing, preventing late runtime failures.
 */
const envSchema = z.object({
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
    ),
  NEXT_PUBLIC_CONCIERGE_WHATSAPP_DISPLAY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables detected:");
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    console.error(issues.join("\n"));
    throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
  }

  return parsed.data ?? (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = validateEnv();
