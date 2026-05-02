"use client";

import { useMemo } from "react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useUserStore } from "@/stores/userStore";
import { computeHealthScore } from "@/lib/portfolio/calculations";
import type { HealthComponents, Weather } from "@/types";

export function useHealthScore(): {
  score: number;
  weather: Weather;
  components: HealthComponents;
} {
  const holdings = usePortfolioStore((s) => s.holdings);
  const profile = useUserStore((s) => s.profile);
  return useMemo(() => computeHealthScore(holdings, profile), [holdings, profile]);
}
