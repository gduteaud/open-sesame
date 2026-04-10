import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const fontSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Sesame | OpenRouter key management",
  description:
    "Manage OpenRouter API keys for events: CSV import, per-key limits, attendee self-serve claiming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Browser extensions may inject <html> attributes; suppressHydrationWarning avoids dev-only hydration noise.
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontSans.className} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
