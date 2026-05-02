import { NextResponse } from "next/server";
import { z } from "zod";
import { getFundHoldings } from "@/lib/funds/edgar";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 60);

const querySchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(8)
    .transform((s) => s.toUpperCase().trim())
    .refine((s) => /^[A-Z][A-Z0-9.]{0,7}$/.test(s), { message: "bad_ticker" }),
});

export async function GET(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "edgar");
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ ticker: url.searchParams.get("ticker") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await getFundHoldings(parsed.data.ticker);
  if (!result.fund) {
    return NextResponse.json({ error: "fund_not_found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
