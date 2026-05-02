"use client";

import { useState } from "react";
import Link from "next/link";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWidgets } from "@/hooks/useWidgets";
import { DashboardGrid } from "@/components/shared/v1/DashboardGrid";
import { HealthScoreWidget } from "@/components/widgets/v1/HealthScoreWidget";
import { TotalValueWidget } from "@/components/widgets/v1/TotalValueWidget";
import { PortfolioHistoryWidget } from "@/components/widgets/v1/PortfolioHistory";
import { MacroConditionsWidget } from "@/components/widgets/v1/MacroConditionsWidget";
import { MutualFundXRayWidget } from "@/components/widgets/v1/MutualFundXRayWidget";
import { WhatYouOwnWidget } from "@/components/widgets/v1/WhatYouOwnWidget";
import { StockExplorer } from "@/components/widgets/v1/StockExplorer";
import { SectorExposureWidget } from "@/components/widgets/v1/SectorExposure";
import { CostTaxReceiptWidget } from "@/components/widgets/v1/CostTaxReceiptWidget";
import { CompareToIndexWidget } from "@/components/widgets/v1/CompareToIndexWidget";
import { WeeklyDigestWidget } from "@/components/widgets/v1/WeeklyDigestWidget";
import { AntiPanicStreakWidget } from "@/components/widgets/v1/AntiPanicStreakWidget";
import { WorryTranslatorWidget } from "@/components/widgets/v1/WorryTranslatorWidget";
import { ActionQueueWidget } from "@/components/widgets/v1/ActionQueue";
import { PlaceholderWidget } from "@/components/widgets/v1/PlaceholderWidget";
import { ErrorBoundary } from "@/components/shared/v1/ErrorBoundary";
import { UIModeToggle } from "@/components/shared/v1/UIModeToggle";
import { WIDGETS_BY_ID } from "@/lib/widgets/registry";

const REAL_WIDGETS: Record<string, () => JSX.Element> = {
  health_score: HealthScoreWidget,
  total_value: TotalValueWidget,
  portfolio_history: PortfolioHistoryWidget,
  macro_conditions: MacroConditionsWidget,
  mutual_fund_xray: MutualFundXRayWidget,
  what_you_own: WhatYouOwnWidget,
  stock_explorer: StockExplorer,
  sector_exposure: SectorExposureWidget,
  cost_tax_receipt: CostTaxReceiptWidget,
  compare_to_index: CompareToIndexWidget,
  weekly_digest: WeeklyDigestWidget,
  streak_tracker: AntiPanicStreakWidget,
};

export function DashboardClient() {
  const { profile, isOnboarded } = useUserProfile();
  const { source, loading } = usePortfolio();
  const { recommended } = useWidgets();
  const [assistantOpen, setAssistantOpen] = useState(false);

  if (!isOnboarded || !profile) {
    return (
      <main style={shell}>
        <section style={{ maxWidth: 560 }}>
          <p style={eyebrow}>Compass</p>
          <h1 style={hero}>Take the 90-second survey first.</h1>
          <p style={helper}>
            Compass needs your goals, timeline, and pain threshold before it can build a
            dashboard worth showing.
          </p>
          <Link href="/onboarding" style={primaryCta}>
            Begin · 90 seconds
          </Link>
        </section>
      </main>
    );
  }

  const cells = recommended.map((w) => {
    const Component = REAL_WIDGETS[w.id];
    const def = WIDGETS_BY_ID[w.id];
    return {
      id: w.id,
      node: (
        <ErrorBoundary title={def?.title ?? w.id}>
          {Component ? <Component /> : <PlaceholderWidget id={w.id} />}
        </ErrorBoundary>
      ),
    };
  });

  return (
    <main id="main" style={shell}>
      <a href="#dashboard-grid" className="skip-link">
        Skip to dashboard
      </a>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div>
          <p style={eyebrow}>Compass</p>
          <h1 style={hero}>
            Built around{" "}
            <span style={{ color: "var(--gold-primary)" }}>
              {profile.answers.goal || "your goal"}
            </span>
            .
          </h1>
        </div>
        <div style={{ display: "grid", justifyItems: "end", gap: "var(--space-2)" }}>
          <UIModeToggle />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-tertiary)",
              letterSpacing: "0.02em",
            }}
          >
            {loading ? "refreshing…" : profileSummary(profile)}
          </div>
        </div>
      </header>

      {source === "sample" && (
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: 10,
            padding: "var(--space-2) var(--space-4)",
            marginBottom: "var(--space-4)",
            fontFamily: "var(--font-body)",
            fontSize: 12.5,
            color: "var(--text-tertiary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-4)",
          }}
        >
          <span>Viewing the sample portfolio.</span>
          <Link
            href="/connect?start=1"
            style={{
              color: "var(--gold-primary)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Connect a brokerage →
          </Link>
        </div>
      )}

      <DashboardGrid cells={cells} />

      <section style={assistantShell} aria-label="Compass assistant">
        <button
          type="button"
          onClick={() => setAssistantOpen((open) => !open)}
          style={assistantToggle}
        >
          {assistantOpen ? "Close Assistant" : "Open Assistant"}
        </button>
        {assistantOpen && (
          <div style={assistantGrid}>
            <ErrorBoundary title="Atlas Assistant">
              <WorryTranslatorWidget />
            </ErrorBoundary>
            <ErrorBoundary title="Agent Inbox">
              <ActionQueueWidget />
            </ErrorBoundary>
          </div>
        )}
      </section>
    </main>
  );
}

function profileSummary(profile: ReturnType<typeof useUserProfile>["profile"]) {
  if (!profile) return "";
  return `Risk ${profile.riskScore} · ${profile.answers.timelineYears}y horizon`;
}

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg-base)",
  color: "var(--text-primary)",
  padding: "var(--space-8) var(--space-6)",
  maxWidth: 1440,
  margin: "0 auto",
};

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: "var(--space-2)",
};

const hero: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 300,
  fontSize: 36,
  lineHeight: 1.1,
  letterSpacing: "-0.015em",
  margin: 0,
};

const helper: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 16,
  color: "var(--text-secondary)",
  marginTop: "var(--space-3)",
  maxWidth: 540,
};

const primaryCta: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 28px",
  borderRadius: 999,
  background: "var(--gold-primary)",
  color: "var(--bg-base)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  fontWeight: 500,
  textDecoration: "none",
  marginTop: "var(--space-6)",
};

const assistantShell: React.CSSProperties = {
  marginTop: "var(--space-8)",
  borderTop: "1px solid var(--border-subtle)",
  paddingTop: "var(--space-6)",
};

const assistantToggle: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  borderRadius: 999,
  background: "var(--bg-elevated)",
  color: "var(--gold-primary)",
  padding: "10px 16px",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  cursor: "pointer",
};

const assistantGrid: React.CSSProperties = {
  marginTop: "var(--space-4)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
  gap: "var(--space-4)",
};
