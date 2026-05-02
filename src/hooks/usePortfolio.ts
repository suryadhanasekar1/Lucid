"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useUserStore } from "@/stores/userStore";
import { computeHealthScore } from "@/lib/portfolio/calculations";
import { runAllAgents } from "@/lib/agents";
import type { Holding, MacroSnapshot, PortfolioSource } from "@/types";

interface SamplePortfolioFile {
  source: "sample";
  holdings: Holding[];
}

interface SnaptradeHoldingsResponse {
  source: "snaptrade";
  holdings: Holding[];
}

async function fetchSnaptrade(userId: string, userSecret: string): Promise<Holding[] | null> {
  const url = `/api/snaptrade/holdings?userId=${encodeURIComponent(userId)}&userSecret=${encodeURIComponent(userSecret)}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as SnaptradeHoldingsResponse;
    if (!Array.isArray(data.holdings)) return null;
    return data.holdings;
  } catch {
    return null;
  }
}

async function fetchSample(): Promise<Holding[]> {
  try {
    const res = await fetch("/data/sample-portfolio.json", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as SamplePortfolioFile;
    return data.holdings ?? [];
  } catch {
    return [];
  }
}

export function usePortfolio(): {
  holdings: Holding[];
  totalValue: number;
  source: PortfolioSource;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  connectBrokerage: () => Promise<void>;
} {
  const holdings = usePortfolioStore((s) => s.holdings);
  const totalValue = usePortfolioStore((s) => s.totalValue);
  const source = usePortfolioStore((s) => s.source);
  const loading = usePortfolioStore((s) => s.loading);
  const error = usePortfolioStore((s) => s.error);
  const snaptrade = usePortfolioStore((s) => s.snaptrade);
  const setHoldings = usePortfolioStore((s) => s.setHoldings);
  const setLoading = usePortfolioStore((s) => s.setLoading);
  const setError = usePortfolioStore((s) => s.setError);
  const addActionCard = usePortfolioStore((s) => s.addActionCard);
  const profile = useUserStore((s) => s.profile);

  const initialized = useRef(false);

  const pushActionCards = useCallback(
    async (nextHoldings: Holding[]) => {
      if (!profile || nextHoldings.length === 0) return;
      try {
        const macroRes = await fetch("/api/macro/conditions", { cache: "no-store" });
        const macroData = (await macroRes.json()) as { snapshot?: MacroSnapshot };
        if (!macroData.snapshot) return;
        const health = computeHealthScore(nextHoldings, profile);
        const cards = await runAllAgents(
          nextHoldings,
          {
            timeHorizon: profile.answers.timelineYears,
            riskScore: profile.riskScore,
          },
          health.score,
          macroData.snapshot,
        );
        cards.forEach(addActionCard);
      } catch {
        // Agent cards are helpful, never blocking.
      }
    },
    [addActionCard, profile],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (snaptrade) {
        const real = await fetchSnaptrade(snaptrade.userId, snaptrade.userSecret);
        if (real && real.length > 0) {
          setHoldings(real, "snaptrade");
          await pushActionCards(real);
          return;
        }
      }
      const sample = await fetchSample();
      setHoldings(sample, "sample");
      await pushActionCards(sample);
    } catch (err) {
      setError(err as Error);
      const sample = await fetchSample();
      setHoldings(sample, "sample");
      await pushActionCards(sample);
    } finally {
      setLoading(false);
    }
  }, [pushActionCards, snaptrade, setHoldings, setLoading, setError]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load();
  }, [load]);

  const connectBrokerage = useCallback(async () => {
    // Phase 2 stub: clicking the button on the Connect page calls /api/snaptrade/register
    // and /api/snaptrade/connect. Hook just routes — see ConnectClient for the flow.
    if (typeof window !== "undefined") {
      window.location.href = "/connect";
    }
  }, []);

  return {
    holdings,
    totalValue,
    source,
    loading,
    error,
    refresh: load,
    connectBrokerage,
  };
}
