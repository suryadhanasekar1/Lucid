"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useFundXRay } from "@/hooks/useFundXRay";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { Skeleton } from "@/components/shared/v1/Skeleton";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatPct } from "@/lib/utils";

const FUND_TYPES = new Set(["mutual_fund", "etf"]);

export function MutualFundXRayWidget() {
  const { holdings } = usePortfolio();
  const def = WIDGETS_BY_ID["mutual_fund_xray"]!;
  const { fundData, loading, fetchFund } = useFundXRay();

  const tickers = useMemo(
    () =>
      holdings
        .filter((h) => FUND_TYPES.has(h.type))
        .map((h) => h.ticker),
    [holdings],
  );
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const next = tickers[0] ?? null;
    setActive(next);
    if (next) void fetchFund(next);
  }, [tickers, fetchFund]);

  const onPick = (t: string) => {
    setActive(t);
    void fetchFund(t);
  };

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="X-Ray">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", height: "100%" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {tickers.length === 0 && (
            <p style={empty}>You don&apos;t hold any funds right now — add one to see what&apos;s inside.</p>
          )}
          {tickers.map((t) => {
            const selected = t === active;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onPick(t)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  background: selected ? "var(--gold-glow)" : "transparent",
                  border: `1px solid ${selected ? "var(--border-emphasis)" : "var(--border-default)"}`,
                  color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }} role="status" aria-label="Loading filing">
            <Skeleton width="40%" height={11} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <Skeleton width="55%" height={10} />
                <Skeleton width="22%" height={10} />
              </div>
            ))}
          </div>
        )}

        {!loading && fundData && (
          <div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--text-tertiary)",
                marginBottom: "var(--space-2)",
              }}
            >
              Top {fundData.holdings.length} of {fundData.totalHoldings.toLocaleString()} holdings · {fundData.fundName}
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {fundData.holdings.map((h) => (
                <li
                  key={h.ticker}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr auto",
                    gap: "var(--space-3)",
                    padding: "6px 0",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{h.ticker}</span>
                  <span>{h.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {formatPct(h.weight, 2)}
                  </span>
                </li>
              ))}
            </ul>
            <p
              style={{
                marginTop: "var(--space-3)",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--text-tertiary)",
              }}
            >
              Source: {fundData.fundTicker} Form N-PORT, filed {fundData.asOf}. Compass pulls this directly from SEC.gov.
            </p>
          </div>
        )}

        {!loading && !fundData && active && (
          <p style={empty}>No filing on file for {active} yet.</p>
        )}
      </div>
    </WidgetCard>
  );
}

const empty: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--text-secondary)",
  margin: 0,
};
