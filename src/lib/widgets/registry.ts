import type { UserProfile, WidgetDefinition } from "@/types";

const always = (_p: UserProfile) => true;

export const WIDGETS: WidgetDefinition[] = [
  // Essentials — shown first in simple mode
  {
    id: "what_you_own",
    title: "What You Own in 3 Sentences",
    category: "education",
    priority: "P0",
    rationale: "Always shown in simple view — a plain-English summary of your portfolio.",
    triggers: always,
  },

  // Core
  {
    id: "health_score",
    title: "Portfolio Health Score",
    category: "core",
    priority: "P0",
    rationale: "Always shown — your at-a-glance read on diversification, risk, fees, and goal alignment.",
    triggers: always,
  },
  {
    id: "action_queue",
    title: "Agent Inbox",
    category: "planning",
    priority: "P0",
    rationale: "Always shown — Lucid surfaces the few portfolio actions worth your attention.",
    triggers: always,
  },
  {
    id: "total_value",
    title: "Total Value",
    category: "core",
    priority: "P0",
    rationale: "Always shown — the headline number across your real holdings.",
    triggers: always,
  },
  {
    id: "portfolio_history",
    title: "Portfolio Balance History",
    category: "core",
    priority: "P0",
    rationale: "Always shown — tracks how your full portfolio has moved over time, not just today's balance.",
    triggers: always,
  },
  {
    id: "foundation_frontier",
    title: "Foundation vs Frontier",
    category: "core",
    priority: "P0",
    rationale: "Always shown — splits boring core funds from speculative bets so you can see the balance.",
    triggers: always,
  },
  {
    id: "goal_progress",
    title: "Goal Progress",
    category: "core",
    priority: "P0",
    rationale: "Always shown — distance to your stated goal in plain dollars and time.",
    triggers: always,
  },

  // Risk
  {
    id: "worry_translator",
    title: "Worry Translator",
    category: "risk",
    priority: "P0",
    rationale: "Always shown — type a worry, get a personalized read grounded in real macro data.",
    triggers: always,
  },
  {
    id: "headline_decoder",
    title: "Headline Decoder",
    category: "risk",
    priority: "P0",
    rationale: "Surfaced because you said headlines or missing-out worry you most.",
    triggers: (p) => p.answers.worry === "market_crashes" || p.answers.worry === "missing_out",
  },
  {
    id: "circuit_breaker",
    title: "Circuit Breaker",
    category: "risk",
    priority: "P0",
    rationale: "Auto-arms whenever you try to sell — a 60s cooldown to prevent panic decisions.",
    triggers: always,
  },
  {
    id: "pain_threshold",
    title: "Pain Threshold Monitor",
    category: "risk",
    priority: "P1",
    rationale: "Surfaced because crashes worry you most — tracks distance from your Sleep Test threshold.",
    triggers: (p) => p.answers.worry === "market_crashes",
  },

  // Education
  {
    id: "mutual_fund_xray",
    title: "Mutual Fund X-Ray",
    category: "education",
    priority: "P1",
    rationale: "Surfaced because you're new to investing — pulls real holdings from SEC EDGAR for any fund you own.",
    triggers: (p) => p.answers.experience === "beginner",
  },
  {
    id: "macro_conditions",
    title: "Today's Conditions",
    category: "education",
    priority: "P1",
    rationale:
      "Surfaced because you're new or worry about crashes — shows current CPI, Fed rate, and yields from FRED with plain-English context.",
    triggers: (p) =>
      p.answers.experience === "beginner" ||
      p.answers.worry === "market_crashes" ||
      p.answers.worry === "missing_out",
  },
  {
    id: "stock_explorer",
    title: "Stock Explorer",
    category: "education",
    priority: "P1",
    rationale: "Search a stock, inspect the chart, and preview how it might change your portfolio before buying.",
    triggers: always,
  },
  {
    id: "sector_exposure",
    title: "Sector & Geographic Exposure",
    category: "education",
    priority: "P1",
    rationale: "Always shown — translates your holdings into sector and location concentration.",
    triggers: always,
  },

  // Mechanics
  {
    id: "cost_tax_receipt",
    title: "Cost & Tax Receipt",
    category: "mechanics",
    priority: "P1",
    rationale: "Surfaced because taxes & fees worry you most — shows expense ratios and tax drag in dollars.",
    triggers: (p) => p.answers.worry === "taxes_fees",
  },

  // Planning
  {
    id: "quick_scenarios",
    title: "Quick Scenarios",
    category: "planning",
    priority: "P1",
    rationale: "Always shown — preview what high inflation, a Fed hike, or a 30% crash would do to YOUR portfolio.",
    triggers: always,
  },

  // Engagement
  {
    id: "compare_to_index",
    title: "Compare to Boring Index",
    category: "engagement",
    priority: "P2",
    rationale: "Surfaced because you're comfortable with markets — compares you against a 60/40 baseline.",
    triggers: (p) => p.answers.experience === "comfortable",
  },
  {
    id: "weekly_digest",
    title: "Weekly Digest",
    category: "engagement",
    priority: "P2",
    rationale: "Surfaced because you check in monthly or rarely — a once-a-week recap so you don't miss anything material.",
    triggers: (p) => p.answers.checkIn === "monthly" || p.answers.checkIn === "only_when_matters",
  },
  {
    id: "streak_tracker",
    title: "Anti-Panic Streak",
    category: "engagement",
    priority: "P2",
    rationale: "Surfaced because you check in daily — counts the days you didn't panic-sell.",
    triggers: (p) => p.answers.checkIn === "daily",
  },
];

export const WIDGETS_BY_ID: Record<string, WidgetDefinition> = Object.fromEntries(
  WIDGETS.map((w) => [w.id, w]),
);

export const CORE_WIDGET_IDS = WIDGETS.filter((w) => w.category === "core").map((w) => w.id);
