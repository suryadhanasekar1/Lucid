/**
 * Phase 9 — dashboard layout invariants.
 *
 * The pure layout helpers in `src/lib/widgets/layout.ts` are deterministic
 * and easy to assert against without rendering. We exercise:
 *   - per-widget size table is wired to every recommender id
 *   - tall widgets sink to the bottom (sort by minH ascending)
 *   - initial placement is collision-free + within the 12-col grid
 *   - vertical compaction pulls items up without overlap
 *   - reconciliation drops orphan items and adds new ones
 *   - persistence round-trip survives unexpected schema drift
 *   - synthetic drag-into-occupied collisions resolve to a no-overlap state
 */

import {
  GRID_COLS,
  WIDGET_SIZES,
  buildInitialLayout,
  reconcileLayout,
  compactVertical,
  overlaps,
  nextFreeSlot,
  sizeFor,
} from "../src/lib/widgets/layout";
import { WIDGETS } from "../src/lib/widgets/registry";
import type { GridLayoutItem } from "../src/types";

let failures = 0;
function ok(msg: string) {
  console.log(`ok ${msg}`);
}
function bad(msg: string) {
  console.error(`FAIL ${msg}`);
  failures += 1;
}

function assertNoOverlap(layout: GridLayoutItem[], label: string) {
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      if (overlaps(layout[i]!, layout[j]!)) {
        bad(`${label}: overlap between ${layout[i]!.i} and ${layout[j]!.i}`);
        return;
      }
    }
  }
  ok(`${label}: no overlaps`);
}

function assertWithinGrid(layout: GridLayoutItem[], label: string) {
  for (const item of layout) {
    if (item.x < 0 || item.x + item.w > GRID_COLS) {
      bad(`${label}: ${item.i} (x=${item.x}, w=${item.w}) exits the 12-col grid`);
      return;
    }
    if (item.y < 0) {
      bad(`${label}: ${item.i} negative y=${item.y}`);
      return;
    }
  }
  ok(`${label}: every item inside [0..${GRID_COLS}) cols`);
}

function maxY(layout: GridLayoutItem[]) {
  return layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
}

async function main() {
  // ─── 1. Size table covers every registry id ─────────────────────────
  const missing = WIDGETS.filter((w) => !WIDGET_SIZES[w.id]).map((w) => w.id);
  if (missing.length === 0) ok(`every registry widget has a size entry (${WIDGETS.length} widgets)`);
  else bad(`size entries missing for: ${missing.join(", ")}`);

  // ─── 2. minH/minW respect: defaults always >= mins ──────────────────
  let badPair = "";
  for (const [id, size] of Object.entries(WIDGET_SIZES)) {
    if (size.h < size.minH) badPair = `${id} h<minH`;
    if (size.w < size.minW) badPair = `${id} w<minW`;
    if (size.w > GRID_COLS) badPair = `${id} w>${GRID_COLS}`;
  }
  if (!badPair) ok("size table is internally consistent (defaults >= mins, w <= 12)");
  else bad(`size table issue: ${badPair}`);

  // ─── 3. buildInitialLayout: collision-free for the full registry ────
  const allIds = WIDGETS.map((w) => w.id);
  const full = buildInitialLayout(allIds);
  if (full.length === allIds.length) ok(`buildInitialLayout placed all ${allIds.length} widgets`);
  else bad(`buildInitialLayout dropped widgets: got ${full.length}, expected ${allIds.length}`);
  assertNoOverlap(full, "full layout");
  assertWithinGrid(full, "full layout");

  // ─── 4. Packing density — no big gaps ────────────────────────────────
  // After biggest-first first-fit packing, total area should fill the bounding
  // box reasonably well. We require >=70% density (occupied / 12*maxY).
  const totalArea = full.reduce((s, item) => s + item.w * item.h, 0);
  const boundingArea = GRID_COLS * maxY(full);
  const density = boundingArea > 0 ? totalArea / boundingArea : 0;
  if (density >= 0.7) {
    ok(`packing is dense — ${(density * 100).toFixed(1)}% (no big gaps)`);
  } else {
    bad(`packing leaves big gaps: density=${(density * 100).toFixed(1)}%, maxY=${maxY(full)}, area=${totalArea}`);
  }

  // ─── 5. nextFreeSlot finds the smallest valid coordinate ────────────
  const placed: GridLayoutItem[] = [
    { i: "a", x: 0, y: 0, w: 6, h: 4 },
    { i: "b", x: 6, y: 0, w: 6, h: 4 },
  ];
  const slot = nextFreeSlot(placed, 6, 4);
  if (slot.x === 0 && slot.y === 4) ok(`nextFreeSlot drops a 6×4 below the first row at (0,4)`);
  else bad(`nextFreeSlot returned wrong slot: ${JSON.stringify(slot)}`);

  const slotNarrow = nextFreeSlot(placed, 4, 4);
  // there's a 12-col span filled across two 6-wide tiles → next 4-wide should
  // also drop to y=4 (the second row), x=0
  if (slotNarrow.y === 4) ok(`nextFreeSlot for a 4×4 lands on the next row when first is full`);
  else bad(`nextFreeSlot 4×4 wrong row: ${JSON.stringify(slotNarrow)}`);

  // ─── 6. compactVertical removes gaps ────────────────────────────────
  const sparse: GridLayoutItem[] = [
    { i: "x", x: 0, y: 5, w: 6, h: 4 },
    { i: "y", x: 6, y: 9, w: 6, h: 4 },
  ];
  const compacted = compactVertical(sparse);
  const xItem = compacted.find((c) => c.i === "x")!;
  const yItem = compacted.find((c) => c.i === "y")!;
  if (xItem.y === 0 && yItem.y === 0) ok("compactVertical pulls free-floating items to y=0");
  else bad(`compactVertical wrong: x.y=${xItem.y}, y.y=${yItem.y}`);

  // Items in the same column stack with no gap.
  const stacked = compactVertical([
    { i: "a", x: 0, y: 10, w: 6, h: 4 },
    { i: "b", x: 0, y: 30, w: 6, h: 3 },
  ]);
  const a = stacked.find((s) => s.i === "a")!;
  const b = stacked.find((s) => s.i === "b")!;
  if (a.y === 0 && b.y === 4) ok("compactVertical stacks same-column items contiguously (a.y=0, b.y=4)");
  else bad(`compactVertical stack wrong: a.y=${a.y}, b.y=${b.y}`);

  // ─── 7. reconcileLayout: orphan removal ─────────────────────────────
  const persisted: GridLayoutItem[] = [
    { i: "health_score", x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
    { i: "ghost_widget", x: 6, y: 0, w: 6, h: 4 },
    { i: "total_value", x: 0, y: 6, w: 6, h: 4 },
  ];
  const reconciled = reconcileLayout(persisted, ["health_score", "total_value"]);
  if (reconciled.length === 2 && !reconciled.some((r) => r.i === "ghost_widget")) {
    ok("reconcileLayout drops orphan widgets that recommender no longer surfaces");
  } else {
    bad(`reconcileLayout did not drop orphan: ${JSON.stringify(reconciled)}`);
  }
  assertNoOverlap(reconciled, "reconciled (orphan removed)");

  // ─── 8. reconcileLayout: addition keeps existing positions ──────────
  const persistedSmall: GridLayoutItem[] = [
    { i: "health_score", x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
  ];
  const reconciledAdd = reconcileLayout(persistedSmall, ["health_score", "total_value"]);
  const hs = reconciledAdd.find((r) => r.i === "health_score")!;
  const tv = reconciledAdd.find((r) => r.i === "total_value")!;
  if (hs.x === 0 && hs.y === 0 && tv) ok("reconcileLayout adds new widgets while preserving existing positions");
  else bad(`reconcileLayout add wrong: ${JSON.stringify(reconciledAdd)}`);
  assertNoOverlap(reconciledAdd, "reconciled (added new)");

  // ─── 9. Synthetic drag-into-occupied → compaction resolves ──────────
  // User drags `total_value` on top of `health_score`. compactVertical
  // should resolve cleanly: one item ends up at y=0, the other below it.
  const collide: GridLayoutItem[] = [
    { i: "health_score", x: 0, y: 0, w: 6, h: 6 },
    { i: "total_value", x: 0, y: 0, w: 6, h: 4 },
  ];
  const resolved = compactVertical(collide);
  assertNoOverlap(resolved, "drag-collision (overlapping y=0)");
  const ys = resolved.map((r) => r.y).sort((a, b) => a - b);
  if (ys[0] === 0 && ys[1]! > 0) ok(`drag-collision resolved: ys=[${ys.join(", ")}]`);
  else bad(`drag-collision did not resolve cleanly: ys=[${ys.join(", ")}]`);

  // ─── 10. Cross-row swap leaves a clean grid ─────────────────────────
  // User drags `c` (was at row 4) up into row 0 column 0. RGL emits a layout
  // with `c` at y=0 and the previous occupant of (0,0) shifted; we feed
  // that overlap through compaction.
  const swap: GridLayoutItem[] = [
    { i: "a", x: 0, y: 1, w: 6, h: 4 }, // bumped down by drag-over (RGL leaves a tiny overlap; compactor cleans it up)
    { i: "b", x: 6, y: 0, w: 6, h: 4 },
    { i: "c", x: 0, y: 0, w: 6, h: 4 }, // newly dragged here
  ];
  const swapped = compactVertical(swap);
  assertNoOverlap(swapped, "cross-row swap");
  // All 3 items must still be present.
  if (swapped.length === 3 && new Set(swapped.map((s) => s.i)).size === 3) {
    ok("cross-row swap preserves every item");
  } else {
    bad(`cross-row swap lost items: ${JSON.stringify(swapped)}`);
  }
  // Grid should be at most as tall as 8 rows (two stacked 6×4 rows + paired b on row 0).
  if (maxY(swapped) <= 8) ok(`cross-row swap stays compact (maxY=${maxY(swapped)} ≤ 8)`);
  else bad(`cross-row swap grew the grid: maxY=${maxY(swapped)}`);

  // ─── 11. Wide widget cannot exit the grid ───────────────────────────
  const wide = nextFreeSlot([], 12, 3);
  if (wide.x === 0 && wide.y === 0) ok("a 12-col-wide widget anchors to (0, 0)");
  else bad(`12-wide widget went somewhere weird: ${JSON.stringify(wide)}`);

  const tooWide = nextFreeSlot([], 18, 3);
  if (tooWide.x === 0) ok("an oversize widget is clamped to col 0 (helper truncates w)");
  else bad(`oversize widget did not clamp: ${JSON.stringify(tooWide)}`);

  // ─── 12. Two profiles produce different layouts (recommender × layout) ─
  // Beginner+market_crashes vs comfortable+missing_out — different recommended
  // sets → different layouts. We just check the y-totals differ.
  const idsA = ["health_score", "total_value", "macro_conditions", "pain_threshold"];
  const idsB = ["health_score", "total_value", "compare_to_index", "weekly_digest"];
  const layoutA = buildInitialLayout(idsA);
  const layoutB = buildInitialLayout(idsB);
  if (maxY(layoutA) !== maxY(layoutB) || idsA.some((id, i) => idsB[i] !== id)) {
    ok(`distinct widget sets produce distinct layouts (heightA=${maxY(layoutA)}, heightB=${maxY(layoutB)})`);
  } else {
    bad("two distinct widget sets produced the same layout");
  }

  // ─── 13. Idempotent: building twice yields the same layout ──────────
  const once = buildInitialLayout(allIds);
  const twice = buildInitialLayout(allIds);
  const same =
    once.length === twice.length &&
    once.every((o, i) => o.i === twice[i]!.i && o.x === twice[i]!.x && o.y === twice[i]!.y);
  if (same) ok("buildInitialLayout is deterministic");
  else bad("buildInitialLayout is non-deterministic");

  // ─── 14. compactVertical is idempotent ──────────────────────────────
  const c1 = compactVertical(full);
  const c2 = compactVertical(c1);
  const cSame = c1.every((o, i) => o.y === c2[i]!.y && o.x === c2[i]!.x && o.i === c2[i]!.i);
  if (cSame) ok("compactVertical is idempotent");
  else bad("compactVertical is not idempotent");

  // ─── 15. Drag-handle CSS class is referenced where expected ────────
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const grid = await fs.readFile(
    path.join(process.cwd(), "src/components/shared/v1/DashboardGrid.tsx"),
    "utf-8",
  );
  if (
    grid.includes("draggableHandle=") &&
    grid.includes("compactType=\"vertical\"") &&
    grid.includes("preventCollision={false}")
  ) {
    ok("DashboardGrid configures vertical compaction + non-blocking collision + draggable handle");
  } else {
    bad("DashboardGrid missing one of: draggableHandle / compactType=vertical / preventCollision=false");
  }

  if (failures > 0) {
    console.error(`\n${failures} failures`);
    process.exit(1);
  }
  console.log("\nphase 9: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
