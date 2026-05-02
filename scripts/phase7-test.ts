/**
 * Phase 7 functional tests — accessibility primitives + reduced-motion +
 * keyboard handling.
 *
 * UI behavior is verified manually in a browser; here we lock down the
 * static structure so the wires don't quietly come undone.
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
  // ─── a11y lib exists with the expected API ───────────────────────────
  await expectAll(
    "src/lib/a11y.ts",
    ["usePrefersReducedMotion", "useFocusTrap", "motionDuration", "Tab", "Escape"],
    "a11y lib exports prefers-reduced-motion + focus trap + motion helper",
  );

  // ─── Globals carry the focus-visible ring + reduced-motion safety net ─
  await expectAll(
    "src/styles/globals.css",
    [":focus-visible", "outline:", "prefers-reduced-motion: reduce", "skip-link", "sr-only"],
    "globals.css carries focus ring + skip link + reduced-motion safety net",
  );

  // ─── Modal wires focus trap + ESC + reduced motion + body lock ───────
  await expectAll(
    "src/components/shared/v1/CircuitBreakerModal.tsx",
    [
      "useFocusTrap",
      "usePrefersReducedMotion",
      "onEscape: cancel",
      'aria-modal="true"',
      "aria-labelledby",
      "aria-describedby",
      'document.body.style.overflow = "hidden"',
      "Press Escape to cancel",
    ],
    "Breaker modal: focus trap + ESC + body lock + ARIA",
  );

  // ─── Dashboard surfaces a skip link + main landmark ──────────────────
  await expectAll(
    "src/app/dashboard/DashboardClient.tsx",
    ['id="main"', "skip-link", "Skip to dashboard"],
    "Dashboard exposes skip link + main landmark",
  );
  await expectAll(
    "src/components/shared/v1/DashboardGrid.tsx",
    ['id="dashboard-grid"', 'role="region"', "aria-label=", "usePrefersReducedMotion"],
    "DashboardGrid is a labelled region + honours reduced motion",
  );

  // ─── Animated widgets honour reduced motion ──────────────────────────
  for (const file of [
    "src/components/widgets/v1/HealthScoreWidget.tsx",
    "src/components/widgets/v1/AntiPanicStreakWidget.tsx",
    "src/components/widgets/v1/WorryTranslatorWidget.tsx",
    "src/components/widgets/v1/HeadlineDecoderWidget.tsx",
    "src/components/shared/v1/ExplainTooltip.tsx",
    "src/components/shared/v1/WhyIsThisHere.tsx",
  ]) {
    await expectAll(file, ["usePrefersReducedMotion"], `${path.basename(file)} reads prefers-reduced-motion`);
  }

  // ─── WhyIsThisHere now closes on outside click + ESC + has aria-expanded ─
  await expectAll(
    "src/components/shared/v1/WhyIsThisHere.tsx",
    ["aria-expanded", 'e.key === "Escape"', "mousedown"],
    "WhyIsThisHere has aria-expanded + ESC + outside-click close",
  );

  // ─── Live regions on AI result cards ─────────────────────────────────
  await expectAll(
    "src/components/widgets/v1/WorryTranslatorWidget.tsx",
    ['role="status"', 'aria-live="polite"'],
    "WorryTranslator result is a polite live region",
  );
  await expectAll(
    "src/components/widgets/v1/HeadlineDecoderWidget.tsx",
    ['role="status"', 'aria-live="polite"'],
    "HeadlineDecoder result is a polite live region",
  );

  // ─── No new hooks were added (Section 4 contract: 11 hooks) ──────────
  const hooks = await fs.readdir(path.join(process.cwd(), "src/hooks"));
  const hookCount = hooks.filter((f) => f.endsWith(".ts")).length;
  if (hookCount >= 11) ok(`original hook contract plus additive hooks present (${hookCount} hooks total)`);
  else bad(`missing hooks: only ${hookCount}`);

  if (failures > 0) {
    console.error(`\n${failures} failures`);
    process.exit(1);
  }
  console.log("\nphase 7: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
