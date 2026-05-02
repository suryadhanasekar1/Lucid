import { NextResponse } from "next/server";
import { z } from "zod";
import { rebalanceToTargets } from "@/lib/portfolio/rebalance";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";
import type { Holding } from "@/types";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 60);

const holdingSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  type: z.enum(["stock", "etf", "mutual_fund", "bond", "cash"]),
  shares: z.number(),
  price: z.number(),
  costBasis: z.number().optional(),
  value: z.number(),
  weight: z.number().optional(),
});

const bodySchema = z.object({
  holdings: z.array(holdingSchema).min(1).max(200),
  targets: z.object({
    stockAndEquity: z.number().min(0).max(1),
    bonds: z.number().min(0).max(1),
    cash: z.number().min(0).max(1),
  }),
});

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "rebalance");
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const result = rebalanceToTargets(parsed.data.holdings as Holding[], parsed.data.targets);
  return NextResponse.json(result);
}
