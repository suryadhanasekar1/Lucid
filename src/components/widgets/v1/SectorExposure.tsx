"use client";

import { useMemo } from "react";
import { useAdaptiveMode } from "@/hooks/useAdaptiveMode";
import { useSectorExposure, type ExposureSlice } from "@/hooks/useSectorExposure";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatPct, formatUSD, cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Sector + Geography exposure — tabbed horizontal bar list.
 *
 * Pattern lifted from common brokerage UIs (Robinhood, Wealthfront) because
 * donut charts compress poorly at widget cell size. A bar list:
 *   - lines every label up
 *   - shows ranking by reading order
 *   - highlights concentration without needing a tooltip hover
 *
 * Slice tints come from --chart-1..5 (the shadcn semantic chart palette
 * mapped to gold + signal colors in globals.css).
 */
export function SectorExposureWidget() {
  const { sectors, geography } = useSectorExposure();
  const { isEssentials } = useAdaptiveMode();
  const def = WIDGETS_BY_ID["sector_exposure"]!;
  const sectorData = isEssentials ? simplifySectors(sectors) : sectors;

  return (
    <WidgetCard title={def.title} rationale={def.rationale}>
      <Tabs defaultValue="sector" className="flex h-full flex-col gap-3">
        <TabsList className="h-8 w-fit gap-1 rounded-full border border-border/40 bg-secondary/30 p-0.5">
          <TabsTrigger
            value="sector"
            className="h-7 rounded-full px-3 text-[12px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
          >
            Sector
          </TabsTrigger>
          <TabsTrigger
            value="geography"
            className="h-7 rounded-full px-3 text-[12px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
          >
            Geography
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sector" className="m-0 flex-1">
          <BarList slices={sectorData} />
        </TabsContent>
        <TabsContent value="geography" className="m-0 flex-1">
          <BarList slices={geography} />
        </TabsContent>
      </Tabs>
    </WidgetCard>
  );
}

const PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-4))",
  "hsl(var(--muted-foreground))",
];

function BarList({ slices }: { slices: ExposureSlice[] }) {
  const sorted = useMemo(
    () => [...slices].sort((a, b) => b.percent - a.percent),
    [slices],
  );
  const total = sorted.reduce((s, x) => s + x.value, 0);
  const top = sorted[0];

  if (sorted.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        Connect a portfolio to see exposure.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Concentration callout — top of list */}
      {top && (
        <div className="flex items-baseline justify-between gap-3 border-b border-border/30 pb-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Top concentration
            </span>
            <span className="text-[13px] font-medium text-foreground">{top.name}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-[15px] tabular-nums text-foreground">
              {formatPct(top.percent, 1)}
            </span>
            {total > 0 && (
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {formatUSD(Math.round(top.value), { decimals: 0 })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bar list */}
      <ul className="flex flex-col gap-2">
        {sorted.slice(0, 6).map((slice, i) => {
          const color = PALETTE[i % PALETTE.length]!;
          const widthPct = Math.max(2, slice.percent * 100);
          return (
            <li key={slice.name} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={cn("h-2 w-2 shrink-0 rounded-full")}
                    style={{ background: color }}
                  />
                  <span className="truncate text-foreground">{slice.name}</span>
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatPct(slice.percent, 1)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary/40">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${widthPct}%`, background: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function simplifySectors(sectors: ExposureSlice[]): ExposureSlice[] {
  const simplified = new Map<string, number>();
  const total = sectors.reduce((sum, slice) => sum + slice.value, 0);
  for (const slice of sectors) {
    const name =
      slice.name.includes("Technology") || slice.name.includes("Market")
        ? "Tech"
        : slice.name.includes("Health")
          ? "Healthcare"
          : "Other";
    simplified.set(name, (simplified.get(name) ?? 0) + slice.value);
  }
  return Array.from(simplified.entries()).map(([name, value]) => ({
    name,
    value,
    percent: total > 0 ? value / total : 0,
  }));
}
