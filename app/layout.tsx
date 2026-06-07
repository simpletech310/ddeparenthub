import type { Metadata, Viewport } from "next";
import { Quicksand, Inter } from "next/font/google";
import "./globals.css";

// DDE brand fonts (matching datadrivenedu.com): Quicksand for friendly, rounded
// display type; Inter for clean body/UI.
const display = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DDE Parent Hub",
  description:
    "Understand your child's IEP, learn from DDE parent classes, and track progress at home.",
};

export const viewport: Viewport = {
  themeColor: "#00a2e8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
