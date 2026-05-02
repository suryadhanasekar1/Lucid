"use client";

import { useCallback, useState } from "react";
import type { FundHoldings } from "@/types";

interface ApiResponse {
  fund: FundHoldings | null;
  source: "cache" | "edgar" | "miss";
}

export function useFundXRay(): {
  fundData: FundHoldings | null;
  loading: boolean;
  fetchFund: (ticker: string) => Promise<void>;
} {
  const [fundData, setFundData] = useState<FundHoldings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFund = useCallback(async (ticker: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/funds/holdings?ticker=${encodeURIComponent(ticker)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setFundData(null);
        return;
      }
      const data = (await res.json()) as ApiResponse;
      setFundData(data.fund);
    } catch {
      setFundData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fundData, loading, fetchFund };
}
