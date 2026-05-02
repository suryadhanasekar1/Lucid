"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePortfolio } from "@/hooks/usePortfolio";
import { getArchetype } from "@/lib/portfolio/calculations";
import type { ConversationMessage, LifeEventDetected, WorryResponse } from "@/types";

export function useWorryTranslator(): {
  response: WorryResponse | null;
  messages: ConversationMessage[];
  loading: boolean;
  error: Error | null;
  ask: (input: string) => Promise<void>;
  clear: () => void;
  newConversation: () => void;
  lifeEvent: LifeEventDetected | null;
  applyLifeEvent: () => void;
} {
  const { profile, setProfile } = useUserProfile();
  const { totalValue } = usePortfolio();
  const [response, setResponse] = useState<WorryResponse | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lifeEvent, setLifeEvent] = useState<LifeEventDetected | null>(null);
  const storageKey = useMemo(
    () => `compass:atlas:${profile?.completedAt ?? "anonymous"}`,
    [profile?.completedAt],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<Omit<ConversationMessage, "timestamp"> & { timestamp: string }>;
      setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const ask = useCallback(
    async (input: string) => {
      const worry = input.trim();
      if (!worry) return;
      const userMessage: ConversationMessage = {
        role: "user",
        content: worry,
        timestamp: new Date(),
      };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/claude/translate-worry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            worry,
            messages: nextMessages,
            profile,
            totalValue,
          }),
        });
        if (!res.ok) {
          throw new Error(`worry_translator_${res.status}`);
        }
        const data = (await res.json()) as WorryResponse;
        setResponse(data);
        setLifeEvent(data.life_event_detected ?? null);
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: naturalMessage(data),
            timestamp: new Date(),
            classification: data.classification,
            confidence: data.confidence,
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("worry_translator_failed"));
        setResponse(null);
      } finally {
        setLoading(false);
      }
    },
    [messages, profile, totalValue],
  );

  const clear = useCallback(() => {
    setResponse(null);
    setError(null);
    setLifeEvent(null);
  }, []);

  const newConversation = useCallback(() => {
    setMessages([]);
    setResponse(null);
    setError(null);
    setLifeEvent(null);
  }, []);

  const applyLifeEvent = useCallback(() => {
    if (!lifeEvent || !profile) return;
    const riskScore = Math.max(0, Math.min(100, profile.riskScore + lifeEvent.adjustment.riskScoreAdjust));
    setProfile({
      ...profile,
      riskScore,
      archetype: getArchetype(riskScore),
      completedAt: new Date().toISOString(),
    });
    setLifeEvent(null);
  }, [lifeEvent, profile, setProfile]);

  return { response, messages, loading, error, ask, clear, newConversation, lifeEvent, applyLifeEvent };
}

function naturalMessage(response: WorryResponse) {
  const actions = response.suggestedActions.length
    ? ` ${response.suggestedActions.join(" ")}`
    : "";
  return `${response.summary} ${response.forYou}${actions}`.trim();
}
