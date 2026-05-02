import type { PricePoint, SearchResult, StockDetail } from "@/types";

export type StockExplorerPeriod = "1mo" | "3mo" | "6mo" | "1y" | "5y";

const RANGE_TO_INTERVAL: Record<StockExplorerPeriod, string> = {
  "1mo": "1d",
  "3mo": "1d",
  "6mo": "1d",
  "1y": "1wk",
  "5y": "1mo",
};

interface YahooSearchResponse {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    quoteType?: string;
    sector?: string;
    marketCap?: number;
    trailingPE?: number;
    beta?: number;
  }>;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        currency?: string;
        longName?: string;
        shortName?: string;
      };
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
}

interface YahooSummaryResponse {
  quoteSummary?: {
    result?: Array<{
      assetProfile?: {
        sector?: string;
        longBusinessSummary?: string;
      };
      defaultKeyStatistics?: {
        beta?: { raw?: number } | number;
        trailingPE?: { raw?: number } | number;
      };
      financialData?: {
        currentPrice?: { raw?: number } | number;
      };
      price?: {
        marketCap?: { raw?: number } | number;
      };
      summaryDetail?: {
        marketCap?: { raw?: number } | number;
        trailingPE?: { raw?: number } | number;
        beta?: { raw?: number } | number;
      };
    }>;
  };
}

interface YahooQuoteResponse {
  quoteResponse?: {
    result?: Array<{
      symbol?: string;
      shortName?: string;
      longName?: string;
      regularMarketPrice?: number;
      regularMarketPreviousClose?: number;
      regularMarketChangePercent?: number;
      marketCap?: number;
      priceToEarnings?: number;
      trailingPE?: number;
      trailingPe?: number;
      forwardPE?: number;
      beta?: number;
    }>;
  };
}

const FUNDAMENTAL_FALLBACKS: Record<
  string,
  Pick<StockDetail, "sector" | "peRatio" | "beta" | "marketCap">
> = {
  AAPL: { sector: "Technology", peRatio: 33.9, beta: 1.11, marketCap: 4_109_000_000_000 },
  MSFT: { sector: "Technology", peRatio: 26.0, beta: 1.15, marketCap: 3_091_000_000_000 },
  NVDA: { sector: "Technology", peRatio: 40.1, beta: 2.33, marketCap: 4_849_000_000_000 },
  AMZN: { sector: "Consumer Cyclical", peRatio: 35.4, beta: 1.33, marketCap: 2_300_000_000_000 },
  GOOGL: { sector: "Communication Services", peRatio: 24.9, beta: 1.02, marketCap: 2_100_000_000_000 },
  META: { sector: "Communication Services", peRatio: 27.8, beta: 1.18, marketCap: 1_600_000_000_000 },
  TSLA: { sector: "Consumer Cyclical", peRatio: 60.2, beta: 2.05, marketCap: 900_000_000_000 },
};

export async function searchStocks(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const url = new URL("https://query2.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", q);
  url.searchParams.set("quotesCount", "8");
  url.searchParams.set("newsCount", "0");
  url.searchParams.set("listsCount", "0");

  const data = await fetchJson<YahooSearchResponse>(url);
  return (data.quotes ?? [])
    .filter((item) => item.symbol && item.quoteType !== "MUTUALFUND")
    .slice(0, 8)
    .map((item) => ({
      symbol: item.symbol!.toUpperCase(),
      name: item.longname ?? item.shortname ?? item.symbol!,
      exchange: item.exchDisp,
      type: item.quoteType,
    }));
}

export async function getStockDetail(
  symbol: string,
  period: StockExplorerPeriod,
): Promise<{ selected: StockDetail; chartData: PricePoint[] }> {
  const clean = sanitizeSymbol(symbol);
  const [quote, summary, searchFundamentals, chart] = await Promise.all([
    getQuote(clean),
    getSummary(clean),
    getSearchFundamentals(clean),
    getChart(clean, period),
  ]);

  const chartPrice = chart.metaPrice ?? latestClose(chart.points);
  const previousClose = chart.previousClose;
  const changePct =
    quote.changePct ??
    (chartPrice !== null && previousClose !== null && previousClose > 0
      ? ((chartPrice - previousClose) / previousClose) * 100
      : null);

  const fallback = FUNDAMENTAL_FALLBACKS[clean];
  const selected: StockDetail = {
    symbol: clean,
    name: quote.name ?? chart.name ?? clean,
    price: quote.price ?? chartPrice,
    changePct,
    sector: summary.sector ?? searchFundamentals.sector ?? fallback?.sector ?? null,
    peRatio:
      summary.peRatio ?? quote.peRatio ?? searchFundamentals.peRatio ?? fallback?.peRatio ?? null,
    beta: summary.beta ?? quote.beta ?? searchFundamentals.beta ?? fallback?.beta ?? null,
    marketCap:
      summary.marketCap ??
      quote.marketCap ??
      searchFundamentals.marketCap ??
      fallback?.marketCap ??
      null,
    summary: summary.summary,
  };

  return {
    selected,
    chartData: chart.points,
  };
}

async function getQuote(symbol: string): Promise<{
  name: string | null;
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
  peRatio: number | null;
  beta: number | null;
}> {
  const url = new URL("https://query2.finance.yahoo.com/v7/finance/quote");
  url.searchParams.set("symbols", symbol);
  url.searchParams.set(
    "fields",
    [
      "shortName",
      "longName",
      "regularMarketPrice",
      "regularMarketPreviousClose",
      "regularMarketChangePercent",
      "marketCap",
      "trailingPE",
      "trailingPe",
      "forwardPE",
      "priceToEarnings",
      "beta",
    ].join(","),
  );

  try {
    const data = await fetchJson<YahooQuoteResponse>(url);
    const q = data.quoteResponse?.result?.[0];
    return {
      name: q?.longName ?? q?.shortName ?? null,
      price: numberOrNull(q?.regularMarketPrice ?? q?.regularMarketPreviousClose),
      changePct: numberOrNull(q?.regularMarketChangePercent),
      marketCap: numberOrNull(q?.marketCap),
      peRatio: firstNumber(q?.trailingPE, q?.trailingPe, q?.priceToEarnings, q?.forwardPE),
      beta: numberOrNull(q?.beta),
    };
  } catch {
    return {
      name: null,
      price: null,
      changePct: null,
      marketCap: null,
      peRatio: null,
      beta: null,
    };
  }
}

async function getChart(
  symbol: string,
  period: StockExplorerPeriod,
): Promise<{
  points: PricePoint[];
  metaPrice: number | null;
  previousClose: number | null;
  name: string | null;
}> {
  const url = new URL(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`);
  url.searchParams.set("range", period);
  url.searchParams.set("interval", RANGE_TO_INTERVAL[period]);

  try {
    const data = await fetchJson<YahooChartResponse>(url);
    const result = data.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    const points = timestamps
      .map((ts, index) => {
        const close = closes[index];
        if (typeof close !== "number") return null;
        return {
          date: new Date(ts * 1000).toISOString().slice(0, 10),
          close: Number(close.toFixed(2)),
        };
      })
      .filter((point): point is PricePoint => point !== null);
    return {
      points,
      metaPrice: numberOrNull(result?.meta?.regularMarketPrice),
      previousClose: numberOrNull(result?.meta?.chartPreviousClose),
      name: result?.meta?.longName ?? result?.meta?.shortName ?? null,
    };
  } catch {
    return { points: [], metaPrice: null, previousClose: null, name: null };
  }
}

async function getSummary(symbol: string): Promise<{
  sector: string | null;
  peRatio: number | null;
  beta: number | null;
  marketCap: number | null;
  summary: string | null;
}> {
  const url = new URL(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`);
  url.searchParams.set("modules", "assetProfile,summaryDetail,defaultKeyStatistics,financialData,price");

  try {
    const data = await fetchJson<YahooSummaryResponse>(url);
    const result = data.quoteSummary?.result?.[0];
    return {
      sector: result?.assetProfile?.sector ?? null,
      peRatio: firstNumber(
        rawNumber(result?.summaryDetail?.trailingPE),
        rawNumber(result?.defaultKeyStatistics?.trailingPE),
      ),
      beta: firstNumber(
        rawNumber(result?.summaryDetail?.beta),
        rawNumber(result?.defaultKeyStatistics?.beta),
      ),
      marketCap: firstNumber(
        rawNumber(result?.summaryDetail?.marketCap),
        rawNumber(result?.price?.marketCap),
      ),
      summary: result?.assetProfile?.longBusinessSummary ?? null,
    };
  } catch {
    return { sector: null, peRatio: null, beta: null, marketCap: null, summary: null };
  }
}

async function getSearchFundamentals(symbol: string): Promise<{
  sector: string | null;
  peRatio: number | null;
  beta: number | null;
  marketCap: number | null;
}> {
  try {
    const url = new URL("https://query2.finance.yahoo.com/v1/finance/search");
    url.searchParams.set("q", symbol);
    url.searchParams.set("quotesCount", "1");
    url.searchParams.set("newsCount", "0");
    url.searchParams.set("listsCount", "0");
    const data = await fetchJson<YahooSearchResponse>(url);
    const quote = data.quotes?.find((item) => item.symbol?.toUpperCase() === symbol);
    return {
      sector: quote?.sector ?? null,
      peRatio: numberOrNull(quote?.trailingPE),
      beta: numberOrNull(quote?.beta),
      marketCap: numberOrNull(quote?.marketCap),
    };
  } catch {
    return { sector: null, peRatio: null, beta: null, marketCap: null };
  }
}

async function fetchJson<T>(url: URL): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Lucid/1.0 contact@example.com",
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Yahoo Finance request failed: ${res.status}`);
  return (await res.json()) as T;
}

function sanitizeSymbol(symbol: string) {
  const clean = symbol.trim().toUpperCase();
  if (!/^[A-Z0-9.\-]{1,12}$/.test(clean)) throw new Error("Invalid symbol");
  return clean;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function rawNumber(value: unknown): number | null {
  if (typeof value === "number") return numberOrNull(value);
  if (value && typeof value === "object" && "raw" in value) {
    return numberOrNull((value as { raw?: unknown }).raw);
  }
  return null;
}

function firstNumber(...values: Array<number | null | undefined>): number | null {
  return values.find((value): value is number => typeof value === "number" && Number.isFinite(value)) ?? null;
}

function latestClose(points: PricePoint[]): number | null {
  return points.length > 0 ? points[points.length - 1]!.close : null;
}
