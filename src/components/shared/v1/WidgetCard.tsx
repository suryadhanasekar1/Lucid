"use client";

import type { ReactNode } from "react";
import { WhyIsThisHere } from "./WhyIsThisHere";

interface Props {
  title: string;
  rationale?: string;
  /**
   * @deprecated kept for source compatibility — minimalistic visual pass
   * removed the gold eyebrow. The prop is accepted but ignored.
   */
  badge?: string;
  children: ReactNode;
}

/**
 * The shared widget chrome.
 *
 * Visual rules (minimalistic pass):
 *   - Hairline 1px border, no shadow, no eyebrow.
 *   - Title is small body text, not a display face.
 *   - Right-side header reserved for the "Why is this here?" affordance and
 *     the drag-handle dot (rendered by DashboardGrid as an absolute child).
 *   - Padding is tighter on top so the drag handle sits flush.
 */
export function WidgetCard({ title, rationale, children }: Props) {
  return (
    <article
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "var(--space-5) var(--space-5) var(--space-5)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        // Drop card shadow — the layered black background carries depth.
        boxShadow: "none",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          /* Reserve room for the drag handle that DashboardGrid lays over the
           * top-right corner of every cell. */
          paddingRight: 28,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.005em",
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h3>
        {rationale && <WhyIsThisHere rationale={rationale} />}
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </article>
  );
}
