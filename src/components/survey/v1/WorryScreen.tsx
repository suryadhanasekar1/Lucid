"use client";

import { ChoiceList } from "./ChoiceList";
import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";
import type { Worry } from "@/types";

interface Props {
  value?: Worry;
  onChange: (worry: Worry) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WorryScreen({ value, onChange, onNext, onBack }: Props) {
  return (
    <QuestionLayout
      eyebrow="Step 6 of 9"
      title="What's your biggest worry?"
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
      <ChoiceList<Worry>
        value={value}
        onChange={onChange}
        options={[
          { value: "losing_money", label: "Losing money" },
          { value: "missing_out", label: "Missing out" },
          { value: "not_understanding", label: "Not understanding what I own" },
          { value: "taxes_fees", label: "Taxes & fees" },
          { value: "market_crashes", label: "Market crashes" },
        ]}
      />
    </QuestionLayout>
  );
}
