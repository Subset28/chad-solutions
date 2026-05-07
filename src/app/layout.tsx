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
  title: "Chad Solutions — Facial Biometric Analysis",
  description: "Scan your face. Get your PSL. Find your looksmax ceiling.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chad Solutions",
  },
  openGraph: {
    title: "Chad Solutions — Facial Biometric Analysis",
    description: "Scan your face. Get your PSL. Find your looksmax ceiling.",
    url: "https://chadsolutions.app",
    siteName: "Chad Solutions",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chad Solutions — Facial Biometric Analysis",
    description: "Scan your face. Get your PSL. Find your looksmax ceiling.",
    images: ["/og-image.png"],
  },
};

import AnalyticsProvider from "@/components/AnalyticsProvider";

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
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
