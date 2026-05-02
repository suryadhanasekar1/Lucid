import type { Holding } from "@/types";
import type { AtlasPortfolioSummary } from "@/types/atlas";

export function summarizeForAtlas(
  holdings: Holding[],
  totalValue: number,
  source: AtlasPortfolioSummary["source"],
): AtlasPortfolioSummary {
  const safeTotal = totalValue > 0 ? totalValue : holdings.reduce((s, h) => s + (h.value ?? 0), 0);
  const sorted = [...holdings].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const topHoldings = sorted.slice(0, 8).map((h) => ({
    ticker: h.ticker,
    name: h.name,
    type: h.type,
    value: Math.round(h.value ?? 0),
    weight: safeTotal > 0 ? Number(((h.value ?? 0) / safeTotal).toFixed(4)) : 0,
  }));

  const assetMix: Record<string, number> = {};
  for (const h of holdings) {
    const w = safeTotal > 0 ? (h.value ?? 0) / safeTotal : 0;
    assetMix[h.type] = (assetMix[h.type] ?? 0) + w;
  }
  for (const k of Object.keys(assetMix)) {
    assetMix[k] = Number(assetMix[k]!.toFixed(4));
  }

  return {
    source,
    totalValue: Math.round(safeTotal),
    holdingsCount: holdings.length,
    topHoldings,
    assetMix,
  };
}

export function renderPortfolioContext(p?: AtlasPortfolioSummary): string {
  if (!p || p.source === "none" || p.holdingsCount === 0) {
    return "User has not connected a portfolio yet. If they ask about specifics, suggest connecting a brokerage on /connect.";
  }
  const dollar = (n: number) => `$${n.toLocaleString("en-US")}`;
  const mix = Object.entries(p.assetMix)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}=${(v * 100).toFixed(0)}%`)
    .join(", ");
  const top = p.topHoldings
    .map((h) => `  - ${h.ticker} (${h.name}) ${(h.weight * 100).toFixed(1)}% • ${dollar(h.value)} • ${h.type}`)
    .join("\n");
  return [
    `User portfolio context (source: ${p.source}):`,
    `- Total value: ${dollar(p.totalValue)}`,
    `- Holdings count: ${p.holdingsCount}`,
    `- Asset mix: ${mix || "n/a"}`,
    `- Top holdings (by value):`,
    top || "  (none)",
    "Use these numbers when relevant. If the user asks about something not present here, say so plainly.",
  ].join("\n");
}
