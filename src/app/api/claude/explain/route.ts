import { NextResponse } from "next/server";
import { callClaude, CLAUDE_MODEL_LIGHT } from "@/lib/claude/client";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 20);

const SYSTEM_PREAMBLE = `You are Compass, a financial-clarity tool for everyday investors. \
Your job in this endpoint is "Tell Me More" — explain a single financial \
concept in 2-3 sentences, in plain English, no jargon, no scare-tactics, no \
recommendations. Never give "buy" / "sell" advice. Stay under 60 words. \
Reference the user's context (provided below) only if it makes the explanation \
more concrete. End with a single concrete sentence the reader can take away.`;

const FALLBACKS: Record<string, string> = {
  health_score:
    "Your Health Score blends four things: how diversified you are, how well your portfolio matches your goal, how much risk you're carrying versus what you can stomach, and what fees you're paying. It's a snapshot, not a verdict.",
  total_value:
    "This is the total dollar value of everything you own across the accounts Compass can see. It moves daily as prices change.",
  foundation_frontier:
    "Foundation = boring, broadly-diversified core (think index funds). Frontier = concentrated bets on individual stocks or themes. Most healthy portfolios are heavier on the Foundation side.",
  goal_progress:
    "How close you are to the dollar amount you said you wanted, given your current value and timeline.",
  macro_conditions:
    "These are the big economic dials — inflation, the Fed's rate, bond yields, and mortgage costs. They set the weather your portfolio is investing in.",
  pain_threshold:
    "Pain Threshold is the dollar value where you said you'd want to stop the bleeding in our Sleep Test. We watch how close any scenario gets to that line.",
  worry_translator:
    "Type any worry — \"will my retirement be okay?\", \"is the bond market broken?\" — and we'll translate it into plain English with the macro data behind it.",
  circuit_breaker:
    "When you click Sell, Compass holds the trade for 60 seconds and asks you to type a real reason. The data is unflattering: most panic sells underperform the held position over the next 12 months. The pause is on your side.",
  headline_decoder:
    "Each headline gets a label — Noise, Watch, or Act. Noise is the daily churn that doesn't change a long-term plan. Watch is worth being aware of. Act is rare. Default to Noise unless something material has changed for the assets you actually own.",
  cost_tax_receipt:
    "An expense ratio is the slice the fund quietly takes each year. 0.05% is great, 1% is steep. Over 30 years it becomes the difference between two portfolios entirely. The cap-gains line shows what selling today would cost — usually a reason to keep holding.",
  compare_to_index:
    "60/40 — 60% stocks, 40% bonds — is the boring benchmark every active strategy is trying to beat. Most don't. Comparing yourself to it tells you whether you're being paid for the extra risk you're taking on.",
  weekly_digest:
    "A once-a-week recap so you don't have to babysit the dashboard. Macro changes, the few headlines that matter, and your behavior — assembled from real data, no AI calls used.",
  streak_tracker:
    "The streak counts days since you last hit Sell anyway through the breaker. Held sales add to your patience score; proceeded sales reset it. The boring math: avoiding three panic sells over a decade is often worth more than picking the right stock.",
};

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "claude_explain");
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limit.retryAfterSec },
      { status: 429 },
    );
  }

  let body: { topic?: string; context?: Record<string, unknown> } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return NextResponse.json({ error: "topic_required" }, { status: 400 });
  }
  if (topic.length > 200) {
    return NextResponse.json({ error: "topic_too_long" }, { status: 400 });
  }

  const fallback = FALLBACKS[topic] ?? FALLBACKS["worry_translator"]!;
  const contextLine = body.context ? `\nContext: ${JSON.stringify(body.context).slice(0, 600)}` : "";

  const result = await callClaude(
    {
      systemBlocks: [{ text: SYSTEM_PREAMBLE, cache: true }],
      userText: `Explain "${topic}" to a beginner investor.${contextLine}`,
    },
    { model: CLAUDE_MODEL_LIGHT, maxTokens: 200, fallback },
  );

  return NextResponse.json({ topic, explanation: result.text, source: result.source });
}
