import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { CircuitBreakerModal } from "@/components/shared/v1/CircuitBreakerModal";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Compass — Navigating the unknown for the everyday investor",
  description:
    "Compass helps beginners grow their money without losing sleep over it. Real holdings via SnapTrade, real fund composition via SEC EDGAR, real macro conditions via FRED.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={GeistSans.variable}
    >
      <body style={{ margin: 0, background: "var(--bg-base, #0A0A0B)" }}>
        {children}
        <CircuitBreakerModal />
      </body>
    </html>
  );
}
