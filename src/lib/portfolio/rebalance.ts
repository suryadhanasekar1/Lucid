import type { Holding } from "@/types";
import { capGainsTaxOnSale } from "./tax";
import {
  calculatePortfolioRiskRaw,
  calculateRiskFitScore,
  riskAssetTypeForHolding,
  riskStatusForScore,
  totalValue,
} from "./calculations";

/**
 * Rebalance the portfolio toward a target allocation by asset type.
 * Returns the proposed new holdings (same identity, adjusted shares) and the
 * estimated cost receipt.
 *
 * INVARIANT: sum of `proposed[i].value` must equal `totalValue(holdings)`
 * within a $1 rounding tolerance. We enforce this with a final correction.
 */
export interface RebalanceTargets {
  stockAndEquity: number; // 0..1 — total share for stocks + ETFs + mutual funds
  bonds: number; // 0..1
  cash: number; // 0..1
}

export interface RebalanceResult {
  before: Holding[];
  after: Holding[];
  taxes: number;
  fees: number; // one-time transaction fees (free for most brokers; we estimate $0)
  delta: { ticker: string; deltaDollars: number }[];
}

export interface RiskRebalanceResult {
  before: Holding[];
  after: Holding[];
  beforeRiskRaw: number;
  afterRiskRaw: number;
  beforeRiskFitScore: number;
  afterRiskFitScore: number;
  targetRisk: number;
  amountMovedOutOfRisky: number;
  amountMovedIntoSafer: number;
  changed: boolean;
  alreadyClose: boolean;
  delta: { ticker: string; deltaDollars: number }[];
}

export function rebalanceToTargets(
  holdings: Holding[],
  targets: RebalanceTargets,
): RebalanceResult {
  const tv = totalValue(holdings);
  if (tv <= 0) return { before: holdings, after: holdings, taxes: 0, fees: 0, delta: [] };

  const sumTargets = targets.stockAndEquity + targets.bonds + targets.cash;
  if (sumTargets <= 0) return { before: holdings, after: holdings, taxes: 0, fees: 0, delta: [] };

  // Normalize to 1.0
  const norm = {
    stockAndEquity: targets.stockAndEquity / sumTargets,
    bonds: targets.bonds / sumTargets,
    cash: targets.cash / sumTargets,
  };

  const targetByType = {
    equity: tv * norm.stockAndEquity,
    bonds: tv * norm.bonds,
    cash: tv * norm.cash,
  };

  // Bucket existing positions
  const equity = holdings.filter((h) => h.type === "stock" || h.type === "etf" || h.type === "mutual_fund");
  const bonds = holdings.filter((h) => h.type === "bond");
  const cash = holdings.filter((h) => h.type === "cash");

  const equityTotal = equity.reduce((s, h) => s + h.value, 0);
  const bondsTotal = bonds.reduce((s, h) => s + h.value, 0);
  const cashTotal = cash.reduce((s, h) => s + h.value, 0);

  const scaledHoldings: Holding[] = [];
  scaleBucket(equity, equityTotal, targetByType.equity, scaledHoldings);
  scaleBucket(bonds, bondsTotal, targetByType.bonds, scaledHoldings);
  scaleBucket(cash, cashTotal, targetByType.cash, scaledHoldings);

  // Final rounding correction so sum equals tv exactly.
  const sum = scaledHoldings.reduce((s, h) => s + h.value, 0);
  const drift = tv - sum;
  if (scaledHoldings.length > 0 && Math.abs(drift) > 0) {
    const last = scaledHoldings[scaledHoldings.length - 1]!;
    const correctedValue = last.value + drift;
    const correctedShares = last.price > 0 ? correctedValue / last.price : last.shares;
    scaledHoldings[scaledHoldings.length - 1] = {
      ...last,
      shares: correctedShares,
      value: correctedValue,
    };
  }

  // Cost receipt: tax on net sales per ticker.
  const before = new Map(holdings.map((h) => [h.ticker, h]));
  let taxes = 0;
  const delta: { ticker: string; deltaDollars: number }[] = [];
  for (const after of scaledHoldings) {
    const prev = before.get(after.ticker);
    if (!prev) continue;
    const diff = after.value - prev.value;
    delta.push({ ticker: after.ticker, deltaDollars: Math.round(diff) });
    if (diff < 0) {
      taxes += capGainsTaxOnSale(prev, -diff);
    }
  }

  return { before: holdings, after: scaledHoldings, taxes, fees: 0, delta };
}

export function rebalanceForRisk(holdings: Holding[], targetRisk: number): RiskRebalanceResult {
  const tv = Math.round(totalValue(holdings));
  const beforeRiskRaw = calculatePortfolioRiskRaw(holdings);
  const beforeRiskFitScore = calculateRiskFitScore(beforeRiskRaw, targetRisk);

  if (tv <= 0 || beforeRiskRaw <= targetRisk + 5) {
    return buildRiskRebalanceResult(holdings, holdings, targetRisk, beforeRiskRaw, beforeRiskFitScore, true);
  }

  const targetValues = targetRiskyAllocation(tv);
  const buckets = {
    broad_market_fund: holdings.filter((h) => riskAssetTypeForHolding(h) === "broad_market_fund"),
    international_fund: holdings.filter((h) => riskAssetTypeForHolding(h) === "international_fund"),
    bond_fund: holdings.filter((h) => riskAssetTypeForHolding(h) === "bond_fund"),
    cash: holdings.filter((h) => riskAssetTypeForHolding(h) === "cash"),
    risky: holdings.filter((h) => {
      const assetType = riskAssetTypeForHolding(h);
      return assetType === "individual_stock" || assetType === "speculative_stock";
    }),
  };

  const after = [
    ...rebucket(buckets.broad_market_fund, targetValues.broad_market_fund, defaultHolding("VTI")),
    ...rebucket(buckets.bond_fund, targetValues.bond_fund, defaultHolding("BND")),
    ...rebucket(buckets.international_fund, targetValues.international_fund, defaultHolding("VXUS")),
    ...rebucket(buckets.cash, targetValues.cash, defaultHolding("CASH")),
    ...rebucket(buckets.risky, targetValues.risky, defaultHolding("AAPL")),
  ].filter((holding) => holding.value > 0);

  correctRounding(after, tv);

  return buildRiskRebalanceResult(holdings, after, targetRisk, beforeRiskRaw, beforeRiskFitScore, false);
}

function scaleBucket(
  bucket: Holding[],
  bucketTotal: number,
  target: number,
  out: Holding[],
): void {
  if (bucket.length === 0) return;
  if (bucketTotal <= 0) {
    // Nothing to scale; preserve existing zero-value holdings unchanged.
    for (const h of bucket) out.push(h);
    return;
  }
  const scale = target / bucketTotal;
  for (const h of bucket) {
    const value = h.value * scale;
    const shares = h.price > 0 ? value / h.price : h.shares;
    out.push({ ...h, shares, value });
  }
}

function targetRiskyAllocation(total: number) {
  const target = {
    broad_market_fund: Math.round(total * 0.55),
    bond_fund: Math.round(total * 0.25),
    international_fund: Math.round(total * 0.1),
    cash: Math.round(total * 0.05),
    risky: Math.round(total * 0.05),
  };
  const drift = total - Object.values(target).reduce((sum, value) => sum + value, 0);
  target.broad_market_fund += drift;
  return target;
}

function rebucket(bucket: Holding[], targetValue: number, fallback: Holding): Holding[] {
  if (targetValue <= 0) return [];
  const source = bucket.length > 0 ? bucket : [fallback];
  const bucketTotal = source.reduce((sum, holding) => sum + holding.value, 0);
  if (bucketTotal <= 0) {
    return [{ ...fallback, shares: sharesForValue(fallback, targetValue), value: targetValue }];
  }

  let remaining = targetValue;
  return source.map((holding, index) => {
    const value = index === source.length - 1
      ? remaining
      : Math.round(targetValue * (holding.value / bucketTotal));
    remaining -= value;
    return {
      ...holding,
      value,
      shares: sharesForValue(holding, value),
    };
  });
}

function sharesForValue(holding: Holding, value: number) {
  if (holding.ticker === "CASH") return value;
  return holding.price > 0 ? value / holding.price : holding.shares;
}

function correctRounding(holdings: Holding[], targetTotal: number) {
  const sum = holdings.reduce((total, holding) => total + holding.value, 0);
  const drift = targetTotal - sum;
  if (drift === 0 || holdings.length === 0) return;
  const correctionIndex = Math.max(0, holdings.findIndex((holding) => riskAssetTypeForHolding(holding) === "broad_market_fund"));
  const current = holdings[correctionIndex]!;
  const value = current.value + drift;
  holdings[correctionIndex] = { ...current, value, shares: sharesForValue(current, value) };
}

function buildRiskRebalanceResult(
  before: Holding[],
  after: Holding[],
  targetRisk: number,
  beforeRiskRaw: number,
  beforeRiskFitScore: number,
  alreadyClose: boolean,
): RiskRebalanceResult {
  const afterRiskRaw = calculatePortfolioRiskRaw(after);
  const afterRiskFitScore = calculateRiskFitScore(afterRiskRaw, targetRisk);
  const afterByTicker = new Map(after.map((holding) => [holding.ticker, holding]));
  const beforeByTicker = new Map(before.map((holding) => [holding.ticker, holding]));
  const tickers = new Set([...beforeByTicker.keys(), ...afterByTicker.keys()]);
  const delta = Array.from(tickers).map((ticker) => ({
    ticker,
    deltaDollars: Math.round((afterByTicker.get(ticker)?.value ?? 0) - (beforeByTicker.get(ticker)?.value ?? 0)),
  }));

  const amountMovedOutOfRisky = before.reduce((sum, holding) => {
    const assetType = riskAssetTypeForHolding(holding);
    if (assetType !== "individual_stock" && assetType !== "speculative_stock") return sum;
    return sum + Math.max(0, holding.value - (afterByTicker.get(holding.ticker)?.value ?? 0));
  }, 0);

  const amountMovedIntoSafer = after.reduce((sum, holding) => {
    const assetType = riskAssetTypeForHolding(holding);
    if (assetType === "individual_stock" || assetType === "speculative_stock") return sum;
    return sum + Math.max(0, holding.value - (beforeByTicker.get(holding.ticker)?.value ?? 0));
  }, 0);

  return {
    before,
    after,
    beforeRiskRaw,
    afterRiskRaw,
    beforeRiskFitScore,
    afterRiskFitScore,
    targetRisk,
    amountMovedOutOfRisky: Math.round(amountMovedOutOfRisky),
    amountMovedIntoSafer: Math.round(amountMovedIntoSafer),
    changed: !alreadyClose && riskStatusForScore(afterRiskFitScore) !== riskStatusForScore(beforeRiskFitScore),
    alreadyClose,
    delta,
  };
}

function defaultHolding(ticker: "VTI" | "BND" | "VXUS" | "CASH" | "AAPL"): Holding {
  const defaults: Record<typeof ticker, Holding> = {
    VTI: {
      ticker: "VTI",
      name: "Vanguard Total Stock Market ETF",
      type: "etf",
      assetType: "broad_market_fund",
      riskScore: 55,
      shares: 0,
      price: 250,
      value: 0,
    },
    BND: {
      ticker: "BND",
      name: "Vanguard Total Bond Market ETF",
      type: "bond",
      assetType: "bond_fund",
      riskScore: 20,
      shares: 0,
      price: 70,
      value: 0,
    },
    VXUS: {
      ticker: "VXUS",
      name: "Vanguard Total International Stock ETF",
      type: "etf",
      assetType: "international_fund",
      riskScore: 65,
      shares: 0,
      price: 60,
      value: 0,
    },
    CASH: {
      ticker: "CASH",
      name: "Cash & Sweep",
      type: "cash",
      assetType: "cash",
      riskScore: 5,
      shares: 0,
      price: 1,
      value: 0,
    },
    AAPL: {
      ticker: "AAPL",
      name: "Apple Inc.",
      type: "stock",
      assetType: "individual_stock",
      riskScore: 75,
      shares: 0,
      price: 200,
      value: 0,
    },
  };
  return defaults[ticker];
}
