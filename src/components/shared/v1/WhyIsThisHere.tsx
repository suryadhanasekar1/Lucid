"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion, motionDuration } from "@/lib/a11y";

interface Props {
  rationale: string;
}

export function WhyIsThisHere({ rationale }: Props) {
  const [open, setOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on ESC.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="Why is this here?"
        aria-expanded={open}
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "transparent",
          border: "1px solid var(--border-default)",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
          fontSize: 12,
          cursor: "help",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ?
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
              right: 0,
              width: 260,
              padding: "var(--space-3) var(--space-4)",
              background: "var(--bg-elevated-2)",
              border: "1px solid var(--border-default)",
              borderRadius: 10,
              boxShadow: "var(--shadow-elevated)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-secondary)",
              lineHeight: 1.45,
              zIndex: 50,
            }}
          >
            {rationale}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
