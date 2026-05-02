import { usePortfolioStore } from "@/stores/portfolioStore";
import type { Holding, MacroSnapshot, UserGoals } from "@/types";
import { findTaxLossOpportunities } from "@/lib/portfolio/tax";
import { generateActionCards, type ActionCard } from "./portfolioMonitor";

export async function runAllAgents(
  holdings: Holding[],
  goals: UserGoals,
  healthScore: number,
  macroSnapshot: MacroSnapshot,
): Promise<ActionCard[]> {
  const taxOpportunities = findTaxLossOpportunities(holdings);
  const cards = generateActionCards(holdings, goals, healthScore, taxOpportunities, macroSnapshot);
  const existing = usePortfolioStore.getState().actionCards;
  const blocked = new Set(existing.filter((card) => card.dismissed).map((card) => card.id));
  const active = new Set(existing.filter((card) => !card.dismissed).map((card) => card.id));
  return cards.filter((card) => !blocked.has(card.id) && !active.has(card.id));
}
