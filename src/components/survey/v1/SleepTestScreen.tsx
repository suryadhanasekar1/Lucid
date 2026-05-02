"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PrimaryButton } from "./PrimaryButton";

interface Props {
  startingValue: number;
  /** Captured pain threshold dollar value, if already captured. */
  painThreshold?: number;
  onCapture: (painThreshold: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAX_DROP = 0.6; // 60%

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function lerpColor(t: number) {
  // off-white #F5F5F0 → terracotta #C76B5A
  const from = [245, 245, 240];
  const to = [199, 107, 90];
  const r = Math.round(from[0]! + (to[0]! - from[0]!) * t);
  const g = Math.round(from[1]! + (to[1]! - from[1]!) * t);
  const b = Math.round(from[2]! + (to[2]! - from[2]!) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function SleepTestScreen({
  startingValue,
  painThreshold,
  onCapture,
  onNext,
  onBack,
}: Props) {
  // crash = fraction of starting value that has been wiped (0..0.6)
  const [crash, setCrash] = useState(0);
  const [captured, setCaptured] = useState<number | null>(painThreshold ?? null);
  const lastPulseValue = useRef<number>(startingValue);

  const currentValue = Math.round(startingValue * (1 - crash));
  const loss = startingValue - currentValue;
  const t = crash / MAX_DROP; // 0..1
  const valueColor = lerpColor(t);
  const lossColor = "var(--signal-negative)";
  const bgOverlayAlpha = 0.18 * t; // background gradient deepens darker red

  // Pulse every $1k drop
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    const drop = lastPulseValue.current - currentValue;
    if (Math.abs(drop) >= 1000) {
      lastPulseValue.current = currentValue;
      setPulseKey((k) => k + 1);
    }
  }, [currentValue]);

  // Slider drags LEFT to crash → invert: slider value 100 = no crash, 0 = max crash.
  // We render via a custom mapping for clarity.
  const sliderValue = Math.round((1 - crash / MAX_DROP) * 100);

  return (
    <section
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-8)",
      }}
    >
      <motion.div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(circle at 50% 30%, rgba(199, 107, 90, ${bgOverlayAlpha}) 0%, rgba(0,0,0,0) 60%)`,
          zIndex: 0,
          transition: "background 200ms ease",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginBottom: "var(--space-3)",
          }}
        >
          Step 5 of 9 · The Sleep Test
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 32,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            maxWidth: 620,
          }}
        >
          Imagine you have $25,000 invested. Drag the slider down. Stop when your
          stomach starts to hurt.
        </h1>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: 16,
          padding: "var(--space-8)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginBottom: "var(--space-4)",
          }}
        >
          Your portfolio
        </p>

        <motion.div
          key={pulseKey}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: 72,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: valueColor,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${currentValue.toLocaleString()}
        </motion.div>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            fontSize: 16,
            color: lossColor,
            marginTop: "var(--space-3)",
            opacity: crash === 0 ? 0 : 1,
            transition: "opacity 200ms ease",
          }}
        >
          Loss: -${loss.toLocaleString()}
        </div>

        <div style={{ marginTop: "var(--space-8)" }}>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderValue}
            onChange={(e) => {
              const v = Number(e.target.value);
              const nextCrash = clamp((1 - v / 100) * MAX_DROP, 0, MAX_DROP);
              setCrash(nextCrash);
              setCaptured(null);
            }}
            style={{
              width: "100%",
              accentColor: crash > 0 ? "var(--signal-negative)" : "var(--gold-primary)",
            }}
            aria-label="Crash slider"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "var(--space-2)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-tertiary)",
            }}
          >
            <span>Crash to -60%</span>
            <span>No drop</span>
          </div>
        </div>

        <div style={{ marginTop: "var(--space-8)" }}>
          <PrimaryButton
            disabled={crash === 0}
            onClick={() => {
              const value = Math.round(startingValue * (1 - crash));
              setCaptured(value);
              onCapture(value);
            }}
          >
            Stop — this is where it hurts
          </PrimaryButton>
        </div>
      </div>

      <AnimatePresence>
        {captured !== null && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "relative",
              zIndex: 1,
              background: "var(--bg-elevated-2)",
              border: "1px solid var(--border-emphasis)",
              borderRadius: 16,
              padding: "var(--space-6) var(--space-8)",
              boxShadow: "var(--shadow-glow-gold)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold-primary)" }}>
                ${captured.toLocaleString()}
              </span>{" "}
              is your pain threshold. We&apos;ll keep you above this 95% of the time.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "var(--space-3)" }}>
        <PrimaryButton variant="ghost" onClick={onBack}>
          Back
        </PrimaryButton>
        <PrimaryButton disabled={captured === null} onClick={onNext}>
          Continue
        </PrimaryButton>
      </div>
    </section>
  );
}
