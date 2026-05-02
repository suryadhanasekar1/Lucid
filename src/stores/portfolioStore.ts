import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ActionCard } from "@/lib/agents/portfolioMonitor";
import type { GridLayout, Holding, PortfolioSource } from "@/types";

interface PortfolioStore {
  holdings: Holding[];
  totalValue: number;
  source: PortfolioSource;
  loading: boolean;
  error: Error | null;

  // SnapTrade auth — only ever set after successful register/connect.
  snaptrade: { userId: string; userSecret: string } | null;

  // Persistent layout / active widget set, keyed implicitly by current profile.
  activeWidgets: string[];
  /** Widget ids the user has explicitly removed via the picker. The auto-add
   * effect respects this so a removed widget doesn't get reseeded. */
  dismissedWidgets: string[];
  layout: GridLayout;
  actionCards: ActionCard[];

  setHoldings: (holdings: Holding[], source: PortfolioSource) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setSnaptrade: (creds: { userId: string; userSecret: string } | null) => void;
  setActiveWidgets: (ids: string[]) => void;
  setDismissedWidgets: (ids: string[]) => void;
  setLayout: (layout: GridLayout) => void;
  addActionCard: (card: ActionCard) => void;
  dismissActionCard: (id: string) => void;
  clearActionCards: () => void;
  reset: () => void;
}

const computeTotal = (holdings: Holding[]) =>
  holdings.reduce((sum, h) => sum + h.value, 0);

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set) => ({
      holdings: [],
      totalValue: 0,
      source: "none",
      loading: false,
      error: null,
      snaptrade: null,
      activeWidgets: [],
      dismissedWidgets: [],
      layout: [],
      actionCards: [],

      setHoldings: (holdings, source) =>
        set({ holdings, source, totalValue: computeTotal(holdings), error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSnaptrade: (snaptrade) => set({ snaptrade }),
      setActiveWidgets: (activeWidgets) => set({ activeWidgets }),
      setDismissedWidgets: (dismissedWidgets) => set({ dismissedWidgets }),
      setLayout: (layout) => set({ layout }),
      addActionCard: (card) =>
        set((s) => ({
          actionCards: s.actionCards.some((existing) => existing.id === card.id)
            ? s.actionCards
            : [card, ...s.actionCards],
        })),
      dismissActionCard: (id) =>
        set((s) => ({
          actionCards: s.actionCards.map((card) =>
            card.id === id ? { ...card, dismissed: true } : card,
          ),
        })),
      clearActionCards: () => set({ actionCards: [] }),
      reset: () =>
        set({
          holdings: [],
          totalValue: 0,
          source: "none",
          loading: false,
          error: null,
          snaptrade: null,
          activeWidgets: [],
          dismissedWidgets: [],
          layout: [],
          actionCards: [],
        }),
    }),
    {
      name: "compass:portfolio",
      // Bumped when layout/sizing logic changes — drops old saved layouts so
      // users get the new bin-packed layout on next load.
      version: 5,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        // Drop the saved layout + active set so they re-seed via buildInitialLayout.
        return { ...p, layout: [], activeWidgets: [] };
      },
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage,
      ),
      // Don't persist transient runtime state — only credentials, layout, widget set.
      partialize: (state) => ({
        snaptrade: state.snaptrade,
        activeWidgets: state.activeWidgets,
        dismissedWidgets: state.dismissedWidgets,
        layout: state.layout,
        actionCards: state.actionCards,
      }),
    },
  ),
);
