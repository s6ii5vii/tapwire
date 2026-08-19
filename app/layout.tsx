import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const deploymentUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const metadataBase = new URL(deploymentUrl ? `https://${deploymentUrl}` : "http://localhost:3000");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B7555",
};

export const metadata: Metadata = {
  metadataBase,
  title: "CredLink — Financial behaviour connected",
  description: "A demo PWA that turns verified susu activity into an explainable financial profile for consumers and participating lenders.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CredLink", statusBarStyle: "default" },
  openGraph: {
    title: "CredLink — Turning financial behaviour into financial opportunity",
    description: "Consumer profile, CredLink Score, loan guidance, consent-based sharing, and institution review in one demo.",
    images: [{ url: "/og.png", width: 656, height: 319, alt: "CredLink financial profile demo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CredLink — Financial behaviour connected",
    description: "A polished Progressive Web App demo for alternative financial profile sharing.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}" }} />
      </body>
    </html>
  );
}
