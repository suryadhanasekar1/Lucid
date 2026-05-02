"use client";

import { ChoiceList } from "./ChoiceList";
import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";
import type { UIMode } from "@/types";

interface Props {
  value?: UIMode;
  onChange: (value: UIMode) => void;
  onNext: () => void;
  onBack: () => void;
}

export function KnowledgeScreen({ value, onChange, onNext, onBack }: Props) {
  return (
    <QuestionLayout
      eyebrow="Step 9 of 9"
      title="How would you describe your investing knowledge?"
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
      <ChoiceList<UIMode>
        value={value}
        onChange={onChange}
        options={[
          { value: "essentials", label: "I'm completely new — keep it simple" },
          { value: "investor", label: "I know the basics — stocks, bonds, funds" },
          { value: "analyst", label: "I'm comfortable with metrics like P/E, beta, Sharpe ratio" },
        ]}
      />
    </QuestionLayout>
  );
}
