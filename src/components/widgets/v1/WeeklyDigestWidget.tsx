"use client";

import { useEffect, useState, useMemo } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMacroConditions } from "@/hooks/useMacroConditions";
import { useHeadlineDecoder } from "@/hooks/useHeadlineDecoder";
import { useCircuitBreaker } from "@/hooks/useCircuitBreaker";
import { WidgetCard } from "@/components/shared/v1/WidgetCard";
import { ExplainTooltip } from "@/components/shared/v1/ExplainTooltip";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";
import { formatUSD, formatPct } from "@/lib/utils";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Weekly Digest — surfaced for users who check in monthly or only_when_matters.
 *
 * Pulls from things already in the app:
 *   - Latest macro snapshot (FRED)
 *   - 3 most recent decoded headlines (NewsAPI fallback)
 *   - Breaker history (panic events in the last 7 days)
 *   - Portfolio totalValue (for next-week framing)
 *
 * No AI call — by design. The Headline Decoder + Worry Translator already
 * spend the API budget; the digest is just the relevant assembly of state.
 */
export function WeeklyDigestWidget() {
  const { profile } = useUserProfile();
  const { totalValue } = usePortfolio();
  const { conditions } = useMacroConditions();
  const { trending } = useHeadlineDecoder();
  const { history } = useCircuitBreaker();
  const def = WIDGETS_BY_ID["weekly_digest"]!;

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const recentHeadlines = trending.slice(0, 3);
  const breakerEvents = useMemo(
    () => history.filter((h) => now - h.ts < ONE_WEEK_MS),
    [history, now],
  );

  const cancelled = breakerEvents.filter((h) => h.decision === "cancelled").length;
  const proceeded = breakerEvents.filter((h) => h.decision === "proceeded").length;

  return (
    <WidgetCard title={def.title} rationale={def.rationale} badge="Weekly Digest">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <Section title="Where you stand">
          <p style={body}>
            Portfolio value:{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold-primary)" }}>
              {formatUSD(Math.round(totalValue))}
            </span>
            . Goal:{" "}
            <span style={{ color: "var(--text-primary)" }}>
              {profile?.answers.goal || "not set"}
            </span>{" "}
            over {profile?.answers.timelineYears ?? "—"} years.
          </p>
        </Section>

        {conditions && (
          <Section title="Macro this week">
            <ul style={list}>
              <li style={body}>
                Inflation:{" "}
                <Mono>
                  {conditions.inflation.value}
                  {conditions.inflation.unit}
                </Mono>{" "}
                — {conditions.inflation.plainEnglish}
              </li>
              <li style={body}>
                Fed funds:{" "}
                <Mono>
                  {conditions.fedFundsRate.value}
                  {conditions.fedFundsRate.unit}
                </Mono>{" "}
                — {conditions.fedFundsRate.plainEnglish}
              </li>
            </ul>
          </Section>
        )}

        {recentHeadlines.length > 0 && (
          <Section title="Three things worth a glance">
            <ul style={list}>
              {recentHeadlines.map((h) => (
                <li key={h.id} style={body}>
                  <span style={{ color: "var(--text-secondary)" }}>{h.title}</span>{" "}
                  <span style={{ ...muted, fontSize: 11 }}>· {h.source}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Behavior">
          <p style={body}>
            {breakerEvents.length === 0
              ? "No sell attempts this week — quietly excellent."
              : `Breaker fired ${breakerEvents.length} time${breakerEvents.length === 1 ? "" : "s"}: ${cancelled} held, ${proceeded} proceeded.`}
          </p>
        </Section>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <ExplainTooltip topic="weekly_digest" label="What goes into this digest?" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
            {formatPct(0, 0)} fluff
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          ...muted,
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--gold-primary)",
          marginBottom: 4,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
      {children}
    </span>
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
  fontSize: 13.5,
  color: "var(--text-secondary)",
  margin: 0,
  lineHeight: 1.45,
};

const list: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
