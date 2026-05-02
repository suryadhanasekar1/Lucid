"use client";

import { useUserStore } from "@/stores/userStore";
import { usePortfolio } from "@/hooks/usePortfolio";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { EmptyState } from "@/components/shared/v1/EmptyState";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatUSD, formatPct } from "@/lib/utils";

const GOAL_TARGET_BY_STAGE: Record<string, number> = {
  student: 25_000,
  early_career: 100_000,
  family: 500_000,
  pre_retirement: 1_000_000,
  retired: 1_500_000,
};

export function GoalProgressWidget() {
  const { totalValue } = usePortfolio();
  const profile = useUserStore((s) => s.profile);
  const def = WIDGETS_BY_ID["goal_progress"]!;

  const target = profile ? GOAL_TARGET_BY_STAGE[profile.answers.lifeStage] ?? 100_000 : 100_000;
  const horizonYears = profile?.answers.timelineYears ?? 10;
  const progress = target > 0 ? Math.min(1, totalValue / target) : 0;
  const remaining = Math.max(0, target - totalValue);
  const goalText = profile?.answers.goal || "your goal";

  if (totalValue <= 0) {
    return (
      <WidgetCard title={def.title} rationale={def.rationale} badge="Progress">
        <EmptyState
          title="Nothing to track yet"
          body={`Connect a portfolio and we'll start measuring your distance to ${goalText}.`}
          cta={{ href: "/connect", label: "Connect a brokerage" }}
        />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Progress">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-secondary)",
              marginBottom: "var(--space-2)",
            }}
          >
            Toward {goalText}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              fontSize: 36,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatPct(progress, 0)}
          </div>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: "var(--bg-elevated-2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              background: "var(--gold-primary)",
              transition: "width 800ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--text-tertiary)",
          }}
        >
          <span>{formatUSD(totalValue)} of {formatUSD(target)}</span>
          <span>
            {formatUSD(remaining)} to go · {horizonYears}y horizon
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}
