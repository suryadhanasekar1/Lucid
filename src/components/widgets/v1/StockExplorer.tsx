"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search, TrendingUp } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useStockExplorer } from "@/hooks/useStockExplorer";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";

const PERIODS = [
  ["1mo", "1M"],
  ["3mo", "3M"],
  ["6mo", "6M"],
  ["1y", "1Y"],
  ["5y", "5Y"],
] as const;

export function StockExplorer() {
  const explorer = useStockExplorer();
  const { holdings, totalValue } = usePortfolio();
  const [draft, setDraft] = useState("");
  const [exploreOpen, setExploreOpen] = useState(false);
  const ownedTradable = useMemo(
    () => holdings.filter((h) => h.type === "stock" || h.type === "etf" || h.type === "mutual_fund"),
    [holdings],
  );

  useEffect(() => {
    if (explorer.selected || ownedTradable.length === 0) return;
    void explorer.select(ownedTradable[0]!.ticker);
    // Run once when holdings arrive; the selected object is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedTradable]);

  const fit = useMemo(() => {
    const selected = explorer.selected;
    if (!selected || totalValue <= 0) return null;

    const assumedBuy = Math.min(1000, Math.max(100, totalValue * 0.05));
    const newTotal = totalValue + assumedBuy;
    const stockValue = holdings
      .filter((h) => h.type === "stock")
      .reduce((sum, h) => sum + h.value, 0);
    const singleStockBefore = stockValue / totalValue;
    const singleStockAfter = (stockValue + assumedBuy) / newTotal;
    const positionWeight = assumedBuy / newTotal;
    const sectorHint =
      selected.sector === "Technology"
        ? "Technology would become a bigger part of your portfolio."
        : selected.sector
          ? `${selected.sector} exposure would increase.`
          : "Sector exposure would increase if this belongs to an area you already own.";
    const riskHint =
      (selected.beta ?? 1) > 1.2
        ? "This tends to move more sharply than the broad market."
        : (selected.beta ?? 1) < 0.8
          ? "This has historically moved less sharply than the broad market."
          : "This has historically moved roughly with the broad market.";

    return {
      assumedBuy,
      positionWeight,
      singleStockBefore,
      singleStockAfter,
      sectorHint,
      riskHint,
    };
  }, [explorer.selected, holdings, totalValue]);

  const handleSearch = async (value: string) => {
    setDraft(value);
    await explorer.search(value);
  };

  return (
    <WidgetCard
      title="Stock Explorer"
      rationale="Search a stock, see the recent price path, and preview how it could change your portfolio before buying."
    >
      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          <p style={sectionLabel}>Stocks and funds you own</p>
          <div style={ownedList}>
            {ownedTradable.slice(0, 6).map((holding) => (
              <button
                key={holding.ticker}
                type="button"
                onClick={() => {
                  setDraft(holding.ticker);
                  void explorer.select(holding.ticker);
                }}
                style={{
                  ...ownedButton,
                  borderColor:
                    explorer.selected?.symbol === holding.ticker
                      ? "var(--gold-primary)"
                      : "var(--border-subtle)",
                }}
              >
                <span style={symbolText}>{holding.ticker}</span>
                <span style={ownedMeta}>
                  {formatCurrency(holding.value)} · {formatWeight(totalValue > 0 ? holding.value / totalValue : 0)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExploreOpen((open) => !open)}
          style={exploreToggle}
        >
          {exploreOpen ? "Hide stock search" : "Explore more stocks"}
        </button>

        {exploreOpen && (
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            <p style={sectionLabel}>Browse stocks you do not own yet</p>
            <div style={searchShell}>
              <Search size={16} color="var(--text-tertiary)" />
              <input
                value={draft}
                onChange={(e) => void handleSearch(e.target.value)}
                placeholder="Search ticker or company"
                aria-label="Search ticker or company"
                style={searchInput}
              />
            </div>
          </div>
        )}

        {exploreOpen && explorer.results.length > 0 && (
          <div style={resultsList}>
            {explorer.results.map((result) => (
              <button
                key={result.symbol}
                type="button"
                onClick={() => {
                  setDraft(result.symbol);
                  void explorer.select(result.symbol);
                }}
                style={resultButton}
              >
                <span style={symbolText}>{result.symbol}</span>
                <span style={resultName}>{result.name}</span>
              </button>
            ))}
          </div>
        )}

        <div style={periodRow} aria-label="Price chart period">
          {PERIODS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => explorer.setPeriod(value)}
              style={{
                ...periodButton,
                color: explorer.period === value ? "var(--bg-base)" : "var(--text-secondary)",
                background: explorer.period === value ? "var(--gold-primary)" : "transparent",
                borderColor: explorer.period === value ? "var(--gold-primary)" : "var(--border-default)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={chartShell}>
          {explorer.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={explorer.chartData} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="stockExplorerGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--gold-primary)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--gold-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={["dataMin", "dataMax"]} hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated-2)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                  }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, "Close"]}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="var(--gold-primary)"
                  strokeWidth={2}
                  fill="url(#stockExplorerGold)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={chartEmpty}>
              <TrendingUp size={24} color="var(--gold-primary)" />
              <span>
                {explorer.loading
                  ? "Loading market data..."
                  : explorer.selected
                    ? "Yahoo did not return price history for this symbol."
                    : "Search and select a stock to see its chart."}
              </span>
            </div>
          )}
        </div>

        {explorer.selected && (
          <>
            <div style={summaryCard}>
              <div>
                <p style={companyName}>{explorer.selected.name}</p>
                <p style={companyMeta}>
                  {explorer.selected.symbol}
                  {explorer.selected.sector ? ` · ${explorer.selected.sector}` : ""}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={priceText}>{formatCurrency(explorer.selected.price)}</p>
                {explorer.selected.changePct !== null ? (
                  <p
                    style={{
                      ...changeText,
                      color:
                        explorer.selected.changePct >= 0
                          ? "var(--signal-positive)"
                          : "var(--signal-negative)",
                    }}
                  >
                    {formatPct(explorer.selected.changePct / 100)}
                  </p>
                ) : (
                  <p style={{ ...changeText, color: "var(--text-tertiary)" }}>price unavailable</p>
                )}
              </div>
            </div>

            <div style={statGrid}>
              <Stat label="P/E" value={formatNumber(explorer.selected.peRatio)} />
              <Stat label="Beta" value={formatNumber(explorer.selected.beta)} />
              <Stat label="Market cap" value={formatMarketCap(explorer.selected.marketCap)} />
            </div>

            {fit && (
              <div style={fitCard}>
                <p style={fitTitle}>How this could fit</p>
                <div style={fitRows}>
                  <FitRow
                    label="New position size"
                    value={formatPct(fit.positionWeight)}
                    note={`Assumes a ${formatCurrency(fit.assumedBuy)} starter buy.`}
                  />
                  <FitRow
                    label="Single-stock share"
                    value={`${formatPct(fit.singleStockBefore)} -> ${formatPct(fit.singleStockAfter)}`}
                    note={fit.sectorHint}
                  />
                  <FitRow label="Risk feel" value={formatNumber(explorer.selected.beta)} note={fit.riskHint} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </WidgetCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={statCard}>
      <span style={statLabel}>{label}</span>
      <span style={statValue}>{value}</span>
    </div>
  );
}

function FitRow({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={fitRow}>
      <div>
        <p style={fitLabel}>{label}</p>
        <p style={fitNote}>{note}</p>
      </div>
      <span style={fitValue}>{value}</span>
    </div>
  );
}

function formatCurrency(value: number | null) {
  if (typeof value !== "number") return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
}

function formatWeight(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number | null) {
  if (typeof value !== "number") return "--";
  return value.toFixed(value >= 10 ? 0 : 2);
}

function formatMarketCap(value: number | null) {
  if (typeof value !== "number") return "--";
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return formatCurrency(value);
}

const searchShell: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  padding: "var(--space-3)",
  border: "1px solid var(--border-default)",
  borderRadius: 10,
  background: "var(--bg-inset)",
};

const sectionLabel: React.CSSProperties = {
  margin: 0,
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const ownedList: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
  gap: "var(--space-2)",
};

const ownedButton: React.CSSProperties = {
  display: "grid",
  gap: 2,
  padding: "var(--space-3)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 10,
  background: "var(--bg-inset)",
  textAlign: "left",
  cursor: "pointer",
};

const ownedMeta: React.CSSProperties = {
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 11,
};

const exploreToggle: React.CSSProperties = {
  justifySelf: "start",
  border: "1px solid var(--border-default)",
  borderRadius: 999,
  background: "transparent",
  color: "var(--gold-primary)",
  padding: "7px 12px",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  cursor: "pointer",
};

const searchInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

const resultsList: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-2)",
  padding: "var(--space-2)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 10,
  background: "var(--bg-inset)",
};

const resultButton: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "64px 1fr",
  gap: "var(--space-3)",
  alignItems: "center",
  padding: "var(--space-2)",
  border: "none",
  borderRadius: 8,
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
};

const symbolText: React.CSSProperties = {
  color: "var(--gold-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
};

const resultName: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const periodRow: React.CSSProperties = {
  display: "flex",
  gap: "var(--space-2)",
};

const periodButton: React.CSSProperties = {
  minWidth: 42,
  height: 28,
  border: "1px solid var(--border-default)",
  borderRadius: 999,
  fontFamily: "var(--font-body)",
  fontSize: 12,
  cursor: "pointer",
};

const chartShell: React.CSSProperties = {
  height: 190,
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  background: "var(--bg-inset)",
  overflow: "hidden",
};

const chartEmpty: React.CSSProperties = {
  height: "100%",
  display: "grid",
  placeItems: "center",
  gap: "var(--space-2)",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  textAlign: "center",
  padding: "var(--space-4)",
};

const summaryCard: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--space-4)",
  padding: "var(--space-4)",
  border: "1px solid var(--border-default)",
  borderRadius: 12,
  background: "var(--bg-elevated-2)",
};

const companyName: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  fontWeight: 500,
};

const companyMeta: React.CSSProperties = {
  margin: "var(--space-1) 0 0",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
};

const priceText: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontFamily: "var(--font-display)",
  fontSize: 30,
  fontWeight: 300,
  lineHeight: 1,
};

const changeText: React.CSSProperties = {
  margin: "var(--space-1) 0 0",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "var(--space-2)",
};

const statCard: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-1)",
  padding: "var(--space-3)",
  borderRadius: 10,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-inset)",
};

const statLabel: React.CSSProperties = {
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const statValue: React.CSSProperties = {
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 14,
};

const fitCard: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-3)",
  padding: "var(--space-4)",
  borderRadius: 12,
  border: "1px solid var(--border-emphasis)",
  background: "var(--gold-glow)",
};

const fitTitle: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  fontWeight: 500,
};

const fitRows: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-3)",
};

const fitRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--space-4)",
};

const fitLabel: React.CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
};

const fitNote: React.CSSProperties = {
  margin: "var(--space-1) 0 0",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  lineHeight: 1.35,
};

const fitValue: React.CSSProperties = {
  flex: "0 0 auto",
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
};
