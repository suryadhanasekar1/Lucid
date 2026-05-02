import { NextResponse } from "next/server";
import { z } from "zod";
import { snaptrade } from "@/lib/snaptrade/client";
import { transformPositions, type SnapTradePosition } from "@/lib/snaptrade/transformer";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const RPM = Number(process.env.RATE_LIMIT_SNAPTRADE_RPM ?? 10);

const querySchema = z.object({
  userId: z.string().min(8).max(128),
  userSecret: z.string().min(8).max(256),
});

export async function GET(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "snaptrade");
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    userId: url.searchParams.get("userId") ?? "",
    userSecret: url.searchParams.get("userSecret") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const client = snaptrade();
    const accountsRes = await client.accountInformation.listUserAccounts({
      userId: parsed.data.userId,
      userSecret: parsed.data.userSecret,
    });
    const accounts = (accountsRes.data ?? []) as { id?: string }[];

    const positions: SnapTradePosition[] = [];
    for (const acct of accounts) {
      if (!acct.id) continue;
      const posRes = await client.accountInformation.getUserAccountPositions({
        userId: parsed.data.userId,
        userSecret: parsed.data.userSecret,
        accountId: acct.id,
      });
      positions.push(...((posRes.data ?? []) as SnapTradePosition[]));
    }

    const holdings = transformPositions(positions);
    return NextResponse.json({
      source: "snaptrade",
      holdings,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "snaptrade_unavailable", message: (err as Error).message },
      { status: 502 },
    );
  }
}
