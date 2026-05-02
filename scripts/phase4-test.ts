/**
 * Phase 4 functional tests.
 *
 * Validates:
 *   - Worry-translator fallback shape matches WorryResponse + grounded citations
 *   - Headline-decoder fallback shape includes signal + plain English
 *   - Explain fallback returns deterministic strings for known topics
 *   - News client falls back to disk seed when no key
 *   - Headline signal classification routes obvious cases
 *   - All Phase 4 routes registered
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { getMacroSnapshot } from "../src/lib/macro/fred";
import { getTrendingHeadlines } from "../src/lib/news/client";

let failures = 0;
function ok(msg: string) {
  console.log(`ok ${msg}`);
}
function bad(msg: string) {
  console.error(`FAIL ${msg}`);
  failures += 1;
}

async function main() {
  // ─── News fallback path ────────────────────────────────────────────────
  delete process.env.NEWSAPI_KEY;
  const news = await getTrendingHeadlines();
  if (news.headlines.length >= 5) ok(`news fallback returned ${news.headlines.length} headlines (source=${news.source})`);
  else bad(`news fallback only returned ${news.headlines.length}`);

  for (const h of news.headlines) {
    if (!h.id || !h.title || !h.url || !h.publishedAt) {
      bad(`headline missing required fields: ${JSON.stringify(h)}`);
      return;
    }
  }
  ok("every headline has id/title/url/publishedAt");

  // ─── Explain endpoint fallback shape ───────────────────────────────────
  // Re-import after stripping ANTHROPIC key so the fallback path runs.
  delete process.env.ANTHROPIC_API_KEY;
  const { POST: explainPost } = await import("../src/app/api/claude/explain/route");
  const explainRes = await explainPost(
    new Request("http://localhost/api/claude/explain", {
      method: "POST",
      body: JSON.stringify({ topic: "health_score" }),
      headers: { "content-type": "application/json" },
    }),
  );
  const explainBody = (await explainRes.json()) as { explanation: string; source: string };
  if (explainBody.source === "fallback" && explainBody.explanation.length > 30) {
    ok(`explain fallback for health_score: "${explainBody.explanation.slice(0, 50)}…"`);
  } else {
    bad(`explain fallback wrong: ${JSON.stringify(explainBody)}`);
  }

  const explainBadRes = await explainPost(
    new Request("http://localhost/api/claude/explain", {
      method: "POST",
      body: JSON.stringify({ topic: "" }),
      headers: { "content-type": "application/json" },
    }),
  );
  if (explainBadRes.status === 400) ok("explain rejects empty topic");
  else bad(`explain accepted empty topic: ${explainBadRes.status}`);

  // ─── Worry translator fallback shape ───────────────────────────────────
  const { POST: worryPost } = await import("../src/app/api/claude/translate-worry/route");
  const worryRes = await worryPost(
    new Request("http://localhost/api/claude/translate-worry", {
      method: "POST",
      body: JSON.stringify({ worry: "Should I be worried about a market crash?" }),
      headers: { "content-type": "application/json" },
    }),
  );
  const worryBody = (await worryRes.json()) as {
    summary: string;
    forYou: string;
    suggestedActions: string[];
    citations: { source: string }[];
    source: string;
  };
  if (
    worryBody.source === "fallback" &&
    worryBody.summary.length > 20 &&
    Array.isArray(worryBody.suggestedActions) &&
    worryBody.citations.some((c) => c.source === "FRED")
  ) {
    ok("worry translator fallback returns grounded WorryResponse");
  } else {
    bad(`worry translator wrong shape: ${JSON.stringify(worryBody).slice(0, 200)}`);
  }

  if (worryBody.summary.toLowerCase().includes("crash") || worryBody.summary.toLowerCase().includes("drop")) {
    ok("worry translator routes 'crash' input to crash-flavoured fallback");
  } else {
    bad(`worry translator did not match crash branch: "${worryBody.summary.slice(0, 80)}"`);
  }

  const worryEmptyRes = await worryPost(
    new Request("http://localhost/api/claude/translate-worry", {
      method: "POST",
      body: JSON.stringify({ worry: "" }),
      headers: { "content-type": "application/json" },
    }),
  );
  if (worryEmptyRes.status === 400) ok("worry translator rejects empty input");
  else bad(`worry translator accepted empty: ${worryEmptyRes.status}`);

  // ─── Headline decoder fallback shape ───────────────────────────────────
  const { POST: decodePost } = await import("../src/app/api/claude/decode-headline/route");
  const samples: Array<{ title: string; expected: "noise" | "watch" | "act"; description: string }> = [
    { title: "Fed Holds Rates Steady After May Meeting", expected: "noise", description: "Fed-hold headline → noise" },
    { title: "10-Year Treasury Yield Tops 5%", expected: "watch", description: "Treasury yield headline → watch" },
    { title: "S&P 500 Hits All-Time High", expected: "noise", description: "ATH headline → noise" },
  ];
  for (const s of samples) {
    const res = await decodePost(
      new Request("http://localhost/api/claude/decode-headline", {
        method: "POST",
        body: JSON.stringify({
          headline: { id: "x", title: s.title, source: "Test", url: "https://x", publishedAt: "2026-04-30T12:00:00Z" },
          tickers: ["VTSAX", "VBTLX"],
        }),
        headers: { "content-type": "application/json" },
      }),
    );
    const body = (await res.json()) as { signal: string; plainEnglish: string };
    if (body.signal === s.expected && body.plainEnglish.length > 20) {
      ok(`${s.description} (signal=${body.signal})`);
    } else {
      bad(`${s.description} got signal=${body.signal}, plainEnglish="${body.plainEnglish.slice(0, 60)}"`);
    }
  }

  const decodeBadRes = await decodePost(
    new Request("http://localhost/api/claude/decode-headline", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    }),
  );
  if (decodeBadRes.status === 400) ok("headline decoder rejects missing headline");
  else bad(`headline decoder accepted missing input: ${decodeBadRes.status}`);

  // ─── Macro snapshot still loads ───────────────────────────────────────
  const macro = await getMacroSnapshot();
  if (macro.snapshot.inflation.value > 0 && macro.snapshot.fedFundsRate.value > 0) {
    ok(`macro snapshot reachable: cpi=${macro.snapshot.inflation.value}% dff=${macro.snapshot.fedFundsRate.value}%`);
  } else {
    bad("macro snapshot returned zeros");
  }

  // ─── Route file inventory ─────────────────────────────────────────────
  const expectedRoutes = [
    "src/app/api/claude/explain/route.ts",
    "src/app/api/claude/translate-worry/route.ts",
    "src/app/api/claude/decode-headline/route.ts",
    "src/app/api/news/trending/route.ts",
  ];
  for (const r of expectedRoutes) {
    try {
      await fs.access(path.join(process.cwd(), r));
      ok(`route exists: ${r}`);
    } catch {
      bad(`route missing: ${r}`);
    }
  }

  // ─── Original hook contract check (later gap-fill work can add hooks) ─
  const hooksDir = path.join(process.cwd(), "src/hooks");
  const hookFiles = (await fs.readdir(hooksDir)).filter((f) => f.endsWith(".ts"));
  const originalHooks = [
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
  const missingHooks = originalHooks.filter((hook) => !hookFiles.includes(hook));
  if (missingHooks.length === 0) ok(`original hook contract present (${hookFiles.length} hooks total)`);
  else bad(`missing original hooks: ${missingHooks.join(", ")}`);

  // ─── Hooks no longer return placeholder stubs ─────────────────────────
  for (const file of ["useExplain.ts", "useWorryTranslator.ts", "useHeadlineDecoder.ts"]) {
    const src = await fs.readFile(path.join(hooksDir, file), "utf-8");
    if (src.includes("Phase 0 placeholder")) {
      bad(`${file} still contains Phase 0 placeholder`);
    } else if (!src.includes("fetch(")) {
      bad(`${file} does not call fetch — wired?`);
    } else {
      ok(`${file} wired (no placeholder, calls fetch)`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} failures`);
    process.exit(1);
  }
  console.log("\nphase 4: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
