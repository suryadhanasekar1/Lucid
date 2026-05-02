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

export function findTaxLossOpportunities(holdings: Holding[]): {
  symbol: string;
  currentValue: number;
  costBasis: number;
  unrealizedLoss: number;
  harvestableAmount: number;
  suggestedReplacement: string;
  washSaleWarning: boolean;
}[] {
  return holdings
    .map((holding) => {
      const currentValue = holding.value;
      const costBasis = holding.costBasis ?? currentValue;
      const unrealizedLoss = Math.max(0, costBasis - currentValue);
      return {
        symbol: holding.ticker,
        currentValue,
        costBasis,
        unrealizedLoss,
        harvestableAmount: unrealizedLoss,
        suggestedReplacement: replacementFor(holding.ticker),
        washSaleWarning: isRecentPurchase(holding.purchaseDate),
      };
    })
    .filter((item) => item.unrealizedLoss > 0)
    .sort((a, b) => b.unrealizedLoss - a.unrealizedLoss);
}

function isRecentPurchase(purchaseDate?: string) {
  if (!purchaseDate) return false;
  const purchased = Date.parse(purchaseDate);
  if (!Number.isFinite(purchased)) return false;
  return Date.now() - purchased < 1000 * 60 * 60 * 24 * 30;
}

function replacementFor(symbol: string) {
  const replacements: Record<string, string> = {
    VTI: "SCHB",
    VOO: "IVV",
    VTSAX: "SWTSX",
    VXUS: "IXUS",
    BND: "AGG",
    QQQ: "VGT",
  };
  return replacements[symbol.toUpperCase()] ?? "similar diversified ETF";
}
