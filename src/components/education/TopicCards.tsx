"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TOPICS = [
  { title: "What is a stock?", prompt: "What is a stock, in plain English?" },
  { title: "Bonds vs. stocks", prompt: "How are bonds different from stocks, and which is riskier?" },
  { title: "Index funds & ETFs", prompt: "What's the difference between an index fund and an ETF?" },
  { title: "Compound interest", prompt: "Explain compound interest with a real example." },
  { title: "Diversification", prompt: "Why does diversification matter, and how much is enough?" },
  { title: "Risk vs. return", prompt: "Walk me through the relationship between risk and return." },
  { title: "Expense ratios", prompt: "What is an expense ratio and why does it matter over decades?" },
  { title: "Tax-advantaged accounts", prompt: "Compare 401(k), IRA, and Roth IRA in plain English." },
  { title: "Inflation basics", prompt: "How does inflation affect my long-term savings?" },
  { title: "Market crashes", prompt: "Why do markets crash, and what should a long-term investor do during one?" },
  { title: "Asset allocation", prompt: "What is asset allocation, and how do I think about mine?" },
  { title: "Dollar-cost averaging", prompt: "What is dollar-cost averaging? Does it actually work?" },
];

export function TopicCards({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {TOPICS.map((t) => (
        <Card
          key={t.title}
          role="button"
          tabIndex={0}
          onClick={() => onPick(t.prompt)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPick(t.prompt);
            }
          }}
          className={cn(
            "glass-surface cursor-pointer border-border/30 bg-secondary/20 transition-all hover:border-primary/50 hover:bg-secondary/40",
          )}
        >
          <CardContent className="p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-primary/70">Lesson</p>
            <p className="mt-1 text-[14px] font-medium text-foreground">{t.title}</p>
            <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">{t.prompt}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
