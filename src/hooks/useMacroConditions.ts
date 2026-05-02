"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MacroSnapshot } from "@/types";

interface ApiResponse {
  snapshot: MacroSnapshot;
  source: "fred" | "cache" | "fallback";
}

export function useMacroConditions(): {
  conditions: MacroSnapshot | null;
  loading: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
} {
  const [conditions, setConditions] = useState<MacroSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const initialized = useRef(false);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/macro/conditions", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ApiResponse;
      setConditions(data.snapshot);
      setLastUpdated(new Date(data.snapshot.fetchedAt));
    } catch {
      // hold the previous snapshot if we have one
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void refresh();
  }, [refresh]);

  return { conditions, loading, lastUpdated, refresh };
}
