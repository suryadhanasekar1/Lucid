"use client";

import { useMacroConditions } from "@/hooks/useMacroConditions";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { Skeleton } from "@/components/shared/v1/Skeleton";
import { ShowMeTheMath } from "@/components/shared/v1/ShowMeTheMath";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import type { MacroIndicator } from "@/types";

export function MacroConditionsWidget() {
  const { conditions, loading } = useMacroConditions();
  const def = WIDGETS_BY_ID["macro_conditions"]!;

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Today's Conditions">
      {loading && !conditions && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-elevated-2)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Skeleton width="60%" height={10} />
              <Skeleton width="40%" height={20} />
              <Skeleton width="90%" height={10} />
            </div>
          ))}
        </div>
      )}
      {conditions && (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
          }}
        >
          <Indicator i={conditions.inflation} />
          <Indicator i={conditions.fedFundsRate} />
          <Indicator i={conditions.treasury10y} />
          <Indicator i={conditions.mortgage30y} />
        </ul>
      )}
      {conditions && (
        <div style={{ marginTop: "var(--space-3)" }}>
          <ShowMeTheMath
            formula="Live values pulled from FRED via /api/macro/conditions, cached 24h. CPI uses the year-over-year transform (units=pc1)."
            rows={[
              {
                label: conditions.inflation.label,
                value: `${conditions.inflation.value}${conditions.inflation.unit}`,
                source: `FRED · ${conditions.inflation.seriesId}`,
              },
              {
                label: conditions.fedFundsRate.label,
                value: `${conditions.fedFundsRate.value}${conditions.fedFundsRate.unit}`,
                source: `FRED · ${conditions.fedFundsRate.seriesId}`,
              },
              {
                label: conditions.treasury10y.label,
                value: `${conditions.treasury10y.value}${conditions.treasury10y.unit}`,
                source: `FRED · ${conditions.treasury10y.seriesId}`,
              },
              {
                label: conditions.mortgage30y.label,
                value: `${conditions.mortgage30y.value}${conditions.mortgage30y.unit}`,
                source: `FRED · ${conditions.mortgage30y.seriesId}`,
              },
            ]}
          />
        </div>
      )}
    </WidgetCard>
  );
}

function Indicator({ i }: { i: MacroIndicator }) {
  return (
    <li
      style={{
        background: "var(--bg-elevated-2)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "var(--text-tertiary)",
          margin: 0,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {i.label}
      </p>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          fontSize: 36,
          lineHeight: 1,
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {i.value}
        <span style={{ fontSize: 18, color: "var(--text-tertiary)", marginLeft: 4 }}>{i.unit}</span>
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        {i.plainEnglish}
      </p>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "var(--text-tertiary)",
          margin: 0,
          marginTop: 4,
        }}
      >
        Source: FRED {i.seriesId}, updated {i.asOf}
      </p>
    </li>
  );
}

const empty: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--text-secondary)",
  margin: 0,
};
