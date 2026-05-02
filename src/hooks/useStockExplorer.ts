"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PricePoint, SearchResult, StockDetail } from "@/types";

type Period = "1mo" | "3mo" | "6mo" | "1y" | "5y";

interface SearchResponse {
  results: SearchResult[];
}

interface DetailResponse {
  selected: StockDetail;
  chartData: PricePoint[];
}

const PERIODS = new Set(["1mo", "3mo", "6mo", "1y", "5y"]);

export function useStockExplorer(): {
  query: string;
  results: SearchResult[];
  selected: StockDetail | null;
  chartData: PricePoint[];
  loading: boolean;
  search: (query: string) => Promise<void>;
  select: (symbol: string) => Promise<void>;
  period: Period;
  setPeriod: (p: string) => void;
} {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<StockDetail | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriodState] = useState<Period>("1y");
  const lastRequest = useRef("");

  const search = useCallback(async (nextQuery: string) => {
    setQuery(nextQuery);
    const trimmed = nextQuery.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/market/stock-explorer?mode=search&q=${encodeURIComponent(trimmed)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = (await res.json()) as SearchResponse;
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (symbol: string, nextPeriod: Period) => {
    const requestKey = `${symbol}:${nextPeriod}`;
    lastRequest.current = requestKey;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/market/stock-explorer?symbol=${encodeURIComponent(symbol)}&period=${nextPeriod}`,
        { cache: "no-store" },
      );
      if (lastRequest.current !== requestKey) return;
      if (!res.ok) {
        setSelected(null);
        setChartData([]);
        return;
      }
      const data = (await res.json()) as DetailResponse;
      setSelected(data.selected);
      setChartData(data.chartData ?? []);
    } catch {
      if (lastRequest.current !== requestKey) return;
      setSelected(null);
      setChartData([]);
    } finally {
      if (lastRequest.current === requestKey) setLoading(false);
    }
  }, []);

  const select = useCallback(
    async (symbol: string) => {
      const clean = symbol.trim().toUpperCase();
      if (!clean) return;
      setSelectedSymbol(clean);
      setResults([]);
      setLoading(true);
      await fetchDetail(clean, period);
    },
    [fetchDetail, period],
  );

  const setPeriod = useCallback((p: string) => {
    if (PERIODS.has(p)) setPeriodState(p as Period);
  }, []);

  useEffect(() => {
    if (selectedSymbol) void fetchDetail(selectedSymbol, period);
  }, [fetchDetail, period, selectedSymbol]);

  return {
    query,
    results,
    selected,
    chartData,
    loading,
    search,
    select,
    period,
    setPeriod,
  };
}
