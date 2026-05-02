"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedDownloadButton from "@/components/ui/download-hover-button";
import { ShowMeTheMath } from "@/components/shared/v1/ShowMeTheMath";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { useHealthScore } from "@/hooks/useHealthScore";
import { usePrefersReducedMotion } from "@/lib/a11y";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import type { HealthComponents, Weather } from "@/types";

type HealthScoreResult = {
  score?: number | null;
  weather?: Weather;
  components?: Partial<HealthComponents>;
  loading?: boolean;
};

const CARD_TITLE = "Portfolio Health";
const CARD_RATIONALE =
  "Shows a beginner-friendly snapshot of diversification, risk level, fees, and goal alignment.";

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const segmentColor = (value: number) => {
  if (value >= 70) return "var(--signal-positive)";
  if (value >= 40) return "var(--signal-warning)";
  return "var(--signal-negative)";
};

const healthSummary = (score: number) => {
  if (score >= 80) return "Looks strong. Your portfolio is balanced across the main checks.";
  if (score >= 60) return "Looks mostly steady. A couple of areas may deserve attention.";
  if (score >= 40) return "Needs a checkup. Start with concentration, risk level, and fees.";
  return "Needs care. This score suggests the current mix may not fit your plan yet.";
};

export function HealthScoreWidget() {
  const health = useHealthScore() as HealthScoreResult;
  const prefersReducedMotion = useReducedMotion();
  const appReducedMotion = usePrefersReducedMotion();
  const reducedMotion = prefersReducedMotion === true || appReducedMotion;
  const def = WIDGETS_BY_ID["health_score"];

  const components: HealthComponents = {
    diversification: clampScore(health.components?.diversification ?? 0),
    goalAlignment: clampScore(health.components?.goalAlignment ?? 0),
    risk: clampScore(health.components?.risk ?? 0),
    fees: clampScore(health.components?.fees ?? 0),
  };

  if (health.loading || health.score === undefined) {
    return (
      <WidgetCard title={CARD_TITLE} rationale={def?.rationale ?? CARD_RATIONALE}>
        <div style={skeletonShell} aria-label="Loading portfolio health" role="status" />
      </WidgetCard>
    );
  }

  const score = clampScore(health.score ?? 0);
  const allComponentsZero = Object.values(components).every((value) => value === 0);

  if (allComponentsZero) {
    return (
      <WidgetCard title={CARD_TITLE} rationale={def?.rationale ?? CARD_RATIONALE}>
        <div style={emptyShell}>
          {"We're still calculating your health score. Connect a portfolio or open the sample dashboard first."}
        </div>
      </WidgetCard>
    );
  }

  const segments = [
    { label: "Diversification", value: components.diversification, color: segmentColor(components.diversification) },
    { label: "Risk level", value: components.risk, color: segmentColor(components.risk) },
    { label: "Fees", value: components.fees, color: segmentColor(components.fees) },
    { label: "Goal alignment", value: components.goalAlignment, color: segmentColor(components.goalAlignment) },
  ];

  return (
    <WidgetCard title={CARD_TITLE} rationale={def?.rationale ?? CARD_RATIONALE}>
      <div style={contentStyle}>
        <div style={topRow}>
          <AnimatedDownloadButton
            score={score}
            label="Portfolio Health"
            summary={healthSummary(score)}
            segments={segments}
            reducedMotion={reducedMotion}
          />
          <div style={copyBlock}>
            <p style={eyebrow}>Hover or tap the ring</p>
            <h4 style={headline}>{healthSummary(score)}</h4>
            <p style={body}>
              This is a procedural health circle, not a professional risk model. It is calculated from
              four visible inputs below so beginners can see exactly what changed.
            </p>
          </div>
        </div>

        <div style={componentGrid}>
          {segments.map((segment, index) => (
            <motion.div
              key={segment.label}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.24, delay: index * 0.05 }}
              style={metricCard}
            >
              <div style={metricHeader}>
                <span style={metricLabel}>{segment.label}</span>
                <span style={{ ...metricValue, color: segment.color }}>{Math.round(segment.value)}/100</span>
              </div>
              <div style={barTrack} aria-hidden="true">
                <span style={{ ...barFill, width: `${segment.value}%`, background: segment.color }} />
              </div>
            </motion.div>
          ))}
        </div>

        <ShowMeTheMath
          formula="Health Score = diversification 30% + goal alignment 25% + risk fit 25% + fee score 20%."
          rows={[
            { label: "Diversification", value: `${components.diversification}/100` },
            { label: "Goal alignment", value: `${components.goalAlignment}/100` },
            { label: "Risk fit", value: `${components.risk}/100` },
            { label: "Fees", value: `${components.fees}/100` },
          ]}
          result={{ label: "Health Score", value: `${score}/100` }}
        />
      </div>
    </WidgetCard>
  );
}

const contentStyle: CSSProperties = {
  minHeight: 360,
  display: "grid",
  gap: "var(--space-4)",
  alignContent: "start",
};

const topRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-4)",
  flexWrap: "wrap",
};

const copyBlock: CSSProperties = {
  flex: "1 1 220px",
  minWidth: 0,
};

const eyebrow: CSSProperties = {
  margin: 0,
  color: "var(--gold-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const headline: CSSProperties = {
  margin: "var(--space-1) 0 0",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.3,
};

const body: CSSProperties = {
  margin: "var(--space-2) 0 0",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: 1.45,
};

const componentGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "var(--space-3)",
};

const metricCard: CSSProperties = {
  padding: "var(--space-3)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  background: "var(--bg-inset)",
  display: "grid",
  gap: "var(--space-2)",
};

const metricHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--space-3)",
};

const metricLabel: CSSProperties = {
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
};

const metricValue: CSSProperties = {
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  fontVariantNumeric: "tabular-nums",
};

const barTrack: CSSProperties = {
  height: 6,
  borderRadius: 999,
  background: "var(--bg-elevated-2)",
  overflow: "hidden",
};

const barFill: CSSProperties = {
  display: "block",
  height: "100%",
  borderRadius: 999,
};

const skeletonShell: CSSProperties = {
  minHeight: 280,
  borderRadius: 32,
  background:
    "linear-gradient(90deg, var(--bg-elevated-2), var(--border-default), var(--bg-elevated-2))",
  backgroundSize: "200% 100%",
  animation: "compass-skeleton-shimmer 1200ms ease-in-out infinite",
};

const emptyShell: CSSProperties = {
  minHeight: 280,
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  lineHeight: 1.5,
  padding: "var(--space-6)",
};
