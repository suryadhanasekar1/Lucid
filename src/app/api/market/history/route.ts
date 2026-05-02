import { NextResponse } from "next/server";
import { z } from "zod";
import type { PricePoint } from "@/types";

const periodSchema = z.enum(["1mo", "3mo", "6mo", "1y", "all"]);

const querySchema = z.object({
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9.\-]{1,12}$/),
  period: periodSchema.default("1y"),
});

const YAHOO_RANGE: Record<z.infer<typeof periodSchema>, string> = {
  "1mo": "1mo",
  "3mo": "3mo",
  "6mo": "6mo",
  "1y": "1y",
  all: "5y",
};

const cache = new Map<string, { fetchedAt: number; points: PricePoint[] }>();
const TTL_MS = 1000 * 60 * 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    symbol: url.searchParams.get("symbol") ?? "",
    period: url.searchParams.get("period") ?? "1y",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { symbol, period } = parsed.data;
  const key = `${symbol}-${period}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.fetchedAt < TTL_MS) {
    return NextResponse.json({ symbol, period, history: cached.points, source: "cache" });
  }

  try {
    const chartUrl = new URL(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`);
    chartUrl.searchParams.set("range", YAHOO_RANGE[period]);
    chartUrl.searchParams.set("interval", period === "all" ? "1wk" : "1d");

    const res = await fetch(chartUrl, {
      headers: {
        "User-Agent": "Lucid/1.0 contact@example.com",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`history_${res.status}`);
    const data = (await res.json()) as YahooChartResponse;
    const result = data.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    const points = timestamps
      .map((ts, index) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        close: Number(closes[index] ?? 0),
      }))
      .filter((p) => p.close > 0);

    cache.set(key, { fetchedAt: now, points });
    return NextResponse.json({ symbol, period, history: points, source: "yahoo" });
  } catch {
    return NextResponse.json({ symbol, period, history: [], source: "fallback" });
  }
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
}
