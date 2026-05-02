"use client";

import { Button } from "@/components/ui/button";

const PROMPTS = [
  "What's in my portfolio right now?",
  "How risky is my current allocation?",
  "Explain my biggest holding in plain English.",
  "Am I diversified enough?",
];

export function SuggestedPrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">
        Try asking
      </span>
      {PROMPTS.map((p) => (
        <Button
          key={p}
          type="button"
          variant="outline"
          onClick={() => onPick(p)}
          className="h-auto justify-start whitespace-normal border-border/40 bg-secondary/40 px-3 py-2.5 text-left text-[13px] font-normal text-muted-foreground hover:border-primary/60 hover:bg-secondary hover:text-foreground"
        >
          {p}
        </Button>
      ))}
    </div>
  );
}
