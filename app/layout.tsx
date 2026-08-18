import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TapWire — Tap. Verify. Pay.",
  description:
    "A proximity-based identity and payment concept for simpler payments and smarter agent withdrawals.",
  openGraph: {
    title: "TapWire — Tap. Verify. Pay.",
    description:
      "Proximity-powered identity for simpler payments and smarter agent withdrawals.",
    images: [{ url: "/og.png", width: 1792, height: 1024, alt: "TapWire — Tap. Verify. Pay." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TapWire — Tap. Verify. Pay.",
    description: "Proximity-powered identity for simpler payments and smarter agent withdrawals.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
