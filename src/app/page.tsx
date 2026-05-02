"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { getArchetype } from "@/lib/portfolio/calculations";
import type { UserProfile } from "@/types";

export default function Page() {
  const router = useRouter();
  const setProfile = useUserStore((s) => s.setProfile);

  const openDemoDashboard = () => {
    setProfile(buildDemoProfile());
    router.push("/dashboard");
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base, #0A0A0B)",
        color: "var(--text-primary, #F5F5F0)",
        padding: "clamp(32px, 8vh, 64px) clamp(20px, 5vw, 48px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <section style={{ maxWidth: 780, width: "100%" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--gold-primary, #C9A961)",
            marginBottom: "var(--space-6)",
          }}
        >
          Compass
        </p>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: "clamp(42px, 8vw, 72px)",
            lineHeight: 1.05,
            letterSpacing: 0,
            color: "var(--text-primary, #F5F5F0)",
            marginBottom: "var(--space-6)",
            marginTop: 0,
          }}
        >
          Navigating the unknown
          <br />
          for the <span style={{ color: "var(--gold-primary, #C9A961)" }}>everyday</span> investor.
        </h1>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(16px, 2.4vw, 18px)",
            color: "var(--text-secondary, #A8A8A2)",
            marginBottom: "var(--space-8)",
            maxWidth: 560,
          }}
        >
          Real holdings, real fund composition, real economic conditions —
          translated for beginners.
        </p>

        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={openDemoDashboard}
            style={primaryCta}
          >
            Open sample dashboard
          </button>
          <Link href="/onboarding" style={secondaryCta}>
            Take 90-second survey
          </Link>
        </div>
      </section>
    </main>
  );
}

function buildDemoProfile(): UserProfile {
  const riskScore = 35;
  return {
    answers: {
      experience: "beginner",
      goal: "build long-term savings",
      timelineYears: 10,
      painThreshold: 16_250,
      sleepTestStartingValue: 25_000,
      worry: "market_crashes",
      checkIn: "weekly",
      lifeStage: "early_career",
      uiMode: "essentials",
    },
    uiMode: "essentials",
    riskScore,
    archetype: getArchetype(riskScore),
    completedAt: new Date().toISOString(),
  };
}

const primaryCta: React.CSSProperties = {
  display: "inline-block",
  maxWidth: "100%",
  padding: "14px 28px",
  borderRadius: 999,
  background: "var(--gold-primary, #C9A961)",
  color: "var(--bg-base, #0A0A0B)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  fontWeight: 500,
  textDecoration: "none",
  textAlign: "center",
  border: "1px solid transparent",
  cursor: "pointer",
};

const secondaryCta: React.CSSProperties = {
  ...primaryCta,
  background: "transparent",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-default)",
};
