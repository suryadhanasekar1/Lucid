"use client";

import { useEffect, useRef } from "react";
import { GraduationCap, Trash2, RotateCcw, BookOpen, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEducationChat } from "@/hooks/useEducationChat";
import { cn } from "@/lib/utils";
import { TopicCards } from "./TopicCards";
import { SageMessageBubble } from "./SageMessageBubble";
import { useState } from "react";
import type { SageMode } from "@/types/education";

export function EducationChat() {
  const {
    messages,
    isLoading,
    currentMode,
    setCurrentMode,
    error,
    sendMessage,
    retryLastMessage,
    clearConversation,
  } = useEducationChat();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const send = (text: string, mode?: SageMode) => {
    if (!text.trim()) return;
    void sendMessage(text, mode ?? currentMode);
    setDraft("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-32px)] max-w-4xl flex-col gap-4 p-4">
      {/* Header */}
      <Card className="glass-surface border-border/30 shadow-none">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, var(--gold-muted), var(--gold-bright))",
                color: "var(--bg-base)",
              }}
            >
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold text-foreground">Sage</span>
              <Badge
                variant="outline"
                className="h-5 w-fit border-primary/40 bg-primary/10 px-2 text-[10px] font-medium uppercase tracking-wider text-primary"
              >
                Lucid · Education
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle current={currentMode} onChange={setCurrentMode} />
            {messages.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={clearConversation}
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Body — scrollable */}
      <div
        ref={scrollRef}
        className="compass-hide-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col gap-4">
            <Card className="glass-surface border-border/30 shadow-none">
              <CardContent className="p-5">
                <h2 className="m-0 font-display text-[24px] font-light leading-tight text-foreground">
                  What would you like to learn?
                </h2>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  Pick a starter below, or ask anything in plain English. Toggle{" "}
                  <span className="text-primary">Deep dive</span> for longer, technical answers
                  with examples and trade-offs.
                </p>
              </CardContent>
            </Card>
            <TopicCards onPick={(p) => send(p)} />
          </div>
        ) : (
          messages
            .filter((m) => m.role === "user" || m.content.length > 0 || m.error)
            .map((m) => <SageMessageBubble key={m.id} message={m} />)
        )}

        {isLoading && (
          <div className="flex items-center gap-2 px-1 py-2 text-[12px] text-muted-foreground">
            <span className="atlas-dot" />
            <span className="atlas-dot atlas-dot-2" />
            <span className="atlas-dot atlas-dot-3" />
            <span className="ml-1">Sage is composing…</span>
          </div>
        )}

        {error && !isLoading && (
          <Button
            variant="outline"
            size="sm"
            onClick={retryLastMessage}
            className="self-start gap-1.5 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </Button>
        )}
      </div>

      {/* Input — sticky bottom */}
      <Card className="glass-surface border-border/30 shadow-none">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder={
                currentMode === "deepdive"
                  ? "Ask for the deep dive — math, edge cases, trade-offs…"
                  : "Ask anything about money, investing, or markets…"
              }
              disabled={isLoading}
              className="h-10 border-border/40 bg-secondary/40 text-[14px] focus-visible:ring-primary/50"
            />
            <Button
              size="default"
              onClick={() => send(draft)}
              disabled={isLoading || !draft.trim()}
              className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90"
            >
              Ask
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Sage is not a licensed financial advisor.
          </p>
        </CardContent>
      </Card>

      {/* Tiny shared dot animation (matches Atlas) */}
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

function ModeToggle({ current, onChange }: { current: SageMode; onChange: (m: SageMode) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border/40 bg-secondary/30 p-1">
      <Button
        size="sm"
        variant={current === "basics" ? "default" : "ghost"}
        onClick={() => onChange("basics")}
        className={cn(
          "h-7 gap-1 rounded-full px-3 text-[12px]",
          current === "basics"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <BookOpen className="h-3.5 w-3.5" /> Basics
      </Button>
      <Button
        size="sm"
        variant={current === "deepdive" ? "default" : "ghost"}
        onClick={() => onChange("deepdive")}
        className={cn(
          "h-7 gap-1 rounded-full px-3 text-[12px]",
          current === "deepdive"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <Microscope className="h-3.5 w-3.5" /> Deep dive
      </Button>
    </div>
  );
}
