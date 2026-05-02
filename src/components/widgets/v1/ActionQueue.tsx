"use client";

import { CheckCircle2, X } from "lucide-react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";

const BORDER: Record<string, string> = {
  high: "var(--signal-negative)",
  medium: "var(--signal-warning)",
  low: "var(--signal-info)",
};

export function ActionQueueWidget() {
  const cards = usePortfolioStore((s) => s.actionCards).filter((card) => !card.dismissed);
  const dismiss = usePortfolioStore((s) => s.dismissActionCard);
  const def = WIDGETS_BY_ID["action_queue"]!;

  return (
    <WidgetCard title={`${def.title}${cards.length ? ` · ${cards.length}` : ""}`} rationale={def.rationale}>
      {cards.length === 0 ? (
        <div style={{ minHeight: 180, display: "grid", placeItems: "center", textAlign: "center", gap: "var(--space-2)" }}>
          <CheckCircle2 size={28} color="var(--signal-positive)" aria-hidden="true" />
          <p style={{ margin: 0, color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 14 }}>
            You&apos;re all caught up. Your portfolio is on track.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {cards.map((card) => (
            <article
              key={card.id}
              style={{
                border: "1px solid var(--border-subtle)",
                borderLeft: `3px solid ${BORDER[card.priority]}`,
                borderRadius: 10,
                padding: "var(--space-3)",
                background: "var(--bg-inset)",
                display: "grid",
                gap: "var(--space-2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                <h4 style={{ margin: 0, color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 14 }}>
                  {card.title}
                </h4>
                <button
                  type="button"
                  aria-label={`Dismiss ${card.title}`}
                  onClick={() => dismiss(card.id)}
                  style={{ border: "none", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 12.5, lineHeight: 1.45 }}>
                {card.description}
              </p>
              {card.cta && (
                <button
                  type="button"
                  style={{
                    justifySelf: "start",
                    border: "1px solid var(--border-default)",
                    borderRadius: 999,
                    background: "transparent",
                    color: "var(--gold-primary)",
                    padding: "5px 10px",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {card.cta}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}
