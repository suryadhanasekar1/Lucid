import { NextResponse } from "next/server";
import { callClaude, tryParseJson } from "@/lib/claude/client";
import { getMacroSnapshot } from "@/lib/macro/fred";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";
import type { Citation, Headline, HeadlineDecoded, MacroSnapshot, UserProfile } from "@/types";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 20);

const SYSTEM_PREAMBLE = `You are Lucid — a financial-clarity tool. The user \
is going to give you a financial headline. Your job:

1. Translate the headline into plain English (1-2 sentences). What does it \
   actually mean for an everyday investor?
2. Decide if it's "noise", "watch", or "act":
   - noise: irrelevant or unactionable for a long-term investor
   - watch: worth being aware of, but no action required
   - act: rare; only when there's a clearly portfolio-relevant change
3. Identify which assets in the user's portfolio it touches (by ticker), \
   with a one-line note for each. Empty list is fine.

You ground every claim in the macro snapshot below when relevant. You never \
recommend specific tickers to buy or sell. Default to "noise" or "watch"; \
"act" should be unusual.

Output strictly as JSON:
{
  "plainEnglish": "...",
  "signal": "noise" | "watch" | "act",
  "affects": [{"ticker": "VTSAX", "note": "..."}]
}
No prose outside the JSON block.`;

interface ParsedShape {
  plainEnglish?: unknown;
  signal?: unknown;
  affects?: unknown;
}

interface RequestBody {
  headline?: Headline;
  profile?: UserProfile;
  tickers?: string[];
}

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "claude_headline");
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limit.retryAfterSec },
      { status: 429 },
    );
  }

  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const headline = body.headline;
  if (!headline?.title || !headline?.id) {
    return NextResponse.json({ error: "headline_required" }, { status: 400 });
  }

  const { snapshot } = await getMacroSnapshot();
  const profile = body.profile;
  const tickers = (body.tickers ?? []).filter((t): t is string => typeof t === "string").slice(0, 20);

  const macroLine = `Today's macro (FRED): inflation=${snapshot.inflation.value}% YoY, \
fed funds=${snapshot.fedFundsRate.value}%, 10y=${snapshot.treasury10y.value}%, mortgage=${snapshot.mortgage30y.value}%.`;
  const profileLine = profile
    ? `Profile: experience=${profile.answers.experience}, timeline=${profile.answers.timelineYears}y, worry=${profile.answers.worry}.`
    : "Profile: not yet onboarded.";
  const tickerLine = tickers.length > 0 ? `User holds: ${tickers.join(", ")}.` : "User holdings unknown.";

  const fallback = buildFallback(headline, snapshot);
  const result = await callClaude(
    {
      systemBlocks: [
        { text: SYSTEM_PREAMBLE, cache: true },
        { text: `${macroLine}\n${profileLine}\n${tickerLine}`, cache: false },
      ],
      userText: `Headline (${headline.source}): ${headline.title}`,
    },
    { maxTokens: 500, fallback: JSON.stringify(fallback) },
  );

  const parsed = tryParseJson<ParsedShape>(result.text);
  const signal: HeadlineDecoded["signal"] =
    parsed?.signal === "act" || parsed?.signal === "watch" ? parsed.signal : "noise";

  const decoded: HeadlineDecoded = {
    original: headline,
    plainEnglish:
      parsed && typeof parsed.plainEnglish === "string" && parsed.plainEnglish.length > 0
        ? parsed.plainEnglish
        : fallback.plainEnglish,
    signal: parsed && parsed.signal ? signal : fallback.signal,
    affects:
      parsed && Array.isArray(parsed.affects)
        ? parsed.affects
            .filter((a): a is { ticker: string; note: string } =>
              typeof a === "object" &&
              a !== null &&
              typeof (a as { ticker?: unknown }).ticker === "string" &&
              typeof (a as { note?: unknown }).note === "string",
            )
            .slice(0, 6)
        : fallback.affects,
    citations: buildCitations(snapshot),
  };

  return NextResponse.json({ ...decoded, source: result.source });
}

function buildCitations(snapshot: MacroSnapshot): Citation[] {
  return [
    { source: "NEWSAPI", label: "Headline source" },
    { source: "FRED", label: snapshot.inflation.label, value: `${snapshot.inflation.value}%` },
    { source: "FRED", label: snapshot.fedFundsRate.label, value: `${snapshot.fedFundsRate.value}%` },
  ];
}

function buildFallback(
  headline: Headline,
  snapshot: MacroSnapshot,
): Pick<HeadlineDecoded, "plainEnglish" | "signal" | "affects"> {
  const t = headline.title.toLowerCase();
  let plainEnglish = "";
  let signal: HeadlineDecoded["signal"] = "noise";
  const affects: HeadlineDecoded["affects"] = [];

  if (t.includes("fed") && (t.includes("hold") || t.includes("steady") || t.includes("pause"))) {
    plainEnglish = `The Fed is keeping rates where they are (currently ${snapshot.fedFundsRate.value}%). For long-term investors, this is mostly maintenance — no policy change to react to.`;
    signal = "noise";
  } else if (t.includes("rate") && (t.includes("hike") || t.includes("raise"))) {
    plainEnglish = `The Fed raising rates makes cash and short-term bonds more attractive and stocks more expensive on a relative basis. With rates already at ${snapshot.fedFundsRate.value}%, the trend matters more than any single move.`;
    signal = "watch";
    affects.push({ ticker: "VBTLX", note: "Bond fund prices fall when rates rise; existing holdings dip on paper." });
  } else if (t.includes("inflation") || t.includes("cpi")) {
    plainEnglish = `Inflation is sitting at ${snapshot.inflation.value}% year-over-year. Cash savers lose ground; diversified equity portfolios have historically outpaced this.`;
    signal = "watch";
  } else if (t.includes("crash") || t.includes("correction") || t.includes("bear")) {
    plainEnglish = `Markets have pullbacks regularly — corrections (10%+ drops) happen on average every 18 months. With a long horizon, these are how returns are bought.`;
    signal = "watch";
  } else if (t.includes("treasury") || t.includes("yield") || t.includes("10-year")) {
    plainEnglish = `The 10-year Treasury yield (currently ${snapshot.treasury10y.value}%) is the market's read on the next decade. Bond fund prices move opposite to yields.`;
    signal = "watch";
    affects.push({ ticker: "VBTLX", note: "Bond fund prices fall when long yields rise." });
  } else if (t.includes("mortgage") || t.includes("housing")) {
    plainEnglish = `Mortgage rates around ${snapshot.mortgage30y.value}% affect housing affordability and home-builder stocks more than a diversified portfolio.`;
    signal = "noise";
  } else if (t.includes("ath") || t.includes("all-time high") || t.includes("record")) {
    plainEnglish = `Markets near all-time highs feel risky but are statistically a normal state. Most days in market history were within reach of an ATH.`;
    signal = "noise";
  } else {
    plainEnglish = `Headlines like this typically don't change a long-term plan. The macro that matters: inflation ${snapshot.inflation.value}%, Fed ${snapshot.fedFundsRate.value}%, 10y ${snapshot.treasury10y.value}%.`;
    signal = "noise";
  }

  return { plainEnglish, signal, affects };
}
