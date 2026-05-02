"use client";

import { useCallback, useRef } from "react";

interface ExplainResponse {
  topic: string;
  explanation: string;
  source: "anthropic" | "fallback";
}

export function useExplain(): {
  explain: (topic: string, context?: object) => Promise<string>;
} {
  const cache = useRef(new Map<string, string>());

  const explain = useCallback(async (topic: string, context?: object): Promise<string> => {
    const key = `${topic}:${context ? JSON.stringify(context) : ""}`;
    const hit = cache.current.get(key);
    if (hit !== undefined) return hit;

    try {
      const res = await fetch("/api/claude/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, context }),
      });
      if (!res.ok) return "";
      const data = (await res.json()) as ExplainResponse;
      const text = data.explanation ?? "";
      cache.current.set(key, text);
      return text;
    } catch {
      return "";
    }
  }, []);

  return { explain };
}
