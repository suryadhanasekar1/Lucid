"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useUserStore } from "@/stores/userStore";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { recommendWidgets } from "@/lib/widgets/recommender";
import { WIDGETS } from "@/lib/widgets/registry";
import {
  buildInitialLayout,
  reconcileLayout,
  sizeFor,
} from "@/lib/widgets/layout";
import type { GridLayout, WidgetDefinition } from "@/types";

export function useWidgets(): {
  recommended: WidgetDefinition[];
  available: WidgetDefinition[];
  active: string[];
  layout: GridLayout;
  addWidget: (id: string) => void;
  removeWidget: (id: string) => void;
  updateLayout: (layout: GridLayout) => void;
} {
  const profile = useUserStore((s) => s.profile);
  const active = usePortfolioStore((s) => s.activeWidgets);
  const layout = usePortfolioStore((s) => s.layout);
  const setActiveWidgets = usePortfolioStore((s) => s.setActiveWidgets);
  const setLayout = usePortfolioStore((s) => s.setLayout);

  const recommended = useMemo(
    () => (profile ? recommendWidgets(profile) : []),
    [profile],
  );

  // Seed the active set + layout the first time a profile shows up.
  useEffect(() => {
    if (!profile) return;
    if (active.length === 0 && recommended.length > 0) {
      const ids = recommended.map((w) => w.id);
      setActiveWidgets(ids);
      setLayout(buildInitialLayout(ids));
    }
  }, [profile, active.length, recommended, setActiveWidgets, setLayout]);

  // Heal the persisted layout if the recommender set changed (new widgets
  // appeared, old ones disappeared). Compact vertically so there are no gaps.
  useEffect(() => {
    if (active.length === 0) return;
    const ids = active;
    const layoutIds = new Set(layout.map((l) => l.i));
    const sameSet =
      ids.length === layoutIds.size && ids.every((id) => layoutIds.has(id));
    if (sameSet) return;
    setLayout(reconcileLayout(layout, ids));
  }, [active, layout, setLayout]);

  const addWidget = useCallback(
    (id: string) => {
      if (active.includes(id)) return;
      const next = [...active, id];
      setActiveWidgets(next);
      if (!layout.some((l) => l.i === id)) {
        setLayout(reconcileLayout(layout, next));
      }
    },
    [active, layout, setActiveWidgets, setLayout],
  );

  const removeWidget = useCallback(
    (id: string) => {
      const nextActive = active.filter((x) => x !== id);
      setActiveWidgets(nextActive);
      setLayout(reconcileLayout(layout, nextActive));
    },
    [active, layout, setActiveWidgets, setLayout],
  );

  const updateLayout = useCallback(
    (next: GridLayout) => {
      // Defensive: re-attach min sizing in case RGL strips it on drag (it
      // sometimes does for items that have been moved). Without minH the
      // user could shrink a widget below its content footprint.
      setLayout(
        next.map((item) => {
          const size = sizeFor(item.i);
          return {
            ...item,
            minW: item.minW ?? size.minW,
            minH: item.minH ?? size.minH,
          };
        }),
      );
    },
    [setLayout],
  );

  return {
    recommended,
    available: WIDGETS,
    active,
    layout,
    addWidget,
    removeWidget,
    updateLayout,
  };
}
