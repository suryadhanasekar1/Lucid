import type {
  Archetype,
  HealthComponents,
  HealthScore,
  Holding,
  SurveyAnswers,
  UserProfile,
  Weather,
} from "@/types";

// ─────────────────────────────── Risk score ───────────────────────────────

/**
 * Sleep Test → 0-100 risk score.
 * pain_threshold / starting_value gives the share of the portfolio the user is
 * willing to keep through a crash. We invert it so a HIGHER number means a
 * HIGHER risk tolerance (i.e. willing to lose more).
 */
export function deriveRiskScore(
  painThreshold: number,
  startingValue: number,
): number {
  if (!startingValue || startingValue <= 0) return 0;
  const clampedThreshold = Math.max(0, Math.min(painThreshold, startingValue));
  const tolerated = (startingValue - clampedThreshold) / startingValue;
  return Math.round(tolerated * 100);
}

export function getArchetype(riskScore: number): Archetype {
  if (riskScore >= 76) return {
    key: "trailblazer",
    name: "The Trailblazer",
    tagline: "High growth. High conviction.",
    description: "You see market dips as buying opportunities. You are comfortable with volatility and focused on long-term growth.",
    color: "#D85A30",
    defaultAllocation: { stocks: 80, bonds: 10, cash: 5, alternatives: 5 },
  };
  if (riskScore >= 51) return {
    key: "builder",
    name: "The Builder",
    tagline: "Steady growth. Balanced risk.",
    description: "You want your money working hard but also sleep well at night. Growth matters, but so does stability.",
    color: "#378ADD",
    defaultAllocation: { stocks: 60, bonds: 25, cash: 10, alternatives: 5 },
  };
  if (riskScore >= 26) return {
    key: "guardian",
    name: "The Guardian",
    tagline: "Capital first. Growth second.",
    description: "Protecting what you have comes before growing it. You prefer steady, predictable returns.",
    color: "#1D9E75",
    defaultAllocation: { stocks: 40, bonds: 40, cash: 15, alternatives: 5 },
  };
  return {
    key: "anchor",
    name: "The Anchor",
    tagline: "Safety above all.",
    description: "You want your money protected and accessible. Minimal risk, maximum peace of mind.",
    color: "#534AB7",
    defaultAllocation: { stocks: 20, bonds: 45, cash: 30, alternatives: 5 },
  };
}

export function buildProfile(answers: SurveyAnswers): UserProfile {
  const riskScore = deriveRiskScore(answers.painThreshold, answers.sleepTestStartingValue);
  return {
    answers,
    riskScore,
    archetype: getArchetype(riskScore),
    completedAt: new Date().toISOString(),
  };
}

// ──────────────────────────── Portfolio basics ────────────────────────────

export function totalValue(holdings: Holding[]): number {
  return holdings.reduce((sum, h) => sum + h.value, 0);
}

export function withWeights(holdings: Holding[]): Holding[] {
  const tv = totalValue(holdings);
  if (tv <= 0) return holdings.map((h) => ({ ...h, weight: 0 }));
  return holdings.map((h) => ({ ...h, weight: h.value / tv }));
}

// Foundation = diversified low-cost core (broad index funds, ETFs, bonds, cash).
// Frontier = single stocks and concentrated bets.
export function foundationFrontier(holdings: Holding[]): {
  foundationValue: number;
  frontierValue: number;
} {
  let foundation = 0;
  let frontier = 0;
  for (const h of holdings) {
    if (h.type === "stock") frontier += h.value;
    else foundation += h.value;
  }
  return { foundationValue: foundation, frontierValue: frontier };
}

// ───────────────────────────── Health score ─────────────────────────────

const WEIGHT = {
  diversification: 0.3,
  goalAlignment: 0.25,
  risk: 0.25,
  fees: 0.2,
} as const;

/** Diversification: 100 when spread across 5+ positions and not over 35% in one. */
function diversificationScore(holdings: Holding[]): number {
  const tv = totalValue(holdings);
  if (tv <= 0) return 0;
  const n = holdings.filter((h) => h.type !== "cash").length;
  const breadth = Math.min(1, n / 5);
  const max = Math.max(...holdings.map((h) => h.value / tv), 0);
  const concentration = max > 0.35 ? Math.max(0, 1 - (max - 0.35) / 0.5) : 1;
  return Math.round(breadth * concentration * 100);
}

/** Goal alignment: foundation share should match (1 - riskScore/100). */
function goalAlignmentScore(holdings: Holding[], profile: UserProfile): number {
  const tv = totalValue(holdings);
  if (tv <= 0) return 0;
  const { foundationValue } = foundationFrontier(holdings);
  const actual = foundationValue / tv;
  const target = 1 - profile.riskScore / 100;
  // 100 when within 10pp of target, decays linearly to 0 at 50pp delta.
  const delta = Math.abs(actual - target);
  const score = 1 - Math.max(0, (delta - 0.1) / 0.4);
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

/** Risk: 100 when stock allocation matches the risk score. */
function riskScoreSubscore(holdings: Holding[], profile: UserProfile): number {
  const tv = totalValue(holdings);
  if (tv <= 0) return 0;
  const stocky = holdings
    .filter((h) => h.type === "stock" || h.type === "etf" || h.type === "mutual_fund")
    .reduce((s, h) => s + h.value, 0);
  const equityShare = stocky / tv;
  const target = profile.riskScore / 100;
  const delta = Math.abs(equityShare - target);
  const score = 1 - Math.max(0, (delta - 0.1) / 0.4);
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

/** Fees: 100 when expense-ratio drag is < 0.2%, decaying to 0 at >1%.
 *  We approximate by ticker — funds with X-suffix or known low-cost tickers
 *  score high; single stocks have zero ER. */
function feeScore(holdings: Holding[]): number {
  if (holdings.length === 0) return 0;
  const erEstimate: Record<string, number> = {
    VTSAX: 0.0004,
    VTIAX: 0.0011,
    VBTLX: 0.0005,
    VTI: 0.0003,
    VOO: 0.0003,
    VXUS: 0.0007,
    QQQ: 0.002,
    SCHB: 0.0003,
    FZROX: 0,
    FZILX: 0,
    BND: 0.0003,
    AGG: 0.0003,
  };
  const tv = totalValue(holdings);
  if (tv <= 0) return 0;
  let weightedER = 0;
  for (const h of holdings) {
    if (h.type === "stock" || h.type === "cash") continue;
    const er = erEstimate[h.ticker] ?? 0.005;
    weightedER += (h.value / tv) * er;
  }
  const score = 1 - Math.max(0, (weightedER - 0.002) / 0.008);
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

export function computeHealthScore(
  holdings: Holding[],
  profile: UserProfile | null,
): HealthScore {
  if (!profile || holdings.length === 0) {
    return {
      score: 0,
      weather: "cloudy",
      components: { diversification: 0, goalAlignment: 0, risk: 0, fees: 0 },
    };
  }
  const components: HealthComponents = {
    diversification: diversificationScore(holdings),
    goalAlignment: goalAlignmentScore(holdings, profile),
    risk: riskScoreSubscore(holdings, profile),
    fees: feeScore(holdings),
  };
  const score = Math.round(
    components.diversification * WEIGHT.diversification +
      components.goalAlignment * WEIGHT.goalAlignment +
      components.risk * WEIGHT.risk +
      components.fees * WEIGHT.fees,
  );
  return { score, weather: weatherFor(score), components };
}

export function weatherFor(score: number): Weather {
  if (score >= 80) return "sunny";
  if (score >= 60) return "partly_cloudy";
  if (score >= 40) return "cloudy";
  return "stormy";
}
