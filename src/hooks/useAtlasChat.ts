"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendAtlasMessage } from "@/lib/atlas/client";
import { summarizeForAtlas } from "@/lib/atlas/portfolio-summary";
import { usePortfolio } from "@/hooks/usePortfolio";
import type { AtlasMessage, AtlasMode } from "@/types/atlas";

const STORAGE_KEY = "atlas:messages:v1";
const MAX_PERSIST = 20;

function newId() {
  const g: { crypto?: { randomUUID?: () => string } } = globalThis as never;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadPersisted(): AtlasMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_PERSIST);
  } catch {
    return [];
  }
}

function persist(msgs: AtlasMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_PERSIST)));
  } catch {
    /* quota or disabled — ignore */
  }
}

export function useAtlasChat() {
  const [messages, setMessages] = useState<AtlasMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AtlasMode>("default");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserRef = useRef<{ message: string; mode: AtlasMode } | null>(null);

  const { holdings, totalValue, source } = usePortfolio();

  useEffect(() => {
    setMessages(loadPersisted());
  }, []);

  useEffect(() => {
    persist(messages);
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, mode?: AtlasMode) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      const useMode = mode ?? currentMode;
      lastUserRef.current = { message: trimmed, mode: useMode };

      const userMsg: AtlasMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        mode: useMode,
        createdAt: Date.now(),
      };
      const assistantId = newId();
      const assistantMsg: AtlasMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        mode: useMode,
        createdAt: Date.now(),
      };

      setError(null);
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      const ac = new AbortController();
      abortRef.current = ac;

      const portfolio = summarizeForAtlas(holdings, totalValue, source as "snaptrade" | "sample" | "none");

      try {
        const history = [...messages, userMsg].slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = await sendAtlasMessage({
          message: trimmed,
          mode: useMode,
          conversationId,
          history: history.slice(0, -1),
          portfolio,
          signal: ac.signal,
          onMeta: (meta) => {
            if (meta.conversationId && !conversationId) setConversationId(meta.conversationId);
          },
          onToken: (delta) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
            );
          },
        });

        // If for some reason no tokens streamed, set the final text once.
        if (result.text && !result.text.startsWith("")) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId && !m.content ? { ...m, content: result.text } : m)),
          );
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
          return;
        }
        const errMsg = (e as Error).message ?? "request_failed";
        setError(errMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || "Something went wrong. Tap retry to try again.", error: true }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [conversationId, currentMode, isLoading, messages, holdings, totalValue, source],
  );

  const retryLastMessage = useCallback(() => {
    if (!lastUserRef.current) return;
    setMessages((prev) => {
      const next = [...prev];
      // Drop trailing assistant errors and the last user message; sendMessage re-adds them.
      while (next.length && next[next.length - 1]!.role === "assistant" && (next[next.length - 1]!.error || !next[next.length - 1]!.content)) {
        next.pop();
      }
      if (next.length && next[next.length - 1]!.role === "user") next.pop();
      return next;
    });
    const { message, mode } = lastUserRef.current;
    void sendMessage(message, mode);
  }, [sendMessage]);

  const clearConversation = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(undefined);
    setError(null);
    lastUserRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    currentMode,
    setCurrentMode,
    conversationId,
    error,
    sendMessage,
    retryLastMessage,
    clearConversation,
  };
}
