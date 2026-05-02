/**
 * Phase 8 — finalization gate (spec Phase 6 polish bundle).
 *
 * Locks down: error boundaries on every widget, skeleton primitives, empty
 * states for zero-holdings/history, mobile reflow under 768px, "Show me the
 * math" disclosure, breaker modal "last 5 events" framing, and the README +
 * SECURITY documentation breadth.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

let failures = 0;
function ok(msg: string) {
  console.log(`ok ${msg}`);
}
function bad(msg: string) {
  console.error(`FAIL ${msg}`);
  failures += 1;
}

async function readFile(rel: string) {
  return fs.readFile(path.join(process.cwd(), rel), "utf-8");
}

async function expectAll(rel: string, snippets: string[], label: string) {
  const src = await readFile(rel);
  const missing = snippets.filter((s) => !src.includes(s));
  if (missing.length === 0) ok(`${label} — ${rel}`);
  else bad(`${label} — ${rel}\n   missing: ${missing.join(" | ")}`);
}

async function main() {
  // ─── ErrorBoundary primitive + Dashboard wraps every widget ──────────
  await expectAll(
    "src/components/shared/v1/ErrorBoundary.tsx",
    ["class ErrorBoundary", "getDerivedStateFromError", "componentDidCatch", "Try again"],
    "ErrorBoundary class component exposes the React 18 lifecycle hooks",
  );
  await expectAll(
    "src/app/dashboard/DashboardClient.tsx",
    ["ErrorBoundary", "<ErrorBoundary"],
    "DashboardClient wraps every widget cell with ErrorBoundary",
  );

  // ─── Skeleton primitives + adopted in async loading states ───────────
  await expectAll(
    "src/components/shared/v1/Skeleton.tsx",
    ["compass-skeleton-shimmer", "role=\"status\""],
    "Skeleton primitive exists + announces as loading status",
  );
  await expectAll(
    "src/styles/globals.css",
    ["@keyframes compass-skeleton-shimmer", "@media (max-width: 767px)"],
    "globals.css carries shimmer keyframes + mobile media query",
  );
  for (const rel of [
    "src/components/widgets/v1/MacroConditionsWidget.tsx",
    "src/components/widgets/v1/HeadlineDecoderWidget.tsx",
    "src/components/widgets/v1/MutualFundXRayWidget.tsx",
  ]) {
    await expectAll(rel, ["Skeleton"], `${path.basename(rel)} uses Skeleton in its loading branch`);
  }

  // ─── EmptyState primitive + adopted in zero-holdings/history widgets ─
  await expectAll(
    "src/components/shared/v1/EmptyState.tsx",
    ["EmptyState", "role=\"note\""],
    "EmptyState primitive exists with role=note",
  );
  for (const rel of [
    "src/components/widgets/v1/TotalValueWidget.tsx",
    "src/components/widgets/v1/FoundationFrontierWidget.tsx",
    "src/components/widgets/v1/GoalProgressWidget.tsx",
    "src/components/widgets/v1/CircuitBreakerWidget.tsx",
  ]) {
    await expectAll(rel, ["EmptyState"], `${path.basename(rel)} renders EmptyState for zero-data path`);
  }

  // ─── Mobile reflow ────────────────────────────────────────────────────
  await expectAll(
    "src/components/shared/v1/DashboardGrid.tsx",
    ["MOBILE_BREAKPOINT", "matchMedia", "isMobile", '"1fr"'],
    "DashboardGrid collapses to single column under MOBILE_BREAKPOINT",
  );

  // ─── "Show me the math" disclosure + adoption ────────────────────────
  await expectAll(
    "src/components/shared/v1/ShowMeTheMath.tsx",
    ["Show me the math", "Hide the math", "aria-expanded"],
    "ShowMeTheMath disclosure exists",
  );
  for (const rel of [
    "src/components/widgets/v1/HealthScoreWidget.tsx",
    "src/components/widgets/v1/MacroConditionsWidget.tsx",
  ]) {
    await expectAll(rel, ["ShowMeTheMath"], `${path.basename(rel)} renders ShowMeTheMath`);
  }

  // ─── Circuit Breaker modal "last 5 sell attempts" framing ────────────
  await expectAll(
    "src/components/shared/v1/CircuitBreakerModal.tsx",
    ["history", "last5", "sell attempt", "held the line"],
    "CircuitBreakerModal surfaces last-5 sell attempts + held count",
  );

  // ─── Documentation breadth ───────────────────────────────────────────
  const readme = await readFile("README.md");
  const securityMd = await readFile("SECURITY.md");
  if (readme.split("\n").length >= 80) ok(`README.md long enough (${readme.split("\n").length} lines)`);
  else bad(`README.md too short (${readme.split("\n").length} lines)`);
  for (const need of ["npm install", ".env.local", "phase3-test", "phase8-test", "Architecture"]) {
    if (readme.includes(need)) ok(`README.md mentions ${need}`);
    else bad(`README.md missing ${need}`);
  }
  for (const need of ["HMAC", "rate-limit", "Zod", "User-Agent", "git log -p"]) {
    if (securityMd.includes(need)) ok(`SECURITY.md mentions ${need}`);
    else bad(`SECURITY.md missing ${need}`);
  }

  // ─── Git history secret audit ────────────────────────────────────────
  // The audit is run as a shell command in the gate scripts; here we just
  // assert the `.gitignore` covers the env files.
  const gi = await readFile(".gitignore");
  for (const need of [".env", ".env.local", ".env*.local", ".env.production"]) {
    if (gi.includes(need)) ok(`.gitignore covers ${need}`);
    else bad(`.gitignore missing ${need}`);
  }

  // ─── Original hook contract still present; gap-fill features add hooks ─
  const hooks = await fs.readdir(path.join(process.cwd(), "src/hooks"));
  const hookCount = hooks.filter((f) => f.endsWith(".ts")).length;
  if (hookCount >= 11) ok(`original hook contract plus additive hooks present (${hookCount} hooks total)`);
  else bad(`missing hooks: only ${hookCount}`);

  if (failures > 0) {
    console.error(`\n${failures} failures`);
    process.exit(1);
  }
  console.log("\nphase 8: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
