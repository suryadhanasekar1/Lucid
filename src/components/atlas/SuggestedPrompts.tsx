"use client";

const PROMPTS = [
  "What's in my portfolio right now?",
  "How risky is my current allocation?",
  "Explain my biggest holding in plain English.",
  "Am I diversified enough?",
];

export function SuggestedPrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        Try asking
      </div>
      {PROMPTS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPick(p)}
          className="text-left transition-colors"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--bg-elevated-2)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            fontSize: 13,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--gold-primary)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
