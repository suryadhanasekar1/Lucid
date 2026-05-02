"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { formatUSD } from "@/lib/utils";

const STOCK_TYPES = new Set(["stock", "etf", "mutual_fund"]);

const TYPE_LABEL: Record<string, string> = {
  mutual_fund: "Funds",
  etf: "ETFs",
  stock: "Stocks",
  bond: "Bonds",
  cash: "Cash",
};

const TYPE_COLOR: Record<string, string> = {
  mutual_fund: "var(--gold-primary)",
  etf: "var(--gold-bright)",
  stock: "var(--signal-info)",
  bond: "var(--signal-positive)",
  cash: "var(--text-tertiary)",
};

export function WhatYouOwnWidget() {
  const { holdings, totalValue } = usePortfolio();

  const fundCount = holdings.filter((h) => h.type === "etf" || h.type === "mutual_fund").length;
  const stockCount = holdings.filter((h) => h.type === "stock").length;
  const steadyValue = holdings
    .filter((h) => h.type === "bond" || h.type === "cash")
    .reduce((sum, h) => sum + h.value, 0);
  const growthValue = holdings
    .filter((h) => STOCK_TYPES.has(h.type))
    .reduce((sum, h) => sum + h.value, 0);
  const growthPct = totalValue > 0 ? growthValue / totalValue : 0;
  const steadyPct = totalValue > 0 ? steadyValue / totalValue : 0;
  const sorted = [...holdings].sort((a, b) => b.value - a.value);
  const largest = sorted[0];
  const largestPct = largest && totalValue > 0 ? largest.value / totalValue : 0;

  const mixMap = new Map<string, number>();
  for (const h of holdings) {
    mixMap.set(h.type, (mixMap.get(h.type) ?? 0) + h.value);
  }
  const mix = [...mixMap.entries()]
    .map(([type, value]) => ({
      type,
      value,
      pct: totalValue > 0 ? value / totalValue : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  const top = sorted.slice(0, 3);

  const sentences =
    holdings.length === 0
      ? ["Connect a portfolio or load the sample to see what you own in plain English."]
      : [
          `You own ${holdings.length} positions: ${fundCount} fund${fundCount === 1 ? "" : "s"}${
            stockCount > 0 ? ` and ${stockCount} individual stock${stockCount === 1 ? "" : "s"}` : ""
          }.`,
          `${formatPct(growthPct)} is in growth assets like stocks and funds, while ${formatPct(
            steadyPct,
          )} is in steadier bonds and cash.`,
          largestPct > 0.35
            ? `${largest?.name ?? "Your largest holding"} is doing a lot of the work.`
            : "No single position is carrying the whole portfolio.",
        ];

  return (
    <WidgetCard
      title="What You Own in 3 Sentences"
      rationale="A plain-English summary of your portfolio."
      hideHeader
    >
      <div style={shell}>
        {/* Header strip — eyebrow left, total right */}
        <div style={headerRow}>
          <span style={eyebrow}>What you own</span>
          {totalValue > 0 && (
            <span style={totalText}>{formatUSD(Math.round(totalValue))}</span>
          )}
        </div>

        {/* Prose summary — left-aligned, generous line-height */}
        <div style={copyStack}>
          {sentences.map((sentence, index) => (
            <p key={sentence} style={index === 0 ? leadSentence : sentenceStyle}>
              {sentence}
            </p>
          ))}
        </div>

        {holdings.length > 0 && (
          <>
            <div style={divider} aria-hidden />

            {/* Top holdings */}
            <div style={section}>
              <span style={sectionLabel}>Top holdings</span>
              <div style={topList}>
                {top.map((h) => {
                  const pct = totalValue > 0 ? h.value / totalValue : 0;
                  return (
                    <div key={h.ticker} style={topRow}>
                      <div style={topLabelCol}>
                        <span style={topTicker}>{h.ticker}</span>
                        <span style={topPct}>{formatPct(pct)}</span>
                      </div>
                      <div style={topBarShell}>
                        <div style={{ ...topBarFill, width: `${Math.min(100, pct * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {mix.length > 1 && (
              <>
                <div style={divider} aria-hidden />

                {/* Asset mix */}
                <div style={section}>
                  <span style={sectionLabel}>Asset mix</span>
                  <div style={mixBar} aria-label="Asset type breakdown">
                    {mix.map((m) => (
                      <div
                        key={m.type}
                        style={{
                          width: `${m.pct * 100}%`,
                          background: TYPE_COLOR[m.type] ?? "var(--text-tertiary)",
                        }}
                        title={`${TYPE_LABEL[m.type] ?? m.type} ${formatPct(m.pct)}`}
                      />
                    ))}
                  </div>
                  <div style={mixLegend}>
                    {mix.map((m) => (
                      <span key={m.type} style={mixLegendItem}>
                        <span
                          style={{
                            ...mixDot,
                            background: TYPE_COLOR[m.type] ?? "var(--text-tertiary)",
                          }}
                        />
                        {TYPE_LABEL[m.type] ?? m.type}
                        <span style={mixLegendPct}>{formatPct(m.pct)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </WidgetCard>
  );
}

function formatPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

const shell: React.CSSProperties = {
  minHeight: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  padding: "var(--space-5) var(--space-4)",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "var(--space-3)",
  paddingBottom: "var(--space-2)",
  borderBottom: "1px solid var(--border-subtle)",
};

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "var(--gold-primary)",
};

const totalText: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "var(--text-primary)",
  fontVariantNumeric: "tabular-nums",
  fontWeight: 500,
};

const copyStack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const leadSentence: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontFamily: "var(--font-display)",
  fontSize: 18,
  fontWeight: 300,
  lineHeight: 1.35,
};

const sentenceStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: 1.55,
};

const divider: React.CSSProperties = {
  height: 1,
  background: "var(--border-subtle)",
};

const section: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
};

const topList: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-2)",
};

const topRow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const topLabelCol: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "var(--space-2)",
};

const topTicker: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--gold-primary)",
  fontWeight: 600,
  letterSpacing: 0.3,
};

const topPct: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--text-secondary)",
  fontVariantNumeric: "tabular-nums",
};

const topBarShell: React.CSSProperties = {
  height: 4,
  borderRadius: 999,
  background: "rgba(245, 245, 240, 0.06)",
  overflow: "hidden",
};

const topBarFill: React.CSSProperties = {
  height: "100%",
  background: "linear-gradient(90deg, var(--gold-muted), var(--gold-primary))",
  borderRadius: 999,
  transition: "width 240ms ease",
};

const mixBar: React.CSSProperties = {
  display: "flex",
  height: 6,
  borderRadius: 999,
  overflow: "hidden",
  background: "rgba(245, 245, 240, 0.04)",
};

const mixLegend: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
  gap: "6px var(--space-3)",
  paddingTop: 2,
};

const mixLegendItem: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "var(--text-secondary)",
};

const mixLegendPct: React.CSSProperties = {
  marginLeft: "auto",
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--text-tertiary)",
  fontVariantNumeric: "tabular-nums",
};

const mixDot: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
  display: "inline-block",
  flexShrink: 0,
};
