"use client";

import { useMemo } from "react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { findTaxLossOpportunities } from "@/lib/portfolio/tax";

export function useTaxLossOpportunities() {
  const holdings = usePortfolioStore((s) => s.holdings);
  return useMemo(() => findTaxLossOpportunities(holdings), [holdings]);
}
