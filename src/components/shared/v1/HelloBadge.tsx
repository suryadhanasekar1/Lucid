"use client";

export function HelloBadge() {
  return (
    <div
      aria-hidden
      className="glass-surface-gold"
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 60,
        padding: "6px 14px",
        borderRadius: 999,
        color: "var(--gold-bright)",
        fontFamily: "var(--font-body)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.4,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      Hello Claude Crew 👋
    </div>
  );
}
