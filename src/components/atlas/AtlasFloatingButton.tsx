"use client";

import { Sparkles } from "lucide-react";

interface Props {
  onClick: () => void;
  hasUnread?: boolean;
}

export function AtlasFloatingButton({ onClick, hasUnread }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Atlas assistant"
      className="glass-surface-gold relative inline-flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-95"
      style={{ color: "var(--gold-bright)" }}
    >
      <Sparkles className="h-6 w-6" style={{ filter: "drop-shadow(0 0 6px rgba(212,175,55,0.55))" }} />
      {hasUnread && (
        <span
          className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--signal-positive)", boxShadow: "0 0 8px var(--signal-positive)" }}
        />
      )}
    </button>
  );
}
