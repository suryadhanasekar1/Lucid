import Link from "next/link";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-base, #0A0A0B)",
        color: "var(--text-primary, #F5F5F0)",
        padding: "var(--space-16) var(--space-8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section style={{ maxWidth: 720, width: "100%" }}>
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
            fontSize: 72,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--text-primary, #F5F5F0)",
            marginBottom: "var(--space-6)",
          }}
        >
          Navigating the unknown
          <br />
          for the <span style={{ color: "var(--gold-primary, #C9A961)" }}>everyday</span> investor.
        </h1>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 18,
            color: "var(--text-secondary, #A8A8A2)",
            marginBottom: "var(--space-12)",
            maxWidth: 560,
          }}
        >
          Real holdings, real fund composition, real economic conditions —
          translated for beginners.
        </p>

        <Link
          href="/onboarding"
          style={{
            display: "inline-block",
            padding: "14px 28px",
            borderRadius: 999,
            background: "var(--gold-primary, #C9A961)",
            color: "var(--bg-base, #0A0A0B)",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Begin · 90 seconds
        </Link>
      </section>
    </main>
  );
}
