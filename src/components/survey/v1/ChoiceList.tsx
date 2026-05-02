"use client";

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value?: T;
  onChange: (value: T) => void;
}

export function ChoiceList<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", listStyle: "none", padding: 0, margin: 0 }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <li key={opt.value}>
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "var(--space-4) var(--space-6)",
                background: selected ? "var(--gold-glow)" : "var(--bg-elevated)",
                border: `1px solid ${selected ? "var(--border-emphasis)" : "var(--border-default)"}`,
                borderRadius: 12,
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: 15,
                cursor: "pointer",
                transition: "border-color 180ms ease, background 180ms ease",
              }}
            >
              <span style={{ display: "block", fontWeight: 500 }}>{opt.label}</span>
              {opt.hint && (
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: "var(--text-tertiary)",
                    marginTop: 4,
                  }}
                >
                  {opt.hint}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
