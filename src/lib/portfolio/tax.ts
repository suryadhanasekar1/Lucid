import type { Holding } from "@/types";

/**
 * Hackathon tax estimator. We assume:
 *   - long-term cap gains rate of 15% on positions with cost basis < value
 *   - short-term not modeled (we don't track holding period)
 *   - basis defaults to 100% of value when missing (i.e. zero gain → zero tax)
 *
 * Returns an estimate of the cap-gains tax owed if the user sold the given
 * dollar amount of `holding`, proportionally to its existing cost basis.
 */
export function capGainsTaxOnSale(holding: Holding, dollarsSold: number): number {
  if (dollarsSold <= 0) return 0;
  const basisPerDollar =
    holding.costBasis !== undefined && holding.value > 0
      ? holding.costBasis / holding.value
      : 1;
  const gainPerDollar = Math.max(0, 1 - basisPerDollar);
  const gain = dollarsSold * gainPerDollar;
  return gain * 0.15;
}

/** Estimated annual fee drag for a fund position based on a static ER table. */
export function annualFeeDrag(holding: Holding): number {
  const erTable: Record<string, number> = {
    VTSAX: 0.0004,
    VTIAX: 0.0011,
    VBTLX: 0.0005,
    VTI: 0.0003,
    VOO: 0.0003,
    VXUS: 0.0007,
    QQQ: 0.002,
    BND: 0.0003,
    AGG: 0.0003,
    SCHB: 0.0003,
    FZROX: 0,
    FZILX: 0,
  };
  if (holding.type === "stock" || holding.type === "cash") return 0;
  const er = erTable[holding.ticker] ?? 0.005;
  return holding.value * er;
}
