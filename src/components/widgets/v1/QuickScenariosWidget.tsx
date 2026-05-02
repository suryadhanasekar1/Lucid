"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useScenario } from "@/hooks/useScenario";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { TaxHarvestAlert } from "@/components/shared/v1/TaxHarvestAlert";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatUSD, formatPct } from "@/lib/utils";

export function QuickScenariosWidget() {
  const { scenarios, current, loading, run, clear } = useScenario();
  const def = WIDGETS_BY_ID["quick_scenarios"]!;

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="What If">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {scenarios.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => run(s.id)}
                disabled={loading}
                style={{
                  textAlign: "left",
                  width: "100%",
                  padding: "var(--space-3) var(--space-4)",
                  background: "transparent",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  cursor: loading ? "wait" : "pointer",
                  transition: "border-color 180ms ease, background 180ms ease",
                }}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>

        <AnimatePresence>
          {current && (
            <motion.div
              key={current.scenarioId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: "var(--bg-elevated-2)",
                border: "1px solid var(--border-emphasis)",
                borderRadius: 12,
                padding: "var(--space-4) var(--space-6)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "var(--space-4)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-tertiary)", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Projected
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 300,
                      fontSize: 32,
                      margin: 0,
                      color: current.deltaPct < 0 ? "var(--signal-negative)" : "var(--text-primary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatUSD(Math.round(current.endingValue))}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: current.deltaPct < 0 ? "var(--signal-negative)" : "var(--signal-positive)", margin: 0 }}>
                    {current.deltaPct >= 0 ? "+" : ""}
                    {formatPct(current.deltaPct, 1)}
                  </p>
                  <button
                    type="button"
                    onClick={clear}
                    style={{
                      marginTop: 8,
                      background: "transparent",
                      border: "1px solid var(--border-default)",
                      borderRadius: 999,
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  marginTop: "var(--space-3)",
                  marginBottom: 0,
                }}
              >
                {current.narrative}
              </p>
              {current.groundedIn && (current.groundedIn.cpi !== undefined || current.groundedIn.fedFundsRate !== undefined) && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    marginTop: "var(--space-2)",
                    marginBottom: 0,
                  }}
                >
                  Grounded in FRED: CPI {current.groundedIn.cpi}% · DFF {current.groundedIn.fedFundsRate}% · 10y {current.groundedIn.treasury10y}%
                </p>
              )}
              <div style={{ marginTop: "var(--space-3)" }}>
                <TaxHarvestAlert />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WidgetCard>
  );
}
