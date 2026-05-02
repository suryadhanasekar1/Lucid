/**
 * Accessibility utilities. Client-only — these touch window/document.
 *
 * Why these live in `lib/` instead of `hooks/`:
 *   The Section-4 hook count is fixed at 11. Helpers used inside components
 *   are functions or namespaced exports here so the hook directory stays
 *   contractually stable.
 */

import { useEffect, useState } from "react";

/** Hook: matches the user's `prefers-reduced-motion` media query. SSR-safe. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Trap focus inside `container` while `active` is true.
 *  - On activate: focus moves into the container (first focusable, or the container itself).
 *  - Tab cycles forwards inside; Shift+Tab cycles backwards.
 *  - On deactivate: focus restores to whatever was focused when the trap engaged.
 *
 * `onEscape` fires when ESC is pressed while the trap is active.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: React.RefObject<HTMLElement>,
  opts: { onEscape?: () => void } = {},
): void {
  const { onEscape } = opts;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = (typeof document !== "undefined" ? document.activeElement : null) as HTMLElement | null;

    const focusables = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null,
      );

    // Focus the first available focusable; otherwise the container itself.
    const first = focusables()[0];
    if (first) first.focus();
    else {
      container.setAttribute("tabindex", "-1");
      container.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape?.();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (activeEl === firstEl || !container.contains(activeEl)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (activeEl === lastEl || !container.contains(activeEl)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus to whatever was focused before the trap engaged.
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef, onEscape]);
}

/**
 * Animation duration helper. Returns 0 when the user prefers reduced motion,
 * otherwise the requested seconds. Use with framer-motion `transition.duration`.
 */
export function motionDuration(reduced: boolean, seconds: number): number {
  return reduced ? 0 : seconds;
}
