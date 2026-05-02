"use client";

import type { SageMessage } from "@/types/education";

const MODE_LABEL: Record<NonNullable<SageMessage["mode"]>, string> = {
  basics: "Basics",
  deepdive: "Deep dive",
};

export function SageMessageBubble({ message }: { message: SageMessage }) {
  const isUser = message.role === "user";
  const modeLabel = message.mode ? MODE_LABEL[message.mode] : "";

  return (
    <div className="flex w-full" style={{ justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "85%",
          padding: "12px 16px",
          borderRadius: 16,
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: isUser ? "var(--gold-primary)" : "var(--bg-elevated-2)",
          color: isUser ? "var(--bg-base)" : "var(--text-primary)",
          border: isUser ? "none" : "1px solid var(--border-subtle)",
          opacity: message.error ? 0.85 : 1,
        }}
      >
        {!isUser && modeLabel && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: "var(--gold-primary)",
              marginBottom: 6,
            }}
          >
            {modeLabel}
          </div>
        )}
        {message.content}
      </div>
    </div>
  );
}
