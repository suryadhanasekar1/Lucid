import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrices } from "@/lib/market/client";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const querySchema = z.object({
  tickers: z
    .string()
    .min(1)
    .max(500)
    .transform((s) =>
      s
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter((t) => /^[A-Z0-9.\-]{1,8}$/.test(t)),
    )
    .refine((arr) => arr.length > 0 && arr.length <= 50, {
      message: "1-50 tickers required",
    }),
});

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 60);

export async function GET(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "market");
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ tickers: url.searchParams.get("tickers") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getPrices(parsed.data.tickers);
  return NextResponse.json(result);
}
