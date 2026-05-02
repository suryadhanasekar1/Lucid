"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedDownloadButton from "@/components/ui/download-hover-button";
import { useHealthScore } from "@/hooks/useHealthScore";
import { useRiskRebalance } from "@/hooks/useRiskRebalance";
import { motionDuration, usePrefersReducedMotion } from "@/lib/a11y";
import { formatUSD } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function HeaderHealthGauge() {
  const { score, components } = useHealthScore();
  const { analysis, lastResult, rebalance, clearResult } = useRiskRebalance();
  const [open, setOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const riskScore = Math.max(0, Math.min(100, Math.round(analysis.riskFitScore)));
  const overallScore = Math.max(0, Math.min(100, Math.round(score)));
  const rebalanced = Boolean(lastResult);
  const riskColor = rebalanced ? "var(--signal-positive)" : riskStatusColor(analysis.status);
  const accentColor = rebalanced ? "var(--signal-positive)" : "var(--signal-info)";
  const accentBorder = rebalanced
    ? "rgba(127, 176, 105, 0.55)"
    : "rgba(107, 143, 181, 0.45)";
  const accentGlow = rebalanced
    ? "0 0 24px rgba(127, 176, 105, 0.25), var(--shadow-elevated)"
    : "var(--shadow-elevated)";
  const segments = [
    { label: "Diversification", value: components.diversification, color: scoreColor(components.diversification) },
    { label: "Fees", value: components.fees, color: scoreColor(components.fees) },
    { label: "Goal fit", value: components.goalAlignment, color: scoreColor(components.goalAlignment) },
  ];

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <AnimatedDownloadButton
        score={riskScore}
        status={analysis.status}
        label="Portfolio Health"
        segments={segments}
        size={58}
        compact
        reducedMotion={reducedMotion}
        panelOpen={open}
        onClick={() => setOpen((next) => !next)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: -4 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: motionDuration(reducedMotion, 0.18) }}
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              width: 280,
              zIndex: 50,
              padding: "var(--space-4)",
              borderRadius: 14,
              border: `1px solid ${accentBorder}`,
              background: "var(--bg-elevated)",
              boxShadow: accentGlow,
              transition: "border-color 280ms ease, box-shadow 280ms ease",
            }}
            role="dialog"
            aria-label="Portfolio health insights"
          >
            <p style={{ ...panelEyebrow, color: accentColor, transition: "color 280ms ease" }}>
              Portfolio Health Insights
            </p>
            <p style={panelBody}>{summaryFor(overallScore)}</p>
            <div style={riskSection}>
              <div style={scoreRow}>
                <span style={{ ...panelLabel, color: riskColor }}>Risk level</span>
                <span style={{ ...panelValue, color: riskColor }}>{riskScore}/100</span>
              </div>
              <p style={riskText}>{riskMessage(analysis.status)}</p>
              <Button
                type="button"
                size="sm"
                onClick={rebalance}
                disabled={rebalanced}
                className={
                  rebalanced
                    ? "h-8 w-full border border-[color:var(--signal-positive)] bg-[color:var(--signal-positive)]/15 text-[color:var(--signal-positive)] transition-colors disabled:opacity-100"
                    : "h-8 w-full bg-primary text-primary-foreground shadow-glow-gold transition-colors hover:bg-primary/90"
                }
              >
                {rebalanced ? "Rebalanced ✓" : "Rebalance"}
              </Button>
            </div>
            <div style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
              {segments.map((segment) => (
                <div key={segment.label} style={{ display: "grid", gap: 4 }}>
                  <div style={scoreRow}>
                    <span style={panelLabel}>{segment.label}</span>
                    <span style={{ ...panelValue, color: segment.color }}>{Math.round(segment.value)}/100</span>
                  </div>
                  <div style={track}>
                    <span
                      style={{
                        ...fill,
                        width: `${Math.max(4, Math.min(100, segment.value))}%`,
                        background: segment.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: motionDuration(reducedMotion, 0.18) }}
            style={toast}
            role="status"
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
              <p style={toastTitle}>Portfolio rebalanced</p>
              <button type="button" onClick={clearResult} aria-label="Close rebalance summary" style={closeButton}>
                x
              </button>
            </div>
            <p style={toastBody}>
              {lastResult.alreadyClose
                ? "Your portfolio was already close to your comfort zone, so Lucid kept the changes minimal."
                : "We reduced exposure to high-volatility stocks and moved more of your portfolio into broad market funds, bonds, and cash."}
            </p>
            <div style={toastGrid}>
              <span>Before risk</span>
              <strong>{Math.round(lastResult.beforeRiskFitScore)}/100</strong>
              <span>After risk</span>
              <strong style={{ color: "var(--signal-positive)" }}>{Math.round(lastResult.afterRiskFitScore)}/100</strong>
              <span>Moved out of risky stocks</span>
              <strong>{formatUSD(lastResult.amountMovedOutOfRisky, { decimals: 0 })}</strong>
              <span>Moved into safer assets</span>
              <strong>{formatUSD(lastResult.amountMovedIntoSafer, { decimals: 0 })}</strong>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function scoreColor(value: number) {
  if (value >= 75) return "var(--signal-positive)";
  if (value >= 40) return "var(--signal-warning)";
  return "var(--signal-negative)";
}

function riskStatusColor(status: "optimized" | "caution" | "risky") {
  if (status === "optimized") return "var(--signal-positive)";
  if (status === "caution") return "var(--signal-warning)";
  return "var(--signal-negative)";
}

function riskMessage(status: "optimized" | "caution" | "risky") {
  if (status === "optimized") {
    return "Risk is now closer to your comfort zone. Your portfolio is more balanced across stocks, bonds, and cash.";
  }
  if (status === "caution") {
    return "Risk is close, but not perfect yet. A small shift toward steadier assets could make it easier to hold through a drop.";
  }
  return "Risk is above your comfort zone. Your portfolio is concentrated in high-volatility stocks, so a market drop could hurt more than expected.";
}

function summaryFor(value: number) {
  if (value >= 80) return "Your portfolio looks strong across the beginner checks.";
  if (value >= 60) return "Your portfolio is mostly steady, with a few places to improve.";
  if (value >= 40) return "Your portfolio needs a checkup. Start with the lowest score below.";
  return "Your portfolio needs care before it can feel beginner-safe.";
}

const panelEyebrow: CSSProperties = {
  margin: 0,
  color: "var(--gold-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const panelBody: CSSProperties = {
  margin: "var(--space-2) 0 0",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: 1.45,
};

const panelLabel: CSSProperties = {
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
};

const panelValue: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  fontVariantNumeric: "tabular-nums",
};

const scoreRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--space-3)",
  alignItems: "baseline",
};

const riskSection: CSSProperties = {
  display: "grid",
  gap: "var(--space-2)",
  marginTop: "var(--space-3)",
  paddingTop: "var(--space-3)",
  borderTop: "1px solid var(--border-subtle)",
};

const riskText: CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 12.5,
  lineHeight: 1.4,
};

const rebalanceButton: CSSProperties = {
  width: "100%",
  border: "1px solid var(--gold-primary)",
  borderRadius: 999,
  background: "linear-gradient(180deg, var(--gold-primary), var(--gold-muted))",
  color: "var(--bg-base)",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.2,
  padding: "11px 14px",
  marginTop: "var(--space-2)",
  boxShadow: "var(--shadow-glow-gold)",
};

const toast: CSSProperties = {
  position: "fixed",
  top: 24,
  right: 24,
  width: 330,
  maxWidth: "calc(100vw - 32px)",
  zIndex: 100,
  padding: "var(--space-4)",
  borderRadius: 16,
  border: "1px solid var(--border-emphasis)",
  background: "var(--bg-elevated)",
  boxShadow: "var(--shadow-elevated)",
};

const toastTitle: CSSProperties = {
  margin: 0,
  color: "var(--gold-primary)",
  fontFamily: "var(--font-display)",
  fontSize: 18,
  fontWeight: 400,
};

const closeButton: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--text-tertiary)",
  cursor: "pointer",
  fontSize: 20,
  lineHeight: 1,
  padding: 0,
};

const toastBody: CSSProperties = {
  margin: "var(--space-2) 0 var(--space-3)",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: 1.45,
};

const toastGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "6px var(--space-3)",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
};

const track: CSSProperties = {
  height: 5,
  borderRadius: 999,
  background: "var(--bg-inset)",
  overflow: "hidden",
};

const fill: CSSProperties = {
  display: "block",
  height: "100%",
  borderRadius: 999,
};
