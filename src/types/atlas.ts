export type AtlasMode = "default" | "accounts" | "insights" | "goals";

export interface AtlasMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: AtlasMode;
  createdAt: number;
  error?: boolean;
}

export interface AtlasPortfolioSummary {
  source: "snaptrade" | "sample" | "none";
  totalValue: number;
  holdingsCount: number;
  topHoldings: Array<{ ticker: string; name: string; weight: number; value: number; type: string }>;
  assetMix: Record<string, number>;
}

export interface AtlasChatRequest {
  message: string;
  mode: AtlasMode;
  conversationId?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  portfolio?: AtlasPortfolioSummary;
}

export interface AtlasChatResponse {
  reply: string;
  conversationId: string;
  source: "anthropic" | "fallback";
}

export interface AtlasStreamFrame {
  type: "token" | "done" | "error" | "meta";
  text?: string;
  source?: "anthropic" | "fallback";
  conversationId?: string;
  message?: string;
}
