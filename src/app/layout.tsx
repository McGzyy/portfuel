import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { MobileViewportFix } from "@/components/pwa/MobileViewportFix";
import { rootMetadata } from "@/lib/seo/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = rootMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e31b23",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white font-sans text-[var(--pf-black)]">
        <DemoModeBanner />
        <InstallPrompt />
        <MobileViewportFix />
        {children}
      </body>
    </html>
  );
}
