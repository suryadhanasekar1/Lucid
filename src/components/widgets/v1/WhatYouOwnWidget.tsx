"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { useUserStore } from "@/stores/userStore";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { foundationFrontier } from "@/lib/portfolio/calculations";
import { formatPct } from "@/lib/utils";

export function WhatYouOwnWidget() {
  const { holdings, totalValue } = usePortfolio();
  const profile = useUserStore((s) => s.profile);
  const def = WIDGETS_BY_ID["what_you_own"]!;
  const ff = foundationFrontier(holdings);
  const fundCount = holdings.filter((h) => h.type === "etf" || h.type === "mutual_fund").length;
  const stockCount = holdings.filter((h) => h.type === "stock").length;
  const equityShare = totalValue > 0 ? (ff.foundationValue + ff.frontierValue - holdings.filter(h => h.type === "bond" || h.type === "cash").reduce((s, h) => s + h.value, 0)) / totalValue : 0;
  const horizon = profile?.answers.timelineYears ?? 10;

  const sentence1 = holdings.length === 0
    ? "You don't have any holdings yet — connect your brokerage or use the sample portfolio to get started."
    : `You own ${holdings.length} positions: ${fundCount} fund${fundCount === 1 ? "" : "s"}${stockCount > 0 ? ` and ${stockCount} single stock${stockCount === 1 ? "" : "s"}` : ""}.`;

  const sentence2 = totalValue > 0
    ? `${formatPct(equityShare, 0)} sits in stocks (most growth, most swings) and the rest in bonds and cash (steadier).`
    : "";

  const sentence3 = horizon >= 15
    ? `With a ${horizon}-year horizon, short drops matter less than getting the long-term mix right.`
    : `With a ${horizon}-year horizon, big stock swings matter more — your bond and cash buffer is doing real work.`;

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="In 3 Sentences">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p style={para}>{sentence1}</p>
        {sentence2 && <p style={para}>{sentence2}</p>}
        <p style={para}>{sentence3}</p>
      </div>
    </WidgetCard>
  );
}

const para: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 15,
  color: "var(--text-primary)",
  lineHeight: 1.5,
  margin: 0,
};
