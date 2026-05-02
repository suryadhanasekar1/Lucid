import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { CircuitBreakerModal } from "@/components/shared/v1/CircuitBreakerModal";
import "@/styles/globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  variable: "--font-fraunces",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

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
      className={`${fraunces.variable} ${GeistSans.variable} ${jetbrains.variable}`}
    >
      <body>
        {children}
        <CircuitBreakerModal />
      </body>
    </html>
  );
}
