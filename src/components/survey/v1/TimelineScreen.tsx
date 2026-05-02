"use client";

import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";

interface Props {
  value?: number;
  onChange: (years: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TimelineScreen({ value, onChange, onNext, onBack }: Props) {
  const years = value ?? 10;

  return (
    <QuestionLayout
      eyebrow="Step 4 of 9"
      title="When do you need this money?"
      footer={
        <>
          <PrimaryButton variant="ghost" onClick={onBack}>
            Back
          </PrimaryButton>
          <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
        </>
      }
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: 16,
          padding: "var(--space-8)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: 56,
            lineHeight: 1,
            color: "var(--text-primary)",
            marginBottom: "var(--space-4)",
          }}
        >
          {years}
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 18,
              color: "var(--text-secondary)",
              marginLeft: "var(--space-3)",
              fontWeight: 400,
            }}
          >
            {years === 1 ? "year" : "years"}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={40}
          step={1}
          value={years}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--gold-primary)" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "var(--space-2)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--text-tertiary)",
          }}
        >
          <span>1 year</span>
          <span>40 years</span>
        </div>
      </div>
    </QuestionLayout>
  );
}
