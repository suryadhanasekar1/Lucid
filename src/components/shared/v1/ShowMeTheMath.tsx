"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion, motionDuration } from "@/lib/a11y";

export interface MathRow {
  /** Left-hand label, e.g. "Diversification". */
  label: string;
  /** Right-hand value (already formatted). */
  value: string;
  /** Optional source citation, e.g. "FRED · CPIAUCSL". */
  source?: string;
}

interface Props {
  /** Plain-English summary of the formula. */
  formula: string;
  /** Inputs that fed the formula. */
  rows: MathRow[];
  /** Optional final result line, displayed at the bottom in gold. */
  result?: { label: string; value: string };
}

/**
 * Reusable disclosure: "Show me the math". Click to expand a panel listing
 * the inputs + formula + result + source citations. The point isn't to teach
 * arithmetic — it's to demonstrate that no number on the dashboard is a guess.
 */
export function ShowMeTheMath({ formula, rows, result }: Props) {
  const [open, setOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          alignSelf: "flex-start",
          background: "transparent",
          border: "none",
          padding: 0,
          color: "var(--gold-primary)",
          fontFamily: "var(--font-body)",
          fontSize: 12,
          fontWeight: 500,
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textUnderlineOffset: 3,
          cursor: "pointer",
        }}
      >
        {open ? "Hide the math" : "Show me the math"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, height: 0 }}
            animate={reducedMotion ? undefined : { opacity: 1, height: "auto" }}
            exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: motionDuration(reducedMotion, 0.2) }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                background: "var(--bg-elevated-2)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "var(--space-3)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                {formula}
              </p>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {rows.map((r) => (
                  <li
                    key={r.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    <span>{r.label}</span>
                    <span style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      {r.source && (
                        <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{r.source}</span>
                      )}
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{r.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {result && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: 6,
                    borderTop: "1px solid var(--border-subtle)",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "var(--gold-primary)",
                  }}
                >
                  <span>{result.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{result.value}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
