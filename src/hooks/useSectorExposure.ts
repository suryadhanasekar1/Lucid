"use client";

import { useMemo } from "react";
import { usePortfolioStore } from "@/stores/portfolioStore";

export interface ExposureSlice {
  name: string;
  value: number;
  percent: number;
}

const SECTOR_MAP: Record<string, string> = {
  AAPL: "Technology",
  MSFT: "Technology",
  NVDA: "Technology",
  GOOGL: "Communication Services",
  META: "Communication Services",
  AMZN: "Consumer Discretionary",
  TSLA: "Consumer Discretionary",
  JPM: "Financials",
  JNJ: "Healthcare",
  VTI: "Total Market",
  VOO: "Large Blend",
  VTSAX: "Total Market",
  VXUS: "International",
  BND: "Bonds",
  AGG: "Bonds",
};

export function useSectorExposure(): {
  sectors: ExposureSlice[];
  geography: ExposureSlice[];
} {
  const holdings = usePortfolioStore((s) => s.holdings);

  return useMemo(() => {
    const total = holdings.reduce((sum, h) => sum + h.value, 0);
    const sectorTotals = new Map<string, number>();
    const geoTotals = new Map<string, number>();
    for (const holding of holdings) {
      const sector = SECTOR_MAP[holding.ticker] ?? (holding.type === "stock" ? "Other Stocks" : "Diversified Funds");
      sectorTotals.set(sector, (sectorTotals.get(sector) ?? 0) + holding.value);
      const geography =
        holding.type === "cash"
          ? "Cash"
          : holding.type === "bond" || sector === "Bonds"
            ? "Bonds"
            : holding.ticker === "VXUS" || sector === "International"
              ? "International"
              : "US";
      geoTotals.set(geography, (geoTotals.get(geography) ?? 0) + holding.value);
    }

    return {
      sectors: toSlices(sectorTotals, total),
      geography: toSlices(geoTotals, total),
    };
  }, [holdings]);
}

function toSlices(map: Map<string, number>, total: number): ExposureSlice[] {
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, percent: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.value - a.value);
}
