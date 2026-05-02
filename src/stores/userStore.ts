import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SurveyAnswers, UIMode, UserProfile } from "@/types";

export const SURVEY_STEPS = [
  "welcome",
  "name",
  "experience",
  "goal",
  "timeline",
  "sleep_test",
  "worry",
  "check_in",
  "life_stage",
  "knowledge",
  "summary",
] as const;

export type SurveyStep = (typeof SURVEY_STEPS)[number];

export type SurveyDraft = Partial<SurveyAnswers>;

interface UserStore {
  profile: UserProfile | null;
  draft: SurveyDraft;
  step: SurveyStep;
  uiMode: UIMode;
  setProfile: (profile: UserProfile) => void;
  setUiMode: (mode: UIMode) => void;
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
      uiMode: "essentials",
      setProfile: (profile) => set({ profile, uiMode: profile.uiMode }),
      setUiMode: (uiMode) =>
        set((s) => ({
          uiMode,
          draft: { ...s.draft, uiMode },
          profile: s.profile ? { ...s.profile, uiMode, answers: { ...s.profile.answers, uiMode } } : s.profile,
        })),
      resetProfile: () =>
        set({ profile: null, draft: { ...initialDraft }, step: "welcome", uiMode: "essentials" }),
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
