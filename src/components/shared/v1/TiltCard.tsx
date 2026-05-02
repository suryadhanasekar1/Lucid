"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/a11y";
import { cn } from "@/lib/utils";

const SPRING = { stiffness: 220, damping: 28, mass: 0.6 } as const;

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Max rotation in degrees on either axis. Default 3.5° — barely there. */
  maxTilt?: number;
  /** Outer perspective in px. Higher = subtler. Default 1400. */
  perspective?: number;
}

/**
 * flutter_tilt-style hover parallax — very subtle.
 *
 *   - Tracks the cursor as a fraction (-0.5..0.5) across the card and maps
 *     it to a small rotateX/rotateY (default ±3.5°).
 *   - Springs back to 0,0 on mouseleave AND mousedown — the latter so an
 *     RGL drag start doesn't fight the tilt transform.
 *   - Honors prefers-reduced-motion (renders an inert plain div).
 *   - h-full so it slots into the dashboard grid cell layout cleanly.
 */
export function TiltCard({
  children,
  className,
  style,
  maxTilt = 3.5,
  perspective = 1400,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), SPRING);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), SPRING);

  const reset = () => {
    x.set(0);
    y.set(0);
  };
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };

  if (reduced) {
    return (
      <div ref={ref} className={cn("h-full", className)} style={style}>
        {children}
      </div>
    );
  }

  const motionStyle: MotionStyle = {
    rotateX,
    rotateY,
    transformStyle: "preserve-3d",
    transformPerspective: perspective,
    willChange: "transform",
    ...(style as MotionStyle),
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={reset}
      onMouseDown={reset}
      className={cn("h-full", className)}
      style={motionStyle}
    >
      {children}
    </motion.div>
  );
}
