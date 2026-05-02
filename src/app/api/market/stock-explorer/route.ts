import { NextResponse } from "next/server";
import { z } from "zod";
import { getStockDetail, searchStocks } from "@/lib/market/stockExplorer";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const periodSchema = z.enum(["1mo", "3mo", "6mo", "1y", "5y"]);

const searchSchema = z.object({
  q: z.string().trim().min(1).max(40),
});

const detailSchema = z.object({
  symbol: z.string().trim().min(1).max(12).regex(/^[A-Za-z0-9.\-]+$/),
  period: periodSchema.default("1y"),
});

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 60);

export async function GET(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "stock-explorer");
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode");

  try {
    if (mode === "search") {
      const parsed = searchSchema.safeParse({ q: url.searchParams.get("q") ?? "" });
      if (!parsed.success) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
      }
      const results = await searchStocks(parsed.data.q);
      return NextResponse.json({ results });
    }

    const parsed = detailSchema.safeParse({
      symbol: url.searchParams.get("symbol") ?? "",
      period: url.searchParams.get("period") ?? "1y",
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const data = await getStockDetail(parsed.data.symbol, parsed.data.period);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "yahoo_unavailable",
        message:
          error instanceof Error
            ? error.message
            : "Yahoo Finance did not return data for this request.",
      },
      { status: 502 },
    );
  }
}
