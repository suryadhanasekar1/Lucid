"use client";

import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";

const GOAL_CHIPS = [
  "Retirement",
  "House down payment",
  "Just to grow my savings",
  "My kid's college",
  "Financial cushion",
];

interface Props {
  value?: string;
  chips?: string[];
  onChange: (goal: string, chips: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function GoalScreen({ value = "", chips = [], onChange, onNext, onBack }: Props) {
  const toggleChip = (chip: string) => {
    const next = chips.includes(chip)
      ? chips.filter((c) => c !== chip)
      : [...chips, chip];
    onChange(value || chip, next);
  };

  return (
    <QuestionLayout
      eyebrow="Step 3 of 9"
      title="What are you saving for?"
      helper="Type freely or pick a chip — both work."
      footer={
        <>
          <PrimaryButton variant="ghost" onClick={onBack}>
            Back
          </PrimaryButton>
          <PrimaryButton disabled={!value || value.trim().length === 0} onClick={onNext}>
            Continue
          </PrimaryButton>
        </>
      }
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value, chips)}
        placeholder="A house, retirement, peace of mind…"
        style={{
          width: "100%",
          padding: "var(--space-4) var(--space-6)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: 12,
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          fontSize: 16,
          outline: "none",
          marginBottom: "var(--space-4)",
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {GOAL_CHIPS.map((chip) => {
          const selected = chips.includes(chip);
          return (
            <button
              key={chip}
              type="button"
              onClick={() => toggleChip(chip)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: selected ? "var(--gold-glow)" : "transparent",
                border: `1px solid ${selected ? "var(--border-emphasis)" : "var(--border-default)"}`,
                color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                cursor: "pointer",
                transition: "border-color 180ms ease, background 180ms ease",
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </QuestionLayout>
  );
}
