import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumen Isles — maths tutor",
  description:
    "Warm adventure maths for Grade 7: restore light to the islands by mastering circles, perimeter, area and algebra. Progress stays on this device.",
  applicationName: "Lumen Isles",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf7f0",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
