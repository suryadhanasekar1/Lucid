"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCircuitBreaker, COUNTDOWN_SECONDS, REASON_MIN_LENGTH } from "@/hooks/useCircuitBreaker";
import { useFocusTrap, usePrefersReducedMotion, motionDuration } from "@/lib/a11y";

/**
 * The 60-second cooldown overlay. Renders globally; gates any sell decision.
 *
 * Locked while `active` is true:
 *   - "I'm sure, sell" button disabled until countdown hits 0
 *   - Even after, the user must type a >= 12-char reason
 *   - "Cancel" is always available (and the encouraged outcome)
 */
export function CircuitBreakerModal() {
  const { active, countdown, action, breachedThreshold, history, proceed, cancel } = useCircuitBreaker();
  const [typedReason, setTypedReason] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const last5 = history.slice(-5).reverse();
  const heldRecent = last5.filter((h) => h.decision === "cancelled").length;

  // Reset reason whenever a new event opens.
  useEffect(() => {
    if (active) setTypedReason("");
  }, [active]);

  // Trap keyboard focus inside the dialog while open; ESC cancels.
  useFocusTrap(active, dialogRef, { onEscape: cancel });

  // While the modal is open, prevent the body from scrolling underneath it.
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  const canProceed = countdown === 0 && typedReason.trim().length >= REASON_MIN_LENGTH;
  const elapsed = COUNTDOWN_SECONDS - countdown;
  const progressPct = Math.min(100, (elapsed / COUNTDOWN_SECONDS) * 100);

  return (
    <AnimatePresence>
      {active && action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionDuration(reducedMotion, 0.18) }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="breaker-title"
          aria-describedby="breaker-desc"
          ref={dialogRef}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(8, 8, 10, 0.78)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-6)",
          }}
        >
          <motion.div
            initial={reducedMotion ? false : { y: 12, scale: 0.985 }}
            animate={reducedMotion ? undefined : { y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { y: 8, opacity: 0 }}
            transition={{ duration: motionDuration(reducedMotion, 0.22), ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "min(560px, 100%)",
              background: "var(--bg-elevated)",
              border: `1px solid ${breachedThreshold ? "var(--signal-negative)" : "var(--border-default)"}`,
              borderRadius: 18,
              padding: "var(--space-8)",
              boxShadow: "var(--shadow-elevated)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-5)",
            }}
          >
            <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: breachedThreshold ? "var(--signal-negative)" : "var(--gold-primary)",
                  margin: 0,
                }}
              >
                Circuit breaker · 60-second pause
              </p>
              <h2
                id="breaker-title"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  fontSize: 32,
                  lineHeight: 1.15,
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Take a breath before selling{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold-primary)" }}>{action.ticker}</span>.
              </h2>
              {breachedThreshold && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "var(--signal-negative)",
                    margin: 0,
                  }}
                >
                  This sale would push your portfolio below the pain threshold you set in the Sleep Test.
                </p>
              )}
              {last5.length > 0 && (
                <div
                  style={{
                    background: "var(--bg-elevated-2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    padding: "var(--space-3)",
                    marginTop: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                  aria-label="Your last 5 sell attempts"
                >
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--text-tertiary)",
                      margin: 0,
                    }}
                  >
                    Your last {last5.length} sell attempt{last5.length === 1 ? "" : "s"} · {heldRecent} held the line
                  </p>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    {last5.map((h) => (
                      <li
                        key={h.ts}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                        }}
                      >
                        <span>
                          {new Date(h.ts).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        <span
                          style={{
                            color:
                              h.decision === "cancelled" ? "var(--signal-positive)" : "var(--signal-negative)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {h.decision === "cancelled" ? "Held" : "Sold"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p
                id="breaker-desc"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                Most panic sells look worse the next morning. Lucid holds the trade for one minute so you have a chance to walk away. Press Escape to cancel.
              </p>
            </header>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-4)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  fontSize: 56,
                  lineHeight: 1,
                  color: countdown === 0 ? "var(--signal-positive)" : "var(--text-primary)",
                  fontVariantNumeric: "tabular-nums",
                  width: 96,
                  textAlign: "center",
                }}
                aria-live="polite"
                aria-label={`${countdown} seconds remaining`}
              >
                {countdown}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <div
                  style={{
                    height: 6,
                    background: "var(--bg-elevated-2)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPct}%`,
                      height: "100%",
                      background: countdown === 0 ? "var(--signal-positive)" : "var(--gold-primary)",
                      transition: "width 1s linear",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    margin: 0,
                  }}
                >
                  {countdown === 0 ? "You can proceed now — but only if you type a real reason." : "Cooling off…"}
                </p>
              </div>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                Why are you selling? Type at least {REASON_MIN_LENGTH} characters.
              </span>
              <textarea
                value={typedReason}
                onChange={(e) => setTypedReason(e.target.value)}
                placeholder={`e.g. "I need cash for a down payment in three weeks"`}
                rows={3}
                maxLength={400}
                style={{
                  width: "100%",
                  resize: "vertical",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "var(--bg-elevated-2)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  lineHeight: 1.45,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color:
                    typedReason.trim().length >= REASON_MIN_LENGTH
                      ? "var(--signal-positive)"
                      : "var(--text-tertiary)",
                }}
              >
                {typedReason.trim().length}/{REASON_MIN_LENGTH}+
              </span>
            </label>

            <footer style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={cancel}
                style={{
                  padding: "12px 20px",
                  borderRadius: 999,
                  background: "var(--gold-primary)",
                  color: "var(--bg-base)",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel · keep holding
              </button>
              <button
                type="button"
                onClick={() => proceed(typedReason)}
                disabled={!canProceed}
                style={{
                  padding: "12px 20px",
                  borderRadius: 999,
                  background: "transparent",
                  color: canProceed ? "var(--signal-negative)" : "var(--text-tertiary)",
                  border: `1px solid ${canProceed ? "var(--signal-negative)" : "var(--border-subtle)"}`,
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: canProceed ? "pointer" : "not-allowed",
                  opacity: canProceed ? 1 : 0.6,
                }}
                aria-disabled={!canProceed}
              >
                I&apos;m sure, sell anyway
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
