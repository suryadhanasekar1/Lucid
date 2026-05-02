"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { SURVEY_STEPS, type SurveyStep } from "@/stores/userStore";

interface Props {
  step: SurveyStep;
  children: ReactNode;
}

export function SurveyShell({ step, children }: Props) {
  const stepIndex = SURVEY_STEPS.indexOf(step);
  const totalSteps = SURVEY_STEPS.length - 1; // welcome doesn't count toward progress
  const progressIndex = Math.max(0, stepIndex - 1);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        padding: "clamp(28px, 6vh, 48px) clamp(18px, 5vw, 32px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720 }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-12)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--gold-primary)",
            }}
          >
            Lucid
          </span>
          <ProgressDots total={totalSteps} index={progressIndex} />
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function ProgressDots({ total, index }: { total: number; index: number }) {
  return (
    <div style={{ display: "flex", gap: "var(--space-2)" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background:
              i < index
                ? "var(--gold-muted)"
                : i === index
                  ? "var(--gold-primary)"
                  : "var(--border-default)",
            transition: "background 240ms ease",
          }}
        />
      ))}
    </div>
  );
}
