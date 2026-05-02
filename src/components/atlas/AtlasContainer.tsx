"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtlasFloatingButton } from "./AtlasFloatingButton";
import { AtlasChat } from "./AtlasChat";

export function AtlasContainer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="atlas-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ pointerEvents: "auto" }}
          >
            <AtlasChat onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ pointerEvents: "auto" }}>
        <AtlasFloatingButton onClick={() => setOpen((o) => !o)} />
      </div>
    </div>
  );
}
