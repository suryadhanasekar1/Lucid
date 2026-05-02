"use client";

import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";
import type { SurveyAnswers, UserProfile } from "@/types";

interface Props {
  answers: SurveyAnswers;
  riskScore: number;
  onBuild: () => void;
  onBack: () => void;
}

const EXPERIENCE_LABEL: Record<SurveyAnswers["experience"], string> = {
  beginner: "Total beginner",
  some_idea: "Some idea",
  comfortable: "Comfortable",
};

const WORRY_LABEL: Record<SurveyAnswers["worry"], string> = {
  losing_money: "Losing money",
  missing_out: "Missing out",
  not_understanding: "Not understanding what I own",
  taxes_fees: "Taxes & fees",
  market_crashes: "Market crashes",
};

const CHECKIN_LABEL: Record<SurveyAnswers["checkIn"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  only_when_matters: "Only when something matters",
};

const LIFE_STAGE_LABEL: Record<SurveyAnswers["lifeStage"], string> = {
  student: "Student",
  early_career: "Early career",
  family: "Family",
  pre_retirement: "Pre-retirement",
  retired: "Retired",
};

export function SummaryScreen({ answers, riskScore, onBuild, onBack }: Props) {
  const rows: { label: string; value: string }[] = [
    { label: "Experience", value: EXPERIENCE_LABEL[answers.experience] },
    { label: "Goal", value: answers.goal },
    { label: "Timeline", value: `${answers.timelineYears} ${answers.timelineYears === 1 ? "year" : "years"}` },
    {
      label: "Pain threshold",
      value: `$${answers.painThreshold.toLocaleString()} (of $${answers.sleepTestStartingValue.toLocaleString()})`,
    },
    { label: "Risk score", value: `${riskScore} / 100` },
    { label: "Biggest worry", value: WORRY_LABEL[answers.worry] },
    { label: "Check-in", value: CHECKIN_LABEL[answers.checkIn] },
    { label: "Life stage", value: LIFE_STAGE_LABEL[answers.lifeStage] },
  ];

  return (
    <QuestionLayout
      eyebrow="All set"
      title="Here's what we'll build around."
      helper="You can change any of this later."
      footer={
        <>
          <PrimaryButton variant="ghost" onClick={onBack}>
            Back
          </PrimaryButton>
          <PrimaryButton onClick={onBuild}>Build my dashboard</PrimaryButton>
        </>
      }
    >
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {rows.map((row, idx) => (
          <li
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "var(--space-4)",
              padding: "var(--space-4) var(--space-6)",
              borderTop: idx === 0 ? "none" : "1px solid var(--border-subtle)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontFamily: row.label === "Pain threshold" || row.label === "Risk score"
                  ? "var(--font-mono)"
                  : "var(--font-body)",
                fontSize: 15,
                color: "var(--text-primary)",
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </QuestionLayout>
  );
}

export function summaryFromProfile(profile: UserProfile) {
  return { answers: profile.answers, riskScore: profile.riskScore };
}
