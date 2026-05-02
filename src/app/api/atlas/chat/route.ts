import { CLAUDE_MODEL_PRIMARY, CLAUDE_MODEL_LIGHT } from "@/lib/claude/client";
import { streamClaude } from "@/lib/claude/stream";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";
import { renderPortfolioContext } from "@/lib/atlas/portfolio-summary";
import type { AtlasChatRequest, AtlasMode } from "@/types/atlas";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 20);

const SYSTEM_BASE = `You are Atlas, the Compass financial assistant for everyday investors. \
Speak in plain English, no jargon, no scare-tactics. Never give "buy" or "sell" recommendations. \
Be calm, concrete, and short — usually 2–5 sentences. If the user asks something Compass can't \
verify against their connected data, say so honestly. End with one practical takeaway when useful.`;

const MODE_PREAMBLES: Record<AtlasMode, string> = {
  default: "",
  accounts:
    "Mode: Accounts. Focus on the user's connected holdings, balances, and positions. " +
    "Use the portfolio context block to ground your answer in real numbers. " +
    "If a number isn't present in the context, say what would be needed to answer.",
  insights:
    "Mode: Insights. Go a level deeper: portfolio composition, concentration, fees, macro context. " +
    "Reasoning can be longer (up to 8 sentences) and may walk through the math when given.",
  goals:
    "Mode: Goals. Focus on goal progress, timelines, savings rate, and what would move the needle. " +
    "Avoid prescriptive advice; describe trade-offs.",
};

const FALLBACK = "I'm having trouble reaching the model right now. Try again in a moment, or rephrase the question.";

function isMode(v: unknown): v is AtlasMode {
  return v === "default" || v === "accounts" || v === "insights" || v === "goals";
}

function sseFrame(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "atlas_chat");
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: "rate_limited", retryAfter: limit.retryAfterSec }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }

  let body: Partial<AtlasChatRequest> = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "empty_message" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (message.length > 4000) {
    return new Response(JSON.stringify({ error: "message_too_long" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const mode: AtlasMode = isMode(body.mode) ? body.mode : "default";
  const history = Array.isArray(body.history) ? body.history.slice(-20) : [];
  const conversationId = body.conversationId ?? cryptoRandomId();
  const portfolioBlock = renderPortfolioContext(body.portfolio);

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.filter(
      (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    ),
    { role: "user", content: message },
  ];

  const systemBlocks = [
    { text: SYSTEM_BASE, cache: true },
    { text: portfolioBlock, cache: false },
    { text: MODE_PREAMBLES[mode] || "", cache: false },
  ].filter((b) => b.text);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(sseFrame({ type: "meta", conversationId })));
      try {
        const gen = streamClaude({
          systemBlocks,
          messages,
          model: mode === "insights" ? CLAUDE_MODEL_PRIMARY : CLAUDE_MODEL_LIGHT,
          maxTokens: mode === "insights" ? 700 : 350,
          fallback: FALLBACK,
        });
        for await (const frame of gen) {
          controller.enqueue(encoder.encode(sseFrame(frame)));
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(sseFrame({ type: "error", message: (e as Error).message ?? "stream_error" })),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

function cryptoRandomId() {
  const g: { crypto?: { randomUUID?: () => string } } = globalThis as never;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
