"use client";

import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { useAdaptiveMode } from "@/hooks/useAdaptiveMode";
import { usePortfolioHistory } from "@/hooks/usePortfolioHistory";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatPct, formatUSD, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Portfolio",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const PERIODS = [
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
] as const;

export function PortfolioHistoryWidget() {
  const { history, period, setPeriod, loading, totalReturn, totalReturnPercent, source } = usePortfolioHistory();
  const { isAnalyst } = useAdaptiveMode();
  const def = WIDGETS_BY_ID["portfolio_history"]!;
  const last = history[history.length - 1];
  const previous = history[history.length - 2];
  const dailyChange = last && previous ? last.value - previous.value : 0;

  return (
    <WidgetCard title={def.title} rationale={def.rationale}>
      <div style={{ display: "grid", gap: "var(--space-4)", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <div>
            <p style={label}>Portfolio balance</p>
            <p style={value}>{last ? formatUSD(Math.round(last.value)) : "$0"}</p>
            {source === "sample" && (
              <p style={{ ...label, marginTop: 4 }}>Sample history based on current holdings</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1 self-start">
            {PERIODS.map((p) => {
              const active = period === p.value;
              return (
                <Button
                  key={p.value}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "h-6 min-w-[36px] rounded-full px-2.5 font-mono text-[11px]",
                    active
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-border/40 bg-transparent text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {p.label}
                </Button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div style={skeleton} />
        ) : history.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <AreaChart data={history} margin={{ top: 12, right: 6, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="portfolioHistoryGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--primary) / 0.4)", strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelClassName="font-mono text-[11px] text-muted-foreground"
                    formatter={(value) => formatUSD(Math.round(Number(value)))}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                fill="url(#portfolioHistoryGold)"
              />
            </AreaChart>
          </ChartContainer>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: isAnalyst ? "repeat(3, minmax(0, 1fr))" : "1fr", gap: "var(--space-3)" }}>
          <Metric label="Return" value={`${totalReturn >= 0 ? "+" : ""}${formatUSD(Math.round(totalReturn))} (${totalReturnPercent >= 0 ? "+" : ""}${formatPct(totalReturnPercent, 1)})`} tone={totalReturn >= 0 ? "positive" : "negative"} />
          {isAnalyst && <Metric label="Daily change" value={`${dailyChange >= 0 ? "+" : ""}${formatUSD(Math.round(dailyChange))}`} tone={dailyChange >= 0 ? "positive" : "negative"} />}
          {isAnalyst && <Metric label="Data points" value={history.length.toLocaleString()} />}
        </div>
      </div>
    </WidgetCard>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p
        style={{
          margin: 0,
          color: tone === "negative" ? "var(--signal-negative)" : tone === "positive" ? "var(--signal-positive)" : "var(--text-primary)",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
    </div>
  );
}

const label: React.CSSProperties = {
  margin: 0,
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
};

const labelStyle: React.CSSProperties = {
  ...label,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 4,
};

const value: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontFamily: "var(--font-display)",
  fontSize: 36,
  fontWeight: 300,
  fontVariantNumeric: "tabular-nums",
};

const skeleton: React.CSSProperties = {
  minHeight: 220,
  borderRadius: 12,
  background:
    "linear-gradient(90deg, var(--bg-elevated-2), var(--border-default), var(--bg-elevated-2))",
  backgroundSize: "200% 100%",
  animation: "compass-skeleton-shimmer 1200ms ease-in-out infinite",
};
