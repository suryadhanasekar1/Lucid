"use client";

import { useUserStore } from "@/stores/userStore";

/**
 * Liquid-glass greeting pinned to the top-left. Only renders once the
 * survey has captured a name; otherwise stays hidden so we don't show a
 * generic "Hello" on the welcome screen.
 */
export function HelloName() {
  const profile = useUserStore((s) => s.profile);
  const draftName = useUserStore((s) => s.draft.name);
  const name = (profile?.answers.name ?? draftName ?? "").trim();
  if (!name) return null;

  return (
    <div
      aria-label={`Hello ${name}`}
      className="glass-input"
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 16px)",
        left: "calc(env(safe-area-inset-left, 0px) + 16px)",
        zIndex: 60,
        padding: "8px 16px",
        borderRadius: 999,
        fontFamily: "var(--font-body)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 0.2,
        color: "var(--text-primary)",
        userSelect: "none",
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ color: "var(--gold-primary)", fontWeight: 600 }}>Hello,</span>
      <span>{name}</span>
      <span aria-hidden style={{ marginLeft: 2 }}>👋</span>
    </div>
  );
}
