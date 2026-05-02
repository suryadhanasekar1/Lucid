import type { UserProfile, WidgetDefinition } from "@/types";
import { WIDGETS } from "./registry";

/**
 * Returns the widget definitions that should be recommended for the given
 * profile. Order is: P0 first, then P1, then P2.
 */
export function recommendWidgets(profile: UserProfile): WidgetDefinition[] {
  const seen = new Set<string>();
  const out: WidgetDefinition[] = [];
  for (const w of WIDGETS) {
    if (!w.triggers(profile)) continue;
    if (seen.has(w.id)) continue;
    seen.add(w.id);
    out.push(w);
  }
  const priorityRank: Record<string, number> = { P0: 0, P1: 1, P2: 2 };
  return out.sort((a, b) => priorityRank[a.priority]! - priorityRank[b.priority]!);
}
