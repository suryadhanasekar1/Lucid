"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorryTranslator } from "@/hooks/useWorryTranslator";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { ExplainTooltip } from "@/components/shared/v1/ExplainTooltip";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { usePrefersReducedMotion, motionDuration } from "@/lib/a11y";

const SUGGESTIONS = [
  "Should I be worried about inflation?",
  "What if the market crashes?",
  "Are bonds dead?",
  "Will I have enough to retire?",
];

export function WorryTranslatorWidget() {
  const { response, loading, error, ask, clear } = useWorryTranslator();
  const def = WIDGETS_BY_ID["worry_translator"]!;
  const [text, setText] = useState("");
  const reducedMotion = usePrefersReducedMotion();

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    await ask(value);
  };

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Worry Translator">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {!response && (
          <p style={muted}>
            Type any fear in plain English. We&apos;ll translate it using today&apos;s real macro data — never &quot;buy/sell&quot; advice.
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          style={{ display: "flex", gap: "var(--space-2)", alignItems: "stretch" }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's worrying you about money?"
            maxLength={500}
            disabled={loading}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--bg-elevated-2)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={loading || text.trim().length === 0}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "var(--gold-primary)",
              color: "var(--bg-base)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? "wait" : "pointer",
              opacity: text.trim().length === 0 ? 0.5 : 1,
            }}
          >
            {loading ? "Translating…" : "Translate"}
          </button>
        </form>

        {!response && !loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setText(s);
                  void ask(s);
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border-subtle)",
                  background: "transparent",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && <p style={{ ...muted, color: "var(--signal-negative)" }}>Couldn&apos;t reach the translator. Try again.</p>}

        <AnimatePresence>
          {response && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: motionDuration(reducedMotion, 0.22) }}
              role="status"
              aria-live="polite"
              style={{
                background: "var(--bg-elevated-2)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <p style={{ ...body, margin: 0 }}>{response.summary}</p>
              {response.forYou && (
                <p style={{ ...body, margin: 0, color: "var(--text-secondary)" }}>
                  <span style={accent}>For you · </span>
                  {response.forYou}
                </p>
              )}
              {response.suggestedActions.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)" }}>
                  {response.suggestedActions.map((a) => (
                    <li key={a} style={body}>{a}</li>
                  ))}
                </ul>
              )}
              {response.citations.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ ...muted, fontSize: 11 }}>Grounded in</span>
                  {response.citations.slice(0, 3).map((c, idx) => (
                    <span
                      key={`${c.source}-${idx}`}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text-tertiary)",
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {c.source}{c.value ? ` · ${c.value}` : ""}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <ExplainTooltip topic="worry_translator" label="How this works" />
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    clear();
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Ask another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WidgetCard>
  );
}

const muted: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-tertiary)",
  margin: 0,
};

const body: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  lineHeight: 1.5,
};

const accent: React.CSSProperties = {
  color: "var(--gold-primary)",
  fontWeight: 500,
};
