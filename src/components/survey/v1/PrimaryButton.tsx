"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost";
}

export function PrimaryButton({
  children,
  variant = "primary",
  disabled,
  style,
  ...rest
}: Props) {
  const base = {
    fontFamily: "var(--font-body)",
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: "0.01em",
    padding: "14px 28px",
    borderRadius: 999,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 200ms ease, color 200ms ease, border-color 200ms ease",
  } as const;

  const variants = {
    primary: {
      background: disabled ? "var(--bg-elevated-2)" : "var(--gold-primary)",
      color: disabled ? "var(--text-disabled)" : "var(--bg-base)",
      border: "1px solid transparent",
    },
    ghost: {
      background: "transparent",
      color: disabled ? "var(--text-disabled)" : "var(--text-secondary)",
      border: "1px solid var(--border-default)",
    },
  } as const;

  return (
    <button
      {...rest}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
