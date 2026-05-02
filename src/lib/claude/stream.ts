import { getClient, CLAUDE_MODEL_PRIMARY } from "./client";

export interface StreamArgs {
  systemBlocks: Array<{ text: string; cache?: boolean }>;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string;
  maxTokens?: number;
  fallback: string;
}

export interface StreamFrame {
  type: "token" | "done" | "error";
  text?: string;
  source?: "anthropic" | "fallback";
  message?: string;
}

/**
 * Yields incremental text deltas from Claude. On API error or missing key, yields
 * the fallback text as a single token so the UI still shows something useful.
 */
export async function* streamClaude(args: StreamArgs): AsyncGenerator<StreamFrame> {
  const c = getClient();
  if (!c) {
    yield { type: "token", text: args.fallback };
    yield { type: "done", source: "fallback" };
    return;
  }

  const system = args.systemBlocks
    .filter((b) => b.text)
    .map((b) =>
      b.cache
        ? { type: "text" as const, text: b.text, cache_control: { type: "ephemeral" as const } }
        : { type: "text" as const, text: b.text },
    );

  try {
    const stream = c.messages.stream({
      model: args.model ?? CLAUDE_MODEL_PRIMARY,
      max_tokens: args.maxTokens ?? 600,
      system,
      messages: args.messages,
    });

    let any = false;
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta &&
        "type" in event.delta &&
        event.delta.type === "text_delta" &&
        typeof event.delta.text === "string" &&
        event.delta.text.length > 0
      ) {
        any = true;
        yield { type: "token", text: event.delta.text };
      }
    }

    if (!any) {
      yield { type: "token", text: args.fallback };
      yield { type: "done", source: "fallback" };
      return;
    }
    yield { type: "done", source: "anthropic" };
  } catch {
    yield { type: "token", text: args.fallback };
    yield { type: "done", source: "fallback" };
  }
}
