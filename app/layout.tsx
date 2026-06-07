import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DDE Parent Hub",
  description:
    "Understand your child's IEP, learn from DDE parent classes, and track progress at home.",
};

export const viewport: Viewport = {
  themeColor: "#1f7977",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
