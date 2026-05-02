"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { useUserStore } from "@/stores/userStore";
import { useScenario } from "@/hooks/useScenario";
import { useCircuitBreaker } from "@/hooks/useCircuitBreaker";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatUSD, formatPct } from "@/lib/utils";

export function PainThresholdMonitorWidget() {
  const { totalValue, holdings } = usePortfolio();
  const profile = useUserStore((s) => s.profile);
  const { current } = useScenario();
  const { trigger } = useCircuitBreaker();
  const def = WIDGETS_BY_ID["pain_threshold"]!;

  if (!profile) {
    return (
      <WidgetCard title={def.title} rationale={def.rationale} badge="Pain Threshold">
        <p style={empty}>Take the survey first.</p>
      </WidgetCard>
    );
  }

  const threshold = profile.answers.painThreshold;
  const startingValue = profile.answers.sleepTestStartingValue || 25_000;
  const scaledThreshold = totalValue > 0 ? (threshold / startingValue) * totalValue : threshold;

  // If a scenario has been run, project against its endingValue. Otherwise show current.
  const projected = current?.endingValue ?? totalValue;
  const breach = projected < scaledThreshold;
  const distance = projected - scaledThreshold;
  const distancePct = scaledThreshold > 0 ? distance / scaledThreshold : 0;

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Pain Threshold">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p style={{ ...empty, color: "var(--text-tertiary)" }}>
          Your pain threshold from the Sleep Test, scaled to today&apos;s portfolio.
        </p>
        <div
          style={{
            background: breach ? "rgba(199, 107, 90, 0.12)" : "var(--bg-elevated-2)",
            border: `1px solid ${breach ? "var(--signal-negative)" : "var(--border-subtle)"}`,
            borderRadius: 12,
            padding: "var(--space-4)",
          }}
        >
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", margin: 0 }}>
            Threshold
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              fontSize: 36,
              margin: "4px 0 0 0",
              color: breach ? "var(--signal-negative)" : "var(--text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatUSD(Math.round(scaledThreshold))}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", margin: "var(--space-2) 0 0 0" }}>
            {current ? "Projected after scenario:" : "Right now:"}{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: breach ? "var(--signal-negative)" : "var(--text-primary)" }}>
              {formatUSD(Math.round(projected))}
            </span>
            {" · "}
            <span style={{ color: breach ? "var(--signal-negative)" : "var(--signal-positive)" }}>
              {distance >= 0 ? "+" : ""}{formatUSD(Math.round(distance))} ({formatPct(distancePct, 1)})
            </span>
          </p>
        </div>
        {breach && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <p style={{ ...empty, color: "var(--signal-negative)", margin: 0 }}>
              This scenario crosses the line you set. We&apos;d ramp risk down before letting that happen.
            </p>
            {holdings.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const largest = [...holdings].sort((a, b) => b.value - a.value)[0]!;
                  trigger(
                    { ticker: largest.ticker, shares: largest.shares, reasonClaimed: "scenario_breach" },
                    { breachedThreshold: true },
                  );
                }}
                style={{
                  alignSelf: "flex-start",
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid var(--signal-negative)",
                  background: "transparent",
                  color: "var(--signal-negative)",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Sell to lock in a smaller loss
              </button>
            )}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

const empty: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--text-secondary)",
  margin: 0,
};
