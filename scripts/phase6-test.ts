/**
 * Phase 6 functional tests — Cost & Tax Receipt, Compare to Index,
 * Weekly Digest, Anti-Panic Streak.
 *
 * Validates the math + recommender wiring; UI rendering is a manual-QA gate.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import type { Holding, UserProfile } from "../src/types";
import { annualFeeDrag, capGainsTaxOnSale } from "../src/lib/portfolio/tax";
import { recommendWidgets } from "../src/lib/widgets/recommender";
import { WIDGETS_BY_ID } from "../src/lib/widgets/registry";

let failures = 0;
function ok(msg: string) {
  console.log(`ok ${msg}`);
}
function bad(msg: string) {
  console.error(`FAIL ${msg}`);
  failures += 1;
}

function profileFor(overrides: Partial<UserProfile["answers"]>, riskScore = 50): UserProfile {
  return {
    answers: {
      experience: "comfortable",
      goal: "early retirement",
      timelineYears: 25,
      painThreshold: 12500,
      sleepTestStartingValue: 25000,
      worry: "taxes_fees",
      checkIn: "monthly",
      lifeStage: "early_career",
      ...overrides,
    },
    riskScore,
    completedAt: new Date().toISOString(),
  };
}

const samplePortfolio: Holding[] = [
  { ticker: "VTSAX", name: "Vanguard Total Stock", type: "mutual_fund", shares: 100, price: 124.65, costBasis: 8000, value: 12465 },
  { ticker: "VBTLX", name: "Vanguard Total Bond", type: "mutual_fund", shares: 200, price: 9.78, costBasis: 1900, value: 1956 },
  { ticker: "AAPL", name: "Apple", type: "stock", shares: 5, price: 200, costBasis: 600, value: 1000 },
];

async function main() {
  // ─── Cost & Tax Receipt math ─────────────────────────────────────────
  const vtsax = samplePortfolio[0]!;
  const vtsaxFee = annualFeeDrag(vtsax);
  const expectedVTSAX = vtsax.value * 0.0004; // ER table
  if (Math.abs(vtsaxFee - expectedVTSAX) < 0.01) {
    ok(`VTSAX annual fee drag = $${vtsaxFee.toFixed(2)} (ER 0.04%)`);
  } else {
    bad(`VTSAX fee drag wrong: got ${vtsaxFee.toFixed(2)}, expected ${expectedVTSAX.toFixed(2)}`);
  }

  const aaplFee = annualFeeDrag(samplePortfolio[2]!);
  if (aaplFee === 0) ok("single stock has zero fee drag");
  else bad(`single stock fee drag should be 0: got ${aaplFee}`);

  // VTSAX has $8000 basis on $12465 value → $4465 LTCG → $669.75 tax
  const vtsaxTax = capGainsTaxOnSale(vtsax, vtsax.value);
  const expectedTax = (vtsax.value - vtsax.costBasis!) * 0.15;
  if (Math.abs(vtsaxTax - expectedTax) < 0.01) {
    ok(`VTSAX tax-if-sold = $${vtsaxTax.toFixed(2)} (15% LTCG on $${(vtsax.value - vtsax.costBasis!).toFixed(0)} gain)`);
  } else {
    bad(`VTSAX tax wrong: got ${vtsaxTax.toFixed(2)}, expected ${expectedTax.toFixed(2)}`);
  }

  // Holding without basis: defaults to value (zero gain)
  const noBasis: Holding = { ...vtsax, costBasis: undefined };
  if (capGainsTaxOnSale(noBasis, vtsax.value) === 0) {
    ok("missing cost basis → tax = $0 (no inferred gain)");
  } else {
    bad("missing cost basis produced non-zero tax");
  }

  // ─── Compare to Index recommender wiring ─────────────────────────────
  const comfortable = profileFor({ experience: "comfortable" });
  const beginner = profileFor({ experience: "beginner" });
  const compareDef = WIDGETS_BY_ID["compare_to_index"];
  if (compareDef && compareDef.triggers(comfortable) && !compareDef.triggers(beginner)) {
    ok("compare_to_index triggers for experience=comfortable only");
  } else {
    bad("compare_to_index recommender wiring broken");
  }

  // 60/40 math: stockPct - 0.6
  const stockValue = samplePortfolio
    .filter((h) => h.type === "stock" || h.type === "etf" || h.type === "mutual_fund")
    .reduce((s, h) => s + h.value, 0);
  const totalValue = samplePortfolio.reduce((s, h) => s + h.value, 0);
  const stockPct = stockValue / totalValue;
  const delta = stockPct - 0.6;
  if (delta > 0.25 && delta < 0.45) {
    ok(`sample portfolio stock allocation ${(stockPct * 100).toFixed(1)}% → ${(delta * 100).toFixed(1)}pp above 60/40`);
  } else {
    bad(`unexpected delta vs 60/40: ${(delta * 100).toFixed(1)}pp`);
  }

  // ─── Weekly Digest recommender wiring ────────────────────────────────
  const monthly = profileFor({ checkIn: "monthly" });
  const onlyWhen = profileFor({ checkIn: "only_when_matters" });
  const daily = profileFor({ checkIn: "daily" });
  const digestDef = WIDGETS_BY_ID["weekly_digest"];
  if (
    digestDef &&
    digestDef.triggers(monthly) &&
    digestDef.triggers(onlyWhen) &&
    !digestDef.triggers(daily)
  ) {
    ok("weekly_digest triggers for monthly + only_when_matters, not daily");
  } else {
    bad("weekly_digest recommender wiring broken");
  }

  // ─── Anti-Panic Streak recommender wiring ────────────────────────────
  const streakDef = WIDGETS_BY_ID["streak_tracker"];
  if (streakDef && streakDef.triggers(daily) && !streakDef.triggers(monthly)) {
    ok("streak_tracker triggers for checkIn=daily only");
  } else {
    bad("streak_tracker recommender wiring broken");
  }

  // ─── Cost & Tax recommender ──────────────────────────────────────────
  const taxesProfile = profileFor({ worry: "taxes_fees" });
  const crashProfile = profileFor({ worry: "market_crashes" });
  const costDef = WIDGETS_BY_ID["cost_tax_receipt"];
  if (costDef && costDef.triggers(taxesProfile) && !costDef.triggers(crashProfile)) {
    ok("cost_tax_receipt triggers for worry=taxes_fees only");
  } else {
    bad("cost_tax_receipt recommender wiring broken");
  }

  // ─── End-to-end recommender outputs include the new widgets ──────────
  const dailyTaxes = profileFor({ worry: "taxes_fees", checkIn: "daily", experience: "comfortable" });
  const recs = recommendWidgets(dailyTaxes).map((w) => w.id);
  for (const id of ["cost_tax_receipt", "compare_to_index", "streak_tracker"]) {
    if (recs.includes(id)) ok(`recommender returns ${id} for {comfortable, taxes_fees, daily}`);
    else bad(`recommender missing ${id} for {comfortable, taxes_fees, daily}; got [${recs.join(", ")}]`);
  }

  const monthlyComfortable = profileFor({ checkIn: "monthly", experience: "comfortable" });
  const recs2 = recommendWidgets(monthlyComfortable).map((w) => w.id);
  if (recs2.includes("weekly_digest")) ok("recommender returns weekly_digest for monthly check-in");
  else bad(`recommender missing weekly_digest for monthly: [${recs2.join(", ")}]`);

  // ─── Files exist + DashboardClient registers them ────────────────────
  const expected = [
    "src/components/widgets/v1/CostTaxReceiptWidget.tsx",
    "src/components/widgets/v1/CompareToIndexWidget.tsx",
    "src/components/widgets/v1/WeeklyDigestWidget.tsx",
    "src/components/widgets/v1/AntiPanicStreakWidget.tsx",
  ];
  for (const f of expected) {
    try {
      await fs.access(path.join(process.cwd(), f));
      ok(`file exists: ${f}`);
    } catch {
      bad(`missing file: ${f}`);
    }
  }

  const dash = await fs.readFile(path.join(process.cwd(), "src/app/dashboard/DashboardClient.tsx"), "utf-8");
  for (const id of [
    "cost_tax_receipt: CostTaxReceiptWidget",
    "compare_to_index: CompareToIndexWidget",
    "weekly_digest: WeeklyDigestWidget",
    "streak_tracker: AntiPanicStreakWidget",
  ]) {
    if (dash.includes(id)) ok(`DashboardClient registers ${id.split(":")[0]}`);
    else bad(`DashboardClient missing ${id}`);
  }

  // Hook count stable
  const hooks = await fs.readdir(path.join(process.cwd(), "src/hooks"));
  if (hooks.filter((f) => f.endsWith(".ts")).length === 11) ok("hook count = 11");
  else bad(`hook count = ${hooks.length}`);

  // Explain endpoint added new fallbacks
  const explain = await fs.readFile(path.join(process.cwd(), "src/app/api/claude/explain/route.ts"), "utf-8");
  for (const t of ["cost_tax_receipt", "compare_to_index", "weekly_digest", "streak_tracker"]) {
    if (explain.includes(`${t}:`)) ok(`explain fallback present for ${t}`);
    else bad(`explain fallback missing for ${t}`);
  }

  if (failures > 0) {
    console.error(`\n${failures} failures`);
    process.exit(1);
  }
  console.log("\nphase 6: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
