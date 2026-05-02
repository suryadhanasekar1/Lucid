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
  status?: "optimized" | "caution" | "risky";
  label?: string;
  summary?: string;
  segments: HealthSegment[];
  size?: number;
  compact?: boolean;
  reducedMotion?: boolean;
  panelOpen?: boolean;
  onClick?: () => void;
}

export default function AnimatedDownloadButton({
  score,
  status = "caution",
  label = "Portfolio Health",
  summary,
  segments,
  size = 64,
  compact = false,
  reducedMotion = false,
  panelOpen = false,
  onClick,
}: AnimatedDownloadButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const expanded = isHovered;
  const expandedWidth = compact ? 188 : 372;
  const expandedHeight = compact ? size : 184;
  const ringSize = compact ? size - 14 : 96;

  return (
    <motion.button
      type="button"
      aria-expanded={panelOpen || expanded}
      aria-label={`${label}: ${Math.round(score)} out of 100`}
      initial={false}
      animate={{
        width: expanded ? expandedWidth : size,
        minHeight: expanded ? expandedHeight : size,
      }}
      whileHover={reducedMotion ? undefined : { width: expandedWidth, minHeight: expandedHeight }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center justify-start overflow-hidden border border-border-subtle bg-bg-inset text-left shadow-none"
      style={{
        borderRadius: size / 2,
        padding: compact ? 7 : 10,
        color: "var(--text-primary)",
      }}
    >
      <div style={{ width: ringSize, height: ringSize, flex: "0 0 auto", position: "relative" }}>
        <ProceduralHealthRing
          score={score}
          status={status}
          reducedMotion={reducedMotion}
          size={ringSize}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontSize: compact ? 17 : 28,
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
          padding: compact ? "0 14px 0 10px" : "0 16px 0 14px",
          pointerEvents: expanded ? "auto" : "none",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--gold-primary)",
            fontFamily: "var(--font-body)",
            fontSize: compact ? 11 : 12,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </p>
        {!compact && (
          <>
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
          </>
        )}
      </motion.div>
    </motion.button>
  );
}

function ProceduralHealthRing({
  score,
  status,
  reducedMotion,
  size,
}: {
  score: number;
  status: "optimized" | "caution" | "risky";
  reducedMotion: boolean;
  size: number;
}) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 34;
  const statusRadius = 43;
  const circumference = 2 * Math.PI * radius;
  const progress = (normalizedScore / 100) * circumference;
  const statusColor = statusColorFor(status);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="portfolio-health-gold" x1="20" x2="82" y1="14" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--gold-light)" />
          <stop offset="48%" stopColor="var(--gold-primary)" />
          <stop offset="100%" stopColor="var(--gold-dark)" />
        </linearGradient>
        <filter id="portfolio-health-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="var(--gold-primary)" floodOpacity="0.28" />
        </filter>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="var(--bg-elevated)"
        stroke="var(--border-subtle)"
        strokeWidth="1"
      />
      <motion.circle
        cx="50"
        cy="50"
        r={statusRadius}
        fill="transparent"
        stroke={statusColor}
        strokeWidth="2"
        opacity="0.88"
        initial={false}
        animate={{ stroke: statusColor }}
        transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx="50"
        cy="7"
        r="3.2"
        fill={statusColor}
        style={{ filter: `drop-shadow(0 0 5px ${statusColor})` }}
        initial={false}
        animate={{ fill: statusColor, opacity: status === "caution" ? 0.78 : 0.95 }}
        transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="transparent"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="8"
      />
      <motion.circle
        cx="50"
        cy="50"
        r={radius}
        fill="transparent"
        stroke="url(#portfolio-health-gold)"
        strokeWidth="8"
        strokeDasharray={`${progress} ${circumference - progress}`}
        strokeDashoffset="0"
        strokeLinecap="round"
        filter="url(#portfolio-health-glow)"
        transform="rotate(-90 50 50)"
        initial={reducedMotion ? false : { strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray: `${progress} ${circumference - progress}` }}
        transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      />
      <circle
        cx="50"
        cy="50"
        r="23"
        fill="var(--bg-inset)"
        stroke="rgba(214, 177, 95, 0.22)"
        strokeWidth="1"
      />
    </svg>
  );
}

function statusColorFor(status: "optimized" | "caution" | "risky") {
  if (status === "optimized") return "var(--signal-positive)";
  if (status === "risky") return "var(--signal-negative)";
  return "var(--gold-primary)";
}
