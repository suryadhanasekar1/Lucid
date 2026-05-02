"use client";

import type { CSSProperties } from "react";

interface Props {
  width?: number | string;
  height?: number | string;
  rounded?: number | string;
  style?: CSSProperties;
  /** Optional label for screen readers — replaces "Loading…". */
  label?: string;
}

/**
 * Shimmer skeleton block. Animation is a linear background sweep that the
 * global `prefers-reduced-motion: reduce` rule flattens automatically.
 */
export function Skeleton({ width = "100%", height = 12, rounded = 6, style, label }: Props) {
  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: rounded,
        background:
          "linear-gradient(90deg, var(--bg-elevated-2) 0%, rgba(245, 245, 240, 0.06) 50%, var(--bg-elevated-2) 100%)",
        backgroundSize: "200% 100%",
        animation: "compass-skeleton-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

/** Pre-composed: 3 stacked text lines. */
export function SkeletonLines({ count = 3, gap = 8 }: { count?: number; gap?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} width={i === count - 1 ? "70%" : "100%"} height={11} />
      ))}
    </div>
  );
}
