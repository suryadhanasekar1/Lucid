"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAdaptiveMode } from "@/hooks/useAdaptiveMode";
import { useSectorExposure, type ExposureSlice } from "@/hooks/useSectorExposure";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatPct, formatUSD } from "@/lib/utils";

const COLORS = [
  "var(--gold-primary)",
  "var(--signal-info)",
  "var(--signal-positive)",
  "var(--signal-warning)",
  "var(--signal-negative)",
  "var(--text-tertiary)",
];

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
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={74} paddingAngle={2}>
            {data.map((slice, i) => (
              <Cell key={slice.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ExposureTooltip />} />
        </PieChart>
      </ResponsiveContainer>
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

function ExposureTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ExposureSlice }> }) {
  if (!active || !payload?.length) return null;
  const slice = payload[0]!.payload;
  return (
    <div style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "var(--space-2)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)" }}>
      <div>{slice.name}</div>
      <div>{formatPct(slice.percent, 1)} · {formatUSD(Math.round(slice.value))}</div>
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
