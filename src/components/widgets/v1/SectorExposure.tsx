"use client";

import { Cell, Pie, PieChart } from "recharts";
import { useAdaptiveMode } from "@/hooks/useAdaptiveMode";
import { useSectorExposure, type ExposureSlice } from "@/hooks/useSectorExposure";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatPct, formatUSD } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-4))",
  "hsl(var(--muted-foreground))",
];

const chartConfig = {
  value: { label: "Allocation" },
} satisfies ChartConfig;

export function SectorExposureWidget() {
  const { sectors, geography } = useSectorExposure();
  const { isEssentials } = useAdaptiveMode();
  const def = WIDGETS_BY_ID["sector_exposure"]!;
  const sectorData = isEssentials ? simplifySectors(sectors) : sectors;

  return (
    <WidgetCard title={def.title} rationale={def.rationale}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--space-4)", minHeight: 260 }}>
        <ExposurePie title="Sector" data={sectorData} />
        <ExposurePie title="Geography" data={geography} />
      </div>
    </WidgetCard>
  );
}

function ExposurePie({ title, data }: { title: string; data: ExposureSlice[] }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-2)", minWidth: 0 }}>
      <p style={titleStyle}>{title}</p>
      <ChartContainer config={chartConfig} className="mx-auto h-[180px] w-full">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={74} paddingAngle={2}>
            {data.map((slice, i) => (
              <Cell key={slice.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(value, _name, item) => {
                  const s = item?.payload as ExposureSlice | undefined;
                  return s ? `${formatPct(s.percent, 1)} · ${formatUSD(Math.round(s.value))}` : String(value);
                }}
              />
            }
          />
        </PieChart>
      </ChartContainer>
      <div style={{ display: "grid", gap: 6 }}>
        {data.slice(0, 4).map((slice, i) => (
          <div key={slice.name} style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...legend, color: "var(--text-secondary)" }}>
              <span aria-hidden="true" style={{ display: "inline-block", width: 8, height: 8, borderRadius: 99, background: COLORS[i % COLORS.length], marginRight: 6 }} />
              {slice.name}
            </span>
            <span style={legend}>{formatPct(slice.percent, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function simplifySectors(sectors: ExposureSlice[]): ExposureSlice[] {
  const simplified = new Map<string, number>();
  const total = sectors.reduce((sum, slice) => sum + slice.value, 0);
  for (const slice of sectors) {
    const name = slice.name.includes("Technology") || slice.name.includes("Market") ? "Tech" : slice.name.includes("Health") ? "Healthcare" : "Other";
    simplified.set(name, (simplified.get(name) ?? 0) + slice.value);
  }
  return Array.from(simplified.entries()).map(([name, value]) => ({
    name,
    value,
    percent: total > 0 ? value / total : 0,
  }));
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  fontWeight: 500,
};

const legend: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "var(--text-tertiary)",
};
