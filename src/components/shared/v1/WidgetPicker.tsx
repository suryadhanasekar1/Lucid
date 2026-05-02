"use client";

import { Plus } from "lucide-react";
import { useWidgets } from "@/hooks/useWidgets";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WidgetCategory } from "@/types";

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  core: "Core",
  risk: "Risk",
  education: "Education",
  mechanics: "Mechanics",
  planning: "Planning",
  engagement: "Engagement",
};

export function WidgetPicker() {
  const { available, active, addWidget, removeWidget } = useWidgets();
  const activeSet = new Set(active);
  const grouped = groupBy(available, (w) => w.category);
  const categories = (Object.keys(CATEGORY_LABELS) as WidgetCategory[]).filter(
    (c) => grouped[c] && grouped[c]!.length > 0,
  );

  const toggle = (id: string) => {
    if (activeSet.has(id)) removeWidget(id);
    else addWidget(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border/40 bg-secondary/30 px-2.5 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Widgets
          <span className="ml-1 font-mono text-[11px] text-primary">{active.length}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-surface w-72 max-h-[60vh] overflow-y-auto compass-hide-scrollbar"
      >
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Manage widgets
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {categories.map((cat, i) => (
          <div key={cat}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-[0.1em] text-primary/70">
              {CATEGORY_LABELS[cat]}
            </DropdownMenuLabel>
            {grouped[cat]!.map((w) => (
              <DropdownMenuCheckboxItem
                key={w.id}
                checked={activeSet.has(w.id)}
                onSelect={(e) => {
                  e.preventDefault();
                  toggle(w.id);
                }}
                className="text-[13px]"
              >
                {w.title}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function groupBy<T, K extends string>(items: T[], key: (t: T) => K): Partial<Record<K, T[]>> {
  const out: Partial<Record<K, T[]>> = {};
  for (const item of items) {
    const k = key(item);
    if (!out[k]) out[k] = [];
    out[k]!.push(item);
  }
  return out;
}
