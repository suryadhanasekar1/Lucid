import { NextResponse } from "next/server";
import { z } from "zod";
import { computeHealthScore } from "@/lib/portfolio/calculations";
import type { Holding, UserGoals, UserProfile } from "@/types";

const holdingSchema = z.object({
  ticker: z.string().min(1).max(12),
  name: z.string().min(1),
  type: z.enum(["stock", "etf", "mutual_fund", "bond", "cash"]),
  shares: z.number().nonnegative(),
  price: z.number().nonnegative(),
  costBasis: z.number().nonnegative().optional(),
  value: z.number().nonnegative(),
  weight: z.number().optional(),
});

const goalsSchema = z.object({
  targetAllocation: z.record(z.number()).optional(),
  timeHorizon: z.number().nonnegative().optional(),
  riskScore: z.number().min(0).max(100).optional(),
});

const bodySchema = z.object({
  holdings: z.array(holdingSchema).max(100),
  goals: goalsSchema.default({}),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ status: "error", error: "invalid_json", apiVersion: "v1" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "error", error: "bad_request", details: parsed.error.flatten(), apiVersion: "v1" },
      { status: 400 },
    );
  }

  const holdings = parsed.data.holdings as Holding[];
  const goals = parsed.data.goals as UserGoals;
  const profile = profileFromGoals(goals);
  const health = computeHealthScore(holdings, profile);
  const alerts = buildAlerts(health.score);

  return NextResponse.json({
    status: "success",
    data: {
      healthScore: health.score,
      overall: health.score,
      components: health.components,
      alerts,
      recommendations: alerts.length > 0 ? ["Review concentration, risk, and fee drag before trading."] : ["Portfolio looks broadly on track."],
    },
    apiVersion: "v1",
  });
}

function profileFromGoals(goals: UserGoals): UserProfile {
  return {
    answers: {
      experience: "some_idea",
      goal: "API analysis",
      timelineYears: goals.timeHorizon ?? 10,
      painThreshold: 20_000,
      sleepTestStartingValue: 25_000,
      worry: "losing_money",
      checkIn: "monthly",
      lifeStage: "early_career",
      uiMode: "investor",
    },
    uiMode: "investor",
    riskScore: goals.riskScore ?? 60,
    completedAt: new Date().toISOString(),
  };
}

function buildAlerts(score: number) {
  if (score >= 70) return [];
  if (score >= 50) return ["Portfolio has a few areas worth reviewing."];
  return ["Portfolio may be misaligned with the stated risk and time horizon."];
}
