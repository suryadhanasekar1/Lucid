"use client";

import { useEffect, useState } from "react";
import { useHealthScore } from "@/hooks/useHealthScore";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { ExplainTooltip } from "@/components/shared/v1/ExplainTooltip";
import { ShowMeTheMath } from "@/components/shared/v1/ShowMeTheMath";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { usePrefersReducedMotion } from "@/lib/a11y";

const WEATHER_COPY = {
  sunny: "Looking sunny",
  partly_cloudy: "Partly cloudy",
  cloudy: "Cloudy",
  stormy: "Stormy",
} as const;

export function HealthScoreWidget() {
  const { score, weather, components } = useHealthScore();
  const def = WIDGETS_BY_ID["health_score"]!;
  const reducedMotion = usePrefersReducedMotion();
  const [arc, setArc] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setArc(score);
      return;
    }
    const t = window.setTimeout(() => setArc(score), 60);
    return () => window.clearTimeout(t);
  }, [score, reducedMotion]);

  // Gauge math: half-arc 180° from 0 → score.
  const radius = 64;
  const cx = 80;
  const cy = 80;
  const startA = Math.PI;
  const endA = Math.PI + (arc / 100) * Math.PI;
  const x1 = cx + radius * Math.cos(startA);
  const y1 = cy + radius * Math.sin(startA);
  const x2 = cx + radius * Math.cos(endA);
  const y2 = cy + radius * Math.sin(endA);
  const largeArc = arc > 50 ? 1 : 0;
  const arcPath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Health">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
        <svg width={160} height={96} viewBox="0 0 160 96">
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            stroke="var(--border-default)"
            strokeWidth={6}
            fill="none"
          />
          <path
            d={arcPath}
            stroke="var(--gold-primary)"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            style={{ transition: reducedMotion ? "none" : "all 700ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              fontSize: 48,
              lineHeight: 1,
              color: "var(--text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {score}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            {WEATHER_COPY[weather]}
          </div>
        </div>
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-2)",
          marginTop: "var(--space-3)",
        }}
      >
        {(
          [
            ["diversification", "Diversification"],
            ["goalAlignment", "Goal alignment"],
            ["risk", "Risk fit"],
            ["fees", "Fees"],
          ] as const
        ).map(([key, label]) => (
          <li
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            <span>{label}</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                color: "var(--text-primary)",
              }}
            >
              {components[key]}
            </span>
          </li>
        ))}
      </ul>
      <div
        style={{
          marginTop: "var(--space-3)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        }}
      >
        <ExplainTooltip
          topic="health_score"
          context={{ score, weather, components }}
        />
        <ShowMeTheMath
          formula="Health = 0.30 × diversification + 0.25 × goal alignment + 0.25 × risk fit + 0.20 × fees"
          rows={[
            { label: "Diversification (30%)", value: String(components.diversification) },
            { label: "Goal alignment (25%)", value: String(components.goalAlignment) },
            { label: "Risk fit (25%)", value: String(components.risk) },
            { label: "Fees (20%)", value: String(components.fees) },
          ]}
          result={{ label: "Score", value: String(score) }}
        />
      </div>
    </WidgetCard>
  );
}
