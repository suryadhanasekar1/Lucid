"use client";

import { useAdaptiveMode } from "@/hooks/useAdaptiveMode";
import type { UIMode } from "@/types";

const MODES: Array<{ value: UIMode; label: string; active: (mode: UIMode) => boolean }> = [
  { value: "essentials", label: "Simple View", active: (mode) => mode !== "analyst" },
  { value: "analyst", label: "Advanced View", active: (mode) => mode === "analyst" },
];

export function UIModeToggle() {
  const { mode, setMode } = useAdaptiveMode();

  return (
    <div
      role="group"
      aria-label="Dashboard detail level"
      style={{
        display: "inline-flex",
        padding: 3,
        borderRadius: 999,
        border: "1px solid var(--border-default)",
        background: "var(--bg-elevated)",
        gap: 2,
      }}
    >
      {MODES.map((item) => {
        const active = item.active(mode);
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => setMode(item.value)}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "7px 12px",
              background: active ? "var(--gold-primary)" : "transparent",
              color: active ? "var(--bg-base)" : "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              transition: "background 160ms ease, color 160ms ease",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
