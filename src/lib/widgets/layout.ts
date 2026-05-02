import type { GridLayoutItem } from "@/types";

/**
 * Layout primitives for the dashboard grid.
 *
 * Sizing strategy
 * ---------------
 * Each widget is classified by *shape* (portrait | square | landscape) based
 * on the natural footprint of its content:
 *   - portrait:  narrow + tall (lists, stacked sentences, AI input + result)
 *   - square:    half-width balanced cards (stat panels, gauges, mini charts)
 *   - landscape: wide + short (timeline charts, multi-stat strips)
 *
 * A small `CUSTOM_SIZES` table overrides the shape preset for widgets that
 * genuinely need a custom footprint (Stock Explorer is far taller than any
 * preset because it stacks chart + summary + stat grid + fit card).
 *
 * Placement strategy
 * ------------------
 * `buildInitialLayout` runs a biggest-first first-fit bin-packer on a 12-col
 * grid. Largest items land first; smaller items then scan top-to-bottom for
 * the first free slot and fall into gaps left by the mix of widths. After
 * packing, vertical compaction pulls everything as high as it can go.
 */

export const GRID_COLS = 12;

export interface WidgetSize {
  /** Default width in cols (1–12). */
  w: number;
  /** Default height in row units (≈56px each + 16px margin). */
  h: number;
  /** Minimum width — RGL refuses to resize below this. */
  minW: number;
  /** Minimum height — RGL refuses to resize below this. */
  minH: number;
}

type Shape = "portrait" | "square" | "landscape";

const SHAPE_PRESETS: Record<Shape, WidgetSize> = {
  portrait: { w: 4, h: 9, minW: 3, minH: 7 },
  square: { w: 6, h: 8, minW: 4, minH: 6 },
  landscape: { w: 8, h: 6, minW: 6, minH: 5 },
};

/** Widgets that override the shape preset because their content needs a custom box. */
const CUSTOM_SIZES: Record<string, WidgetSize> = {
  stock_explorer: { w: 8, h: 18, minW: 6, minH: 16 },
  health_score: { w: 6, h: 9, minW: 4, minH: 8 },
};

/** Per-widget shape classification. Anything not listed defaults to square. */
const WIDGET_SHAPES: Record<string, Shape> = {
  total_value: "square",
  portfolio_history: "landscape",
  macro_conditions: "landscape",
  what_you_own: "portrait",
  sector_exposure: "square",
  mutual_fund_xray: "square",
  cost_tax_receipt: "square",
  compare_to_index: "landscape",
  weekly_digest: "portrait",
  streak_tracker: "square",
  worry_translator: "portrait",
  headline_decoder: "portrait",
  circuit_breaker: "square",
  pain_threshold: "square",
  action_queue: "portrait",
  foundation_frontier: "square",
  goal_progress: "square",
  quick_scenarios: "square",
};

const DEFAULT_SHAPE: Shape = "square";

export const DEFAULT_SIZE: WidgetSize = SHAPE_PRESETS[DEFAULT_SHAPE];

export function sizeFor(id: string): WidgetSize {
  if (CUSTOM_SIZES[id]) return CUSTOM_SIZES[id]!;
  const shape = WIDGET_SHAPES[id] ?? DEFAULT_SHAPE;
  return SHAPE_PRESETS[shape];
}

/**
 * Derived size table — built from CUSTOM_SIZES + WIDGET_SHAPES so every
 * classified widget has an entry. Kept exported for compatibility with the
 * phase-9 test which asserts size-table coverage of the registry.
 */
export const WIDGET_SIZES: Record<string, WidgetSize> = (() => {
  const out: Record<string, WidgetSize> = { ...CUSTOM_SIZES };
  for (const [id, shape] of Object.entries(WIDGET_SHAPES)) {
    if (!out[id]) out[id] = SHAPE_PRESETS[shape];
  }
  return out;
})();

/**
 * Widgets in this list are placed first, in this exact order, before the
 * bin-packer runs on the rest. They land at the top of the dashboard.
 */
const PINNED_ORDER = [
  "portfolio_history", // top — landscape balance chart, lead view
  "total_value",       // primary stat
  "what_you_own",      // plain-English summary
  "stock_explorer",    // big chart + explorer
] as const;

/**
 * Pinned-first first-fit bin-packer.
 *
 * 1. Place PINNED_ORDER widgets first, in order, at the topmost-leftmost
 *    free slot. Pins land at the top of the grid.
 * 2. Sort the remainder by area descending (priority breaks ties) and
 *    fill via first-fit.
 * 3. Compact vertically.
 */
export function buildInitialLayout(ids: string[]): GridLayoutItem[] {
  const idSet = new Set(ids);
  const pinned = PINNED_ORDER.filter((id) => idSet.has(id));
  const rest = ids
    .filter((id) => !pinned.includes(id as (typeof PINNED_ORDER)[number]))
    .map((id, idx) => ({ id, idx, size: sizeFor(id) }))
    .sort((a, b) => {
      const areaA = a.size.w * a.size.h;
      const areaB = b.size.w * b.size.h;
      if (areaA !== areaB) return areaB - areaA;
      return a.idx - b.idx;
    });

  const placed: GridLayoutItem[] = [];
  const place = (id: string) => {
    const size = sizeFor(id);
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
  };
  for (const id of pinned) place(id);
  for (const { id } of rest) place(id);

  return compactVertical(placed.sort((a, b) => a.y - b.y || a.x - b.x));
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
  const sorted = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
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
 * - Drops items the recommender no longer surfaces.
 * - Adds default-sized entries for any newly recommended widgets, slotting
 *   them into the first free position via the bin-packer.
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
  // Slot fresh items into existing holes via first-fit, then compact.
  const next = [...kept];
  for (const id of missing) {
    const size = sizeFor(id);
    const { x, y } = nextFreeSlot(next, size.w, size.h);
    next.push({
      i: id,
      x,
      y,
      w: size.w,
      h: size.h,
      minW: size.minW,
      minH: size.minH,
    });
  }
  return compactVertical(next);
}
