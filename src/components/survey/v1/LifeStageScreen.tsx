"use client";

import { ChoiceList } from "./ChoiceList";
import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";
import type { LifeStage } from "@/types";

interface Props {
  value?: LifeStage;
  onChange: (value: LifeStage) => void;
  onNext: () => void;
  onBack: () => void;
}

export function LifeStageScreen({ value, onChange, onNext, onBack }: Props) {
  return (
    <QuestionLayout
      eyebrow="Step 7 of 8"
      title="Which sounds most like you right now?"
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
      <ChoiceList<LifeStage>
        value={value}
        onChange={onChange}
        options={[
          { value: "student", label: "Student" },
          { value: "early_career", label: "Early career" },
          { value: "family", label: "Family" },
          { value: "pre_retirement", label: "Pre-retirement" },
          { value: "retired", label: "Retired" },
        ]}
      />
    </QuestionLayout>
  );
}
