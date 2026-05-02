"use client";

import { useMemo } from "react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import {
  calculateAlpha,
  calculateBeta,
  calculateCorrelationMatrix,
  calculateMaxDrawdown,
  calculateSharpeRatio,
  calculateSortino,
  calculateVolatility,
} from "@/lib/calculations/advancedMetrics";

const MARKET_RETURNS = [0.018, -0.012, 0.027, 0.009, -0.021, 0.034, 0.011, 0.006, -0.015, 0.022, 0.014, 0.008];

export function useAdvancedMetrics(): {
  metrics: {
    sharpe: number;
    sortino: number;
    beta: number;
    alpha: number;
    maxDrawdown: number;
    volatility: number;
  };
  correlationMatrix: Record<string, Record<string, number>>;
} {
  const holdings = usePortfolioStore((s) => s.holdings);

  return useMemo(() => {
    const returnsBySymbol: Record<string, number[]> = {};
    for (const holding of holdings.slice(0, 5)) {
      returnsBySymbol[holding.ticker] = deterministicReturns(holding.ticker, holding.type);
    }

    const total = holdings.reduce((sum, h) => sum + h.value, 0);
    const portfolioReturns = MARKET_RETURNS.map((_, i) =>
      holdings.reduce((sum, h) => {
        const weight = total > 0 ? h.value / total : 0;
        const returns = returnsBySymbol[h.ticker] ?? deterministicReturns(h.ticker, h.type);
        return sum + weight * returns[i % returns.length]!;
      }, 0),
    );
    const beta = calculateBeta(portfolioReturns, MARKET_RETURNS);
    const prices = portfolioReturns.reduce<number[]>((acc, r) => {
      const prior = acc[acc.length - 1] ?? 100;
      acc.push(prior * (1 + r));
      return acc;
    }, []);

    return {
      metrics: {
        sharpe: calculateSharpeRatio(portfolioReturns),
        sortino: calculateSortino(portfolioReturns),
        beta,
        alpha: calculateAlpha(portfolioReturns, MARKET_RETURNS, beta),
        maxDrawdown: calculateMaxDrawdown(prices),
        volatility: calculateVolatility(portfolioReturns),
      },
      correlationMatrix: calculateCorrelationMatrix(returnsBySymbol),
    };
  }, [holdings]);
}

function deterministicReturns(symbol: string, type: string): number[] {
  const seed = symbol.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const typeMultiplier = type === "stock" ? 1.35 : type === "bond" ? 0.45 : type === "cash" ? 0.1 : 0.85;
  return MARKET_RETURNS.map((market, i) => {
    const wobble = (((seed + i * 17) % 13) - 6) / 1000;
    return market * typeMultiplier + wobble;
  });
}
