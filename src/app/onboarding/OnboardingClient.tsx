"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SurveyShell } from "@/components/survey/v1/SurveyShell";
import { WelcomeScreen } from "@/components/survey/v1/WelcomeScreen";
import { NameScreen } from "@/components/survey/v1/NameScreen";
import { ExperienceScreen } from "@/components/survey/v1/ExperienceScreen";
import { GoalScreen } from "@/components/survey/v1/GoalScreen";
import { TimelineScreen } from "@/components/survey/v1/TimelineScreen";
import { SleepTestScreen } from "@/components/survey/v1/SleepTestScreen";
import { WorryScreen } from "@/components/survey/v1/WorryScreen";
import { CheckInScreen } from "@/components/survey/v1/CheckInScreen";
import { LifeStageScreen } from "@/components/survey/v1/LifeStageScreen";
import { KnowledgeScreen } from "@/components/survey/v1/KnowledgeScreen";
import { SummaryScreen } from "@/components/survey/v1/SummaryScreen";
import { useSurveyDraft } from "@/hooks/useUserProfile";
import {
  SURVEY_STEPS,
  type SurveyStep,
} from "@/stores/userStore";

interface Props {
  initialStep: SurveyStep;
}

export function OnboardingClient({ initialStep }: Props) {
  const router = useRouter();
  const { draft, updateDraft, setStep, finalize } = useSurveyDraft();

  // URL is the source of truth for which step renders. The store mirrors it
  // for any non-UI consumer (e.g. resume-where-you-left-off).
  const step: SurveyStep = initialStep;

  useEffect(() => {
    setStep(initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStep]);

  const goTo = (next: SurveyStep) => {
    router.push(next === "welcome" ? "/onboarding" : `/onboarding/${next}`);
  };

  const stepIndex = SURVEY_STEPS.indexOf(step);
  const next = (): SurveyStep => SURVEY_STEPS[stepIndex + 1] ?? "summary";
  const prev = (): SurveyStep => SURVEY_STEPS[Math.max(0, stepIndex - 1)] ?? "welcome";

  const onNext = () => goTo(next());
  const onBack = () => goTo(prev());

  const startingValue = draft.sleepTestStartingValue ?? 25_000;

  return (
    <SurveyShell step={step}>
      {step === "welcome" && <WelcomeScreen onStart={onNext} />}

      {step === "name" && (
        <NameScreen
          value={draft.name}
          onChange={(name) => updateDraft({ name })}
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {step === "experience" && (
        <ExperienceScreen
          value={draft.experience}
          onChange={(experience) => updateDraft({ experience })}
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {step === "goal" && (
        <GoalScreen
          value={draft.goal}
          chips={draft.goalChips}
          onChange={(goal, goalChips) => updateDraft({ goal, goalChips })}
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {step === "timeline" && (
        <TimelineScreen
          value={draft.timelineYears}
          onChange={(timelineYears) => updateDraft({ timelineYears })}
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {step === "sleep_test" && (
        <SleepTestScreen
          startingValue={startingValue}
          painThreshold={draft.painThreshold}
          onCapture={(painThreshold) =>
            updateDraft({ painThreshold, sleepTestStartingValue: startingValue })
          }
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {step === "worry" && (
        <WorryScreen
          value={draft.worry}
          onChange={(worry) => updateDraft({ worry })}
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {step === "check_in" && (
        <CheckInScreen
          value={draft.checkIn}
          onChange={(checkIn) => updateDraft({ checkIn })}
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {step === "life_stage" && (
        <LifeStageScreen
          value={draft.lifeStage}
          onChange={(lifeStage) => updateDraft({ lifeStage })}
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {step === "knowledge" && (
        <KnowledgeScreen
          value={draft.uiMode}
          onChange={(uiMode) => updateDraft({ uiMode })}
          onNext={onNext}
          onBack={onBack}
        />
      )}

      {step === "summary" && draft.painThreshold !== undefined && (
        <SummaryScreen
          answers={{
            experience: draft.experience ?? "beginner",
            goal: draft.goal ?? "",
            goalChips: draft.goalChips,
            timelineYears: draft.timelineYears ?? 10,
            painThreshold: draft.painThreshold,
            sleepTestStartingValue: draft.sleepTestStartingValue ?? 25_000,
            worry: draft.worry ?? "losing_money",
            checkIn: draft.checkIn ?? "weekly",
            lifeStage: draft.lifeStage ?? "early_career",
            uiMode: draft.uiMode ?? "essentials",
          }}
          riskScore={Math.round(
            ((draft.sleepTestStartingValue ?? 25_000) - draft.painThreshold) /
              (draft.sleepTestStartingValue ?? 25_000) *
              100,
          )}
          onBack={onBack}
          onBuild={() => {
            const profile = finalize();
            if (profile) {
              router.push("/connect");
            }
          }}
        />
      )}
    </SurveyShell>
  );
}
