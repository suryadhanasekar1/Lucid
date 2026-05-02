"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { useExplain } from "@/hooks/useExplain";
import type { UIMode } from "@/types";

interface Props {
  label: string;
  value: string | number;
  topic: string;
  context?: object;
  mode: UIMode;
}

export function ExpandableMetric({ label, value, topic, context, mode }: Props) {
  const { explain } = useExplain();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (text || loading) {
      setOpen((current) => !current);
      return;
    }
    setOpen(true);
    setLoading(true);
    const next = await explain(topic, context);
    setText(next);
    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <div>
          <span style={labelStyle}>{label}</span>
          <span style={valueStyle}>{value}</span>
        </div>
        <button
          type="button"
          aria-label={`Tell me more about ${label}`}
          onClick={load}
          title={mode === "essentials" ? undefined : text ?? "Tell me more"}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            border: "1px solid var(--border-subtle)",
            background: "transparent",
            color: "var(--text-tertiary)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <HelpCircle size={14} aria-hidden="true" />
        </button>
      </div>
      {mode === "analyst" && context && (
        <pre style={rawStyle}>{JSON.stringify(context)}</pre>
      )}
      {open && mode === "essentials" && (
        <p style={explainStyle}>{loading ? "Loading..." : text}</p>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: 1.25,
};

const valueStyle: React.CSSProperties = {
  display: "block",
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  marginTop: 2,
};

const explainStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  lineHeight: 1.45,
};

const rawStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  whiteSpace: "pre-wrap",
};
