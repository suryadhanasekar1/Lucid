"use client";

import { useUserStore } from "@/stores/userStore";
import type { UIMode } from "@/types";

export function useAdaptiveMode(): {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  isEssentials: boolean;
  isInvestor: boolean;
  isAnalyst: boolean;
} {
  const mode = useUserStore((s) => s.uiMode);
  const setMode = useUserStore((s) => s.setUiMode);

  return {
    mode,
    setMode,
    isEssentials: mode === "essentials",
    isInvestor: mode === "investor",
    isAnalyst: mode === "analyst",
  };
}
