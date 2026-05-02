"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useExplain } from "@/hooks/useExplain";
import { usePrefersReducedMotion, motionDuration } from "@/lib/a11y";

interface Props {
  /** Topic id passed to the explain endpoint, e.g. "health_score". */
  topic: string;
  /** Optional context the model can ground the explanation in. */
  context?: object;
  /** Inline label shown next to the trigger; defaults to "Tell me more". */
  label?: string;
}

/**
 * "Tell me more" link → small popover with a 2-3 sentence Claude-backed
 * explanation. Caches per topic so reopening doesn't refire the call.
 */
export function ExplainTooltip({ topic, context, label = "Tell me more" }: Props) {
  const { explain } = useExplain();
  const reducedMotion = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    if (text !== null) return;
    setLoading(true);
    const result = await explain(topic, context);
    setText(result || "Couldn't load an explanation right now.");
    setLoading(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : void handleOpen())}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "var(--gold-primary)",
          cursor: "pointer",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textUnderlineOffset: 3,
        }}
      >
        {label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 4 }}
            transition={{ duration: motionDuration(reducedMotion, 0.18) }}
            role="tooltip"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              width: 280,
              padding: "var(--space-3) var(--space-4)",
              background: "var(--bg-elevated-2)",
              border: "1px solid var(--border-default)",
              borderRadius: 10,
              boxShadow: "var(--shadow-elevated)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-secondary)",
              lineHeight: 1.45,
              zIndex: 60,
            }}
          >
            {loading ? "Translating…" : text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
