"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WhyIsThisHere } from "./WhyIsThisHere";

interface Props {
  title: string;
  rationale?: string;
  /**
   * @deprecated kept for source compatibility — minimalistic visual pass
   * removed the gold eyebrow. The prop is accepted but ignored.
   */
  badge?: string;
  hideHeader?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The shared widget chrome — Apple liquid-glass aesthetic.
 *
 *   - `.glass-surface` Tailwind utility applies the frosted backdrop blur,
 *     translucent gradient, top-edge highlight, and ambient shadow.
 *   - The drag-handle dot is laid over the top-right by DashboardGrid.
 *   - Inner content is a plain flex column; auto-fit grows the cell to fit.
 */
export function WidgetCard({ title, rationale, hideHeader = false, className, children }: Props) {
  return (
    <article
      className={cn("glass-surface", className)}
      style={{
        borderRadius: 16,
        padding: "var(--space-6)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        overflow: "hidden",
      }}
    >
      {!hideHeader && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
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
      )}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </article>
  );
}
