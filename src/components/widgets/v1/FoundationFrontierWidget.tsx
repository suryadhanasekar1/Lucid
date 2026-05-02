"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { EmptyState } from "@/components/shared/v1/EmptyState";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { foundationFrontier } from "@/lib/portfolio/calculations";
import { formatUSD, formatPct } from "@/lib/utils";

export function FoundationFrontierWidget() {
  const { holdings, totalValue } = usePortfolio();
  const def = WIDGETS_BY_ID["foundation_frontier"]!;
  const { foundationValue, frontierValue } = foundationFrontier(holdings);
  const fShare = totalValue > 0 ? foundationValue / totalValue : 0;
  const xShare = totalValue > 0 ? frontierValue / totalValue : 0;

  if (holdings.length === 0) {
    return (
      <WidgetCard title={def.title} rationale={def.rationale} badge="Allocation">
        <EmptyState
          title="Nothing to split yet"
          body="Once you connect a portfolio, we'll separate boring core funds from speculative bets."
          cta={{ href: "/connect", label: "Connect a brokerage" }}
        />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Allocation">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div
          style={{
            display: "flex",
            height: 12,
            borderRadius: 999,
            overflow: "hidden",
            background: "var(--bg-elevated-2)",
          }}
        >
          <div
            style={{
              width: `${fShare * 100}%`,
              background: "var(--gold-primary)",
              transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
          <div
            style={{
              width: `${xShare * 100}%`,
              background: "var(--gold-muted)",
              transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <li style={legendRow}>
            <span style={{ ...dot, background: "var(--gold-primary)" }} />
            <span style={legendLabel}>Foundation · funds, ETFs, bonds</span>
            <span style={legendValue}>{formatUSD(foundationValue)} · {formatPct(fShare, 0)}</span>
          </li>
          <li style={legendRow}>
            <span style={{ ...dot, background: "var(--gold-muted)" }} />
            <span style={legendLabel}>Frontier · single stocks</span>
            <span style={legendValue}>{formatUSD(frontierValue)} · {formatPct(xShare, 0)}</span>
          </li>
        </ul>
      </div>
    </WidgetCard>
  );
}

const legendRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "12px 1fr auto",
  alignItems: "center",
  gap: "var(--space-3)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
};

const dot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
};

const legendLabel: React.CSSProperties = {
  color: "var(--text-secondary)",
};

const legendValue: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
  color: "var(--text-primary)",
};
