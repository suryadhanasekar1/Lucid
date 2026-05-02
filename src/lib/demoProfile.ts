import { getArchetype } from "@/lib/portfolio/calculations";
import type { UserProfile } from "@/types";

export function buildDemoProfile(): UserProfile {
  const riskScore = 35;

  return {
    answers: {
      name: "there",
      experience: "beginner",
      goal: "build long-term savings",
      timelineYears: 10,
      painThreshold: 16_250,
      sleepTestStartingValue: 25_000,
      worry: "market_crashes",
      checkIn: "weekly",
      lifeStage: "early_career",
      uiMode: "essentials",
    },
    uiMode: "essentials",
    riskScore,
    archetype: getArchetype(riskScore),
    completedAt: "sample-dashboard",
  };
}
