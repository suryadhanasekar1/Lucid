"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { hashKey } from "@/lib/utils";
import { useUserStore } from "@/stores/userStore";

type Status = "idle" | "registering" | "redirecting" | "fallback" | "error";

interface RegisterResponse {
  userId?: string;
  userSecret?: string;
  error?: string;
}

interface ConnectResponse {
  redirectURI?: string | null;
  error?: string;
}

export function ConnectClient() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const snaptrade = usePortfolioStore((s) => s.snaptrade);
  const setSnaptrade = usePortfolioStore((s) => s.setSnaptrade);
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState<string | null>(null);
  const didAutoStart = useRef(false);

  const localUserId = useMemo(
    () => `compass_${hashKey(profile?.completedAt ?? Date.now().toString())}`,
    [profile?.completedAt],
  );

  const startConnect = useCallback(async () => {
    setStatus("registering");
    setReason(null);
    try {
      let creds = snaptrade;
      if (!creds) {
        const regRes = await fetch("/api/snaptrade/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: localUserId }),
        });
        const reg: RegisterResponse = await regRes.json();
        if (!regRes.ok || !reg.userId || !reg.userSecret) {
          throw new Error(reg.error ?? "register_failed");
        }
        creds = { userId: reg.userId, userSecret: reg.userSecret };
        setSnaptrade(creds);
      }

      setStatus("redirecting");
      const conRes = await fetch("/api/snaptrade/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: creds.userId,
          userSecret: creds.userSecret,
          redirectUri: `${window.location.origin}/connect/callback`,
        }),
      });
      const con: ConnectResponse = await conRes.json();
      if (!conRes.ok || !con.redirectURI) {
        throw new Error(con.error ?? "connect_failed");
      }
      window.location.href = con.redirectURI;
    } catch (err) {
      setStatus("error");
      setReason((err as Error).message);
    }
  }, [localUserId, setSnaptrade, snaptrade]);

  useEffect(() => {
    if (typeof window === "undefined" || didAutoStart.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("start") !== "1") return;
    didAutoStart.current = true;
    void startConnect();
  }, [startConnect]);

  const skip = () => {
    setStatus("fallback");
    router.push("/dashboard");
  };

  return (
    <main style={shell}>
      <section style={{ maxWidth: 560 }}>
        <p style={eyebrow}>Compass</p>
        <h1 style={hero}>Connect your brokerage.</h1>
        <p style={helper}>
          Compass uses SnapTrade to read your real holdings — never to make trades. If
          this fails or you skip it, we&apos;ll show a sample portfolio so you can keep
          looking around.
        </p>

        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-8)", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={startConnect}
            disabled={status === "registering" || status === "redirecting"}
            style={primaryCta}
          >
            {status === "registering"
              ? "Preparing…"
              : status === "redirecting"
                ? "Opening SnapTrade…"
                : "Connect your brokerage"}
          </button>
          <button type="button" onClick={skip} style={ghostCta}>
            Skip — use sample portfolio
          </button>
        </div>

        {status === "fallback" && (
          <p style={{ ...helper, marginTop: "var(--space-6)", color: "var(--text-tertiary)" }}>
            Falling back to a sample portfolio
            {reason ? <> ({reason})</> : null}. Redirecting…
          </p>
        )}

        {status === "error" && (
          <p style={{ ...helper, marginTop: "var(--space-6)", color: "var(--signal-warning)" }}>
            Couldn&apos;t open SnapTrade
            {reason ? <> ({reason})</> : null}. Check the SnapTrade keys and try again, or use the sample portfolio.
          </p>
        )}
      </section>
    </main>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg-base)",
  color: "var(--text-primary)",
  padding: "var(--space-16) var(--space-8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--gold-primary)",
  marginBottom: "var(--space-6)",
};

const hero: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 300,
  fontSize: 56,
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
  margin: 0,
};

const helper: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 18,
  color: "var(--text-secondary)",
  marginTop: "var(--space-6)",
};

const primaryCta: React.CSSProperties = {
  padding: "14px 28px",
  borderRadius: 999,
  background: "var(--gold-primary)",
  color: "var(--bg-base)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  fontWeight: 500,
  border: "1px solid transparent",
  cursor: "pointer",
};

const ghostCta: React.CSSProperties = {
  padding: "14px 28px",
  borderRadius: 999,
  background: "transparent",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  fontWeight: 500,
  border: "1px solid var(--border-default)",
  cursor: "pointer",
};
