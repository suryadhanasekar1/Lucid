"use client";

import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";

interface Props {
  id: string;
}

const PHASE_BY_ID: Record<string, string> = {
  worry_translator: "Phase 4",
  headline_decoder: "Phase 4",
  circuit_breaker: "Phase 5",
  pain_threshold: "Phase 5",
  mutual_fund_xray: "Phase 3",
  macro_conditions: "Phase 3",
  what_you_own: "Phase 4",
  cost_tax_receipt: "Phase 5",
  quick_scenarios: "Phase 3",
  compare_to_index: "Phase 5",
  weekly_digest: "Phase 5",
  streak_tracker: "Phase 5",
};

export function PlaceholderWidget({ id }: Props) {
  const def = WIDGETS_BY_ID[id];
  if (!def) return null;
  const phase = PHASE_BY_ID[id] ?? "later phase";

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge={def.category}>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        Coming in {phase}.
      </p>
    </WidgetCard>
  );
}
