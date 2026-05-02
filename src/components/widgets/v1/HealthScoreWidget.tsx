"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Cloud, CloudLightning, CloudSun, Sun } from "lucide-react";
import { useExplain } from "@/hooks/useExplain";
import { useHealthScore } from "@/hooks/useHealthScore";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { WhyIsThisHere } from "@/components/shared/v1/WhyIsThisHere";
import type { HealthComponents, Weather } from "@/types";

type HealthScoreResult = {
  score?: number | null;
  weather?: Weather;
  components?: Partial<HealthComponents>;
  loading?: boolean;
};

type ComponentKey = keyof HealthComponents;

const CARD_TITLE = "Portfolio Health Score";
const CARD_RATIONALE =
  "Always shown so you can quickly see whether your portfolio needs attention before making a decision.";

const WEATHER: Record<
  Weather,
  {
    label: string;
    Icon: typeof Sun;
    color: string;
  }
> = {
  sunny: {
    label: "Your portfolio is in great shape.",
    Icon: Sun,
    color: "var(--gold-primary)",
  },
  partly_cloudy: {
    label: "Things look solid, with some room to improve.",
    Icon: CloudSun,
    color: "var(--signal-warning)",
  },
  cloudy: {
    label: "A few things need attention.",
    Icon: Cloud,
    color: "var(--text-secondary)",
  },
  stormy: {
    label: "Your portfolio needs some care.",
    Icon: CloudLightning,
    color: "var(--signal-negative)",
  },
};

const COMPONENT_ROWS: Array<{
  key: ComponentKey;
  label: string;
  tooltip: string;
}> = [
  {
    key: "diversification",
    label: "Variety of investments",
    tooltip: "Owning different types of investments protects you if one drops.",
  },
  {
    key: "goalAlignment",
    label: "On track for your goal",
    tooltip: "Are your investments lined up with when you need the money?",
  },
  {
    key: "risk",
    label: "Comfort with risk level",
    tooltip: "Does your portfolio match what you said you could handle losing?",
  },
  {
    key: "fees",
    label: "What you're paying",
    tooltip: "Lower fees mean more of your money stays invested.",
  },
];

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const signalColor = (value: number) => {
  if (value >= 70) return "var(--signal-positive)";
  if (value >= 40) return "var(--signal-warning)";
  return "var(--signal-negative)";
};

function AnimatedScore({ score, reducedMotion }: { score: number; reducedMotion: boolean }) {
  const count = useMotionValue(reducedMotion ? score : 0);
  const rounded = useTransform(count, (latest) => String(Math.round(latest)));
  const [display, setDisplay] = useState(reducedMotion ? String(score) : "0");

  useEffect(() => {
    if (reducedMotion) {
      count.set(score);
      setDisplay(String(score));
      return;
    }

    count.set(0);
    const unsubscribe = rounded.on("change", setDisplay);
    const controls = animate(count, score, {
      duration: 0.9,
      ease: "easeOut",
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, reducedMotion, rounded, score]);

  return <>{display}</>;
}

function SkeletonBar() {
  return (
    <div
      style={{
        height: 6,
        borderRadius: 999,
        background:
          "linear-gradient(90deg, var(--bg-elevated-2), var(--border-default), var(--bg-elevated-2))",
        backgroundSize: "200% 100%",
        animation: "compass-skeleton-shimmer 1200ms ease-in-out infinite",
      }}
    />
  );
}

function HealthSkeleton() {
  return (
    <WidgetCard title={CARD_TITLE} rationale={CARD_RATIONALE}>
      <div style={contentStyle}>
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            border: "1px solid var(--border-default)",
            background:
              "linear-gradient(90deg, var(--bg-elevated-2), var(--border-default), var(--bg-elevated-2))",
            backgroundSize: "200% 100%",
            animation: "compass-skeleton-shimmer 1200ms ease-in-out infinite",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            width: 208,
            height: 124,
            borderRadius: 999,
            border: "8px solid var(--border-default)",
            borderBottomColor: "transparent",
            opacity: 0.7,
          }}
        />
        <div style={{ width: "100%", display: "grid", gap: "var(--space-4)" }}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBar key={i} />
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}

export function HealthScoreWidget() {
  const health = useHealthScore() as HealthScoreResult;
  const { explain } = useExplain();
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  const components = useMemo<HealthComponents>(
    () => ({
      diversification: clampScore(health.components?.diversification ?? 0),
      goalAlignment: clampScore(health.components?.goalAlignment ?? 0),
      risk: clampScore(health.components?.risk ?? 0),
      fees: clampScore(health.components?.fees ?? 0),
    }),
    [health.components],
  );

  if (health.loading || health.score === undefined) {
    return <HealthSkeleton />;
  }

  const allComponentsZero = Object.values(components).every((value) => value === 0);

  if (health.score === null || allComponentsZero) {
    return (
      <WidgetCard title={CARD_TITLE} rationale={CARD_RATIONALE}>
        <div
          style={{
            minHeight: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1.5,
            padding: "var(--space-6)",
          }}
        >
          {"We're still calculating your score. Check back after connecting your portfolio."}
        </div>
      </WidgetCard>
    );
  }

  const score = clampScore(health.score);
  const weather = health.weather ?? (score >= 80 ? "sunny" : score >= 60 ? "partly_cloudy" : score >= 40 ? "cloudy" : "stormy");
  const weatherInfo = WEATHER[weather];
  const WeatherIcon = weatherInfo.Icon;
  const arcLength = Math.PI * 82;
  const arcOffset = arcLength * (1 - score / 100);
  const explainContext = {
    "Variety of investments": components.diversification,
    "On track for your goal": components.goalAlignment,
    "Comfort with risk level": components.risk,
    "What you're paying": components.fees,
  };

  const handleTellMeMore = async () => {
    if (explanation || explanationLoading) return;
    setExplanationLoading(true);
    const text = await explain("health_score", explainContext);
    setExplanation(text || "This score looks at whether your portfolio fits your goal, your comfort level, and what you pay to own it.");
    setExplanationLoading(false);
  };

  return (
    <WidgetCard title={CARD_TITLE} rationale={CARD_RATIONALE}>
      <div style={contentStyle}>
        <div
          aria-label={weatherInfo.label}
          style={{
            display: "grid",
            justifyItems: "center",
            gap: "var(--space-2)",
            textAlign: "center",
          }}
        >
          <WeatherIcon aria-hidden="true" size={56} strokeWidth={1.7} color={weatherInfo.color} />
          <p
            style={{
              margin: 0,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              lineHeight: 1.35,
            }}
          >
            {weatherInfo.label}
          </p>
        </div>

        <div style={{ position: "relative", width: 220, height: 152 }}>
          <svg
            width="220"
            height="152"
            viewBox="0 0 220 152"
            role="img"
            aria-label={`Portfolio health score: ${score} out of 100`}
          >
            <path
              d="M 28 116 A 82 82 0 0 1 192 116"
              fill="none"
              stroke="var(--border-default)"
              strokeWidth={8}
              strokeLinecap="round"
            />
            <motion.path
              d="M 28 116 A 82 82 0 0 1 192 116"
              fill="none"
              stroke={signalColor(score)}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={arcLength}
              style={{ strokeDashoffset: arcOffset }}
              initial={reducedMotion ? false : { strokeDashoffset: arcLength }}
              animate={{ strokeDashoffset: arcOffset }}
              transition={{ duration: reducedMotion ? 0 : 0.9, ease: "easeOut" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: "42px 0 auto",
              display: "grid",
              justifyItems: "center",
              gap: "var(--space-1)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 48,
                fontWeight: 300,
                lineHeight: 1,
                color: "var(--text-primary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <AnimatedScore score={score} reducedMotion={reducedMotion} />
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              out of 100
            </div>
          </div>
        </div>

        <div style={{ width: "100%", display: "grid", gap: "var(--space-4)" }}>
          {COMPONENT_ROWS.map((row, index) => {
            const value = components[row.key];
            return (
              <div key={row.key} style={{ display: "grid", gap: "var(--space-2)" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      lineHeight: 1.25,
                    }}
                  >
                    {row.label}
                  </span>
                  <WhyIsThisHere rationale={row.tooltip} />
                </div>
                <div
                  role="progressbar"
                  aria-label={row.label}
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: "var(--bg-inset)",
                    overflow: "hidden",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <motion.div
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      background: signalColor(value),
                    }}
                    initial={reducedMotion ? false : { width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.5,
                      delay: reducedMotion ? 0 : 0.5 + index * 0.1,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ width: "100%", display: "grid", gap: "var(--space-3)" }}>
          <button
            type="button"
            onClick={handleTellMeMore}
            style={{
              justifySelf: "start",
              background: "transparent",
              border: "none",
              padding: 0,
              color: "var(--gold-primary)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textUnderlineOffset: 4,
            }}
          >
            Tell me more
          </button>

          {explanationLoading && <SkeletonBar />}

          {explanation && (
            <motion.p
              initial={reducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              style={{
                margin: 0,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {explanation}
            </motion.p>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}

const contentStyle: CSSProperties = {
  minHeight: 360,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
};
