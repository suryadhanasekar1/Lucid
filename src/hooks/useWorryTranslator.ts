"use client";

import { useCallback, useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePortfolio } from "@/hooks/usePortfolio";
import type { WorryResponse } from "@/types";

export function useWorryTranslator(): {
  response: WorryResponse | null;
  loading: boolean;
  error: Error | null;
  ask: (input: string) => Promise<void>;
  clear: () => void;
} {
  const { profile } = useUserProfile();
  const { totalValue } = usePortfolio();
  const [response, setResponse] = useState<WorryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const ask = useCallback(
    async (input: string) => {
      const worry = input.trim();
      if (!worry) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/claude/translate-worry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            worry,
            profile,
            totalValue,
          }),
        });
        if (!res.ok) {
          throw new Error(`worry_translator_${res.status}`);
        }
        const data = (await res.json()) as WorryResponse;
        setResponse(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("worry_translator_failed"));
        setResponse(null);
      } finally {
        setLoading(false);
      }
    },
    [profile, totalValue],
  );

  const clear = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return { response, loading, error, ask, clear };
}
