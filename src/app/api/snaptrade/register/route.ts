import { NextResponse } from "next/server";
import { z } from "zod";
import { snaptrade } from "@/lib/snaptrade/client";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const RPM = Number(process.env.RATE_LIMIT_SNAPTRADE_RPM ?? 10);

const bodySchema = z.object({
  userId: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "snaptrade");
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: limit.retryAfterSec },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const client = snaptrade();
    const res = await client.authentication.registerSnapTradeUser({
      userId: parsed.data.userId,
    });
    return NextResponse.json({ userId: res.data.userId, userSecret: res.data.userSecret });
  } catch (err) {
    return NextResponse.json(
      { error: "snaptrade_unavailable", message: (err as Error).message },
      { status: 502 },
    );
  }
}
