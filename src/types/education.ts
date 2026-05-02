export type SageMode = "basics" | "deepdive";

export interface SageMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: SageMode;
  createdAt: number;
  error?: boolean;
}

export interface SageChatRequest {
  message: string;
  mode: SageMode;
  conversationId?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface SageStreamFrame {
  type: "token" | "done" | "error" | "meta";
  text?: string;
  source?: "anthropic" | "fallback";
  conversationId?: string;
  message?: string;
}
