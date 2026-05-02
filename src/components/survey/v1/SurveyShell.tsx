"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { SURVEY_STEPS, type SurveyStep } from "@/stores/userStore";
import { motionDuration, usePrefersReducedMotion } from "@/lib/a11y";

interface Props {
  step: SurveyStep;
  children: ReactNode;
}

export function SurveyShell({ step, children }: Props) {
  const stepIndex = SURVEY_STEPS.indexOf(step);
  const totalSteps = SURVEY_STEPS.length - 1; // welcome doesn't count toward progress
  const progressIndex = Math.max(0, stepIndex - 1);
  const reducedMotion = usePrefersReducedMotion();
  const prevIndexRef = useRef(stepIndex);
  const direction = stepIndex >= prevIndexRef.current ? 1 : -1;
  prevIndexRef.current = stepIndex;
  const slideDistance = 32;
  const variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir * slideDistance,
      scale: 0.985,
      filter: "blur(6px)",
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir * -slideDistance,
      scale: 0.985,
      filter: "blur(6px)",
    }),
  };

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
            justifyContent: "flex-end",
            marginBottom: "var(--space-12)",
          }}
        >
          <ProgressDots total={totalSteps} index={progressIndex} />
        </header>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={reducedMotion ? undefined : variants}
            initial={reducedMotion ? { opacity: 0 } : "enter"}
            animate={reducedMotion ? { opacity: 1 } : "center"}
            exit={reducedMotion ? { opacity: 0 } : "exit"}
            transition={{
              duration: motionDuration(reducedMotion, 0.42),
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ willChange: "transform, opacity, filter" }}
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
