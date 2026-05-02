import * as fs from "node:fs";
import { runScenario, listScenarios } from "../src/lib/portfolio/scenarios";
import { rebalanceToTargets } from "../src/lib/portfolio/rebalance";
import { capGainsTaxOnSale } from "../src/lib/portfolio/tax";
import {
  translateInflation,
  translateFedFunds,
  translateTreasury,
  translateMortgage,
  getMacroSnapshot,
} from "../src/lib/macro/fred";
import { getFundHoldings } from "../src/lib/funds/edgar";
import { buildProfile, totalValue } from "../src/lib/portfolio/calculations";

let pass = true;
const fail = (m: string) => {
  pass = false;
  console.log("FAIL", m);
};
const ok = (m: string) => console.log("ok", m);

async function main() {
const sample = JSON.parse(fs.readFileSync("public/data/sample-portfolio.json", "utf8")).holdings;
const profile = buildProfile({
  experience: "beginner",
  goal: "House",
  timelineYears: 5,
  painThreshold: 20000,
  sleepTestStartingValue: 25000,
  worry: "market_crashes",
  checkIn: "monthly",
  lifeStage: "early_career",
  uiMode: "investor",
});

const macro = (await getMacroSnapshot()).snapshot;
ok(
  `macro snapshot: cpi=${macro.inflation.value}% dff=${macro.fedFundsRate.value}% 10y=${macro.treasury10y.value}% mortgage=${macro.mortgage30y.value}%`,
);

[macro.inflation, macro.fedFundsRate, macro.treasury10y, macro.mortgage30y].forEach((i) => {
  i.plainEnglish.length > 10
    ? ok(`translation present for ${i.seriesId}`)
    : fail(`empty translation for ${i.seriesId}`);
});

const presets = listScenarios(macro);
const cpiTitle = presets.find((p) => p.id === "high_inflation")?.title ?? "";
const dffTitle = presets.find((p) => p.id === "fed_hike")?.title ?? "";
cpiTitle.includes(`${macro.inflation.value}%`)
  ? ok(`scenario CPI title: ${cpiTitle}`)
  : fail(`scenario 3 missing CPI value: ${cpiTitle}`);
dffTitle.includes(`${macro.fedFundsRate.value}%`)
  ? ok(`scenario DFF title: ${dffTitle}`)
  : fail(`scenario 5 missing DFF value: ${dffTitle}`);
presets.length === 5 ? ok("5 scenarios configured") : fail(`scenario count = ${presets.length}`);

for (const p of presets) {
  const r1 = runScenario(p.id, sample, profile, macro);
  const r2 = runScenario(p.id, sample, profile, macro);
  Number.isFinite(r1.endingValue) && r1.endingValue === r2.endingValue
    ? ok(
        `scenario ${p.id} deterministic ending=${r1.endingValue.toFixed(2)} delta=${(r1.deltaPct * 100).toFixed(1)}%`,
      )
    : fail(`scenario ${p.id} non-deterministic or NaN`);
}

const tv = totalValue(sample);
const reb = rebalanceToTargets(sample, { stockAndEquity: 0.7, bonds: 0.2, cash: 0.1 });
const after = reb.after.reduce((s: number, h) => s + h.value, 0);
Math.abs(after - tv) < 1
  ? ok(`rebalance sum preserved ${tv.toFixed(2)} → ${after.toFixed(2)}`)
  : fail(`rebalance leaks $${(after - tv).toFixed(2)}`);
reb.taxes >= 0 ? ok(`rebalance taxes = $${reb.taxes.toFixed(2)}`) : fail("rebalance negative tax");

let foundFunds = 0;
for (const t of ["VTSAX", "VTI", "VOO", "BND", "VXUS"]) {
  const r = await getFundHoldings(t);
  if (r.fund && r.fund.holdings.length > 0) {
    foundFunds++;
    ok(`EDGAR cache hit ${t} → ${r.fund.holdings.length} holdings, asOf ${r.fund.asOf}`);
  } else {
    fail(`EDGAR miss ${t}`);
  }
}
foundFunds >= 3 ? ok(`EDGAR returns 3+ funds (${foundFunds})`) : fail(`EDGAR returned ${foundFunds} funds`);

const crash = runScenario("market_crash_30", sample, profile, macro);
const scaledThresh = (profile.answers.painThreshold / profile.answers.sleepTestStartingValue) * tv;
crash.endingValue < scaledThresh
  ? ok(`market crash breaches scaled threshold (${crash.endingValue.toFixed(0)} < ${scaledThresh.toFixed(0)})`)
  : ok(`market crash stays above threshold (${crash.endingValue.toFixed(0)} >= ${scaledThresh.toFixed(0)})`);

const tax = capGainsTaxOnSale(
  { ticker: "AAPL", name: "Apple", type: "stock", shares: 10, price: 200, costBasis: 1000, value: 2000 },
  1000,
);
Math.abs(tax - 75) < 0.5 ? ok(`cap gains tax = $${tax.toFixed(2)}`) : fail(`tax expected ~75, got ${tax}`);

translateInflation(2.0).startsWith("Prices are rising slowly")
  ? ok("inflation translator low")
  : fail("inflation translator low");
translateFedFunds(4.5).startsWith("Rates are elevated")
  ? ok("fed funds translator mid")
  : fail("fed funds translator mid");
translateTreasury(4.2).startsWith("Bond yields are attractive")
  ? ok("treasury translator mid")
  : fail("treasury translator mid");
translateMortgage(6.8).startsWith("Mortgages are expensive")
  ? ok("mortgage translator mid")
  : fail("mortgage translator mid");

const hookFiles = fs.readdirSync("src/hooks").filter((f) => f.endsWith(".ts"));
const requiredHooks = [
  "useUserProfile.ts",
  "usePortfolio.ts",
  "useHealthScore.ts",
  "useWidgets.ts",
  "useScenario.ts",
  "useWorryTranslator.ts",
  "useHeadlineDecoder.ts",
  "useCircuitBreaker.ts",
  "useFundXRay.ts",
  "useMacroConditions.ts",
  "useExplain.ts",
];
const missingHooks = requiredHooks.filter((hook) => !hookFiles.includes(hook));
missingHooks.length === 0
  ? ok(`original hook contract present (${hookFiles.length} hooks total)`)
  : fail(`missing original hooks: ${missingHooks.join(", ")}`);

process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
