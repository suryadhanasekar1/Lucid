"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface Props {
  value: number;
  format: (n: number) => string;
  durationMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({ value, format, durationMs = 900, className, style }: Props) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (latest) => format(latest));
  const [text, setText] = useState(format(0));

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: durationMs / 1000,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = display.on("change", (v: string) => setText(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, durationMs, mv, display]);

  return (
    <motion.span className={className} style={style}>
      {text}
    </motion.span>
  );
}
