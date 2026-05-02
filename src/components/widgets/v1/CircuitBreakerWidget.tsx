"use client";

import { useMemo } from "react";
import { useCircuitBreaker } from "@/hooks/useCircuitBreaker";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useUserStore } from "@/stores/userStore";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { ExplainTooltip } from "@/components/shared/v1/ExplainTooltip";
import { EmptyState } from "@/components/shared/v1/EmptyState";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";

/**
 * Circuit Breaker widget.
 *   - Shows the user's current "anti-panic" stats (cancelled vs proceeded sells).
 *   - Demonstrates the breaker via a "Try the breaker" button using the largest holding.
 *   - When `breachedThreshold` is reasoned at trigger time, the modal escalates the copy.
 */
export function CircuitBreakerWidget() {
  const { history, trigger } = useCircuitBreaker();
  const { holdings, totalValue } = usePortfolio();
  const profile = useUserStore((s) => s.profile);
  const def = WIDGETS_BY_ID["circuit_breaker"]!;

  const stats = useMemo(() => {
    const cancelled = history.filter((h) => h.decision === "cancelled").length;
    const proceeded = history.filter((h) => h.decision === "proceeded").length;
    const recent = history.slice(-5).reverse();
    return { cancelled, proceeded, total: history.length, recent };
  }, [history]);

  const largest = useMemo(() => {
    if (!holdings.length) return null;
    return [...holdings].sort((a, b) => b.value - a.value)[0]!;
  }, [holdings]);

  const breachAt = profile && totalValue > 0
    ? scaledThreshold(profile.answers.painThreshold, profile.answers.sleepTestStartingValue || 25_000, totalValue)
    : null;

  const handleTry = () => {
    if (!largest) return;
    // Demo trigger: assume the user is about to dump the largest holding.
    const sharesToSell = largest.shares;
    const breachedThreshold =
      breachAt !== null && totalValue - largest.value < breachAt;
    trigger({ ticker: largest.ticker, shares: sharesToSell }, { breachedThreshold });
  };

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Circuit Breaker">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p style={muted}>
          Whenever you try to sell, Compass holds the trade for 60 seconds and asks you to type a real reason. Most of the panic clears in that minute.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-2)",
          }}
        >
          <Stat label="Sales paused" value={stats.total} accent={false} />
          <Stat label="Anti-panic streak" value={stats.cancelled} accent={true} />
        </div>

        {stats.recent.length === 0 && (
          <EmptyState
            title="No breaker history yet"
            body="Hit the trigger below to see how the 60-second pause feels — every cancelled sale will land here."
          />
        )}

        {stats.recent.length > 0 && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {stats.recent.map((h) => (
              <li
                key={h.ts}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  padding: "4px 0",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <span>{new Date(h.ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                <span
                  style={{
                    color: h.decision === "cancelled" ? "var(--signal-positive)" : "var(--signal-negative)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {h.decision === "cancelled" ? "Held the line" : "Sold anyway"}
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={handleTry}
          disabled={!largest}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            background: "transparent",
            color: largest ? "var(--gold-primary)" : "var(--text-tertiary)",
            border: `1px solid ${largest ? "var(--gold-primary)" : "var(--border-subtle)"}`,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            cursor: largest ? "pointer" : "not-allowed",
            alignSelf: "flex-start",
          }}
        >
          {largest ? `Try the breaker on ${largest.ticker}` : "Connect a portfolio first"}
        </button>

        <ExplainTooltip topic="circuit_breaker" label="Why a 60-second pause?" />
      </div>
    </WidgetCard>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: boolean }) {
  return (
    <div
      style={{
        background: "var(--bg-elevated-2)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: "var(--space-3)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          fontSize: 28,
          margin: "4px 0 0 0",
          color: accent ? "var(--signal-positive)" : "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function scaledThreshold(painThreshold: number, startingValue: number, totalValue: number): number {
  if (startingValue <= 0) return painThreshold;
  return (painThreshold / startingValue) * totalValue;
}

const muted: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-secondary)",
  margin: 0,
};
