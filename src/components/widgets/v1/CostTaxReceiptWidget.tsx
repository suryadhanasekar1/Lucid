"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { ExplainTooltip } from "@/components/shared/v1/ExplainTooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { annualFeeDrag, capGainsTaxOnSale } from "@/lib/portfolio/tax";
import { formatUSD, formatPct } from "@/lib/utils";

/**
 * Cost & Tax Receipt — surfaced for users whose worry is `taxes_fees`.
 *
 * Two stacked tables:
 *   1. Annual fee drag, per holding, weighted by today's ER table.
 *   2. Estimated long-term cap gains tax if every position with a gain were
 *      sold today (15% bracket). Pure illustration — Compass never recommends
 *      a sale; it just makes the cost visible.
 */
export function CostTaxReceiptWidget() {
  const { holdings, totalValue } = usePortfolio();
  const def = WIDGETS_BY_ID["cost_tax_receipt"]!;

  const rows = useMemo(() => {
    return holdings
      .map((h) => {
        const fee = annualFeeDrag(h);
        const tax = capGainsTaxOnSale(h, h.value);
        const er = h.value > 0 ? fee / h.value : 0;
        return { holding: h, fee, tax, er };
      })
      .sort((a, b) => b.fee + b.tax - (a.fee + a.tax));
  }, [holdings]);

  const totalFees = rows.reduce((s, r) => s + r.fee, 0);
  const totalTax = rows.reduce((s, r) => s + r.tax, 0);
  const blendedER = totalValue > 0 ? totalFees / totalValue : 0;

  if (holdings.length === 0) {
    return (
      <WidgetCard title={def.title} rationale={def.rationale} badge="Costs & Taxes">
        <p style={muted}>Connect a portfolio (or load the sample) to see your fee drag.</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Costs & Taxes">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
          <Stat
            label="Annual fee drag"
            value={formatUSD(Math.round(totalFees))}
            sub={`Blended ER ${formatPct(blendedER, 2)}`}
            tone={blendedER < 0.002 ? "good" : blendedER < 0.005 ? "neutral" : "warn"}
          />
          <Stat
            label="If you sold everything"
            value={formatUSD(Math.round(totalTax))}
            sub="Long-term cap gains @ 15%"
            tone="neutral"
          />
        </div>

        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="h-8 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Holding
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                ER
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Fee/yr
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Tax if sold
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 6).map((r) => (
              <TableRow key={r.holding.ticker} className="border-border/20 hover:bg-secondary/30">
                <TableCell className="px-2 py-2">
                  <span className="font-mono text-primary">{r.holding.ticker}</span>
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-mono tabular-nums">
                  {r.holding.type === "stock" || r.holding.type === "cash" ? "—" : formatPct(r.er, 2)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-mono tabular-nums">
                  {r.fee > 0 ? formatUSD(Math.round(r.fee)) : "—"}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-mono tabular-nums">
                  {r.tax > 0 ? formatUSD(Math.round(r.tax)) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <ExplainTooltip topic="cost_tax_receipt" label="What's an expense ratio?" />
      </div>
    </WidgetCard>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "good" | "neutral" | "warn";
}) {
  const color =
    tone === "good"
      ? "var(--signal-positive)"
      : tone === "warn"
        ? "var(--signal-negative)"
        : "var(--text-primary)";
  return (
    <div
      style={{
        background: "var(--bg-elevated-2)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: "var(--space-3)",
      }}
    >
      <p style={{ ...muted, margin: 0, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          fontSize: 28,
          margin: "4px 0 0 0",
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      <p style={{ ...muted, margin: "2px 0 0 0", fontSize: 12 }}>{sub}</p>
    </div>
  );
}

const muted: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-tertiary)",
  margin: 0,
};

