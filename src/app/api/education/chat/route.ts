import { CLAUDE_MODEL_PRIMARY, CLAUDE_MODEL_LIGHT } from "@/lib/claude/client";
import { streamClaude } from "@/lib/claude/stream";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";
import type { SageChatRequest, SageMode } from "@/types/education";

const RPM = Number(process.env.RATE_LIMIT_AI_RPM ?? 20);

const SYSTEM_BASE = `You are Sage, the Lucid education assistant. You teach personal finance and \
investing concepts to beginners and intermediate learners. \
Lead with plain English and a one-sentence analogy before any jargon. \
Show concrete numbers when they help (e.g. "if you put $100/month at 7% for 30 years…"). \
Never give "buy" or "sell" recommendations — your job is to teach so the user can decide. \
If a topic is genuinely controversial or has multiple valid views, name the trade-offs honestly.`;

const MODE_PREAMBLES: Record<SageMode, string> = {
  basics:
    "Mode: Basics. Audience is a beginner. 3–5 sentences, simple vocabulary, exactly one analogy. " +
    "Define any term that's not 8th-grade English. End with a single takeaway sentence.",
  deepdive:
    "Mode: Deep Dive. Audience knows the basics and wants depth. " +
    "Use multiple paragraphs (up to 8 sentences total). Include: a concrete numeric example, " +
    "at least one common misconception, and an edge case or trade-off the beginner explanation glosses over. " +
    "Markdown formatting (headers, bullets) is fine. Still no buy/sell calls.",
};

const FALLBACK = "I'm having trouble reaching the model right now. Try again in a moment, or rephrase your question.";

function isMode(v: unknown): v is SageMode {
  return v === "basics" || v === "deepdive";
}

function sseFrame(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(ip, RPM, "sage_chat");
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: "rate_limited", retryAfter: limit.retryAfterSec }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }

  let body: Partial<SageChatRequest> = {};
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

  const mode: SageMode = isMode(body.mode) ? body.mode : "basics";
  const history = Array.isArray(body.history) ? body.history.slice(-20) : [];
  const conversationId = body.conversationId ?? cryptoRandomId();

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.filter(
      (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    ),
    { role: "user", content: message },
  ];

  const systemBlocks = [
    { text: SYSTEM_BASE, cache: true },
    { text: MODE_PREAMBLES[mode], cache: false },
  ].filter((b) => b.text);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(sseFrame({ type: "meta", conversationId })));
      try {
        const gen = streamClaude({
          systemBlocks,
          messages,
          model: mode === "deepdive" ? CLAUDE_MODEL_PRIMARY : CLAUDE_MODEL_LIGHT,
          maxTokens: mode === "deepdive" ? 900 : 350,
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
