"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { ExplainTooltip } from "@/components/shared/v1/ExplainTooltip";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatPct } from "@/lib/utils";

/**
 * Compare to Boring Index — surfaced for users with `experience=comfortable`.
 *
 * Computes the user's stock vs bond/cash split today and benchmarks it against
 * a vanilla 60/40 allocation. The intent is grounding, not motion: showing the
 * delta visually so a tilted portfolio is obvious without numerical analysis.
 */
const STOCK_TYPES = new Set(["stock", "etf", "mutual_fund"]);

export function CompareToIndexWidget() {
  const { holdings, totalValue } = usePortfolio();
  const def = WIDGETS_BY_ID["compare_to_index"]!;

  const split = useMemo(() => {
    if (totalValue <= 0) return { stockPct: 0, bondPct: 0, otherPct: 0 };
    let stock = 0;
    let bond = 0;
    let other = 0;
    for (const h of holdings) {
      if (STOCK_TYPES.has(h.type)) stock += h.value;
      else if (h.type === "bond") bond += h.value;
      else other += h.value;
    }
    return {
      stockPct: stock / totalValue,
      bondPct: bond / totalValue,
      otherPct: other / totalValue,
    };
  }, [holdings, totalValue]);

  const benchmark = { stockPct: 0.6, bondPct: 0.4, otherPct: 0 };
  const stockDelta = split.stockPct - benchmark.stockPct;

  if (totalValue <= 0) {
    return (
      <WidgetCard title={def.title} rationale={def.rationale} badge="60/40 baseline">
        <p style={muted}>Connect a portfolio (or load the sample) to compare against the boring index.</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="60/40 baseline">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Row label="You" pct={split} accent />
          <Row label="60/40 baseline" pct={benchmark} />
        </div>

        <p style={{ ...muted, fontSize: 13, color: "var(--text-secondary)" }}>
          You&apos;re running{" "}
          <span style={{ color: "var(--gold-primary)", fontFamily: "var(--font-mono)" }}>
            {stockDelta >= 0 ? "+" : ""}{formatPct(stockDelta, 1)}
          </span>{" "}
          {stockDelta >= 0 ? "more" : "less"} stock than the 60/40 boring baseline. {tilt(stockDelta)}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <ExplainTooltip topic="compare_to_index" label="Why 60/40?" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
            stock {formatPct(split.stockPct, 1)} · bond {formatPct(split.bondPct, 1)}
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}

function Row({
  label,
  pct,
  accent,
}: {
  label: string;
  pct: { stockPct: number; bondPct: number; otherPct: number };
  accent?: boolean;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ ...muted, fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
      </div>
      <div
        style={{
          display: "flex",
          height: 18,
          borderRadius: 8,
          overflow: "hidden",
          border: `1px solid ${accent ? "var(--gold-primary)" : "var(--border-subtle)"}`,
        }}
      >
        <Segment width={pct.stockPct} color={accent ? "var(--gold-primary)" : "var(--text-secondary)"} />
        <Segment width={pct.bondPct} color={accent ? "var(--text-primary)" : "var(--text-tertiary)"} dim />
        <Segment width={pct.otherPct} color="var(--bg-elevated-2)" />
      </div>
    </div>
  );
}

function Segment({ width, color, dim }: { width: number; color: string; dim?: boolean }) {
  if (width <= 0) return null;
  return (
    <div
      style={{
        width: `${width * 100}%`,
        background: color,
        opacity: dim ? 0.55 : 1,
      }}
    />
  );
}

function tilt(delta: number): string {
  const abs = Math.abs(delta);
  if (abs < 0.05) return "Effectively in line — boring is winning.";
  if (delta > 0) return "More upside in good years, more pain in down years.";
  return "Lower expected return long-term, but smoother ride.";
}

const muted: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-tertiary)",
  margin: 0,
};
