export const LIFE_EVENT_PATTERNS = [
  { pattern: /buy(ing)?\s+(a\s+)?house|home\s+purchase|down\s+payment|mortgage/i, event: "home_purchase" },
  { pattern: /baby|child|pregnant|expecting/i, event: "new_child" },
  { pattern: /retir(e|ing|ement)/i, event: "retirement" },
  { pattern: /laid\s+off|lost\s+my\s+job|unemploy/i, event: "job_loss" },
  { pattern: /new\s+job|promotion|raise/i, event: "income_increase" },
  { pattern: /married|wedding/i, event: "marriage" },
  { pattern: /inherit|windfall|bonus/i, event: "windfall" },
] as const;

export function detectLifeEvent(message: string): string | null {
  const match = LIFE_EVENT_PATTERNS.find((item) => item.pattern.test(message));
  return match?.event ?? null;
}

export function getLifeEventAdjustments(
  event: string,
  currentRiskScore: number,
): {
  riskScoreAdjust: number;
  allocationShift: Record<string, number>;
  urgency: string;
  explanation: string;
} {
  const table: Record<string, ReturnType<typeof getLifeEventAdjustments>> = {
    home_purchase: {
      riskScoreAdjust: currentRiskScore > 45 ? -10 : -5,
      allocationShift: { cash: 10, bonds: 5, stocks: -15 },
      urgency: "medium",
      explanation: "A near-term house goal usually deserves more cash and less volatility.",
    },
    new_child: {
      riskScoreAdjust: -5,
      allocationShift: { cash: 5, bonds: 5, stocks: -10 },
      urgency: "medium",
      explanation: "A new child often means a larger emergency cushion and calmer allocation.",
    },
    retirement: {
      riskScoreAdjust: -15,
      allocationShift: { bonds: 15, cash: 5, stocks: -20 },
      urgency: "high",
      explanation: "Retirement shifts the job from growth-only to reliable withdrawals.",
    },
    job_loss: {
      riskScoreAdjust: -20,
      allocationShift: { cash: 20, stocks: -20 },
      urgency: "high",
      explanation: "Job loss makes liquidity more important than chasing returns.",
    },
    income_increase: {
      riskScoreAdjust: 5,
      allocationShift: { stocks: 5, cash: -5 },
      urgency: "low",
      explanation: "Higher income may let you invest more without changing your plan too much.",
    },
    marriage: {
      riskScoreAdjust: -3,
      allocationShift: { cash: 5, stocks: -5 },
      urgency: "medium",
      explanation: "Marriage is a good moment to align timelines, goals, and emergency cash.",
    },
    windfall: {
      riskScoreAdjust: -5,
      allocationShift: { cash: 10, bonds: 5, stocks: -15 },
      urgency: "medium",
      explanation: "A windfall is worth staging carefully instead of investing all at once.",
    },
  };
  return table[event] ?? {
    riskScoreAdjust: 0,
    allocationShift: {},
    urgency: "low",
    explanation: "This may be worth reflecting in your profile.",
  };
}
