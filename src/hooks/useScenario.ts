"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { ScenarioPreset, ScenarioResult } from "@/types";

export function useScenario(): {
  scenarios: ScenarioPreset[];
  current: ScenarioResult | null;
  loading: boolean;
  run: (scenarioId: string) => Promise<void>;
  clear: () => void;
} {
  const profile = useUserStore((s) => s.profile);
  const holdings = usePortfolioStore((s) => s.holdings);
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>([]);
  const [current, setCurrent] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/portfolio/scenarios", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { scenarios: ScenarioPreset[] };
        if (!cancelled) setScenarios(data.scenarios);
      } catch {
        // hold previous list
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = useCallback(
    async (scenarioId: string) => {
      if (!profile || holdings.length === 0) return;
      setLoading(true);
      try {
        const res = await fetch("/api/portfolio/scenarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId, holdings, profile }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as ScenarioResult;
        setCurrent(data);
      } finally {
        setLoading(false);
      }
    },
    [profile, holdings],
  );

  const clear = useCallback(() => setCurrent(null), []);

  return { scenarios, current, loading, run, clear };
}
