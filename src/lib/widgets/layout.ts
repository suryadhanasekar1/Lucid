import type { GridLayoutItem } from "@/types";

/**
 * Layout primitives for the dashboard grid.
 *
 * The dashboard uses react-grid-layout; this module owns the *content-aware*
 * sizing per widget id and the deterministic placement algorithm used when no
 * persisted layout exists. RGL itself handles drag/drop + collision + compact;
 * we just feed it a sane initial state.
 */

export const GRID_COLS = 12;

export interface WidgetSize {
  /** Default width in cols (1-12). */
  w: number;
  /** Default height in row units (each row ≈ 60px). */
  h: number;
  /** Minimum width — RGL refuses to resize below this. */
  minW: number;
  /** Minimum height — RGL refuses to resize below this. */
  minH: number;
}

/**
 * Per-widget size requirements. Tuned to the actual content footprint
 * each widget renders (form + result for AI, table for cost/tax, gauge
 * for health, etc.). Widgets not listed fall back to `DEFAULT_SIZE`.
 */
export const WIDGET_SIZES: Record<string, WidgetSize> = {
  // Core
  health_score: { w: 6, h: 9, minW: 4, minH: 8 },
  total_value: { w: 6, h: 4, minW: 3, minH: 3 },
  foundation_frontier: { w: 6, h: 4, minW: 4, minH: 3 },
  goal_progress: { w: 6, h: 4, minW: 3, minH: 3 },

  // Risk (tall — they hold a form + a result panel)
  worry_translator: { w: 6, h: 8, minW: 4, minH: 6 },
  headline_decoder: { w: 6, h: 9, minW: 4, minH: 7 },
  circuit_breaker: { w: 6, h: 7, minW: 4, minH: 5 },
  pain_threshold: { w: 6, h: 5, minW: 4, minH: 4 },

  // Education
  mutual_fund_xray: { w: 6, h: 8, minW: 4, minH: 6 },
  macro_conditions: { w: 6, h: 8, minW: 4, minH: 6 },
  what_you_own: { w: 6, h: 6, minW: 4, minH: 5 },
  stock_explorer: { w: 6, h: 12, minW: 5, minH: 10 },

  // Mechanics
  cost_tax_receipt: { w: 6, h: 8, minW: 4, minH: 5 },

  // Planning
  quick_scenarios: { w: 6, h: 7, minW: 4, minH: 5 },

  // Engagement
  compare_to_index: { w: 6, h: 5, minW: 4, minH: 4 },
  weekly_digest: { w: 6, h: 9, minW: 4, minH: 6 },
  streak_tracker: { w: 4, h: 5, minW: 3, minH: 4 },
};

export const DEFAULT_SIZE: WidgetSize = { w: 6, h: 4, minW: 3, minH: 3 };

export function sizeFor(id: string): WidgetSize {
  return WIDGET_SIZES[id] ?? DEFAULT_SIZE;
}

/**
 * Initial placement.
 *
 * Two-pass algorithm:
 *   1. Sort widgets by `minH` ascending — short, flexible widgets settle first;
 *      tall, rigid widgets sink to the bottom (the user requested this).
 *      Ties broken by the input order (recommender priority).
 *   2. Pack each widget left-to-right, top-to-bottom, into the first slot
 *      where it fits without overlap. Width = `w` from sizeFor(id).
 */
export function buildInitialLayout(ids: string[]): GridLayoutItem[] {
  const sorted = [...ids]
    .map((id, idx) => ({ id, idx, size: sizeFor(id) }))
    .sort((a, b) => {
      if (a.size.minH !== b.size.minH) return a.size.minH - b.size.minH;
      return a.idx - b.idx;
    });

  const placed: GridLayoutItem[] = [];
  for (const { id, size } of sorted) {
    const { x, y } = nextFreeSlot(placed, size.w, size.h);
    placed.push({
      i: id,
      x,
      y,
      w: size.w,
      h: size.h,
      minW: size.minW,
      minH: size.minH,
    });
  }
  // RGL works best when items are returned in row order (top-to-bottom,
  // left-to-right). Sort the final layout by (y, x) so callers don't need
  // to think about it.
  return placed.sort((a, b) => (a.y - b.y) || (a.x - b.x));
}

/** Find the first {x, y} where a w×h rect fits without overlapping `placed`. */
export function nextFreeSlot(
  placed: GridLayoutItem[],
  w: number,
  h: number,
): { x: number; y: number } {
  if (w > GRID_COLS) w = GRID_COLS;
  for (let y = 0; ; y++) {
    for (let x = 0; x + w <= GRID_COLS; x++) {
      const candidate = { x, y, w, h };
      if (!placed.some((p) => overlaps(p, candidate))) {
        return { x, y };
      }
    }
  }
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Vertical compaction. Each widget is pulled as far up (smaller y) as it
 * can go without overlapping anything above it. Mirrors RGL's vertical
 * compactType so we can reason about layouts in tests without rendering.
 */
export function compactVertical(layout: GridLayoutItem[]): GridLayoutItem[] {
  // Process top-to-bottom, left-to-right so each item only needs to look at
  // already-placed items.
  const sorted = [...layout].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const compacted: GridLayoutItem[] = [];
  for (const item of sorted) {
    let y = 0;
    while (
      compacted.some((p) =>
        overlaps(p, { x: item.x, y, w: item.w, h: item.h }),
      )
    ) {
      y += 1;
    }
    compacted.push({ ...item, y });
  }
  return compacted;
}

/**
 * Reconcile a persisted layout with the current set of recommended widgets.
 * - Drops items the recommender no longer surfaces (so e.g. switching
 *   profiles doesn't leave orphaned grid slots).
 * - Adds default-sized entries for any newly recommended widgets.
 * - Re-runs vertical compaction so there are no gaps.
 */
export function reconcileLayout(
  persisted: GridLayoutItem[],
  ids: string[],
): GridLayoutItem[] {
  const wanted = new Set(ids);
  const kept = persisted.filter((item) => wanted.has(item.i));
  const knownIds = new Set(kept.map((k) => k.i));
  const missing = ids.filter((id) => !knownIds.has(id));
  if (missing.length === 0) {
    return compactVertical(kept);
  }
  const fresh = buildInitialLayout(missing);
  // Place fresh items below any existing ones, then recompact.
  const maxY = kept.reduce((m, k) => Math.max(m, k.y + k.h), 0);
  const offset = fresh.map((f) => ({ ...f, y: f.y + maxY }));
  return compactVertical([...kept, ...offset]);
}
