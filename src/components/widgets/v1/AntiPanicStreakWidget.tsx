"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useCircuitBreaker } from "@/hooks/useCircuitBreaker";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { ExplainTooltip } from "@/components/shared/v1/ExplainTooltip";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { usePrefersReducedMotion, motionDuration } from "@/lib/a11y";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Anti-Panic Streak — surfaced for users who check in daily.
 *
 * "Streak" = days since the last `proceeded` (panic-sold) breaker event.
 * If the user has never proceeded, we count from the first breaker fire (the
 * implicit "I started using Lucid" moment). Empty history → 0.
 */
export function AntiPanicStreakWidget() {
  const { history } = useCircuitBreaker();
  const def = WIDGETS_BY_ID["streak_tracker"]!;
  const reducedMotion = usePrefersReducedMotion();

  const { streakDays, totalHeld, lastBreak } = useMemo(() => {
    if (history.length === 0) return { streakDays: 0, totalHeld: 0, lastBreak: null as null | number };
    const sorted = [...history].sort((a, b) => a.ts - b.ts);
    const firstTs = sorted[0]!.ts;
    const lastProceeded = [...sorted].reverse().find((h) => h.decision === "proceeded");
    const heldCount = sorted.filter((h) => h.decision === "cancelled").length;
    const anchor = lastProceeded?.ts ?? firstTs;
    const days = Math.max(0, Math.floor((Date.now() - anchor) / ONE_DAY_MS));
    return { streakDays: days, totalHeld: heldCount, lastBreak: lastProceeded?.ts ?? null };
  }, [history]);

  const blurb = streakBlurb(streakDays, totalHeld, lastBreak !== null);

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Anti-Panic Streak">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
          <motion.span
            key={streakDays}
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: motionDuration(reducedMotion, 0.22), ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              fontSize: 64,
              lineHeight: 1,
              color: "var(--gold-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {streakDays}
          </motion.span>
          <div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {streakDays === 1 ? "day" : "days"} without a panic sell
            </p>
            <p style={muted}>{totalHeld} sale{totalHeld === 1 ? "" : "s"} held the line</p>
          </div>
        </div>

        <p style={body}>{blurb}</p>

        <ExplainTooltip topic="streak_tracker" label="How is this counted?" />
      </div>
    </WidgetCard>
  );
}

function streakBlurb(days: number, totalHeld: number, hasBreak: boolean): string {
  if (totalHeld === 0 && days === 0) {
    return "No breaker history yet. Try the Circuit Breaker widget — every time you change your mind, this number grows.";
  }
  if (hasBreak) {
    if (days === 0) return "The clock just reset. The next streak starts now.";
    if (days < 7) return "Early days. The hardest part is the first week.";
    if (days < 30) return "Habit forming. Past month is the bedrock.";
    return "This is the boring kind of compounding. Don't break it.";
  }
  // No break ever
  if (days < 7) return "Quiet week. That's the whole point.";
  if (days < 30) return "A solid month. Most people break here — you didn't.";
  return "An unbroken streak. That's the competitive edge nobody talks about.";
}

const muted: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "var(--text-tertiary)",
  margin: 0,
};

const body: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13.5,
  color: "var(--text-secondary)",
  margin: 0,
  lineHeight: 1.45,
};
