"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useHeadlineDecoder } from "@/hooks/useHeadlineDecoder";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { ExplainTooltip } from "@/components/shared/v1/ExplainTooltip";
import { Skeleton } from "@/components/shared/v1/Skeleton";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { usePrefersReducedMotion, motionDuration } from "@/lib/a11y";
import type { HeadlineDecoded } from "@/types";

export function HeadlineDecoderWidget() {
  const { trending, decoded, loading, decode } = useHeadlineDecoder();
  const def = WIDGETS_BY_ID["headline_decoder"]!;
  const reducedMotion = usePrefersReducedMotion();

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Headline Decoder">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p style={muted}>
          Today&apos;s top business headlines. Click one to translate the news into plain English — and see whether it&apos;s noise, watch, or act for your portfolio.
        </p>

        {trending.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <Skeleton width="92%" height={11} />
                <Skeleton width="40%" height={9} />
              </div>
            ))}
          </div>
        )}

        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {trending.slice(0, 5).map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => void decode(h.id)}
                disabled={loading}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: decoded?.original.id === h.id ? "var(--bg-elevated-2)" : "transparent",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13.5,
                  lineHeight: 1.4,
                  cursor: loading ? "wait" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span>{h.title}</span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  {h.source} · {timeAgo(h.publishedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <AnimatePresence>
          {decoded && (
            <motion.div
              key={decoded.original.id}
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
              <SignalPill signal={decoded.signal} />
              <p style={{ ...body, margin: 0 }}>{decoded.plainEnglish}</p>

              {decoded.affects.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ ...muted, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Touches your portfolio
                  </span>
                  {decoded.affects.map((a) => (
                    <p key={a.ticker} style={{ ...body, margin: 0, color: "var(--text-secondary)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold-primary)" }}>{a.ticker}</span>
                      {" — "}
                      {a.note}
                    </p>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <ExplainTooltip
                  topic="headline_decoder"
                  context={{ signal: decoded.signal }}
                  label="What does this signal mean?"
                />
                <a
                  href={decoded.original.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    textDecoration: "underline",
                  }}
                >
                  Read original →
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WidgetCard>
  );
}

function SignalPill({ signal }: { signal: HeadlineDecoded["signal"] }) {
  const config: Record<HeadlineDecoded["signal"], { label: string; color: string; bg: string }> = {
    noise: { label: "Noise", color: "var(--text-secondary)", bg: "rgba(127, 127, 127, 0.12)" },
    watch: { label: "Watch", color: "var(--gold-primary)", bg: "rgba(196, 162, 92, 0.12)" },
    act: { label: "Act", color: "var(--signal-negative)", bg: "rgba(199, 107, 90, 0.16)" },
  };
  const c = config[signal];
  return (
    <span
      style={{
        alignSelf: "flex-start",
        fontFamily: "var(--font-body)",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.color}`,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      {c.label}
    </span>
  );
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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
