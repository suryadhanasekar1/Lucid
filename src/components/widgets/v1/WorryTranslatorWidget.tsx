"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useWorryTranslator } from "@/hooks/useWorryTranslator";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { ExplainTooltip } from "@/components/shared/v1/ExplainTooltip";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { usePrefersReducedMotion } from "@/lib/a11y";

const DEMOS = [
  "Should I buy Tesla right now?",
  "The market dropped today — should I panic?",
  "I just got a $10,000 bonus. What should I do?",
];

export function WorryTranslatorWidget() {
  const {
    response,
    messages,
    loading,
    error,
    ask,
    clear,
    newConversation,
    lifeEvent,
    applyLifeEvent,
  } = useWorryTranslator();
  const def = WIDGETS_BY_ID["worry_translator"]!;
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  const submit = async (value = text) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setText("");
    await ask(trimmed);
  };

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Atlas">
      <div style={{ display: "grid", gridTemplateRows: "minmax(220px, 1fr) auto", gap: "var(--space-3)", height: "100%" }}>
        <div
          role="status"
          aria-live="polite"
          style={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            paddingRight: 4,
          }}
        >
          {messages.length === 0 && (
            <p style={muted}>
              Talk to Atlas about market news, rates, a bonus, a job change, or the feeling that you should do something right now.
            </p>
          )}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${message.timestamp.toISOString()}-${index}`}
              style={{
                alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "86%",
                background: message.role === "user" ? "var(--gold-primary)" : "var(--bg-elevated-2)",
                color: message.role === "user" ? "var(--bg-base)" : "var(--text-primary)",
                border: message.role === "user" ? "none" : "1px solid var(--border-subtle)",
                borderRadius: 14,
                padding: "var(--space-3)",
                fontFamily: "var(--font-body)",
                fontSize: 13.5,
                lineHeight: 1.45,
              }}
            >
              <p style={{ margin: 0 }}>{message.content}</p>
              {message.role === "assistant" && message.confidence && (
                <span style={badge}>{message.confidence} confidence</span>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ ...muted, display: "flex", gap: 4, alignItems: "center" }}>
              <span>Atlas is thinking</span>
              <span style={{ ...dot, animation: reducedMotion ? "none" : dot.animation }} />
              <span style={{ ...dot, animation: reducedMotion ? "none" : dot.animation, animationDelay: "120ms" }} />
              <span style={{ ...dot, animation: reducedMotion ? "none" : dot.animation, animationDelay: "240ms" }} />
            </div>
          )}

          {error && <p style={{ ...muted, color: "var(--signal-negative)" }}>Atlas could not answer that. Try a shorter version.</p>}

          {response && (
            <ActionCard response={response} onClear={clear} />
          )}

          {lifeEvent && (
            <div style={lifeEventBox}>
              <p style={{ ...body, margin: 0 }}>
                It sounds like {lifeEvent.event.replaceAll("_", " ")}. Want Compass to adjust your profile?
              </p>
              <p style={{ ...muted, margin: 0 }}>{lifeEvent.adjustment.explanation}</p>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button type="button" onClick={applyLifeEvent} style={primaryButton}>Yes</button>
                <button type="button" onClick={clear} style={secondaryButton}>Not now</button>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DEMOS.map((demo) => (
              <button key={demo} type="button" onClick={() => void submit(demo)} style={demoButton}>
                {demo}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "stretch" }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              placeholder="Ask Atlas anything about your money..."
              maxLength={500}
              disabled={loading}
              style={input}
            />
            <button type="button" aria-label="Send to Atlas" disabled={loading || text.trim().length === 0} onClick={() => void submit()} style={sendButton}>
              <Send size={16} aria-hidden="true" />
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <ExplainTooltip topic="worry_translator" label="How Atlas works" />
            <button type="button" onClick={newConversation} style={linkButton}>
              New conversation
            </button>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}

function ActionCard({ response, onClear }: { response: NonNullable<ReturnType<typeof useWorryTranslator>["response"]>; onClear: () => void }) {
  if (response.suggestedActions.length === 0) return null;
  return (
    <div style={{ background: "var(--bg-inset)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "var(--space-3)", display: "grid", gap: "var(--space-2)" }}>
      <p style={{ ...body, margin: 0, color: "var(--gold-primary)" }}>Action card</p>
      <p style={{ ...body, margin: 0 }}>{response.forYou}</p>
      <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)" }}>
        {response.suggestedActions.map((action) => (
          <li key={action} style={body}>{action}</li>
        ))}
      </ul>
      <button type="button" onClick={onClear} style={linkButton}>Hide card</button>
    </div>
  );
}

const muted: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-tertiary)",
  margin: 0,
  lineHeight: 1.5,
};

const body: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: 1.45,
  color: "var(--text-secondary)",
};

const badge: React.CSSProperties = {
  display: "inline-block",
  marginTop: 8,
  padding: "2px 7px",
  borderRadius: 999,
  border: "1px solid var(--border-subtle)",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  textTransform: "uppercase",
};

const dot: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: 999,
  background: "var(--gold-primary)",
  animation: "compass-pulse 900ms ease-in-out infinite",
};

const input: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "10px 14px",
  borderRadius: 10,
  background: "var(--bg-elevated-2)",
  border: "1px solid var(--border-default)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

const sendButton: React.CSSProperties = {
  width: 42,
  borderRadius: 10,
  border: "none",
  background: "var(--gold-primary)",
  color: "var(--bg-base)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const demoButton: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid var(--border-subtle)",
  background: "transparent",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  cursor: "pointer",
};

const linkButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-tertiary)",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationStyle: "dotted",
  textUnderlineOffset: 4,
};

const lifeEventBox: React.CSSProperties = {
  background: "var(--bg-inset)",
  border: "1px solid var(--border-emphasis)",
  borderRadius: 12,
  padding: "var(--space-3)",
  display: "grid",
  gap: "var(--space-2)",
};

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "var(--gold-primary)",
  color: "var(--bg-base)",
  padding: "7px 12px",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: "transparent",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-default)",
};
