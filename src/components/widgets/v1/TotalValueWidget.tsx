"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { usePortfolioSummary } from "@/hooks/usePortfolioSummary";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { CountUp } from "@/components/shared/v1/CountUp";
import { EmptyState } from "@/components/shared/v1/EmptyState";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatUSD } from "@/lib/utils";

export function TotalValueWidget() {
  const { totalValue, source, holdings, loading } = usePortfolio();
  const { positionCount, holdingsPreview, allocationSummary } = usePortfolioSummary();
  const def = WIDGETS_BY_ID["total_value"]!;
  const sourceLabel =
    source === "snaptrade" ? "Live · SnapTrade" : source === "sample" ? "Sample data" : "—";

  if (!loading && holdings.length === 0) {
    return (
      <WidgetCard title={def.title} rationale={def.rationale} badge="Headline">
        <EmptyState
          title="No holdings yet"
          body="Connect a brokerage with SnapTrade or load the sample portfolio to see your headline number."
          cta={{ href: "/connect", label: "Connect a brokerage" }}
        />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Headline">
      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: 56,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
            opacity: loading ? 0.6 : 1,
            transition: "opacity 200ms",
          }}
        >
          <CountUp value={totalValue} format={(n) => formatUSD(n, { decimals: 0 })} />
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--text-tertiary)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>You own {positionCount} {positionCount === 1 ? "position" : "positions"}</span>
          <span style={{ color: "var(--text-secondary)" }}>{sourceLabel}</span>
        </div>

        <div style={allocationShell} aria-label="Allocation summary">
          <div
            style={{
              display: "flex",
              height: 8,
              borderRadius: 999,
              overflow: "hidden",
              background: "var(--bg-inset)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ flex: allocationSummary.foundationValue, background: "var(--gold-primary)" }} />
            <span style={{ flex: allocationSummary.frontierValue, background: "var(--signal-info)" }} />
          </div>
          <div style={allocationLegend}>
            <span>Foundation {formatPercent(allocationSummary.foundationPercent)}</span>
            <span>Individual stocks {formatPercent(allocationSummary.frontierPercent)}</span>
          </div>
        </div>

        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          <p style={sectionLabel}>Current holdings</p>
          <ul style={holdingsList}>
            {holdingsPreview.map((holding) => (
              <li key={holding.ticker} style={holdingRow}>
                <div style={{ minWidth: 0 }}>
                  <span style={tickerText}>{holding.ticker}</span>
                  <span style={holdingName}>{holding.name}</span>
                </div>
                <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                  <span style={holdingValue}>{formatUSD(Math.round(holding.value))}</span>
                  <span style={holdingWeight}>{formatPercent(holding.weight)}</span>
                </div>
              </li>
            ))}
          </ul>
          {positionCount > holdingsPreview.length && (
            <p style={{ ...sectionLabel, textTransform: "none", letterSpacing: 0 }}>
              Showing top {holdingsPreview.length} of {positionCount} positions.
            </p>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

const allocationShell: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-2)",
  padding: "var(--space-3)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  background: "var(--bg-inset)",
};

const allocationLegend: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--space-3)",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
};

const sectionLabel: React.CSSProperties = {
  margin: 0,
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const holdingsList: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: "var(--space-2)",
};

const holdingRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--space-3)",
  alignItems: "center",
  padding: "var(--space-2) 0",
  borderTop: "1px solid var(--border-subtle)",
};

const tickerText: React.CSSProperties = {
  display: "block",
  color: "var(--gold-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
};

const holdingName: React.CSSProperties = {
  display: "block",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const holdingValue: React.CSSProperties = {
  display: "block",
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
};

const holdingWeight: React.CSSProperties = {
  display: "block",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 11,
};
