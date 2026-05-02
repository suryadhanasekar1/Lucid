import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { CircuitBreakerModal } from "@/components/shared/v1/CircuitBreakerModal";
import { AtlasContainer } from "@/components/atlas/AtlasContainer";
import { HelloName } from "@/components/shared/v1/HelloName";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Lucid — Navigating the unknown for the everyday investor",
  description:
    "Lucid helps beginners grow their money without losing sleep over it. Real holdings via SnapTrade, real fund composition via SEC EDGAR, real macro conditions via FRED.",
  applicationName: "Lucid",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Lucid",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
        <AtlasContainer />
        <HelloName />
      </body>
    </html>
  );
}
