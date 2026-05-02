"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendSageMessage } from "@/lib/education/client";
import type { SageMessage, SageMode } from "@/types/education";

const STORAGE_KEY = "sage:messages:v1";
const MAX_PERSIST = 20;

function newId() {
  const g: { crypto?: { randomUUID?: () => string } } = globalThis as never;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadPersisted(): SageMessage[] {
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

function persist(msgs: SageMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_PERSIST)));
  } catch {
    /* ignore */
  }
}

export function useEducationChat() {
  const [messages, setMessages] = useState<SageMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<SageMode>("basics");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserRef = useRef<{ message: string; mode: SageMode } | null>(null);

  useEffect(() => {
    setMessages(loadPersisted());
  }, []);

  useEffect(() => {
    persist(messages);
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, mode?: SageMode) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      const useMode = mode ?? currentMode;
      lastUserRef.current = { message: trimmed, mode: useMode };

      const userMsg: SageMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        mode: useMode,
        createdAt: Date.now(),
      };
      const assistantId = newId();
      const assistantMsg: SageMessage = {
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

      try {
        const history = [...messages, userMsg].slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        }));
        await sendSageMessage({
          message: trimmed,
          mode: useMode,
          conversationId,
          history: history.slice(0, -1),
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
    [conversationId, currentMode, isLoading, messages],
  );

  const retryLastMessage = useCallback(() => {
    if (!lastUserRef.current) return;
    setMessages((prev) => {
      const next = [...prev];
      while (
        next.length &&
        next[next.length - 1]!.role === "assistant" &&
        (next[next.length - 1]!.error || !next[next.length - 1]!.content)
      ) {
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
