import { notFound } from "next/navigation";
import { OnboardingClient } from "../OnboardingClient";
import { SURVEY_STEPS, type SurveyStep } from "@/stores/userStore";

export default function OnboardingStepPage({
  params,
}: {
  params: { step: string };
}) {
  if (!SURVEY_STEPS.includes(params.step as SurveyStep)) {
    notFound();
  }
  return <OnboardingClient initialStep={params.step as SurveyStep} />;
}

export function generateStaticParams() {
  return SURVEY_STEPS.map((step) => ({ step }));
}
