"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";

const STOCK_TYPES = new Set(["stock", "etf", "mutual_fund"]);

export function WhatYouOwnWidget() {
  const { holdings, totalValue } = usePortfolio();

  const fundCount = holdings.filter((h) => h.type === "etf" || h.type === "mutual_fund").length;
  const stockCount = holdings.filter((h) => h.type === "stock").length;
  const steadyValue = holdings
    .filter((h) => h.type === "bond" || h.type === "cash")
    .reduce((sum, h) => sum + h.value, 0);
  const growthValue = holdings
    .filter((h) => STOCK_TYPES.has(h.type))
    .reduce((sum, h) => sum + h.value, 0);
  const growthPct = totalValue > 0 ? growthValue / totalValue : 0;
  const steadyPct = totalValue > 0 ? steadyValue / totalValue : 0;
  const largest = [...holdings].sort((a, b) => b.value - a.value)[0];
  const largestPct = largest && totalValue > 0 ? largest.value / totalValue : 0;

  const sentences =
    holdings.length === 0
      ? ["Connect a portfolio or load the sample to see what you own in plain English."]
      : [
          `You own ${holdings.length} positions: ${fundCount} fund${fundCount === 1 ? "" : "s"}${
            stockCount > 0 ? ` and ${stockCount} individual stock${stockCount === 1 ? "" : "s"}` : ""
          }.`,
          `${formatPct(growthPct)} is in growth assets like stocks and funds, while ${formatPct(
            steadyPct,
          )} is in steadier bonds and cash.`,
          largestPct > 0.35
            ? `${largest?.name ?? "Your largest holding"} is doing a lot of the work, so that one position deserves attention.`
            : "No single position is carrying the whole portfolio.",
        ];

  return (
    <WidgetCard
      title="What You Own in 3 Sentences"
      rationale="Surfaced because you're new to investing — a plain-English summary of your portfolio."
      hideHeader
    >
      <div style={shell}>
        <div style={copyStack}>
          {sentences.map((sentence, index) => (
            <p key={sentence} style={index === 0 ? leadSentence : sentenceStyle}>
              {sentence}
            </p>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}

function formatPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

const shell: React.CSSProperties = {
  minHeight: "100%",
  display: "flex",
  alignItems: "center",
  padding: "var(--space-6)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  background: "var(--bg-inset)",
};

const copyStack: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-6)",
  width: "100%",
};

const leadSentence: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontFamily: "var(--font-display)",
  fontSize: 24,
  fontWeight: 300,
  lineHeight: 1.25,
};

const sentenceStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 17,
  lineHeight: 1.55,
};
