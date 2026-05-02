import { NextResponse } from "next/server";
import { z } from "zod";
import { listScenarios, runScenario } from "@/lib/portfolio/scenarios";
import { getMacroSnapshot } from "@/lib/macro/fred";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";
import type { Holding, ScenarioId, UserProfile } from "@/types";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 60);

const holdingSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  type: z.enum(["stock", "etf", "mutual_fund", "bond", "cash"]),
  shares: z.number(),
  price: z.number(),
  costBasis: z.number().optional(),
  value: z.number(),
  weight: z.number().optional(),
});

const profileSchema = z.object({
  answers: z.object({
    experience: z.enum(["beginner", "some_idea", "comfortable"]),
    goal: z.string(),
    goalChips: z.array(z.string()).optional(),
    timelineYears: z.number(),
    painThreshold: z.number(),
    sleepTestStartingValue: z.number(),
    worry: z.enum(["losing_money", "missing_out", "not_understanding", "taxes_fees", "market_crashes"]),
    checkIn: z.enum(["daily", "weekly", "monthly", "only_when_matters"]),
    lifeStage: z.enum(["student", "early_career", "family", "pre_retirement", "retired"]),
  }),
  riskScore: z.number(),
  completedAt: z.string(),
});

const bodySchema = z.object({
  scenarioId: z.enum(["high_inflation", "fed_hike", "market_crash_30", "soft_landing", "recession"]),
  holdings: z.array(holdingSchema).min(1).max(200),
  profile: profileSchema,
});

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "scenarios");
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { snapshot } = await getMacroSnapshot();
  const result = runScenario(
    parsed.data.scenarioId as ScenarioId,
    parsed.data.holdings as Holding[],
    parsed.data.profile as UserProfile,
    snapshot,
  );
  return NextResponse.json(result);
}

export async function GET() {
  const { snapshot } = await getMacroSnapshot();
  return NextResponse.json({ scenarios: listScenarios(snapshot) });
}
