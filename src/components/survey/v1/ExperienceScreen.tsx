"use client";

import { ChoiceList } from "./ChoiceList";
import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";
import type { ExperienceLevel } from "@/types";

interface Props {
  value?: ExperienceLevel;
  onChange: (value: ExperienceLevel) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ExperienceScreen({ value, onChange, onNext, onBack }: Props) {
  return (
    <QuestionLayout
      eyebrow="Step 1 of 8"
      title="How would you describe yourself?"
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
      <ChoiceList<ExperienceLevel>
        value={value}
        onChange={onChange}
        options={[
          {
            value: "beginner",
            label: "Total beginner",
            hint: "Not sure where to start.",
          },
          {
            value: "some_idea",
            label: "Some idea",
            hint: "I know a few things, mostly from headlines.",
          },
          {
            value: "comfortable",
            label: "Comfortable",
            hint: "I check my portfolio and know what I own.",
          },
        ]}
      />
    </QuestionLayout>
  );
}
