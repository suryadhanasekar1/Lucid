"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  title: string;
  body: string;
  cta?: { href: string; label: string };
  /** Optional override for the CTA region — useful for in-place buttons rather than links. */
  action?: ReactNode;
}

/** Shared "nothing to show yet" panel for widgets that depend on holdings, history, etc. */
export function EmptyState({ title, body, cta, action }: Props) {
  return (
    <div
      role="note"
      style={{
        background: "var(--bg-elevated-2)",
        border: "1px dashed var(--border-default)",
        borderRadius: 12,
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--text-secondary)",
          margin: 0,
          lineHeight: 1.45,
        }}
      >
        {body}
      </p>
      {cta && (
        <Link
          href={cta.href}
          style={{
            alignSelf: "flex-start",
            color: "var(--gold-primary)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            marginTop: 4,
          }}
        >
          {cta.label} →
        </Link>
      )}
      {action}
    </div>
  );
}
