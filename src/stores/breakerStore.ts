import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SellAction } from "@/types";

export const COUNTDOWN_SECONDS = 60;
export const REASON_MIN_LENGTH = 12;

export type BreakerOutcome = {
  ts: number;
  action: SellAction;
  decision: "cancelled" | "proceeded";
  typedReason?: string;
  breachedThreshold?: boolean;
};

interface BreakerStore {
  /** True while the modal countdown is running. */
  active: boolean;
  /** Remaining seconds in the cooldown. */
  countdown: number;
  /** The action that triggered the breaker. */
  action: SellAction | null;
  /** Optional flag — set true if this sale would push the user past their pain threshold. */
  breachedThreshold: boolean;
  /** History of resolved breaker events. Used by Anti-Panic Streak / audit. */
  history: BreakerOutcome[];

  start: (action: SellAction, opts?: { breachedThreshold?: boolean }) => void;
  tick: () => void;
  cancel: () => void;
  proceed: (typedReason: string) => void;
}

export const useBreakerStore = create<BreakerStore>()(
  persist(
    (set, get) => ({
      active: false,
      countdown: 0,
      action: null,
      breachedThreshold: false,
      history: [],

      start: (action, opts) => {
        // Re-triggering while active is a no-op — preserve the existing countdown.
        if (get().active) return;
        set({
          active: true,
          countdown: COUNTDOWN_SECONDS,
          action,
          breachedThreshold: !!opts?.breachedThreshold,
        });
      },

      tick: () => {
        const { active, countdown } = get();
        if (!active) return;
        if (countdown <= 1) {
          set({ countdown: 0 });
          return;
        }
        set({ countdown: countdown - 1 });
      },

      cancel: () => {
        const { active, action, history, breachedThreshold } = get();
        if (!active || !action) {
          set({ active: false, countdown: 0, action: null, breachedThreshold: false });
          return;
        }
        set({
          active: false,
          countdown: 0,
          action: null,
          breachedThreshold: false,
          history: [
            ...history,
            { ts: Date.now(), action, decision: "cancelled" as const, breachedThreshold },
          ].slice(-50),
        });
      },

      proceed: (typedReason: string) => {
        const { active, action, history, countdown, breachedThreshold } = get();
        if (!active || !action) return;
        if (countdown > 0) return; // gate: can't proceed until timer is done
        if (typedReason.trim().length < REASON_MIN_LENGTH) return; // gate: typed reason required
        set({
          active: false,
          countdown: 0,
          action: null,
          breachedThreshold: false,
          history: [
            ...history,
            { ts: Date.now(), action, decision: "proceeded" as const, typedReason: typedReason.trim(), breachedThreshold },
          ].slice(-50),
        });
      },
    }),
    {
      name: "compass:breaker",
      storage: createJSONStorage(() => localStorage),
      // Don't restore an in-flight cooldown across page loads; only history persists.
      partialize: (s) => ({ history: s.history }),
    },
  ),
);
