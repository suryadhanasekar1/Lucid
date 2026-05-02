"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { PricePoint } from "@/types";

type Period = "1mo" | "3mo" | "6mo" | "1y" | "all";
type PortfolioPoint = { date: string; value: number };

interface HistoryResponse {
  history?: PricePoint[];
}

const historyCache = new Map<string, PricePoint[]>();

export function usePortfolioHistory(): {
  history: PortfolioPoint[];
  period: Period;
  setPeriod: (p: Period) => void;
  loading: boolean;
  totalReturn: number;
  totalReturnPercent: number;
  source: "market" | "sample";
} {
  const holdings = usePortfolioStore((s) => s.holdings);
  const currentTotal = usePortfolioStore((s) => s.totalValue);
  const [period, setPeriod] = useState<Period>("1y");
  const [history, setHistory] = useState<PortfolioPoint[]>([]);
  const [source, setSource] = useState<"market" | "sample">("market");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (holdings.length === 0) {
        setHistory([]);
        setSource("market");
        return;
      }
      setLoading(true);
      try {
        const cashValue = holdings
          .filter((h) => h.type === "cash")
          .reduce((sum, h) => sum + h.value, 0);
        const investable = holdings.filter((h) => h.type !== "cash" && h.shares > 0);
        const results = await Promise.all(
          investable.map(async (holding) => {
            const symbol = holding.ticker.toUpperCase();
            const key = `${symbol}-${period}`;
            let points = historyCache.get(key);
            if (!points) {
              const res = await fetch(
                `/api/market/history?symbol=${encodeURIComponent(symbol)}&period=${period}`,
                { cache: "no-store" },
              );
              const data = (await res.json()) as HistoryResponse;
              points = Array.isArray(data.history) ? data.history : [];
              historyCache.set(key, points);
            }
            return { holding, points };
          }),
        );

        const totals = new Map<string, number>();
        for (const { holding, points } of results) {
          for (const point of points) {
            totals.set(point.date, (totals.get(point.date) ?? cashValue) + holding.shares * point.close);
          }
        }

        const merged = Array.from(totals.entries())
          .map(([date, value]) => ({ date, value }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const usableMarketHistory = merged.length >= 5;
        const nextHistory = usableMarketHistory
          ? scaleToCurrentTotal(merged, currentTotal)
          : generateSampleHistory(currentTotal, period);

        if (!cancelled) {
          setHistory(nextHistory);
          setSource(usableMarketHistory ? "market" : "sample");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [currentTotal, holdings, period]);

  const { totalReturn, totalReturnPercent } = useMemo(() => {
    if (history.length < 2) return { totalReturn: 0, totalReturnPercent: 0 };
    const first = history[0]!.value;
    const last = history[history.length - 1]!.value;
    const totalReturn = last - first;
    return {
      totalReturn,
      totalReturnPercent: first > 0 ? totalReturn / first : 0,
    };
  }, [history]);

  return { history, period, setPeriod, loading, totalReturn, totalReturnPercent, source };
}

function scaleToCurrentTotal(history: PortfolioPoint[], currentTotal: number): PortfolioPoint[] {
  const last = history[history.length - 1]?.value ?? 0;
  if (last <= 0 || currentTotal <= 0) return history;
  const scale = currentTotal / last;
  return history.map((point) => ({ ...point, value: point.value * scale }));
}

function generateSampleHistory(currentTotal: number, period: Period): PortfolioPoint[] {
  const daysByPeriod: Record<Period, number> = {
    "1mo": 30,
    "3mo": 90,
    "6mo": 180,
    "1y": 365,
    all: 365 * 3,
  };
  const totalDays = daysByPeriod[period];
  const pointCount = period === "1mo" ? 16 : 28;
  const start = new Date();
  start.setDate(start.getDate() - totalDays);
  const drift = period === "1mo" ? 0.012 : period === "3mo" ? 0.028 : period === "6mo" ? 0.045 : 0.075;
  const startValue = currentTotal / (1 + drift);

  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const date = new Date(start);
    date.setDate(start.getDate() + Math.round(totalDays * progress));
    const wave = Math.sin(index * 1.7) * 0.012 + Math.cos(index * 0.8) * 0.008;
    const value = index === pointCount - 1
      ? currentTotal
      : startValue + (currentTotal - startValue) * progress + currentTotal * wave;
    return {
      date: date.toISOString().slice(0, 10),
      value: Math.max(0, value),
    };
  });
}
