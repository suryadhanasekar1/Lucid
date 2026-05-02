import type { UserProfile, WidgetDefinition } from "@/types";
import { WIDGETS } from "./registry";

const SIMPLE_WIDGET_IDS = new Set([
  "total_value",
  "portfolio_history",
  "stock_explorer",
  "what_you_own",
]);

const ADVANCED_WIDGET_IDS = new Set([
  "total_value",
  "portfolio_history",
  "stock_explorer",
  "mutual_fund_xray",
  "macro_conditions",
  "sector_exposure",
  "cost_tax_receipt",
  "compare_to_index",
  "weekly_digest",
  "streak_tracker",
]);

/**
 * Returns the widget definitions that should be recommended for the given
 * profile. Order is: P0 first, then P1, then P2.
 */
export function recommendWidgets(
  profile: UserProfile,
  view: "simple" | "advanced" = "simple",
): WidgetDefinition[] {
  const allowed = view === "advanced" ? ADVANCED_WIDGET_IDS : SIMPLE_WIDGET_IDS;
  const seen = new Set<string>();
  const out: WidgetDefinition[] = [];
  for (const w of WIDGETS) {
    if (!allowed.has(w.id)) continue;
    if (!w.triggers(profile)) continue;
    if (seen.has(w.id)) continue;
    seen.add(w.id);
    out.push(w);
  }
  const priorityRank: Record<string, number> = { P0: 0, P1: 1, P2: 2 };
  return out.sort((a, b) => priorityRank[a.priority]! - priorityRank[b.priority]!);
}
