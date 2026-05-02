"use client";

import { useState, useEffect, type ReactNode } from "react";
import GridLayout, { type Layout, WidthProvider } from "react-grid-layout";
import { motion } from "framer-motion";
import { useWidgets } from "@/hooks/useWidgets";
import { usePrefersReducedMotion, motionDuration } from "@/lib/a11y";
import { GRID_COLS, sizeFor } from "@/lib/widgets/layout";

const ResponsiveGrid = WidthProvider(GridLayout);

interface Cell {
  id: string;
  node: ReactNode;
}

interface Props {
  cells: Cell[];
}

const ROW_HEIGHT = 56;
const MOBILE_BREAKPOINT = 768;
const DRAG_HANDLE_CLASS = "compass-drag-handle";

/**
 * DashboardGrid
 * -------------
 * Drag-to-rearrange dashboard with three guarantees:
 *
 *   1. **Auto-rearrange.** Dragging a widget into an occupied slot pushes
 *      others out of the way. RGL's `compactType="vertical"` +
 *      `preventCollision=false` does this; we configure it explicitly here so
 *      the behaviour can't drift.
 *   2. **Per-widget room.** Each widget id has a content-aware default
 *      size + minH/minW in `WIDGET_SIZES`; the grid never lets the user
 *      shrink below the content footprint.
 *   3. **Tall widgets sink.** Initial placement (`buildInitialLayout`) sorts
 *      widgets ascending by minH, so flexible widgets settle on top and the
 *      rigid ones settle at the bottom.
 *
 * Drag is opt-in via a small handle at the top-right of each card, so clicks
 * on inner buttons (Translate, Try the breaker, etc.) don't start a drag.
 */
export function DashboardGrid({ cells }: Props) {
  const { layout, updateLayout } = useWidgets();
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // SSR + mobile: a CSS grid that always reflows to a single column.
  if (!mounted || isMobile) {
    return (
      <div
        id="dashboard-grid"
        role="region"
        aria-label="Dashboard widgets"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "var(--space-6)",
        }}
      >
        {cells.map(({ id, node }) => (
          <div key={id}>{node}</div>
        ))}
      </div>
    );
  }

  // Backfill anything in `cells` that the persisted layout doesn't know about.
  // (Shouldn't happen with `useWidgets` reconciler, but safe.)
  const rgl: Layout[] = cells.map((c) => {
    const found = layout.find((l) => l.i === c.id);
    const size = sizeFor(c.id);
    if (found) {
      return {
        ...found,
        w: Math.max(found.w, size.minW),
        h: Math.max(found.h, size.minH),
        minW: size.minW,
        minH: size.minH,
      };
    }
    return {
      i: c.id,
      x: 0,
      y: Infinity,
      w: size.w,
      h: size.h,
      minW: size.minW,
      minH: size.minH,
    };
  });

  return (
    <div id="dashboard-grid" role="region" aria-label="Dashboard widgets">
      <ResponsiveGrid
        className="compass-grid"
        cols={GRID_COLS}
        rowHeight={ROW_HEIGHT}
        layout={rgl}
        compactType="vertical"
        preventCollision={false}
        onLayoutChange={(next) => updateLayout(next)}
        draggableHandle={`.${DRAG_HANDLE_CLASS}`}
        isResizable
        isDraggable
        margin={[16, 16]}
        useCSSTransforms
      >
        {cells.map(({ id, node }, i) => (
          <div key={id} style={{ position: "relative" }}>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{
                duration: motionDuration(reducedMotion, 0.32),
                delay: motionDuration(reducedMotion, i * 0.04),
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ height: "100%" }}
            >
              {node}
            </motion.div>
            <button
              type="button"
              className={DRAG_HANDLE_CLASS}
              aria-label="Drag to rearrange"
              tabIndex={-1}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 18,
                height: 18,
                padding: 0,
                background: "transparent",
                border: "none",
                cursor: "grab",
                color: "var(--text-tertiary)",
                opacity: 0.5,
                transition: "opacity 120ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
            >
              <svg viewBox="0 0 18 18" width={18} height={18} aria-hidden>
                <circle cx="6" cy="5" r="1.2" fill="currentColor" />
                <circle cx="12" cy="5" r="1.2" fill="currentColor" />
                <circle cx="6" cy="9" r="1.2" fill="currentColor" />
                <circle cx="12" cy="9" r="1.2" fill="currentColor" />
                <circle cx="6" cy="13" r="1.2" fill="currentColor" />
                <circle cx="12" cy="13" r="1.2" fill="currentColor" />
              </svg>
            </button>
          </div>
        ))}
      </ResponsiveGrid>
    </div>
  );
}
