/**
 * Core domain types. The hook contract (src/hooks/**) consumes these.
 * Once Phase 0 ships, these signatures should change as little as possible —
 * Section 4 of COMPASS_MASTER_SPEC.md is the authoritative reference.
 */

// ───────────────────────────────── Onboarding ─────────────────────────────────

export type ExperienceLevel = "beginner" | "some_idea" | "comfortable";

export type Worry =
  | "losing_money"
  | "missing_out"
  | "not_understanding"
  | "taxes_fees"
  | "market_crashes";

export type CheckInFrequency = "daily" | "weekly" | "monthly" | "only_when_matters";

export type LifeStage =
  | "student"
  | "early_career"
  | "family"
  | "pre_retirement"
  | "retired";

export type UIMode = "essentials" | "investor" | "analyst";

export interface SurveyAnswers {
  experience: ExperienceLevel;
  goal: string;
  goalChips?: string[];
  timelineYears: number;
  /** Dollar value at which the user said "stop" in the Sleep Test. */
  painThreshold: number;
  /** Starting portfolio value used in the Sleep Test (default 25000). */
  sleepTestStartingValue: number;
  worry: Worry;
  checkIn: CheckInFrequency;
  lifeStage: LifeStage;
  uiMode: UIMode;
}

export interface Archetype {
  key: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  defaultAllocation: Record<string, number>;
}

export interface UserProfile {
  /** All raw survey answers verbatim. */
  answers: SurveyAnswers;
  /** Dashboard detail level: simple, standard, or advanced. */
  uiMode: UIMode;
  /** Derived 0-100 risk score from pain_threshold / starting_value. */
  riskScore: number;
  /** Named risk archetype shown after the Sleep Test. */
  archetype?: Archetype;
  /** ISO timestamp the survey was completed. */
  completedAt: string;
}

// ───────────────────────────────── Portfolio ──────────────────────────────────

export type AssetType = "stock" | "etf" | "mutual_fund" | "bond" | "cash";
export type RiskAssetType =
  | "broad_market_fund"
  | "international_fund"
  | "bond_fund"
  | "cash"
  | "individual_stock"
  | "speculative_stock";

export type PortfolioSource = "snaptrade" | "sample" | "none";

export interface Holding {
  ticker: string;
  name: string;
  type: AssetType;
  shares: number;
  /** Last-known unit price in USD. */
  price: number;
  /** Optional snapshot of cost basis if SnapTrade returned it. */
  costBasis?: number;
  /** Optional recent purchase date used for wash-sale warnings. */
  purchaseDate?: string;
  /** Computed: shares * price. */
  value: number;
  /** Beginner risk bucket used by the demo health/rebalance logic. */
  assetType?: RiskAssetType;
  /** Optional explicit 0-100 risk score for demo/sample holdings. */
  riskScore?: number;
  /** Optional pre-computed allocation (0-1). */
  weight?: number;
}

export interface PortfolioSnapshot {
  source: PortfolioSource;
  holdings: Holding[];
  totalValue: number;
  fetchedAt: string;
}

// ───────────────────────────── Stock explorer ─────────────────────────────

export interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

export interface StockDetail {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  sector: string | null;
  peRatio: number | null;
  beta: number | null;
  marketCap: number | null;
  summary: string | null;
}

export interface PricePoint {
  date: string;
  close: number;
}

// ─────────────────────────── Health score / weather ───────────────────────────

export type Weather = "sunny" | "partly_cloudy" | "cloudy" | "stormy";

export interface HealthComponents {
  diversification: number;
  goalAlignment: number;
  risk: number;
  fees: number;
}

export interface HealthScore {
  score: number; // 0-100
  weather: Weather;
  components: HealthComponents;
}

// ──────────────────────────────────── Widgets ─────────────────────────────────

export type WidgetCategory =
  | "core"
  | "risk"
  | "education"
  | "planning"
  | "mechanics"
  | "engagement";

export type WidgetPriority = "P0" | "P1" | "P2";

export interface WidgetDefinition {
  id: string;
  title: string;
  category: WidgetCategory;
  priority: WidgetPriority;
  /** Description shown in "Why is this here?" tooltip. */
  rationale: string;
  /**
   * Predicate run against UserProfile to decide whether to recommend this widget.
   * Returns true when the widget should appear by default.
   */
  triggers: (profile: UserProfile) => boolean;
}

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export type GridLayout = GridLayoutItem[];

// ───────────────────────────────── Scenarios ─────────────────────────────────

export type ScenarioId =
  | "high_inflation"
  | "fed_hike"
  | "market_crash_30"
  | "soft_landing"
  | "recession";

export interface ScenarioPreset {
  id: ScenarioId;
  title: string;
  blurb: string;
  /** "What if X happens" copy used in tooltips. */
  question: string;
}

export interface ScenarioImpact {
  ticker: string;
  before: number;
  after: number;
  deltaPct: number;
}

export interface ScenarioResult {
  scenarioId: ScenarioId;
  startingValue: number;
  endingValue: number;
  deltaPct: number;
  impacts: ScenarioImpact[];
  narrative: string;
  /** Macro values FRED supplied as inputs. */
  groundedIn?: {
    cpi?: number;
    fedFundsRate?: number;
    treasury10y?: number;
  };
}

// ─────────────────────────────── Worry Translator ─────────────────────────────

export interface WorryResponse {
  /** Plain-English summary, 2-3 sentences. */
  summary: string;
  /** What this means for the user's specific portfolio. */
  forYou: string;
  /** What (if anything) they should consider doing — usually nothing. */
  suggestedActions: string[];
  /** Cited macro/fund values used to ground the response. */
  citations: Citation[];
  confidence?: "low" | "medium" | "high";
  classification?: string;
  life_event_detected?: LifeEventDetected | null;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  classification?: string;
  confidence?: "low" | "medium" | "high";
}

export interface LifeEventDetected {
  event: string;
  adjustment: {
    riskScoreAdjust: number;
    allocationShift: Record<string, number>;
    urgency: string;
    explanation: string;
  };
}

export interface UserGoals {
  targetAllocation?: Record<string, number>;
  timeHorizon?: number;
  riskScore?: number;
}

export interface Citation {
  source: "FRED" | "SEC_EDGAR" | "YAHOO" | "NEWSAPI" | "SNAPTRADE";
  label: string;
  value?: string | number;
  url?: string;
}

// ─────────────────────────────── Headline Decoder ─────────────────────────────

export interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface HeadlineDecoded {
  original: Headline;
  /** "What this actually means for a beginner." */
  plainEnglish: string;
  /** Whether this is something to act on. */
  signal: "noise" | "watch" | "act";
  affects: {
    ticker: string;
    note: string;
  }[];
  citations: Citation[];
}

// ─────────────────────────────── Circuit Breaker ──────────────────────────────

export interface SellAction {
  ticker: string;
  shares: number;
  reasonClaimed?: string;
}

// ──────────────────────────────── Fund X-Ray ──────────────────────────────────

export interface FundComponent {
  ticker: string;
  name: string;
  weight: number; // 0-1
}

export interface FundHoldings {
  fundTicker: string;
  fundName: string;
  /** Filing date of the N-PORT used. */
  asOf: string;
  /** Sorted descending by weight. */
  holdings: FundComponent[];
  /** Total holdings count in the original filing. */
  totalHoldings: number;
}

// ─────────────────────────── Macro snapshot (FRED) ────────────────────────────

export interface MacroIndicator {
  /** FRED series id, e.g. "CPIAUCSL". */
  seriesId: string;
  /** Human label, e.g. "Inflation (CPI)". */
  label: string;
  /** Most-recent value. */
  value: number;
  /** Units, e.g. "%", "%/yr", "USD". */
  unit: string;
  /** Plain-English translation for beginners. */
  plainEnglish: string;
  /** ISO date the value is for. */
  asOf: string;
}

export interface MacroSnapshot {
  /** Snapshot fetch timestamp. */
  fetchedAt: string;
  inflation: MacroIndicator;
  fedFundsRate: MacroIndicator;
  treasury10y: MacroIndicator;
  mortgage30y: MacroIndicator;
  vix?: MacroIndicator;
}
