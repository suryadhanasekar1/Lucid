"use client";

import { PrimaryButton } from "./PrimaryButton";
import { QuestionLayout } from "./QuestionLayout";
import { useArchetype } from "@/hooks/useArchetype";
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
  const archetype = useArchetype(riskScore);
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
      <div style={archetypeCard}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span
            aria-hidden="true"
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: archetype.color,
              boxShadow: "0 0 0 4px var(--border-subtle)",
              flex: "0 0 auto",
            }}
          />
          <div>
            <h2 style={archetypeName}>{archetype.name}</h2>
            <p style={archetypeTagline}>{archetype.tagline}</p>
          </div>
        </div>

        <p style={archetypeDescription}>{archetype.description}</p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            alignItems: "center",
          }}
        >
          <span style={riskScoreText}>Risk Score: {riskScore} / 100</span>
          <span style={allocationLabel}>Default allocation</span>
        </div>

        <AllocationBar allocation={archetype.defaultAllocation} accent={archetype.color} />
      </div>

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
  return { answers: profile.answers, riskScore: profile.riskScore, archetype: profile.archetype };
}

function AllocationBar({
  allocation,
  accent,
}: {
  allocation: Record<string, number>;
  accent: string;
}) {
  const segments = [
    { key: "stocks", label: "Stocks", color: accent },
    { key: "bonds", label: "Bonds", color: "var(--signal-info)" },
    { key: "cash", label: "Cash", color: "var(--text-tertiary)" },
    { key: "alternatives", label: "Alt.", color: "var(--gold-muted)" },
  ];

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <div
        aria-label="Default allocation"
        style={{
          display: "flex",
          height: 12,
          overflow: "hidden",
          borderRadius: 999,
          background: "var(--bg-inset)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {segments.map((segment) => (
          <span
            key={segment.key}
            title={`${segment.label}: ${allocation[segment.key] ?? 0}%`}
            style={{
              width: `${allocation[segment.key] ?? 0}%`,
              background: segment.color,
            }}
          />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "var(--space-2)",
        }}
      >
        {segments.map((segment) => (
          <div key={segment.key} style={{ display: "grid", gap: "var(--space-1)" }}>
            <span
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
                fontSize: 11,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {segment.label}
            </span>
            <span
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {allocation[segment.key] ?? 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const archetypeCard: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-4)",
  padding: "var(--space-6)",
  marginBottom: "var(--space-6)",
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-emphasis)",
  borderRadius: 16,
  boxShadow: "var(--shadow-card)",
};

const archetypeName: React.CSSProperties = {
  margin: 0,
  color: "var(--gold-primary)",
  fontFamily: "var(--font-display)",
  fontSize: 32,
  fontWeight: 300,
  lineHeight: 1.1,
};

const archetypeTagline: React.CSSProperties = {
  margin: "var(--space-1) 0 0",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  lineHeight: 1.4,
};

const archetypeDescription: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  lineHeight: 1.55,
};

const riskScoreText: React.CSSProperties = {
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  fontVariantNumeric: "tabular-nums",
};

const allocationLabel: React.CSSProperties = {
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};
