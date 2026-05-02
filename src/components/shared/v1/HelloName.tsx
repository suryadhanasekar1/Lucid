"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { useUserStore } from "@/stores/userStore";

/**
 * Liquid-glass greeting pinned to the top-left.
 *
 *   - Renders only after a name is captured (during onboarding draft.name
 *     is set; after onboarding profile.answers.name is set).
 *   - Click the pill to edit — small inline input replaces the name. Enter
 *     or blur saves; Esc cancels. ✕ button to clear and re-prompt later.
 */
export function HelloName() {
  const profile = useUserStore((s) => s.profile);
  const draftName = useUserStore((s) => s.draft.name);
  const setName = useUserStore((s) => s.setName);
  const name = (profile?.answers.name ?? draftName ?? "").trim();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setValue(name);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, name]);

  if (!name && !editing) return null;

  const commit = () => {
    const next = value.trim();
    if (next.length > 0 && next.length <= 40) {
      setName(next);
    }
    setEditing(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setName("");
    setEditing(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !editing && setEditing(true)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !editing) {
          e.preventDefault();
          setEditing(true);
        }
      }}
      aria-label={editing ? "Edit your name" : `Hello ${name}, click to edit`}
      title={editing ? undefined : "Click to change your name"}
      className="glass-input"
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 16px)",
        left: "calc(env(safe-area-inset-left, 0px) + 16px)",
        zIndex: 60,
        padding: "8px 14px",
        borderRadius: 999,
        fontFamily: "var(--font-body)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 0.2,
        color: "var(--text-primary)",
        userSelect: "none",
        cursor: editing ? "text" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ color: "var(--gold-primary)", fontWeight: 600 }}>Hello,</span>
      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setValue(name);
              setEditing(false);
            }
          }}
          maxLength={40}
          aria-label="Your name"
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 0.2,
            width: `${Math.max(value.length, 4) + 1}ch`,
            padding: 0,
            minWidth: "4ch",
          }}
        />
      ) : (
        <span>{name}</span>
      )}
      <span aria-hidden style={{ marginLeft: 2 }}>👋</span>
      {editing ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clear}
          aria-label="Clear name"
          title="Clear name"
          style={{
            marginLeft: 4,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-tertiary)",
            display: "inline-flex",
            alignItems: "center",
            padding: 2,
          }}
        >
          <X className="h-3 w-3" />
        </button>
      ) : (
        <Pencil
          className="h-3 w-3"
          style={{ color: "var(--text-tertiary)", marginLeft: 2, opacity: 0.7 }}
          aria-hidden
        />
      )}
    </div>
  );
}
