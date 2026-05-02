import type { Holding } from "@/types";
import { capGainsTaxOnSale } from "./tax";
import { totalValue } from "./calculations";

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
