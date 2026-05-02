"use client";

import { useMemo } from "react";
import { usePortfolioStore } from "@/stores/portfolioStore";

export function usePortfolioSummary(): {
  positionCount: number;
  holdingsPreview: Array<{
    ticker: string;
    name: string;
    value: number;
    weight: number;
  }>;
  allocationSummary: {
    foundationValue: number;
    frontierValue: number;
    foundationPercent: number;
    frontierPercent: number;
  };
} {
  const holdings = usePortfolioStore((s) => s.holdings);
  const totalValue = usePortfolioStore((s) => s.totalValue);

  return useMemo(() => {
    const sorted = [...holdings].sort((a, b) => b.value - a.value);
    const holdingsPreview = sorted.slice(0, 5).map((holding) => ({
      ticker: holding.ticker,
      name: holding.name,
      value: holding.value,
      weight: totalValue > 0 ? holding.value / totalValue : 0,
    }));

    const foundationValue = holdings
      .filter((holding) => holding.type !== "stock")
      .reduce((sum, holding) => sum + holding.value, 0);
    const frontierValue = holdings
      .filter((holding) => holding.type === "stock")
      .reduce((sum, holding) => sum + holding.value, 0);

    return {
      positionCount: holdings.length,
      holdingsPreview,
      allocationSummary: {
        foundationValue,
        frontierValue,
        foundationPercent: totalValue > 0 ? foundationValue / totalValue : 0,
        frontierPercent: totalValue > 0 ? frontierValue / totalValue : 0,
      },
    };
  }, [holdings, totalValue]);
}
