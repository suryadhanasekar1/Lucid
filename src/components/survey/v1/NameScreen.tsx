"use client";

import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";

interface Props {
  value?: string;
  onChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function NameScreen({ value = "", onChange, onNext, onBack }: Props) {
  const trimmed = value.trim();
  const canContinue = trimmed.length > 0 && trimmed.length <= 40;

  return (
    <QuestionLayout
      eyebrow="Step 1 of 9"
      title="What should we call you?"
      helper="First name or nickname — Lucid will use it across the app."
      footer={
        <>
          <PrimaryButton variant="ghost" onClick={onBack}>
            Back
          </PrimaryButton>
          <PrimaryButton disabled={!canContinue} onClick={onNext}>
            Continue
          </PrimaryButton>
        </>
      }
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canContinue) {
            e.preventDefault();
            onNext();
          }
        }}
        placeholder="e.g. Manvith"
        autoFocus
        maxLength={40}
        aria-label="Your name"
        className="glass-input"
        style={{
          width: "100%",
          padding: "var(--space-4) var(--space-6)",
          borderRadius: 14,
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          fontSize: 18,
          outline: "none",
        }}
      />
    </QuestionLayout>
  );
}
