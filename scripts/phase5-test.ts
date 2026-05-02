/**
 * Phase 5 functional tests — Circuit Breaker.
 *
 * The hook itself uses React + window.setInterval; we exercise the underlying
 * Zustand store directly so we can verify the gating logic without React.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

// JSDOM-free: stub the bits the persist middleware touches before importing.
const memStore: Record<string, string> = {};
const memStorage = {
  getItem: (key: string) => (key in memStore ? memStore[key]! : null),
  setItem: (key: string, value: string) => {
    memStore[key] = value;
  },
  removeItem: (key: string) => {
    delete memStore[key];
  },
};
(globalThis as unknown as { localStorage: typeof memStorage }).localStorage = memStorage;
(globalThis as unknown as { window: { localStorage: typeof memStorage } }).window = { localStorage: memStorage };

// Dynamic-import the store so the localStorage stub above is in place before
// zustand's persist middleware initialises.
type Mod = typeof import("../src/stores/breakerStore");
let useBreakerStore!: Mod["useBreakerStore"];
let COUNTDOWN_SECONDS!: Mod["COUNTDOWN_SECONDS"];
let REASON_MIN_LENGTH!: Mod["REASON_MIN_LENGTH"];

let failures = 0;
function ok(msg: string) {
  console.log(`ok ${msg}`);
}
function bad(msg: string) {
  console.error(`FAIL ${msg}`);
  failures += 1;
}

function reset() {
  // hard-reset between scenarios
  useBreakerStore.setState({
    active: false,
    countdown: 0,
    action: null,
    breachedThreshold: false,
    history: [],
  });
}

async function main() {
  const mod = await import("../src/stores/breakerStore");
  useBreakerStore = mod.useBreakerStore;
  COUNTDOWN_SECONDS = mod.COUNTDOWN_SECONDS;
  REASON_MIN_LENGTH = mod.REASON_MIN_LENGTH;

  // ─── start() arms the breaker and seeds the countdown ────────────────
  reset();
  const sample = { ticker: "VTSAX", shares: 10 };
  useBreakerStore.getState().start(sample);
  let s = useBreakerStore.getState();
  if (s.active && s.countdown === COUNTDOWN_SECONDS && s.action?.ticker === "VTSAX") {
    ok(`start() arms breaker (countdown=${s.countdown})`);
  } else {
    bad(`start() did not arm correctly: ${JSON.stringify({ active: s.active, countdown: s.countdown })}`);
  }

  // ─── Re-trigger while active is a no-op ──────────────────────────────
  for (let i = 0; i < 3; i++) useBreakerStore.getState().tick();
  const beforeCountdown = useBreakerStore.getState().countdown;
  useBreakerStore.getState().start({ ticker: "AAPL", shares: 5 });
  s = useBreakerStore.getState();
  if (s.action?.ticker === "VTSAX" && s.countdown === beforeCountdown) {
    ok("re-triggering while active is a no-op (preserves original action + countdown)");
  } else {
    bad(`re-trigger replaced state unexpectedly: ${JSON.stringify({ ticker: s.action?.ticker, countdown: s.countdown })}`);
  }

  // ─── proceed() blocked while countdown > 0 ───────────────────────────
  useBreakerStore.getState().proceed("This is a totally legitimate reason that meets the length bar.");
  s = useBreakerStore.getState();
  if (s.active) ok("proceed() refused while countdown > 0");
  else bad("proceed() bypassed the cooldown");

  // ─── tick() down to zero ─────────────────────────────────────────────
  // current countdown is COUNTDOWN_SECONDS - 3; tick the rest
  while (useBreakerStore.getState().countdown > 0) {
    useBreakerStore.getState().tick();
  }
  if (useBreakerStore.getState().countdown === 0) ok("tick() drained countdown to 0");
  else bad("countdown did not reach 0");

  // ─── proceed() blocked when reason too short ─────────────────────────
  useBreakerStore.getState().proceed("too short");
  if (useBreakerStore.getState().active) {
    ok(`proceed() refused short reason (< ${REASON_MIN_LENGTH} chars)`);
  } else {
    bad("proceed() accepted short reason");
  }

  // ─── proceed() succeeds with full reason ─────────────────────────────
  useBreakerStore
    .getState()
    .proceed("I need this cash for a medical bill arriving next week and have no other source.");
  s = useBreakerStore.getState();
  if (!s.active && s.history.length === 1 && s.history[0]!.decision === "proceeded") {
    ok(`proceed() recorded outcome (history.length=${s.history.length}, decision=${s.history[0]!.decision})`);
  } else {
    bad(`proceed() outcome wrong: ${JSON.stringify({ active: s.active, history: s.history })}`);
  }

  // ─── cancel() flow ───────────────────────────────────────────────────
  reset();
  useBreakerStore.getState().start({ ticker: "BND", shares: 50 }, { breachedThreshold: true });
  s = useBreakerStore.getState();
  if (s.breachedThreshold) ok("breachedThreshold flag forwarded from start()");
  else bad("breachedThreshold flag dropped");

  useBreakerStore.getState().cancel();
  s = useBreakerStore.getState();
  if (!s.active && s.history.length === 1 && s.history[0]!.decision === "cancelled" && s.history[0]!.breachedThreshold) {
    ok("cancel() records cancelled outcome with breach flag");
  } else {
    bad(`cancel() outcome wrong: ${JSON.stringify({ active: s.active, history: s.history })}`);
  }

  // ─── History capped at 50 entries ────────────────────────────────────
  reset();
  for (let i = 0; i < 60; i++) {
    useBreakerStore.getState().start({ ticker: `T${i}`, shares: 1 });
    useBreakerStore.getState().cancel();
  }
  if (useBreakerStore.getState().history.length === 50) ok("history capped at 50 entries");
  else bad(`history length = ${useBreakerStore.getState().history.length} (expected 50)`);

  // ─── File / wiring inventory ─────────────────────────────────────────
  const expected = [
    "src/components/shared/v1/CircuitBreakerModal.tsx",
    "src/components/widgets/v1/CircuitBreakerWidget.tsx",
    "src/stores/breakerStore.ts",
  ];
  for (const f of expected) {
    try {
      await fs.access(path.join(process.cwd(), f));
      ok(`file exists: ${f}`);
    } catch {
      bad(`missing file: ${f}`);
    }
  }

  const layout = await fs.readFile(path.join(process.cwd(), "src/app/layout.tsx"), "utf-8");
  if (layout.includes("CircuitBreakerModal")) ok("layout.tsx mounts CircuitBreakerModal globally");
  else bad("CircuitBreakerModal not mounted in layout.tsx");

  const dashboard = await fs.readFile(path.join(process.cwd(), "src/app/dashboard/DashboardClient.tsx"), "utf-8");
  if (dashboard.includes("circuit_breaker: CircuitBreakerWidget")) {
    ok("DashboardClient registers circuit_breaker widget");
  } else {
    bad("DashboardClient missing circuit_breaker registration");
  }

  const breakerHook = await fs.readFile(path.join(process.cwd(), "src/hooks/useCircuitBreaker.ts"), "utf-8");
  if (!breakerHook.includes("Phase 0 placeholder") && breakerHook.includes("useBreakerStore")) {
    ok("useCircuitBreaker hook wired (no placeholder, uses store)");
  } else {
    bad("useCircuitBreaker still placeholder");
  }

  const painThreshold = await fs.readFile(
    path.join(process.cwd(), "src/components/widgets/v1/PainThresholdMonitorWidget.tsx"),
    "utf-8",
  );
  if (painThreshold.includes("useCircuitBreaker") && painThreshold.includes("breachedThreshold: true")) {
    ok("PainThresholdMonitor triggers breaker on breach");
  } else {
    bad("PainThresholdMonitor not wired to breaker");
  }

  // Hook count stable
  const hooks = await fs.readdir(path.join(process.cwd(), "src/hooks"));
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
  const missingHooks = requiredHooks.filter((hook) => !hooks.includes(hook));
  if (missingHooks.length === 0) ok(`original hook contract present (${hooks.filter((f) => f.endsWith(".ts")).length} hooks total)`);
  else bad(`missing original hooks: ${missingHooks.join(", ")}`);

  if (failures > 0) {
    console.error(`\n${failures} failures`);
    process.exit(1);
  }
  console.log("\nphase 5: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
