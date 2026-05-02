"use client";

import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  helper?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function QuestionLayout({ eyebrow, title, helper, children, footer }: Props) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div>
        {eyebrow && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: "var(--space-3)",
            }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(30px, 5vw, 36px)",
            lineHeight: 1.15,
            letterSpacing: 0,
            margin: 0,
          }}
        >
          {title}
        </h1>
        {helper && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              color: "var(--text-secondary)",
              marginTop: "var(--space-3)",
              maxWidth: 540,
            }}
          >
            {helper}
          </p>
        )}
      </div>

      <div>{children}</div>

      {footer && (
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>{footer}</div>
      )}
    </section>
  );
}
