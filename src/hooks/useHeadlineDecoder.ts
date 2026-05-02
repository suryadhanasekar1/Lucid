"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePortfolio } from "@/hooks/usePortfolio";
import type { Headline, HeadlineDecoded } from "@/types";

export function useHeadlineDecoder(): {
  trending: Headline[];
  decoded: HeadlineDecoded | null;
  loading: boolean;
  decode: (headlineId: string) => Promise<void>;
  refreshTrending: () => Promise<void>;
} {
  const { profile } = useUserProfile();
  const { holdings } = usePortfolio();
  const [trending, setTrending] = useState<Headline[]>([]);
  const [decoded, setDecoded] = useState<HeadlineDecoded | null>(null);
  const [loading, setLoading] = useState(false);
  const trendingRef = useRef<Headline[]>([]);

  const refreshTrending = useCallback(async () => {
    try {
      const res = await fetch("/api/news/trending");
      if (!res.ok) return;
      const data = (await res.json()) as { headlines: Headline[] };
      setTrending(data.headlines ?? []);
      trendingRef.current = data.headlines ?? [];
    } catch {
      /* swallow */
    }
  }, []);

  // auto-load on mount
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void refreshTrending();
  }, [refreshTrending]);

  const decode = useCallback(
    async (headlineId: string) => {
      const headline = trendingRef.current.find((h) => h.id === headlineId);
      if (!headline) return;
      setLoading(true);
      try {
        const res = await fetch("/api/claude/decode-headline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headline,
            profile,
            tickers: holdings.map((h) => h.ticker),
          }),
        });
        if (!res.ok) {
          setDecoded(null);
          return;
        }
        const data = (await res.json()) as HeadlineDecoded;
        setDecoded(data);
      } catch {
        setDecoded(null);
      } finally {
        setLoading(false);
      }
    },
    [profile, holdings],
  );

  return { trending, decoded, loading, decode, refreshTrending };
}
