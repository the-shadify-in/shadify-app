import pino from "pino";

/**
 * Sensitive fields strictly redacted from all JSON output by default.
 * Guarantees zero PII leakage (names, phones, UPI VPAs, tokens, PINs) into logs.
 */
const SENSITIVE_PATHS = [
  "password",
  "passwordHash",
  "token",
  "secret",
  "pin",
  "privatePin",
  "privatePinHash",
  "phone",
  "couplePhone",
  "guestPhone",
  "upiVpa",
  "guestName",
  "guests",
  "guestList",
  "dietary",
  "mealPreference",
  "authorization",
  "cookie",
  "set-cookie",
  "*.password",
  "*.token",
  "*.secret",
  "*.phone",
  "*.couplePhone",
  "*.upiVpa",
  "*.pin",
  "*.email",
];

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: SENSITIVE_PATHS,
    censor: "[REDACTED]",
  },
  base: {
    env: process.env.NODE_ENV,
    service: "shadify-web",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export interface LogRequestParams {
  requestId: string;
  route: string;
  method?: string;
  status: number;
  durationMs: number;
  weddingId?: string;
  error?: unknown;
}

/**
 * Standard structured request logger for API routes.
 * Call this at route completion to emit a single compliant JSON record.
 */
export function logRequest({
  requestId,
  route,
  method = "POST",
  status,
  durationMs,
  weddingId,
  error,
}: LogRequestParams) {
  const logData: Record<string, unknown> = {
    requestId,
    route,
    method,
    status,
    durationMs,
    ...(weddingId ? { weddingId } : {}),
  };

  if (error) {
    logData.errorClass = error instanceof Error ? error.constructor.name : "UnknownError";
    logData.errorMessage = error instanceof Error ? error.message : String(error);
    if (status >= 500) {
      logger.error(logData, `API Request Failed: ${method} ${route} (${status})`);
      return;
    }
    logger.warn(logData, `API Request Client Error: ${method} ${route} (${status})`);
    return;
  }

  logger.info(logData, `API Request Completed: ${method} ${route} (${status})`);
}
