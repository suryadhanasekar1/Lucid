import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SurveyAnswers, UserProfile } from "@/types";

export const SURVEY_STEPS = [
  "welcome",
  "experience",
  "goal",
  "timeline",
  "sleep_test",
  "worry",
  "check_in",
  "life_stage",
  "summary",
] as const;

export type SurveyStep = (typeof SURVEY_STEPS)[number];

export type SurveyDraft = Partial<SurveyAnswers>;

interface UserStore {
  profile: UserProfile | null;
  draft: SurveyDraft;
  step: SurveyStep;
  setProfile: (profile: UserProfile) => void;
  resetProfile: () => void;
  updateDraft: (patch: SurveyDraft) => void;
  resetDraft: () => void;
  setStep: (step: SurveyStep) => void;
}

const initialDraft: SurveyDraft = {
  sleepTestStartingValue: 25_000,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      draft: { ...initialDraft },
      step: "welcome",
      setProfile: (profile) => set({ profile }),
      resetProfile: () =>
        set({ profile: null, draft: { ...initialDraft }, step: "welcome" }),
      updateDraft: (patch) =>
        set((s) => ({ draft: { ...s.draft, ...patch } })),
      resetDraft: () => set({ draft: { ...initialDraft }, step: "welcome" }),
      setStep: (step) => set({ step }),
    }),
    {
      name: "compass:user",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : window.localStorage,
      ),
    },
  ),
);
