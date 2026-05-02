"use client";

import { useUserStore, type SurveyDraft, type SurveyStep } from "@/stores/userStore";
import { buildProfile } from "@/lib/portfolio/calculations";
import type { SurveyAnswers, UserProfile } from "@/types";

/**
 * Public hook (Section 4 contract). UI consumers only see what's specified.
 */
export function useUserProfile(): {
  profile: UserProfile | null;
  isOnboarded: boolean;
  setProfile: (profile: UserProfile) => void;
  resetProfile: () => void;
} {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const resetProfile = useUserStore((s) => s.resetProfile);

  return {
    profile,
    isOnboarded: profile !== null,
    setProfile,
    resetProfile,
  };
}

/**
 * Internal hook used by the survey flow. Not part of the public hook contract,
 * so its shape can evolve.
 */
export function useSurveyDraft(): {
  draft: SurveyDraft;
  step: SurveyStep;
  updateDraft: (patch: SurveyDraft) => void;
  setStep: (step: SurveyStep) => void;
  resetDraft: () => void;
  finalize: () => UserProfile | null;
} {
  const draft = useUserStore((s) => s.draft);
  const step = useUserStore((s) => s.step);
  const updateDraft = useUserStore((s) => s.updateDraft);
  const setStep = useUserStore((s) => s.setStep);
  const resetDraft = useUserStore((s) => s.resetDraft);
  const setProfile = useUserStore((s) => s.setProfile);

  const finalize = (): UserProfile | null => {
    if (!isComplete(draft)) return null;
    const profile = buildProfile(draft as SurveyAnswers);
    setProfile(profile);
    return profile;
  };

  return { draft, step, updateDraft, setStep, resetDraft, finalize };
}

function isComplete(d: SurveyDraft): d is SurveyAnswers {
  return (
    typeof d.experience === "string" &&
    typeof d.goal === "string" &&
    d.goal.length > 0 &&
    typeof d.timelineYears === "number" &&
    typeof d.painThreshold === "number" &&
    typeof d.sleepTestStartingValue === "number" &&
    typeof d.worry === "string" &&
    typeof d.checkIn === "string" &&
    typeof d.lifeStage === "string"
  );
}
