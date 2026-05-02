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

  // Asset-type mix (totals per type, sorted by weight desc)
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
            ? `${largest?.name ?? "Your largest holding"} is doing a lot of the work, so that one position deserves attention.`
            : "No single position is carrying the whole portfolio.",
        ];

  return (
    <WidgetCard
      title="What You Own in 3 Sentences"
      rationale="A plain-English summary of your portfolio."
      hideHeader
    >
      <div style={shell}>
        <div style={accentBar} aria-hidden />
        <div style={contentCol}>
          <div style={copyStack}>
            <div style={eyebrowRow}>
              <span style={eyebrow}>What you own</span>
              {totalValue > 0 && (
                <span style={totalText}>{formatUSD(Math.round(totalValue))}</span>
              )}
            </div>
            {sentences.map((sentence, index) => (
              <p key={sentence} style={index === 0 ? leadSentence : sentenceStyle}>
                {sentence}
              </p>
            ))}
          </div>

          {holdings.length > 0 && (
            <>
              <Divider />
              <Section label="Top holdings">
                <div style={topList}>
                  {top.map((h) => {
                    const pct = totalValue > 0 ? h.value / totalValue : 0;
                    return (
                      <div key={h.ticker} style={topRow}>
                        <div style={topLabelCol}>
                          <span style={topTicker}>{h.ticker}</span>
                          <span style={topName}>{h.name}</span>
                        </div>
                        <div style={topBarShell}>
                          <div style={{ ...topBarFill, width: `${Math.min(100, pct * 100)}%` }} />
                        </div>
                        <span style={topPct}>{formatPct(pct)}</span>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {mix.length > 1 && (
                <>
                  <Divider />
                  <Section label="Asset mix">
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
                          {TYPE_LABEL[m.type] ?? m.type} {formatPct(m.pct)}
                        </span>
                      ))}
                    </div>
                  </Section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-2)" }}>
      <span style={sectionLabel}>{label}</span>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={divider} aria-hidden />;
}

function formatPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

const shell: React.CSSProperties = {
  minHeight: "100%",
  display: "flex",
  alignItems: "stretch",
  gap: "var(--space-4)",
  padding: "var(--space-5)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  background: "linear-gradient(180deg, var(--bg-inset) 0%, var(--bg-elevated) 100%)",
  position: "relative",
  overflow: "hidden",
};

const accentBar: React.CSSProperties = {
  width: 3,
  borderRadius: 999,
  background: "linear-gradient(180deg, var(--gold-bright), var(--gold-primary), transparent)",
  flexShrink: 0,
};

const contentCol: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  width: "100%",
  minWidth: 0,
};

const copyStack: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-2)",
  width: "100%",
};

const eyebrowRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "var(--space-3)",
};

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: "var(--gold-primary)",
};

const totalText: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-secondary)",
  fontVariantNumeric: "tabular-nums",
};

const leadSentence: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontFamily: "var(--font-display)",
  fontSize: 22,
  fontWeight: 300,
  lineHeight: 1.25,
  marginTop: "var(--space-1)",
};

const sentenceStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  lineHeight: 1.5,
};

const divider: React.CSSProperties = {
  height: 1,
  background: "var(--border-subtle)",
};

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
};

const topList: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const topRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.4fr) minmax(60px, 1fr) auto",
  gap: "var(--space-3)",
  alignItems: "center",
  fontSize: 12,
};

const topLabelCol: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
};

const topTicker: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--gold-primary)",
  fontWeight: 600,
};

const topName: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "var(--text-tertiary)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const topBarShell: React.CSSProperties = {
  height: 6,
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

const topPct: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--text-secondary)",
  fontVariantNumeric: "tabular-nums",
  minWidth: 32,
  textAlign: "right",
};

const mixBar: React.CSSProperties = {
  display: "flex",
  height: 8,
  borderRadius: 999,
  overflow: "hidden",
  background: "rgba(245, 245, 240, 0.04)",
};

const mixLegend: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
};

const mixLegendItem: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "var(--text-secondary)",
};

const mixDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  display: "inline-block",
};
