import Link from "next/link";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
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
            color: "var(--gold-primary)",
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
            color: "var(--text-primary)",
            marginBottom: "var(--space-6)",
          }}
        >
          Navigating the unknown
          <br />
          for the <span style={{ color: "var(--gold-primary)" }}>everyday</span> investor.
        </h1>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 18,
            color: "var(--text-secondary)",
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
            background: "var(--gold-primary)",
            color: "var(--bg-base)",
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
