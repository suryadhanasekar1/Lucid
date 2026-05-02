"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/hooks/usePortfolio";

export function CallbackClient() {
  const router = useRouter();
  const { refresh } = usePortfolio();

  useEffect(() => {
    void (async () => {
      // SnapTrade returns the user to /connect/callback after the brokerage flow.
      // Refresh holdings (which will hit /api/snaptrade/holdings using the stored
      // creds, or silently fall back to the sample portfolio).
      await refresh();
      router.replace("/dashboard");
    })();
  }, [refresh, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        padding: "var(--space-16) var(--space-8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 16,
          color: "var(--text-secondary)",
        }}
      >
        Loading your real holdings…
      </p>
    </main>
  );
}
