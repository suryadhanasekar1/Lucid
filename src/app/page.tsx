"use client";

import Link from "next/link";

export default function Page() {
  return (
    <main
      className="home-landing"
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: "var(--bg-base, #0A0A0B)",
        color: "var(--text-primary, #F5F5F0)",
        padding: "clamp(24px, 7vh, 64px) clamp(18px, 5vw, 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflowX: "hidden",
      }}
    >
      <section style={{ maxWidth: 780, width: "100%", margin: 0 }}>
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
          Lucid
        </p>

        <h1
          className="home-hero-title"
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

        <div className="home-cta-row" style={ctaRow}>
          <Link className="home-cta" href="/dashboard?demo=1" style={primaryCta}>
            Open sample dashboard
          </Link>
          <Link className="home-cta" href="/onboarding" style={secondaryCta}>
            Take 90-second survey
          </Link>
        </div>
      </section>
    </main>
  );
}

const ctaRow: React.CSSProperties = {
  display: "flex",
  gap: "var(--space-3)",
  flexWrap: "wrap",
  alignItems: "center",
};

const primaryCta: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: "100%",
  minHeight: 48,
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
  lineHeight: 1.2,
};

const secondaryCta: React.CSSProperties = {
  ...primaryCta,
  background: "transparent",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-default)",
};
