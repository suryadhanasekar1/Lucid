"use client";

import { useCallback, useMemo, useState } from "react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useUserStore } from "@/stores/userStore";
import { analyzePortfolioRisk } from "@/lib/portfolio/calculations";
import { rebalanceForRisk, type RiskRebalanceResult } from "@/lib/portfolio/rebalance";

export function useRiskRebalance(): {
  analysis: ReturnType<typeof analyzePortfolioRisk>;
  lastResult: RiskRebalanceResult | null;
  rebalance: () => RiskRebalanceResult | null;
  clearResult: () => void;
} {
  const holdings = usePortfolioStore((s) => s.holdings);
  const source = usePortfolioStore((s) => s.source);
  const setHoldings = usePortfolioStore((s) => s.setHoldings);
  const profile = useUserStore((s) => s.profile);
  const [lastResult, setLastResult] = useState<RiskRebalanceResult | null>(null);

  const analysis = useMemo(() => analyzePortfolioRisk(holdings, profile), [holdings, profile]);

  const rebalance = useCallback(() => {
    if (holdings.length === 0) return null;
    const result = rebalanceForRisk(holdings, analysis.targetRisk);
    setHoldings(result.after, source === "none" ? "sample" : source);
    setLastResult(result);
    return result;
  }, [analysis.targetRisk, holdings, setHoldings, source]);

  const clearResult = useCallback(() => setLastResult(null), []);

  return { analysis, lastResult, rebalance, clearResult };
}
