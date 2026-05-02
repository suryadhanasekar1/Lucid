import { NextResponse } from "next/server";
import { z } from "zod";
import { snaptrade } from "@/lib/snaptrade/client";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const RPM = Number(process.env.RATE_LIMIT_SNAPTRADE_RPM ?? 10);

const bodySchema = z.object({
  userId: z.string().min(8).max(128),
  userSecret: z.string().min(8).max(256),
});

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "snaptrade");
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const client = snaptrade();
    const res = await client.authentication.loginSnapTradeUser({
      userId: parsed.data.userId,
      userSecret: parsed.data.userSecret,
    });
    // SDK returns either { redirectURI } or session data. We forward the redirect URI.
    const data = res.data as { redirectURI?: string };
    return NextResponse.json({ redirectURI: data.redirectURI ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: "snaptrade_unavailable", message: (err as Error).message },
      { status: 502 },
    );
  }
}
