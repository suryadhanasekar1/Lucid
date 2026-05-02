"use client";

import { useEffect, useRef } from "react";
import { X, Sparkles, Trash2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PromptInputBox, type AtlasPromptMode } from "@/components/ui/ai-prompt-box";
import { MessageBubble } from "./MessageBubble";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { useAtlasChat } from "@/hooks/useAtlasChat";

interface Props {
  onClose: () => void;
}

export function AtlasChat({ onClose }: Props) {
  const { messages, isLoading, error, sendMessage, retryLastMessage, clearConversation } = useAtlasChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = (text: string, _files?: File[], mode?: AtlasPromptMode) => {
    if (!text.trim()) return;
    void sendMessage(text, mode);
  };

  return (
    <div
      role="dialog"
      aria-label="Atlas chat"
      className="glass-surface-deep"
      style={{
        width: 400,
        maxWidth: "calc(100vw - 32px)",
        height: 600,
        maxHeight: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(245, 245, 240, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--gold-muted), var(--gold-bright))",
              color: "var(--bg-base)",
            }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">Atlas</span>
            <Badge variant="outline" className="h-5 w-fit border-primary/40 bg-primary/10 px-2 text-[10px] font-medium uppercase tracking-wider text-primary">
              Compass · AI
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={clearConversation}
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="compass-hide-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.55 }}>
              Hi — I&apos;m Atlas. I help explain what&apos;s happening in your portfolio in plain English.
              I won&apos;t give buy/sell advice. Pick a starter or ask anything.
            </div>
            <SuggestedPrompts onPick={(t) => void sendMessage(t)} />
          </div>
        )}

        {messages
          .filter((m) => m.role === "user" || m.content.length > 0 || m.error)
          .map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-tertiary)", fontSize: 12, padding: "4px 2px" }}>
            <span className="atlas-dot" />
            <span className="atlas-dot atlas-dot-2" />
            <span className="atlas-dot atlas-dot-3" />
            <span style={{ marginLeft: 4 }}>Atlas is thinking…</span>
          </div>
        )}

        {error && !isLoading && (
          <button
            type="button"
            onClick={retryLastMessage}
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--signal-negative)",
              background: "transparent",
              color: "var(--signal-negative)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </button>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: 12, borderTop: "1px solid rgba(245, 245, 240, 0.08)", background: "linear-gradient(0deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))" }}>
        <PromptInputBox onSend={handleSend} isLoading={isLoading} />
        <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-tertiary)", textAlign: "center" }}>
          Atlas is not a licensed financial advisor.
        </div>
      </div>

      <style jsx>{`
        .atlas-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold-primary);
          animation: atlas-pulse 1.2s ease-in-out infinite;
        }
        .atlas-dot-2 {
          animation-delay: 0.15s;
        }
        .atlas-dot-3 {
          animation-delay: 0.3s;
        }
        @keyframes atlas-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

