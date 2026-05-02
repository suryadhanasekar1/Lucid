"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface HealthSegment {
  label: string;
  value: number;
  color: string;
}

interface AnimatedDownloadButtonProps {
  score: number;
  label?: string;
  summary?: string;
  segments: HealthSegment[];
  reducedMotion?: boolean;
}

export default function AnimatedDownloadButton({
  score,
  label = "Portfolio Health",
  summary,
  segments,
  reducedMotion = false,
}: AnimatedDownloadButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPinned, setIsPinned] = React.useState(false);
  const expanded = isHovered || isPinned;

  return (
    <motion.button
      type="button"
      aria-expanded={expanded}
      aria-label={`${label}: ${Math.round(score)} out of 100`}
      initial={false}
      animate={{
        width: expanded ? 372 : 116,
        minHeight: expanded ? 184 : 116,
      }}
      whileHover={reducedMotion ? undefined : { width: 372, minHeight: 184 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => setIsPinned((value) => !value)}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center justify-start overflow-hidden border border-border-subtle bg-bg-inset text-left shadow-none"
      style={{
        borderRadius: 58,
        padding: 10,
        color: "var(--text-primary)",
      }}
    >
      <div style={{ width: 96, height: 96, flex: "0 0 auto", position: "relative" }}>
        <ProceduralHealthRing score={score} segments={segments} reducedMotion={reducedMotion} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 300,
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(score)}
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{
          opacity: expanded ? 1 : 0,
          x: expanded ? 0 : -10,
        }}
        transition={{ duration: reducedMotion ? 0 : 0.18, delay: expanded && !reducedMotion ? 0.08 : 0 }}
        style={{
          minWidth: 0,
          padding: "0 16px 0 14px",
          pointerEvents: expanded ? "auto" : "none",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--gold-primary)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: "4px 0 10px",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1.35,
            maxWidth: 210,
          }}
        >
          {summary ?? "Hover or tap to see what drives the score."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {segments.map((segment) => (
            <div key={segment.label}>
              <span
                style={{
                  display: "block",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {segment.label}
              </span>
              <span
                style={{
                  color: segment.color,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(segment.value)}/100
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.button>
  );
}

function ProceduralHealthRing({
  score,
  segments,
  reducedMotion,
}: {
  score: number;
  segments: HealthSegment[];
  reducedMotion: boolean;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const gap = 12;
  const segmentLength = (circumference - gap * 4) / 4;

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-hidden="true">
      <circle
        cx="48"
        cy="48"
        r="24"
        fill="transparent"
        stroke="var(--border-default)"
        strokeWidth="18"
      />
      {segments.map((segment, index) => {
        const visible = segmentLength * Math.max(0.12, Math.min(1, segment.value / 100));
        return (
          <motion.circle
            key={segment.label}
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke={segment.color}
            strokeWidth="13"
            strokeLinecap="butt"
            pathLength={circumference}
            strokeDasharray={`${visible} ${circumference - visible}`}
            strokeDashoffset={-(index * (segmentLength + gap) + 8)}
            transform="rotate(-90 48 48)"
            initial={reducedMotion ? false : { opacity: 0.25, strokeDasharray: `1 ${circumference - 1}` }}
            animate={{ opacity: 1, strokeDasharray: `${visible} ${circumference - visible}` }}
            transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : index * 0.08 }}
          />
        );
      })}
      <circle
        cx="48"
        cy="48"
        r="40"
        fill="transparent"
        stroke="var(--gold-primary)"
        strokeWidth="3"
        strokeDasharray={`${Math.max(12, (score / 100) * 95)} 18`}
        strokeLinecap="round"
        opacity="0.9"
        transform="rotate(-92 48 48)"
      />
    </svg>
  );
}
