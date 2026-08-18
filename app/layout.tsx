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

const deploymentUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const metadataBase = new URL(
  deploymentUrl ? `https://${deploymentUrl}` : "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: "TapWire — Tap. Verify. Pay.",
  description:
    "A proximity-based identity and payment concept for simpler payments and smarter agent withdrawals.",
  openGraph: {
    title: "TapWire — Tap. Verify. Pay.",
    description:
      "Proximity-powered identity for simpler payments and smarter agent withdrawals.",
    images: [{ url: "/og.png", width: 656, height: 319, alt: "TapWire — Tap. Connect. Send." }],
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
