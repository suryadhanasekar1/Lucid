"use client";

import { Component, type ReactNode } from "react";

interface Props {
  /** Title rendered at the top of the fallback. Usually the widget title. */
  title?: string;
  /** Optional override for the fallback content. */
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Per-widget error boundary. A widget that throws renders the fallback card
 * (so the rest of the dashboard keeps working) and surfaces a "Try again"
 * button that resets local state.
 *
 * React error boundaries must be class components today.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (typeof console !== "undefined") {
      console.error("[ErrorBoundary]", this.props.title ?? "(unknown widget)", error);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <article
          role="alert"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--signal-negative)",
            borderRadius: 16,
            padding: "var(--space-6)",
            boxShadow: "var(--shadow-card)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--signal-negative)",
                margin: 0,
              }}
            >
              {this.props.title ?? "Widget error"}
            </p>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 300,
                fontSize: 22,
                lineHeight: 1.2,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              This widget crashed.
            </h3>
          </header>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13.5,
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            The rest of your dashboard is fine. We&apos;ve logged the error so it can be diagnosed.
          </p>
          <button
            type="button"
            onClick={this.reset}
            style={{
              alignSelf: "flex-start",
              padding: "8px 14px",
              borderRadius: 999,
              background: "transparent",
              color: "var(--gold-primary)",
              border: "1px solid var(--gold-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </article>
      );
    }
    return this.props.children;
  }
}
