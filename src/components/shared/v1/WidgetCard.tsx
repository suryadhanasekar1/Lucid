"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WhyIsThisHere } from "./WhyIsThisHere";

interface Props {
  title: string;
  rationale?: string;
  /**
   * @deprecated kept for source compatibility — minimalistic visual pass
   * removed the gold eyebrow.
   */
  badge?: string;
  hideHeader?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Widget chrome — shadcn `Card` skinned with the Lucid liquid-glass utility.
 * Shadow off (the layered black backdrop carries depth); padding tighter on
 * top so the drag-handle dot sits flush.
 */
export function WidgetCard({ title, rationale, hideHeader = false, className, children }: Props) {
  return (
    <Card
      className={cn(
        "glass-surface flex h-full flex-col gap-3 overflow-hidden p-6 shadow-none",
        className,
      )}
    >
      {!hideHeader && (
        <header className="flex items-center justify-between gap-3 pr-7">
          <h3 className="m-0 font-body text-[13px] font-medium tracking-[0.005em] text-foreground">
            {title}
          </h3>
          {rationale && <WhyIsThisHere rationale={rationale} />}
        </header>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </Card>
  );
}
