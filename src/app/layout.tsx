import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chadsolutions.app";
const withBasePath = (path: string) => `${basePath}${path}`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#050505",
};

export const metadata: Metadata = {
  title: "Chad Solutions - Objective Facial Analysis",
  description: "Take a photo, review objective facial metrics, and get practical glow-up guidance.",
  metadataBase: new URL(siteUrl),
  manifest: withBasePath("/manifest.json"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chad Solutions",
  },
  openGraph: {
    title: "Chad Solutions - Objective Facial Analysis",
    description: "Take a photo, review objective facial metrics, and get practical glow-up guidance.",
    url: siteUrl,
    siteName: "Chad Solutions",
    images: [
      {
        url: withBasePath("/og-image.png"),
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chad Solutions - Objective Facial Analysis",
    description: "Take a photo, review objective facial metrics, and get practical glow-up guidance.",
    images: [withBasePath("/og-image.png")],
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
        className={`${geistSans.variable} ${geistMono.variable} bg-black text-white antialiased`}
      >
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
