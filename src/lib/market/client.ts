import YahooFinance from "yahoo-finance2";

const yahoo = new YahooFinance();
import { promises as fs } from "node:fs";
import path from "node:path";

interface PriceMap {
  [ticker: string]: number;
}

interface CacheEntry {
  prices: PriceMap;
  fetchedAt: number;
}

let memCache: CacheEntry | null = null;
let fallbackCache: PriceMap | null = null;

const TTL_MS = 1000 * 60 * 60; // 1h

async function loadFallback(): Promise<PriceMap> {
  if (fallbackCache) return fallbackCache;
  const file = path.join(process.cwd(), "public", "data", "tickers.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as { prices: PriceMap };
    fallbackCache = parsed.prices ?? {};
  } catch {
    fallbackCache = {};
  }
  return fallbackCache;
}

export interface PriceQuoteResult {
  prices: PriceMap;
  source: "yahoo" | "cache" | "fallback";
  fetchedAt: string;
}

/**
 * Fetches last-day prices for the given tickers.
 * Uses an in-memory cache (1h TTL) and falls back to public/data/tickers.json
 * if Yahoo errors. Always resolves — never throws — because the dashboard
 * must keep rendering.
 */
export async function getPrices(tickers: string[]): Promise<PriceQuoteResult> {
  const requested = Array.from(new Set(tickers.map((t) => t.toUpperCase().trim())));
  if (requested.length === 0) {
    return { prices: {}, source: "cache", fetchedAt: new Date().toISOString() };
  }

  const now = Date.now();
  if (
    memCache &&
    now - memCache.fetchedAt < TTL_MS &&
    requested.every((t) => t in memCache!.prices)
  ) {
    return {
      prices: pick(memCache.prices, requested),
      source: "cache",
      fetchedAt: new Date(memCache.fetchedAt).toISOString(),
    };
  }

  try {
    const quotes = await yahoo.quote(requested);
    const list = Array.isArray(quotes) ? quotes : [quotes];
    const prices: PriceMap = {};
    for (const q of list) {
      const sym = (q.symbol ?? "").toUpperCase();
      const price = q.regularMarketPrice ?? q.regularMarketPreviousClose ?? null;
      if (sym && typeof price === "number") prices[sym] = price;
    }
    memCache = {
      prices: { ...(memCache?.prices ?? {}), ...prices },
      fetchedAt: now,
    };
    // Fill any missing requested tickers from fallback so callers always have something to render.
    const missing = requested.filter((t) => !(t in prices));
    if (missing.length > 0) {
      const fb = await loadFallback();
      for (const t of missing) if (t in fb) prices[t] = fb[t]!;
    }
    return { prices, source: "yahoo", fetchedAt: new Date(now).toISOString() };
  } catch {
    const fb = await loadFallback();
    return {
      prices: pick(fb, requested),
      source: "fallback",
      fetchedAt: new Date(now).toISOString(),
    };
  }
}

function pick(map: PriceMap, keys: string[]): PriceMap {
  const out: PriceMap = {};
  for (const k of keys) if (k in map) out[k] = map[k]!;
  return out;
}
