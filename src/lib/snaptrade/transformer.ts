import type { AssetType, Holding } from "@/types";

/**
 * Loose shape of a SnapTrade position. We don't import the SDK type here so
 * the transformer can be unit-tested without bringing the SDK along, and so
 * future SDK changes don't ripple across the app.
 */
export interface SnapTradePosition {
  symbol?: {
    symbol?: { symbol?: string; description?: string; type?: { code?: string } };
    description?: string;
  };
  units?: number | null;
  price?: number | null;
  average_purchase_price?: number | null;
}

const TYPE_MAP: Record<string, AssetType> = {
  cs: "stock", // common stock
  et: "etf",
  mf: "mutual_fund",
  bnd: "bond",
  ad: "stock",
  cash: "cash",
};

function classify(code?: string, ticker?: string): AssetType {
  if (!ticker) return "cash";
  if (code && TYPE_MAP[code.toLowerCase()]) return TYPE_MAP[code.toLowerCase()]!;
  // Heuristic: 5-letter all-caps US ticker ending in X is usually a mutual fund.
  if (/^[A-Z]{4,5}X$/.test(ticker)) return "mutual_fund";
  return "stock";
}

export function transformPositions(positions: SnapTradePosition[]): Holding[] {
  const out: Holding[] = [];
  for (const p of positions) {
    const ticker = p.symbol?.symbol?.symbol?.toUpperCase();
    const name = p.symbol?.symbol?.description ?? p.symbol?.description ?? ticker ?? "—";
    const shares = Number(p.units ?? 0);
    const price = Number(p.price ?? 0);
    if (!ticker || shares === 0 || price === 0) continue;
    const type = classify(p.symbol?.symbol?.type?.code, ticker);
    out.push({
      ticker,
      name,
      type,
      shares,
      price,
      costBasis: p.average_purchase_price ? Number(p.average_purchase_price) * shares : undefined,
      value: shares * price,
    });
  }
  return out;
}
