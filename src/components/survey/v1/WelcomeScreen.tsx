"use client";

import { PrimaryButton } from "./PrimaryButton";

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: 56,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Compass helps you grow your money without losing sleep over it.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 18,
            color: "var(--text-secondary)",
            marginTop: "var(--space-6)",
            maxWidth: 540,
          }}
        >
          This takes 90 seconds. Ready?
        </p>
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <PrimaryButton onClick={onStart}>Begin</PrimaryButton>
      </div>
    </section>
  );
}
