"use client";

import { ChoiceList } from "./ChoiceList";
import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";
import type { CheckInFrequency } from "@/types";

interface Props {
  value?: CheckInFrequency;
  onChange: (value: CheckInFrequency) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CheckInScreen({ value, onChange, onNext, onBack }: Props) {
  return (
    <QuestionLayout
      eyebrow="Step 7 of 9"
      title="How often will you check in?"
      footer={
        <>
          <PrimaryButton variant="ghost" onClick={onBack}>
            Back
          </PrimaryButton>
          <PrimaryButton disabled={!value} onClick={onNext}>
            Continue
          </PrimaryButton>
        </>
      }
    >
      <ChoiceList<CheckInFrequency>
        value={value}
        onChange={onChange}
        options={[
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "only_when_matters", label: "Only when something matters" },
        ]}
      />
    </QuestionLayout>
  );
}
