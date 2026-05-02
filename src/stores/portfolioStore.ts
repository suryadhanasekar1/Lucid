import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  layout: GridLayout;

  setHoldings: (holdings: Holding[], source: PortfolioSource) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setSnaptrade: (creds: { userId: string; userSecret: string } | null) => void;
  setActiveWidgets: (ids: string[]) => void;
  setLayout: (layout: GridLayout) => void;
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
      layout: [],

      setHoldings: (holdings, source) =>
        set({ holdings, source, totalValue: computeTotal(holdings), error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSnaptrade: (snaptrade) => set({ snaptrade }),
      setActiveWidgets: (activeWidgets) => set({ activeWidgets }),
      setLayout: (layout) => set({ layout }),
      reset: () =>
        set({
          holdings: [],
          totalValue: 0,
          source: "none",
          loading: false,
          error: null,
          snaptrade: null,
          activeWidgets: [],
          layout: [],
        }),
    }),
    {
      name: "compass:portfolio",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage,
      ),
      // Don't persist transient runtime state — only credentials, layout, widget set.
      partialize: (state) => ({
        snaptrade: state.snaptrade,
        activeWidgets: state.activeWidgets,
        layout: state.layout,
      }),
    },
  ),
);
