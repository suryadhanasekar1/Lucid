"use client";

import type { AtlasMessage } from "@/types/atlas";

const MODE_LABEL: Record<NonNullable<AtlasMessage["mode"]>, string> = {
  default: "",
  accounts: "Accounts",
  insights: "Insights",
  goals: "Goals",
};

export function MessageBubble({ message }: { message: AtlasMessage }) {
  const isUser = message.role === "user";
  const modeLabel = message.mode && message.mode !== "default" ? MODE_LABEL[message.mode] : "";

  return (
    <div
      className="flex w-full"
      style={{ justifyContent: isUser ? "flex-end" : "flex-start" }}
    >
      <div
        style={{
          maxWidth: "85%",
          padding: "10px 14px",
          borderRadius: 14,
          fontSize: 14,
          lineHeight: 1.55,
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
              marginBottom: 4,
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
