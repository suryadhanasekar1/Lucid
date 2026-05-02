import type {
  Archetype,
  HealthComponents,
  HealthScore,
  Holding,
  RiskAssetType,
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
    uiMode: answers.uiMode,
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
    const assetType = riskAssetTypeForHolding(h);
    if (assetType === "individual_stock" || assetType === "speculative_stock") frontier += h.value;
    else foundation += h.value;
  }
  return { foundationValue: foundation, frontierValue: frontier };
}

// ───────────────────── Beginner-friendly portfolio risk ─────────────────────

export const RISK_WEIGHTS: Record<RiskAssetType, number> = {
  cash: 5,
  bond_fund: 20,
  broad_market_fund: 55,
  international_fund: 65,
  individual_stock: 85,
  speculative_stock: 95,
};

const TICKER_RISK: Record<string, { assetType: RiskAssetType; riskScore: number }> = {
  TSLA: { assetType: "speculative_stock", riskScore: 95 },
  NVDA: { assetType: "speculative_stock", riskScore: 90 },
  COIN: { assetType: "speculative_stock", riskScore: 95 },
  PLTR: { assetType: "speculative_stock", riskScore: 90 },
  AAPL: { assetType: "individual_stock", riskScore: 75 },
  MSFT: { assetType: "individual_stock", riskScore: 70 },
  VTSAX: { assetType: "broad_market_fund", riskScore: 55 },
  VTI: { assetType: "broad_market_fund", riskScore: 55 },
  VOO: { assetType: "broad_market_fund", riskScore: 55 },
  SCHB: { assetType: "broad_market_fund", riskScore: 55 },
  VTIAX: { assetType: "international_fund", riskScore: 65 },
  VXUS: { assetType: "international_fund", riskScore: 65 },
  VBTLX: { assetType: "bond_fund", riskScore: 20 },
  BND: { assetType: "bond_fund", riskScore: 20 },
  AGG: { assetType: "bond_fund", riskScore: 20 },
  CASH: { assetType: "cash", riskScore: 5 },
};

export type RiskStatus = "optimized" | "caution" | "risky";

export interface PortfolioRiskAnalysis {
  portfolioRiskRaw: number;
  targetRisk: number;
  riskFitScore: number;
  status: RiskStatus;
}

export function riskAssetTypeForHolding(holding: Holding): RiskAssetType {
  if (holding.assetType) return holding.assetType;
  const ticker = holding.ticker.toUpperCase();
  const mapped = TICKER_RISK[ticker];
  if (mapped) return mapped.assetType;
  if (holding.type === "cash") return "cash";
  if (holding.type === "bond") return "bond_fund";
  if (holding.type === "stock") return "individual_stock";
  if (holding.type === "etf" || holding.type === "mutual_fund") return "broad_market_fund";
  return "individual_stock";
}

export function holdingRiskScore(holding: Holding): number {
  if (typeof holding.riskScore === "number") return clampScore(holding.riskScore);
  const ticker = holding.ticker.toUpperCase();
  const mapped = TICKER_RISK[ticker];
  if (mapped) return mapped.riskScore;
  return RISK_WEIGHTS[riskAssetTypeForHolding(holding)];
}

export function calculatePortfolioRiskRaw(holdings: Holding[]): number {
  const tv = totalValue(holdings);
  if (tv <= 0) return 0;
  const weighted = holdings.reduce((sum, holding) => {
    return sum + (holding.value / tv) * holdingRiskScore(holding);
  }, 0);
  return Math.round(weighted * 10) / 10;
}

export function calculateTargetRisk(profile: UserProfile | null): number {
  if (!profile) return 55;
  const riskTolerance =
    (profile as { riskTolerance?: string }).riskTolerance ??
    (profile.answers as SurveyAnswers & { riskTolerance?: string }).riskTolerance;

  if (riskTolerance === "conservative") return 35;
  if (riskTolerance === "moderate") return 55;
  if (riskTolerance === "aggressive") return 75;

  const horizon = profile.answers.timelineYears;
  if (horizon <= 3) return 35;
  if (horizon <= 10) return 55;
  return 70;
}

export function calculateRiskFitScore(portfolioRiskRaw: number, targetRisk: number): number {
  const riskDifference = Math.abs(portfolioRiskRaw - targetRisk);
  return clampScore(100 - riskDifference * 2);
}

export function riskStatusForScore(riskFitScore: number): RiskStatus {
  if (riskFitScore >= 75) return "optimized";
  if (riskFitScore >= 50) return "caution";
  return "risky";
}

export function analyzePortfolioRisk(
  holdings: Holding[],
  profile: UserProfile | null,
): PortfolioRiskAnalysis {
  const portfolioRiskRaw = calculatePortfolioRiskRaw(holdings);
  const targetRisk = calculateTargetRisk(profile);
  const riskFitScore = calculateRiskFitScore(portfolioRiskRaw, targetRisk);
  return {
    portfolioRiskRaw,
    targetRisk,
    riskFitScore,
    status: riskStatusForScore(riskFitScore),
  };
}

// ───────────────────────────── Health score ─────────────────────────────

const WEIGHT = {
  diversification: 0.25,
  risk: 0.35,
  fees: 0.2,
  goalAlignment: 0.2,
} as const;

/** Diversification: broad funds are diversified inside; concentrated single stocks are the main penalty. */
function diversificationScore(holdings: Holding[]): number {
  const tv = totalValue(holdings);
  if (tv <= 0) return 0;
  const invested = holdings.filter((h) => h.value > 0 && h.type !== "cash");
  const breadth = Math.min(1, invested.length / 5);
  const classCount = new Set(holdings.map(riskAssetTypeForHolding)).size;
  const assetMix = Math.min(1, classCount / 4);
  const maxRiskyPosition = Math.max(
    ...holdings
      .filter((h) => {
        const assetType = riskAssetTypeForHolding(h);
        return assetType === "individual_stock" || assetType === "speculative_stock";
      })
      .map((h) => h.value / tv),
    0,
  );
  const concentration = maxRiskyPosition > 0.25
    ? Math.max(0, 1 - (maxRiskyPosition - 0.25) / 0.4)
    : 1;
  return Math.round((breadth * 0.55 + assetMix * 0.45) * concentration * 100);
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

function riskScoreSubscore(holdings: Holding[], profile: UserProfile): number {
  return analyzePortfolioRisk(holdings, profile).riskFitScore;
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

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
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
