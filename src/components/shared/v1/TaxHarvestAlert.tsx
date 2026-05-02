"use client";

import { AlertTriangle } from "lucide-react";
import { useTaxLossOpportunities } from "@/hooks/useTaxLossOpportunities";
import { formatUSD } from "@/lib/utils";

export function TaxHarvestAlert() {
  const opportunities = useTaxLossOpportunities();
  const top = opportunities[0];
  if (!top) return null;

  return (
    <aside
      style={{
        border: "1px solid var(--border-default)",
        borderLeft: "3px solid var(--signal-warning)",
        borderRadius: 10,
        padding: "var(--space-3)",
        background: "var(--bg-inset)",
        display: "grid",
        gap: "var(--space-2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <AlertTriangle size={16} color="var(--signal-warning)" aria-hidden="true" />
        <strong style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-primary)" }}>
          Tax-loss opportunity
        </strong>
      </div>
      <p style={text}>
        {top.symbol} has an unrealized loss of {formatUSD(Math.round(top.unrealizedLoss))}. Estimated tax saving:
        {" "}
        {formatUSD(Math.round(top.unrealizedLoss * 0.15))}.
      </p>
      <p style={text}>
        Replacement idea: {top.suggestedReplacement}
        {top.washSaleWarning ? " · wash-sale warning: recent purchase detected." : ""}
      </p>
    </aside>
  );
}

const text: React.CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 12.5,
  lineHeight: 1.45,
};
