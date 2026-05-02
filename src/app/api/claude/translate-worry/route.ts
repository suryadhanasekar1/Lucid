import { NextResponse } from "next/server";
import { callClaude, tryParseJson } from "@/lib/claude/client";
import { detectLifeEvent, getLifeEventAdjustments } from "@/lib/agents/lifeEvent";
import { getMacroSnapshot } from "@/lib/macro/fred";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";
import type { Citation, ConversationMessage, MacroSnapshot, UserProfile, WorryResponse } from "@/types";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 20);

const SYSTEM_PREAMBLE = `You are Compass — a financial-clarity tool for everyday \
investors. The user is going to type a free-form worry. Your job:

1. Translate it into plain English (2-3 sentences). No jargon, no scare quotes.
2. Tell them what this means *for their portfolio specifically*, given the \
   profile and macro snapshot below.
3. Give them at most 2 calm, low-stakes "consider doing" actions. Often the \
   right answer is "do nothing for now" — don't manufacture activity.

You ground every point in real numbers from the macro snapshot when relevant. \
You never recommend specific tickers or "buy/sell" advice. Tone: warm, \
direct, no panic, no jargon.

Output strictly as JSON matching this shape:
{
  "summary": "...",       // 2-3 sentence plain-English translation
  "forYou": "...",        // 1-2 sentences tied to their portfolio + profile
  "suggestedActions": ["...", "..."], // 0-2 short imperative lines
  "classification": "panic_sell | fomo_buy | news_anxiety | life_event | peer_pressure | general_question",
  "confidence": "low | medium | high"
}
No prose outside the JSON block.`;

interface ParsedShape {
  summary?: unknown;
  forYou?: unknown;
  suggestedActions?: unknown;
  classification?: unknown;
  confidence?: unknown;
}

interface RequestBody {
  worry?: string;
  messages?: ConversationMessage[];
  profile?: UserProfile;
  totalValue?: number;
}

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "claude_worry");
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
  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const lastUserMessage = [...incomingMessages].reverse().find((m) => m?.role === "user")?.content;
  const worry = (body.worry ?? lastUserMessage ?? "").trim();
  if (!worry) return NextResponse.json({ error: "worry_required" }, { status: 400 });
  if (worry.length > 500) {
    return NextResponse.json({ error: "worry_too_long" }, { status: 400 });
  }
  if (/<\s*script/i.test(worry)) {
    return NextResponse.json({ error: "unsafe_input" }, { status: 400 });
  }

  const { snapshot } = await getMacroSnapshot();
  const profile = body.profile;
  const totalValue = typeof body.totalValue === "number" ? body.totalValue : undefined;

  const profileLine = profile
    ? `Profile: experience=${profile.answers.experience}, goal="${profile.answers.goal}", \
timelineYears=${profile.answers.timelineYears}, painThreshold=$${profile.answers.painThreshold}, \
worry=${profile.answers.worry}, riskScore=${profile.riskScore}` +
      (totalValue !== undefined ? `, currentValue=$${totalValue.toFixed(0)}` : "")
    : "Profile: not yet onboarded.";

  const macroLine = `Today's macro (FRED): \
inflation=${snapshot.inflation.value}% YoY, \
fed funds=${snapshot.fedFundsRate.value}%, \
10y treasury=${snapshot.treasury10y.value}%, \
30y mortgage=${snapshot.mortgage30y.value}%.`;

  const fallback = buildFallback(worry, snapshot, profile);

  const conversation = normalizeConversation(incomingMessages, worry);
  const result = await callClaude(
    {
      systemBlocks: [
        { text: SYSTEM_PREAMBLE, cache: true },
        { text: `${macroLine}\n${profileLine}`, cache: false },
      ],
      userText: `User worry: ${worry}`,
      messages: conversation,
    },
    { maxTokens: 600, fallback: JSON.stringify(fallback) },
  );

  const parsed = tryParseJson<ParsedShape>(result.text);
  const response: WorryResponse =
    parsed && typeof parsed.summary === "string"
      ? {
          summary: String(parsed.summary),
          forYou: typeof parsed.forYou === "string" ? parsed.forYou : fallback.forYou,
          suggestedActions: Array.isArray(parsed.suggestedActions)
            ? parsed.suggestedActions.filter((s): s is string => typeof s === "string").slice(0, 2)
            : fallback.suggestedActions,
          citations: buildCitations(snapshot),
          classification: typeof parsed.classification === "string" ? parsed.classification : fallback.classification,
          confidence: isConfidence(parsed.confidence) ? parsed.confidence : fallback.confidence,
        }
      : { ...fallback, citations: buildCitations(snapshot) };

  const event = detectLifeEvent(worry);
  const life_event_detected =
    event && profile
      ? {
          event,
          adjustment: getLifeEventAdjustments(event, profile.riskScore),
        }
      : null;

  return NextResponse.json({ ...response, life_event_detected, source: result.source });
}

function normalizeConversation(
  messages: ConversationMessage[],
  worry: string,
): Array<{ role: "user" | "assistant"; content: string }> {
  const normalized = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 700) }));
  if (normalized.length === 0 || normalized[normalized.length - 1]?.role !== "user") {
    normalized.push({ role: "user", content: worry });
  }
  return normalized;
}

function isConfidence(value: unknown): value is "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high";
}

function buildCitations(snapshot: MacroSnapshot): Citation[] {
  return [
    { source: "FRED", label: snapshot.inflation.label, value: `${snapshot.inflation.value}%` },
    { source: "FRED", label: snapshot.fedFundsRate.label, value: `${snapshot.fedFundsRate.value}%` },
    { source: "FRED", label: snapshot.treasury10y.label, value: `${snapshot.treasury10y.value}%` },
  ];
}

function buildFallback(
  worry: string,
  snapshot: MacroSnapshot,
  profile: UserProfile | undefined,
): Omit<WorryResponse, "citations" | "life_event_detected"> {
  const w = worry.toLowerCase();
  const cpi = snapshot.inflation.value;
  const dff = snapshot.fedFundsRate.value;
  const yld = snapshot.treasury10y.value;

  const profileNudge =
    profile && profile.answers.timelineYears >= 10
      ? `With a ${profile.answers.timelineYears}-year horizon, day-to-day moves matter much less than staying invested through them.`
      : profile
        ? `Given your ${profile.answers.timelineYears}-year horizon, focus on whether the *plan* still fits — not whether headlines feel scary.`
        : `If your horizon is 10+ years, today's headlines matter much less than staying invested.`;

  let summary = "";
  if (w.includes("inflation") || w.includes("prices")) {
    summary = `Inflation is currently ${cpi}% year-over-year. That's the rate at which the cost of stuff is rising — your savings need to outpace it just to stand still. Stocks have historically beaten inflation over long horizons; cash hasn't.`;
  } else if (w.includes("rate") || w.includes("fed") || w.includes("interest")) {
    summary = `The Fed funds rate is ${dff}%. When rates are this level, cash earns a real yield and bonds become competitive again, but borrowers (mortgages, businesses) feel the pinch.`;
  } else if (w.includes("crash") || w.includes("recession") || w.includes("drop") || w.includes("losing")) {
    summary = `Markets do drop — historically the S&P has had a 10%+ drawdown about every 18 months. The 10-year treasury sits at ${yld}%, which is the market's read on the next decade. None of that says a crash is imminent.`;
  } else if (w.includes("retir") || w.includes("enough")) {
    summary = `"Will I have enough" comes down to three knobs: how much you save, how long it grows, and how much risk you take. Markets have done the work for patient investors before — the math still works.`;
  } else {
    summary = `That's a real worry, and it's worth pausing on it instead of clicking sell. Right now: inflation ${cpi}%, Fed rate ${dff}%, 10y ${yld}%. None of that is unprecedented territory.`;
  }

  return {
    summary,
    forYou: profileNudge,
    classification:
      w.includes("crash") || w.includes("losing")
        ? "panic_sell"
        : w.includes("tesla") || w.includes("buy")
          ? "fomo_buy"
          : w.includes("job") || w.includes("baby") || w.includes("house")
            ? "life_event"
            : "general_question",
    confidence: "medium",
    suggestedActions:
      w.includes("crash") || w.includes("losing")
        ? [
            "Re-read your Sleep Test number before doing anything.",
            "Wait 24 hours — most panic decisions look worse the next morning.",
          ]
        : ["Do nothing for now. Check back in a week if it still bothers you."],
  };
}
