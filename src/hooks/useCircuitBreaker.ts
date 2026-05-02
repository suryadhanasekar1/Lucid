"use client";

import { useEffect } from "react";
import { useBreakerStore, COUNTDOWN_SECONDS, REASON_MIN_LENGTH } from "@/stores/breakerStore";
import type { SellAction } from "@/types";

export { COUNTDOWN_SECONDS, REASON_MIN_LENGTH };

/**
 * useCircuitBreaker — 60-second cooldown + typed-reason gate before any sell.
 *
 * Flow:
 *   1. Caller invokes `trigger(action, {breachedThreshold?})` when a sale is attempted.
 *      The store flips `active` to true and starts a 60s countdown.
 *   2. The CircuitBreakerModal renders while `active` and watches `countdown`.
 *   3. `proceed(typedReason)` is gated: countdown must hit 0 AND reason >= 12 chars.
 *   4. `cancel()` is always available — that's the calm-down outcome we hope for.
 *
 * Both decisions are appended to a persisted `history` so Anti-Panic Streak + audit
 * widgets can read them later.
 */
export function useCircuitBreaker(): {
  active: boolean;
  countdown: number;
  reason: string;
  breachedThreshold: boolean;
  action: SellAction | null;
  trigger: (action: SellAction, opts?: { breachedThreshold?: boolean }) => void;
  proceed: (typedReason: string) => void;
  cancel: () => void;
  history: Array<{ ts: number; decision: "cancelled" | "proceeded" }>;
} {
  const active = useBreakerStore((s) => s.active);
  const countdown = useBreakerStore((s) => s.countdown);
  const action = useBreakerStore((s) => s.action);
  const breachedThreshold = useBreakerStore((s) => s.breachedThreshold);
  const history = useBreakerStore((s) => s.history);
  const start = useBreakerStore((s) => s.start);
  const tick = useBreakerStore((s) => s.tick);
  const cancelStore = useBreakerStore((s) => s.cancel);
  const proceedStore = useBreakerStore((s) => s.proceed);

  // Drive the countdown.
  useEffect(() => {
    if (!active) return;
    if (countdown <= 0) return;
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [active, countdown, tick]);

  return {
    active,
    countdown,
    reason: action?.reasonClaimed ?? "",
    breachedThreshold,
    action,
    trigger: (act, opts) => start(act, opts),
    proceed: (typedReason: string) => proceedStore(typedReason),
    cancel: () => cancelStore(),
    history: history.map((h) => ({ ts: h.ts, decision: h.decision })),
  };
}
