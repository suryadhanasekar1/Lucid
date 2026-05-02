import type { Holding, MacroSnapshot, UserGoals } from "@/types";

export interface ActionCard {
  id: string;
  type: "drift" | "risk" | "goal" | "fee" | "tax_loss" | "news";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  cta?: string;
  ctaAction?: string;
  timestamp: Date;
  dismissed: boolean;
}

export function generateActionCards(
  holdings: Holding[],
  goals: UserGoals,
  healthScore: number,
  taxOpportunities: Array<{ symbol: string; unrealizedLoss: number }>,
  macroSnapshot: MacroSnapshot,
): ActionCard[] {
  const now = new Date();
  const total = holdings.reduce((sum, h) => sum + h.value, 0);
  const cards: ActionCard[] = [];

  for (const holding of holdings) {
    const weight = total > 0 ? holding.value / total : 0;
    const target = targetWeight(holding, goals);
    const drift = Math.abs(weight - target);
    if (drift > 0.05) {
      cards.push({
        id: `drift-${holding.ticker}`,
        type: "drift",
        priority: drift > 0.1 ? "high" : "medium",
        title: `${holding.ticker} drifted from plan`,
        description: `${holding.ticker} is ${(drift * 100).toFixed(1)} percentage points from its target weight.`,
        cta: "Review allocation",
        ctaAction: "open_rebalance",
        timestamp: now,
        dismissed: false,
      });
    }
  }

  if (healthScore < 60) {
    cards.push({
      id: "risk-health-score",
      type: "risk",
      priority: "high",
      title: "Portfolio health needs attention",
      description: `Your health score is ${healthScore}. Start with diversification and risk alignment.`,
      cta: "Open health score",
      ctaAction: "open_health",
      timestamp: now,
      dismissed: false,
    });
  }

  const tax = taxOpportunities.find((item) => item.unrealizedLoss > 500);
  if (tax) {
    cards.push({
      id: `tax-loss-${tax.symbol}`,
      type: "tax_loss",
      priority: "medium",
      title: "Potential tax-loss harvest",
      description: `${tax.symbol} has about $${Math.round(tax.unrealizedLoss).toLocaleString()} in harvestable losses.`,
      cta: "View tax note",
      ctaAction: "open_tax",
      timestamp: now,
      dismissed: false,
    });
  }

  const vix = macroSnapshot.vix?.value;
  if (typeof vix === "number" && vix > 25) {
    cards.push({
      id: "news-vix-volatility",
      type: "news",
      priority: "medium",
      title: "Market volatility is elevated",
      description: `VIX is ${vix.toFixed(1)}. This is a moment to follow your plan, not headlines.`,
      timestamp: now,
      dismissed: false,
    });
  }

  if ((goals.timeHorizon ?? 10) < 2 && healthScore < 50) {
    cards.push({
      id: "goal-near-term",
      type: "goal",
      priority: "high",
      title: "Near-term goal may need more stability",
      description: "You have less than two years left and your plan is under 50% on track.",
      cta: "Adjust goal",
      ctaAction: "open_goal",
      timestamp: now,
      dismissed: false,
    });
  }

  return cards;
}

function targetWeight(holding: Holding, goals: UserGoals) {
  const explicit = goals.targetAllocation?.[holding.ticker] ?? goals.targetAllocation?.[holding.type];
  if (typeof explicit === "number") return explicit > 1 ? explicit / 100 : explicit;
  if (holding.type === "cash") return 0.05;
  if (holding.type === "bond") return 0.25;
  return 0.7;
}
