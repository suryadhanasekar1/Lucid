import { z } from "zod";

/**
 * Server-side env validation. Imported only by API routes / server components.
 * Crashes the process at startup if anything required is missing or malformed.
 */
const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
  SNAPTRADE_CLIENT_ID: z.string().min(1),
  SNAPTRADE_CONSUMER_KEY: z.string().min(1),
  SNAPTRADE_REDIRECT_URI: z.string().url(),
  NEWSAPI_KEY: z.string().optional(),
  FRED_API_KEY: z.string().min(20).optional(),
  SEC_EDGAR_USER_AGENT: z.string().min(10),
  RATE_LIMIT_AI_RPM: z.coerce.number().default(20),
  MARKET_CACHE_TTL: z.coerce.number().default(3600),
  FRED_CACHE_TTL: z.coerce.number().default(86400),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment validation failed:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
