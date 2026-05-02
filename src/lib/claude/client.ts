import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client. Imported from API routes only.
 *
 * Strategy
 * --------
 * - Default to claude-sonnet-4-5 (fast, deep) for the worry translator + headline
 *   decoder; claude-haiku-4-5 for the lightweight Tell-Me-More tooltips.
 * - Use prompt caching on the long, stable preamble (system + macro context block).
 *   The user-supplied portion stays uncached so each call still personalises.
 * - All routes degrade gracefully: callers get a typed fallback when the API
 *   call fails or the key is invalid — never an unhandled exception.
 */

export const CLAUDE_MODEL_PRIMARY = "claude-sonnet-4-5";
export const CLAUDE_MODEL_LIGHT = "claude-haiku-4-5";

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export interface ClaudeMessage {
  systemBlocks: Array<{ text: string; cache?: boolean }>;
  userText: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ClaudeCallResult {
  text: string;
  /** Whether the response came from a real API call vs the deterministic fallback. */
  source: "anthropic" | "fallback";
}

export async function callClaude(
  msg: ClaudeMessage,
  opts: { model?: string; maxTokens?: number; fallback: string },
): Promise<ClaudeCallResult> {
  const c = getClient();
  if (!c) return { text: opts.fallback, source: "fallback" };

  try {
    const system = msg.systemBlocks.map((b) =>
      b.cache
        ? { type: "text" as const, text: b.text, cache_control: { type: "ephemeral" as const } }
        : { type: "text" as const, text: b.text },
    );

    const response = await c.messages.create({
      model: opts.model ?? CLAUDE_MODEL_PRIMARY,
      max_tokens: opts.maxTokens ?? 600,
      system,
      messages: msg.messages ?? [{ role: "user", content: msg.userText }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n")
      .trim();

    if (!text) return { text: opts.fallback, source: "fallback" };
    return { text, source: "anthropic" };
  } catch {
    return { text: opts.fallback, source: "fallback" };
  }
}

/**
 * Try to coerce a model response into JSON, retrying without the prose preamble
 * if the model wrapped it in commentary. Returns null on failure so callers can
 * fall back to deterministic output.
 */
export function tryParseJson<T>(text: string): T | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // strip ```json fences
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence?.[1]) {
      try {
        return JSON.parse(fence[1]) as T;
      } catch {
        // fall through
      }
    }
    // grab the first {...} block
    const brace = trimmed.match(/\{[\s\S]*\}/);
    if (brace) {
      try {
        return JSON.parse(brace[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
