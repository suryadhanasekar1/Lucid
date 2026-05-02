"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { CountUp } from "@/components/shared/v1/CountUp";
import { EmptyState } from "@/components/shared/v1/EmptyState";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatUSD } from "@/lib/utils";

export function TotalValueWidget() {
  const { totalValue, source, holdings, loading } = usePortfolio();
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
      <div>
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
            marginTop: "var(--space-3)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{holdings.length} holdings</span>
          <span style={{ color: "var(--text-secondary)" }}>{sourceLabel}</span>
        </div>
      </div>
    </WidgetCard>
  );
}
