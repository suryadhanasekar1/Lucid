import type { SageChatRequest, SageMode, SageStreamFrame } from "@/types/education";

export interface SendArgs {
  message: string;
  mode: SageMode;
  conversationId?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  signal?: AbortSignal;
  onToken?: (text: string) => void;
  onMeta?: (meta: { conversationId?: string }) => void;
}

export interface SendResult {
  text: string;
  conversationId?: string;
  source: "anthropic" | "fallback" | "unknown";
}

export async function sendSageMessage(args: SendArgs): Promise<SendResult> {
  const body: SageChatRequest = {
    message: args.message,
    mode: args.mode,
    conversationId: args.conversationId,
    history: args.history,
  };
  const res = await fetch("/api/education/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: args.signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `request_failed_${res.status}`);
  }
  if (!res.body) throw new Error("no_response_body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let source: SendResult["source"] = "unknown";
  let conversationId: string | undefined = args.conversationId;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = raw.startsWith("data: ") ? raw.slice(6) : raw;
      if (!line) continue;
      let frame: SageStreamFrame;
      try {
        frame = JSON.parse(line) as SageStreamFrame;
      } catch {
        continue;
      }
      if (frame.type === "meta") {
        if (frame.conversationId) {
          conversationId = frame.conversationId;
          args.onMeta?.({ conversationId });
        }
      } else if (frame.type === "token" && typeof frame.text === "string") {
        text += frame.text;
        args.onToken?.(frame.text);
      } else if (frame.type === "done") {
        if (frame.source) source = frame.source;
      } else if (frame.type === "error") {
        throw new Error(frame.message ?? "stream_error");
      }
    }
  }

  return { text, conversationId, source };
}
